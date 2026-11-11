<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\DailyInventory;
use App\Models\ParkDailyCapacity;
use App\Models\QuotaReservation;
use App\Models\Payment;
use App\Models\IssuedTicket;
use App\Models\Promotion;
use App\Models\PromotionRedemption;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CheckoutController extends Controller
{
    public function index(Request $request)
    {
        $items = json_decode($request->query('items', '[]'), true);
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
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
                $qty = (int)$item['quantity'];
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
            $promo = Promotion::where('code', strtoupper($promoCode))->where('is_active', true)->first();
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
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:120',
            'customer_email' => 'required|email|max:150',
            'customer_phone' => 'required|string|max:30',
            'visit_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.inventory_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|string',
            'promo_code' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
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
                $promo = Promotion::where('code', strtoupper($request->promo_code))->where('is_active', true)->first();
                if ($promo) {
                    // Cek apakah promo spesifik untuk park tertentu
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

            // Create Order dengan relasi park_id & user_id yang tepat
            $order = Order::create([
                'order_code' => $orderCode,
                'park_id' => $orderParkId,
                'user_id' => auth()->id(), // Terhubung langsung ke user yang login
                'customer_id' => $customer->id,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'subtotal_amount' => $subtotal,
                'discount_amount' => $discount,
                'total_amount' => $total,
                'status' => 'PAID', // Instant approval simulation
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

            // Create OrderItems, IssuedTickets & QuotaReservations
            foreach ($itemsToCreate as $itemInfo) {
                $inv = $itemInfo['inventory'];
                $itemParkId = $itemInfo['park_id'];

                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'daily_inventory_id' => $inv->id,
                    'quantity' => $itemInfo['quantity'],
                    'unit_price' => $itemInfo['unit_price'],
                    'subtotal' => $itemInfo['subtotal'],
                ]);

                // Update inventory booked quota
                $inv->increment('booked_quota', $itemInfo['quantity']);

                // Catat di QuotaReservation agar sinkron dengan ERD
                QuotaReservation::create([
                    'order_id' => $order->id,
                    'daily_inventory_id' => $inv->id,
                    'park_daily_capacity_id' => $inv->park_daily_capacity_id,
                    'quantity' => $itemInfo['quantity'],
                    'expires_at' => Carbon::now()->addHours(2),
                    'is_released' => false,
                ]);

                // Create individual tickets dengan park_id yang akurat
                for ($k = 0; $k < $itemInfo['quantity']; $k++) {
                    IssuedTicket::create([
                        'order_item_id' => $orderItem->id,
                        'park_id' => $itemParkId,
                        'valid_date' => $request->visit_date,
                        'ticket_code' => 'TKT-' . strtoupper(Str::random(8)),
                        'qr_token' => 'VURASI-QR-' . strtoupper(Str::random(16)),
                        'status' => 'VALID',
                    ]);
                }
            }

            // Update daily park capacity count untuk park tujuan
            $cap = ParkDailyCapacity::where('park_id', $orderParkId)
                ->where('visit_date', $request->visit_date)
                ->first();
            if ($cap) {
                $cap->increment('booked_count', $totalQuantity);
            }

            // Create Payment
            Payment::create([
                'order_id' => $order->id,
                'gateway_provider' => 'SIMULATED_GATEWAY',
                'payment_method' => $request->payment_method,
                'transaction_reference' => 'TRX-' . time() . '-' . rand(100, 999),
                'amount' => $total,
                'status' => 'SUCCESS',
                'paid_at' => Carbon::now(),
            ]);

            return redirect()->route('tickets.order', ['order_code' => $order->order_code]);
        });
    }

    public function showOrder($order_code)
    {
        $order = Order::with(['items.dailyInventory.ticketTier', 'items.issuedTickets', 'payment'])
            ->where('order_code', $order_code)
            ->firstOrFail();

        return Inertia::render('Tickets/OrderSummary', [
            'order' => $order,
        ]);
    }

    public function lookupOrder(Request $request)
    {
        $request->validate([
            'order_code' => 'required|string',
            'email' => 'required|email',
        ]);

        $order = Order::where('order_code', trim($request->order_code))
            ->where('customer_email', trim($request->email))
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
