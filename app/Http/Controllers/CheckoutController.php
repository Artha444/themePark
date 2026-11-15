<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\DailyInventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Park;
use App\Models\ParkDailyCapacity;
use App\Models\Payment;
use App\Models\Promotion;
use App\Models\PromotionRedemption;
use App\Models\QuotaReservation;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Midtrans\Transaction;

class CheckoutController extends Controller
{
    public function __construct(
        protected MidtransService $midtransService
    ) {}

    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $items = json_decode((string) $request->query('items', '[]'), true);
        $date = (string) $request->query('date', Carbon::today()->format('Y-m-d'));
        $promoCode = $request->query('promo', null);

        if (empty($items)) {
            return redirect()->route('tickets.index');
        }

        $inventoryIds = array_column($items, 'inventory_id');
        $inventories = DailyInventory::with('ticketTier')
            ->whereIn('id', $inventoryIds)
            ->get()
            ->keyBy('id');

        $orderItemsData = [];
        $subtotal = 0;

        foreach ($items as $item) {
            $inv = $inventories->get($item['inventory_id']);
            if ($inv) {
                $qty = (int) $item['quantity'];
                $itemSubtotal = $inv->price * $qty;
                $subtotal += $itemSubtotal;

                $orderItemsData[] = [
                    'inventory_id' => $inv->id,
                    'tier_name' => $inv->ticketTier->name,
                    'unit_price' => $inv->price,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                ];
            }
        }

        $discount = 0;
        if ($promoCode) {
            $promo = Promotion::where('code', strtoupper((string) $promoCode))->where('is_active', true)->first();
            if ($promo && $subtotal >= $promo->min_order_amount) {
                if ($promo->discount_type === 'PERCENTAGE') {
                    $discount = ($subtotal * $promo->discount_value) / 100;
                    if ($promo->max_discount_amount && $discount > $promo->max_discount_amount) {
                        $discount = $promo->max_discount_amount;
                    }
                } else {
                    $discount = $promo->discount_value;
                }
            }
        }

        $total = max(0, $subtotal - $discount);
        $user = auth()->user();

