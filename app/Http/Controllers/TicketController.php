<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\DailyInventory;
use App\Models\ParkDailyCapacity;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $parkId = $request->query('park_id');

        $parks = Park::where('is_active', true)
            ->select(['id', 'name', 'category', 'slug', 'location_address', 'open_time', 'close_time', 'image_url', 'default_daily_capacity'])
            ->orderBy('name')
            ->get();

        $selectedPark = null;
        if ($parkId) {
            $selectedPark = $parks->firstWhere('id', $parkId) ?: $parks->firstWhere('slug', $parkId);
        }
        if (!$selectedPark && $parks->isNotEmpty()) {
            $selectedPark = $parks->first();
        }

        // Get unique categories for filtering
        $categories = $parks->pluck('category')->filter()->unique()->values();

        // Get daily capacity for selected date & park
        $capacity = null;
        $inventories = collect();

        if ($selectedPark) {
            // Auto-generate or get daily capacity for selected date & park
            $capacity = ParkDailyCapacity::firstOrCreate(
                [
                    'park_id' => $selectedPark->id,
                    'visit_date' => $date,
                ],
                [
                    'max_capacity' => $selectedPark->default_daily_capacity ?? 5000,
                    'booked_count' => 0,
                    'locked_count' => 0,
                    'is_closed' => false,
                ]
            );

            // Pastikan setiap active ticketTier memiliki DailyInventory untuk tanggal tersebut
            $isWeekend = \Carbon\Carbon::parse($date)->isWeekend();
            $tiers = $selectedPark->ticketTiers()->where('is_active', true)->get();
            foreach ($tiers as $tier) {
                $targetPrice = $isWeekend 
                    ? ($tier->weekend_price ?? ($tier->weekday_price ? (int)($tier->weekday_price * 1.2) : 100000))
                    : ($tier->weekday_price ?? 75000);

                $inventory = DailyInventory::firstOrCreate(
                    [
                        'ticket_tier_id' => $tier->id,
                        'visit_date' => $date,
                    ],
                    [
                        'park_daily_capacity_id' => $capacity->id,
                        'price' => $targetPrice,
                        'total_quota' => $tier->initial_quota ?? 1000,
                        'booked_quota' => 0,
                        'locked_quota' => 0,
                        'is_open' => true,
                    ]
                );

                // Jika inventori sudah ada tetapi harganya belum sesuai (misalnya baru di-generate dengan harga default lama)
                if ($inventory->booked_quota === 0 && $inventory->price !== $targetPrice) {
                    $inventory->update(['price' => $targetPrice]);
                }
            }

            // Get daily inventories for date & park
            $inventories = DailyInventory::with('ticketTier')
                ->whereHas('ticketTier', function ($q) use ($selectedPark) {
                    $q->where('park_id', $selectedPark->id)->where('is_active', true);
                })
                ->where('visit_date', $date)
                ->where('is_open', true)
                ->get();
        }

        return Inertia::render('Tickets/Index', [
            'parks' => $parks,
            'park' => $selectedPark,
            'categories' => $categories,
            'selectedDate' => $date,
            'capacity' => $capacity,
            'inventories' => $inventories,
        ]);
    }

    public function checkPromo(Request $request)
    {
        $request->validate([
            'code'     => 'required|string',
            'subtotal' => 'required|numeric',
            'park_id'  => 'nullable|exists:parks,id',
        ]);

        $promo = Promotion::where('code', strtoupper($request->code))
            ->where('is_active', true)
            ->where('valid_from', '<=', Carbon::now())
            ->where('valid_until', '>=', Carbon::now())
            ->first();

        if (!$promo) {
            return response()->json([
                'success' => false,
                'message' => 'Kode promo tidak valid atau telah kadaluwarsa.',
            ], 422);
        }

        // ✅ VALIDASI SCOPING PARK: Promo milik park tertentu hanya valid di park itu
        if (!is_null($promo->park_id)) {
            if (!$request->park_id || $promo->park_id !== $request->park_id) {
                $parkName = $promo->park?->name ?? 'taman bermain lain';
                return response()->json([
                    'success' => false,
                    'message' => "Kode promo ini hanya berlaku untuk tiket di {$parkName}, tidak dapat digunakan di tempat ini.",
                ], 422);
            }
        }

        if ($request->subtotal < $promo->min_order_amount) {
            return response()->json([
                'success' => false,
                'message' => 'Minimum transaksi untuk promo ini adalah Rp ' . number_format($promo->min_order_amount, 0, ',', '.'),
            ], 422);
        }

        $discount = 0;
        if ($promo->discount_type === 'PERCENTAGE') {
            $discount = ($request->subtotal * $promo->discount_value) / 100;
            if ($promo->max_discount_amount && $discount > $promo->max_discount_amount) {
                $discount = $promo->max_discount_amount;
            }
        } else {
            $discount = $promo->discount_value;
        }

        return response()->json([
            'success'         => true,
            'code'            => $promo->code,
            'discount_amount' => (int)$discount,
            'discount_type'   => $promo->discount_type,
            'park_id'         => $promo->park_id,  // null = berlaku global
            'is_global'       => is_null($promo->park_id),
        ]);
    }
}
