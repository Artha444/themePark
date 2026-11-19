<?php

namespace App\Http\Controllers;

use App\Models\DailyInventory;
use App\Models\NationalHoliday;
use App\Models\Park;
use App\Models\ParkDailyCapacity;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $parkId = $request->query('park_id');

        $today = Carbon::today()->format('Y-m-d');

        // Pre-fetch harga termurah asli dari ticket_tiers aktif milik masing-masing park
        $tierMinPrices = \App\Models\TicketTier::where('is_active', true)
            ->groupBy('park_id')
            ->selectRaw('park_id, MIN(weekday_price) as min_price')
            ->pluck('min_price', 'park_id');

        // Pre-fetch minimum ticket prices dari DailyInventory (jika ada harga promo/harian aktif)
        $inventoryMinPrices = DailyInventory::query()
            ->join('ticket_tiers', 'daily_inventories.ticket_tier_id', '=', 'ticket_tiers.id')
            ->where('daily_inventories.visit_date', '>=', $today)
            ->where('daily_inventories.is_open', true)
            ->where('ticket_tiers.is_active', true)
            ->where('daily_inventories.price', '>', 0)
            ->groupBy('ticket_tiers.park_id')
            ->selectRaw('ticket_tiers.park_id, MIN(daily_inventories.price) as min_price')
            ->pluck('min_price', 'park_id');

        $parkModels = Park::where('is_active', true)
            ->select(['id', 'name', 'category', 'slug', 'location_address', 'city', 'open_time', 'close_time', 'image_url', 'default_daily_capacity'])
            ->orderBy('name')
            ->get();

        $selectedPark = null;
        if ($parkId) {
            $selectedPark = $parkModels->firstWhere('id', $parkId) ?: $parkModels->firstWhere('slug', $parkId);
        }
        if (! $selectedPark && $parkModels->isNotEmpty()) {
            $selectedPark = $parkModels->first();
        }

        $parks = $parkModels->map(function ($p) use ($tierMinPrices, $inventoryMinPrices) {
            $category = $p->category ?: (str_contains(strtolower($p->name), 'art') || str_contains(strtolower($p->name), 'pavilion') ? 'Art & Light Exhibition' : 'Theme Park & Wahana');
            $isArt = str_contains(strtolower($category), 'art') || str_contains(strtolower($p->name), 'art');
            $defaultImageUrl = $isArt
                ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80'
                : 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=800&q=80';
            $imageUrl = ! empty($p->image_url) ? $p->image_url : $defaultImageUrl;

            // Prioritaskan harga termurah asli dari tier tiket aktif milik park tersebut
            $realMinPrice = $tierMinPrices->get($p->id) ?? $inventoryMinPrices->get($p->id) ?? null;

            return [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'category' => $category,
                'location_address' => $p->location_address,
                'city' => $p->city,
                'open_time' => $p->open_time,
                'close_time' => $p->close_time,
                'default_daily_capacity' => $p->default_daily_capacity,
                'image_url' => $imageUrl,
                'min_price' => $realMinPrice,
            ];
        });

        // Get unique categories for filtering
        $categories = $parks->pluck('category')->filter()->unique()->values();

        // Cek apakah tanggal merupakan Hari Libur Nasional atau Weekend
        $nationalHoliday = NationalHoliday::whereDate('holiday_date', $date)->first();
        $isHoliday = $nationalHoliday !== null;
        $isWeekend = Carbon::parse($date)->isWeekend();

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
            $tiers = $selectedPark->ticketTiers()->where('is_active', true)->get();
            foreach ($tiers as $tier) {
                if ($isHoliday) {
                    $targetPrice = $tier->holiday_price ?? ($tier->weekend_price ? (int) ($tier->weekend_price * 1.15) : 120000);
                } elseif ($isWeekend) {
                    $targetPrice = $tier->weekend_price ?? ($tier->weekday_price ? (int) ($tier->weekday_price * 1.2) : 100000);
                } else {
                    $targetPrice = $tier->weekday_price ?? 75000;
                }

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
            'holiday' => $nationalHoliday,
            'isWeekend' => $isWeekend,
        ]);
    }

    public function checkPromo(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric',
            'park_id' => 'nullable|exists:parks,id',
        ]);

        $promo = Promotion::where('code', strtoupper($request->code))
            ->where('is_active', true)
            ->where('valid_from', '<=', Carbon::now())
            ->where('valid_until', '>=', Carbon::now())
            ->first();

        if (! $promo) {
            return response()->json([
                'success' => false,
                'message' => 'Kode promo tidak valid atau telah kadaluwarsa.',
            ], 422);
        }

        // ✅ VALIDASI SCOPING PARK: Promo milik park tertentu hanya valid di park itu
        if (! is_null($promo->park_id)) {
            if (! $request->park_id || $promo->park_id !== $request->park_id) {
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
                'message' => 'Minimum transaksi untuk promo ini adalah Rp '.number_format($promo->min_order_amount, 0, ',', '.'),
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
            'success' => true,
            'code' => $promo->code,
            'discount_amount' => (int) $discount,
            'discount_type' => $promo->discount_type,
            'park_id' => $promo->park_id,  // null = berlaku global
            'is_global' => is_null($promo->park_id),
        ]);
    }
}