        return Inertia::render('Checkout/Index', [
            'visitDate' => $date,
            'items' => $orderItemsData,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'promoCode' => $promoCode,
            'currentUser' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
            'midtransClientKey' => config('services.midtrans.client_key'),
            'midtransIsProduction' => (bool) config('services.midtrans.is_production', false),
        ]);
    }

    public function store(Request $request): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'customer_name' => 'required|string|max:120',
            'customer_email' => 'required|email|max:150',
            'customer_phone' => 'required|string|max:30',
            'visit_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.inventory_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'nullable|string',
            'promo_code' => 'nullable|string',
        ]);

        $order = DB::transaction(function () use ($request) {
            // Find or create customer
            $customer = Customer::firstOrCreate(
                ['email' => $request->customer_email],
                [
                    'full_name' => $request->customer_name,
                    'phone' => $request->customer_phone,
                    'is_email_verified' => true,
                ]
            );

            // Compute subtotal & check inventory availability
            $subtotal = 0;
            $itemsToCreate = [];
            $totalQuantity = 0;
            $orderParkId = null;

            foreach ($request->items as $itemData) {
                $inv = DailyInventory::with('ticketTier.park')
                    ->where('id', $itemData['inventory_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                // Dapatkan park_id asli dari tiket yang dipesan
                if (!$orderParkId) {
                    $orderParkId = $inv->ticketTier->park_id;
                }

                if (($inv->booked_quota + $itemData['quantity']) > $inv->total_quota) {
                    abort(422, "Kuota tiket {$inv->ticketTier->name} untuk tanggal ini sudah penuh.");
                }

                $itemSubtotal = $inv->price * $itemData['quantity'];
                $subtotal += $itemSubtotal;
                $totalQuantity += $itemData['quantity'];

                $itemsToCreate[] = [
                    'inventory' => $inv,
                    'park_id' => $inv->ticketTier->park_id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $inv->price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            // Fallback park jika belum terdeteksi
            if (!$orderParkId) {
                $orderParkId = Park::where('is_active', true)->value('id');
            }

            // Calculate discount & verifikasi scope promo terhadap park tujuan
            $discount = 0;
            $promo = null;
            if ($request->promo_code) {
                $promo = Promotion::where('code', strtoupper((string) $request->promo_code))->where('is_active', true)->first();
                if ($promo) {
                    if (!is_null($promo->park_id) && $promo->park_id !== $orderParkId) {
                        abort(422, "Kupon promo {$promo->code} tidak berlaku untuk destinasi ini.");
                    }

                    if ($subtotal >= $promo->min_order_amount) {
                        if ($promo->discount_type === 'PERCENTAGE') {
                            $discount = ($subtotal * $promo->discount_value) / 100;
                            if ($promo->max_discount_amount && $discount > $promo->max_discount_amount) {
                                $discount = $promo->max_discount_amount;
                            }
                        } else {
                            $discount = $promo->discount_value;
                        }
                    }
                }
            }

            $total = max(0, $subtotal - $discount);
            $orderCode = 'VRS-' . strtoupper(Str::random(8));

            // Create Order with PENDING status initially
            $order = Order::create([
                'order_code' => $orderCode,
                'park_id' => $orderParkId,
                'user_id' => auth()->id(),
                'customer_id' => $customer->id,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'subtotal_amount' => $subtotal,
                'discount_amount' => $discount,
                'total_amount' => $total,
                'status' => 'PENDING',
                'expires_at' => Carbon::now()->addHours(2),
            ]);

            // Track promo redemption if used
            if ($promo && $discount > 0) {
                PromotionRedemption::create([
                    'promotion_id' => $promo->id,
                    'order_id' => $order->id,
                    'customer_email' => $request->customer_email,
                    'discount_applied' => $discount,
                ]);
            }

            // Create OrderItems & QuotaReservations (hold quota)
            foreach ($itemsToCreate as $itemInfo) {
                $inv = $itemInfo['inventory'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'daily_inventory_id' => $inv->id,
                    'quantity' => $itemInfo['quantity'],
                    'unit_price' => $itemInfo['unit_price'],
                    'subtotal' => $itemInfo['subtotal'],
                ]);

                // Update inventory booked quota (reserved)
                $inv->increment('booked_quota', $itemInfo['quantity']);

                QuotaReservation::create([
                    'order_id' => $order->id,
                    'daily_inventory_id' => $inv->id,
                    'park_daily_capacity_id' => $inv->park_daily_capacity_id,
                    'quantity' => $itemInfo['quantity'],
                    'expires_at' => Carbon::now()->addHours(2),
                    'is_released' => false,
                ]);
            }

            // Update daily park capacity count
            $cap = ParkDailyCapacity::where('park_id', $orderParkId)
                ->where('visit_date', $request->visit_date)
                ->first();
            if ($cap) {
                $cap->increment('booked_count', $totalQuantity);
            }

            // Create initial pending payment record
            Payment::create([
                'order_id' => $order->id,
                'gateway_provider' => 'MIDTRANS',
                'payment_method' => $request->payment_method ?: 'MIDTRANS_SNAP',
                'payment_type' => 'snap',
                'transaction_reference' => $order->order_code,
                'amount' => $total,
                'status' => 'PENDING',
            ]);

            return $order;
        });

        // Request Snap Token from Midtrans
        try {
            $order->load(['items.dailyInventory.ticketTier']);
            $snapItems = [];
            foreach ($order->items as $item) {
                $snapItems[] = [
                    'id' => $item->id,
                    'price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'name' => $item->dailyInventory->ticketTier->name ?? 'Tiket Masuk',
                ];
            }

            $snapToken = $this->midtransService->createSnapToken([
                'order_code' => $order->order_code,
                'total_amount' => $order->total_amount,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'items' => $snapItems,
            ]);

            $order->update(['snap_token' => $snapToken]);
        } catch (\Throwable $e) {
            Log::error('Failed to create Midtrans Snap Token: ' . $e->getMessage(), [
                'order' => $order->order_code,
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menghubungkan ke Midtrans: ' . $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['midtrans' => 'Gagal menghubungi server pembayaran Midtrans.']);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'order_code' => $order->order_code,
                'snap_token' => $snapToken,
                'redirect_url' => route('tickets.order', ['order_code' => $order->order_code]),
            ]);
        }

        return redirect()->route('tickets.order', ['order_code' => $order->order_code]);
    }

    public function showOrder(string $order_code): Response
    {
        $order = Order::with(['items.dailyInventory.ticketTier', 'items.issuedTickets', 'payment'])
            ->where('order_code', $order_code)
            ->firstOrFail();

        // Check if Midtrans status sync is needed if order is still PENDING
        if ($order->status === 'PENDING') {
            try {
                $this->midtransService->configure();
                $status = Transaction::status($order->order_code);

                if ($status) {
                    $notificationCtrl = app(MidtransNotificationController::class);
                    $rawStatus = (array) $status;
                    $trxStatus = $rawStatus['transaction_status'] ?? '';
                    $fraud = $rawStatus['fraud_status'] ?? null;
                    $paymentType = $rawStatus['payment_type'] ?? 'midtrans';
                    $trxId = $rawStatus['transaction_id'] ?? null;

                    if ($trxStatus === 'capture' || $trxStatus === 'settlement') {
                        if ($trxStatus !== 'capture' || $fraud === 'accept') {
                            $notificationCtrl->markOrderAsPaid($order, $rawStatus, $paymentType, $trxId, $fraud);
                            $order->refresh();
                        }
                    }
                }
            } catch (\Throwable $e) {
                // If Midtrans throws 404 (transaction not found yet), it means user hasn't paid or completed payment yet
                Log::debug('Midtrans transaction check: ' . $e->getMessage());
            }
        }

        return Inertia::render('Tickets/OrderSummary', [
            'order' => $order,
            'midtransClientKey' => config('services.midtrans.client_key'),
            'midtransIsProduction' => (bool) config('services.midtrans.is_production', false),
        ]);
    }

    /**
     * Selesaikan pembayaran secara instan dari callback frontend Snap
     * (Berguna terutama saat development lokal karena webhook Midtrans tidak bisa tembus localhost)
     */
    public function confirmFrontendSuccess(Request $request, string $order_code): JsonResponse
    {
        $order = Order::with(['items.dailyInventory'])->where('order_code', $order_code)->firstOrFail();

        $payload = $request->all();
        $paymentType = $payload['payment_type'] ?? 'midtrans_snap';
        $transactionId = $payload['transaction_id'] ?? ('SNAP-' . time());
        $fraudStatus = $payload['fraud_status'] ?? 'accept';

        $notificationCtrl = app(MidtransNotificationController::class);
        $notificationCtrl->markOrderAsPaid($order, $payload, $paymentType, $transactionId, $fraudStatus);

        return response()->json([
            'success' => true,
            'redirect_url' => route('tickets.order', ['order_code' => $order->order_code]),
        ]);
    }

    public function lookupOrder(Request $request): JsonResponse
    {
        $request->validate([
            'order_code' => 'required|string',
            'email' => 'required|email',
        ]);

        $order = Order::where('order_code', trim((string) $request->order_code))
            ->where('customer_email', trim((string) $request->email))
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan dengan kode dan email tersebut tidak ditemukan. Silakan periksa kembali data Anda.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'redirect_url' => route('tickets.order', ['order_code' => $order->order_code]),
        ]);
    }
}
