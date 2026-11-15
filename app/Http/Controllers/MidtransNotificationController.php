<?php

namespace App\Http\Controllers;

use App\Models\IssuedTicket;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ParkDailyCapacity;
use App\Models\Payment;
use App\Models\QuotaReservation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MidtransNotificationController extends Controller
{
    /**
     * Handle incoming notification webhook from Midtrans.
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Midtrans Notification received:', $payload);

        $serverKey = (string) config('services.midtrans.server_key');
        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;

        if (!$orderId || !$statusCode || !$grossAmount || !$signatureKey) {
            return response()->json(['message' => 'Invalid notification payload'], 400);
        }

        // Verify SHA512 signature: order_id + status_code + gross_amount + ServerKey
        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        if ($signatureKey !== $expectedSignature) {
            Log::warning("Midtrans signature mismatch for order {$orderId}");
            return response()->json(['message' => 'Signature mismatch'], 403);
        }

        $order = Order::with(['items.dailyInventory'])->where('order_code', $orderId)->first();
        if (!$order) {
            Log::warning("Midtrans order not found: {$orderId}");
            return response()->json(['message' => 'Order not found'], 404);
        }

        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus = $payload['fraud_status'] ?? null;
        $paymentType = $payload['payment_type'] ?? 'midtrans';
        $transactionId = $payload['transaction_id'] ?? null;

        DB::transaction(function () use ($order, $payload, $transactionStatus, $fraudStatus, $paymentType, $transactionId) {
            $isPaid = false;
            $isCancelled = false;

            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $isPaid = true;
                }
            } elseif ($transactionStatus === 'settlement') {
                $isPaid = true;
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                $isCancelled = true;
            }

            if ($isPaid) {
                $this->markOrderAsPaid($order, $payload, $paymentType, $transactionId, $fraudStatus);
            } elseif ($isCancelled) {
                $this->markOrderAsCancelled($order, $payload, $paymentType, $transactionId, $fraudStatus, $transactionStatus);
            } else {
                // Pending status
                $order->update(['status' => 'PENDING']);
                Payment::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'gateway_provider' => 'MIDTRANS',
                        'payment_method' => $paymentType,
                        'payment_type' => $paymentType,
                        'transaction_reference' => $order->order_code,
                        'transaction_id' => $transactionId,
                        'amount' => $order->total_amount,
                        'status' => 'PENDING',
                        'fraud_status' => $fraudStatus,
                        'gateway_payload' => $payload,
                    ]
                );
            }
        });

        return response()->json(['status' => 'success']);
    }

    /**
     * Mark order as paid and issue tickets if not yet issued.
     */
    public function markOrderAsPaid(Order $order, array $payload, string $paymentType, ?string $transactionId, ?string $fraudStatus): void
    {
        if ($order->status === 'PAID') {
            return;
        }

        $order->update(['status' => 'PAID']);

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'gateway_provider' => 'MIDTRANS',
                'payment_method' => $paymentType,
                'payment_type' => $paymentType,
                'transaction_reference' => $order->order_code,
                'transaction_id' => $transactionId,
                'amount' => $order->total_amount,
                'status' => 'SUCCESS',
                'fraud_status' => $fraudStatus,
                'paid_at' => Carbon::now(),
                'gateway_payload' => $payload,
            ]
        );

        // Issue tickets for each order item if they haven't been issued yet
        foreach ($order->items as $item) {
            $existingTicketsCount = IssuedTicket::where('order_item_id', $item->id)->count();
            $neededTickets = $item->quantity - $existingTicketsCount;

            $inv = $item->dailyInventory;
            $parkId = $order->park_id;
            $visitDate = $inv ? $inv->visit_date : Carbon::today()->toDateString();

            for ($i = 0; $i < $neededTickets; $i++) {
                IssuedTicket::create([
                    'order_item_id' => $item->id,
                    'park_id' => $parkId,
                    'valid_date' => $visitDate,
                    'ticket_code' => 'TKT-' . strtoupper(Str::random(8)),
                    'qr_token' => 'VURASI-QR-' . strtoupper(Str::random(16)),
                    'status' => 'VALID',
                ]);
            }
        }
    }

    /**
     * Release inventory & quota reservations when order is expired/cancelled.
     */
    private function markOrderAsCancelled(Order $order, array $payload, string $paymentType, ?string $transactionId, ?string $fraudStatus, string $transactionStatus): void
    {
        if ($order->status === 'CANCELLED' || $order->status === 'EXPIRED') {
            return;
        }

        $newStatus = ($transactionStatus === 'expire') ? 'EXPIRED' : 'CANCELLED';
        $order->update(['status' => $newStatus]);

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'gateway_provider' => 'MIDTRANS',
                'payment_method' => $paymentType,
                'payment_type' => $paymentType,
                'transaction_reference' => $order->order_code,
                'transaction_id' => $transactionId,
                'amount' => $order->total_amount,
                'status' => 'FAILED',
                'fraud_status' => $fraudStatus,
                'gateway_payload' => $payload,
            ]
        );

        // Decrement daily inventory booked quota
        foreach ($order->items as $item) {
            $inv = $item->dailyInventory;
            if ($inv && $inv->booked_quota >= $item->quantity) {
                $inv->decrement('booked_quota', $item->quantity);
            }
        }

        // Release quota reservations
        QuotaReservation::where('order_id', $order->id)
            ->where('is_released', false)
            ->update(['is_released' => true]);

        // Invalidate any issued tickets
        IssuedTicket::whereIn('order_item_id', $order->items->pluck('id'))
            ->update(['status' => 'CANCELLED']);

        // Decrement daily park capacity count
        $firstItem = $order->items->first();
        if ($firstItem && $firstItem->dailyInventory) {
            $cap = ParkDailyCapacity::where('park_id', $order->park_id)
                ->where('visit_date', $firstItem->dailyInventory->visit_date)
                ->first();
            if ($cap && $cap->booked_count >= $order->items->sum('quantity')) {
                $cap->decrement('booked_count', $order->items->sum('quantity'));
            }
        }
    }
}
