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
use Inertia\Response;

class ParkController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today()->format('Y-m-d');

        // Pre-fetch harga termurah asli dari ticket_tiers aktif milik masing-masing park
        $tierMinPrices = \App\Models\TicketTier::where('is_active', true)
            ->groupBy('park_id')
            ->selectRaw('park_id, MIN(weekday_price) as min_price')
            ->pluck('min_price', 'park_id');

        // Pre-fetch minimum ticket prices grouped by park to prevent N+1 queries
        $inventoryMinPrices = DailyInventory::query()
            ->join('ticket_tiers', 'daily_inventories.ticket_tier_id', '=', 'ticket_tiers.id')
            ->where('daily_inventories.visit_date', '>=', $today)
            ->where('daily_inventories.is_open', true)
            ->where('ticket_tiers.is_active', true)
            ->where('daily_inventories.price', '>', 0)
            ->groupBy('ticket_tiers.park_id')
            ->selectRaw('ticket_tiers.park_id, MIN(daily_inventories.price) as min_price')
            ->pluck('min_price', 'park_id');

        // Ambil semua Theme Park / Galeri yang aktif beserta relasi
        $parks = Park::withCount(['zones', 'ticketTiers'])
            ->with(['zones.attractions'])
            ->where('is_active', true)
            ->get()
            ->map(function ($park) use ($tierMinPrices, $inventoryMinPrices) {
                $totalAttractions = $park->zones->sum(function ($zone) {
                    return $zone->attractions->count();
                });

                $minPrice = $tierMinPrices->get($park->id) ?? $inventoryMinPrices->get($park->id) ?? null;

                $category = $park->category ?: (str_contains(strtolower($park->name), 'art') || str_contains(strtolower($park->name), 'pavilion') ? 'Art & Light Exhibition' : 'Theme Park & Wahana');
                $isArt = str_contains(strtolower($category), 'art') || str_contains(strtolower($park->name), 'art');
                $defaultImageUrl = $isArt
                    ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80'
                    : 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=800&q=80';
                $imageUrl = ! empty($park->image_url) ? $park->image_url : $defaultImageUrl;

                return [
                    'id' => $park->id,
                    'slug' => $park->slug,
                    'name' => $park->name,
                    'description' => $park->description,
                    'location_address' => $park->location_address,
                    'city' => $park->city,
                    'latitude' => $park->latitude,
                    'longitude' => $park->longitude,
                    'maps_place_name' => $park->maps_place_name,
                    'open_time' => $park->open_time,
                    'close_time' => $park->close_time,
                    'default_daily_capacity' => $park->default_daily_capacity,
                    'category' => $category,
                    'image_url' => $imageUrl,
                    'min_price' => $minPrice,
                    'total_zones' => $park->zones_count,
                    'total_attractions' => $totalAttractions,
                    'zones_preview' => $park->zones->pluck('name')->take(3),
                ];
            });

        // Ambil semua promo aktif lintas destinasi (ditambahkan oleh admin)
        $now = Carbon::now();
        $promotions = Promotion::with('park')
            ->where('is_active', true)
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Welcome', [
            'parks' => $parks,
            'promotions' => $promotions,
            'today' => $today,
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $today = Carbon::today()->format('Y-m-d');
        $selectedDate = $request->query('date', $today);

        $park = Park::with(['zones.attractions', 'ticketTiers' => function ($q) {
            $q->where('is_active', true);
        }])
            ->where('is_active', true)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('slug', $id);
            })
            ->firstOrFail();

        // Cek hari libur nasional atau weekend
        $nationalHoliday = NationalHoliday::whereDate('holiday_date', $selectedDate)->first();
        $isHoliday = $nationalHoliday !== null;
        $isWeekend = Carbon::parse($selectedDate)->isWeekend();

        // Pastikan capacity & daily inventory tersedia untuk tanggal terpilih
        $capacity = ParkDailyCapacity::firstOrCreate(
            [
                'park_id' => $park->id,
                'visit_date' => $selectedDate,
            ],
            [
                'max_capacity' => $park->default_daily_capacity ?? 5000,
                'booked_count' => 0,
                'locked_count' => 0,
                'is_closed' => false,
            ]
        );

        foreach ($park->ticketTiers as $tier) {
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
                    'visit_date' => $selectedDate,
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

            if ($inventory->booked_quota === 0 && $inventory->price !== $targetPrice) {
                $inventory->update(['price' => $targetPrice]);
            }
        }

        $inventories = DailyInventory::with('ticketTier')
            ->whereIn('ticket_tier_id', $park->ticketTiers->pluck('id'))
            ->where('visit_date', $selectedDate)
            ->where('is_open', true)
            ->get();

        $category = $park->category ?: (str_contains(strtolower($park->name), 'art') || str_contains(strtolower($park->name), 'pavilion') ? 'Art & Light Exhibition' : 'Theme Park & Wahana');
        $isArt = str_contains(strtolower($category), 'art') || str_contains(strtolower($park->name), 'art');
        $defaultImageUrl = $isArt
            ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80'
            : 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=1200&q=80';
        $imageUrl = ! empty($park->image_url) ? $park->image_url : $defaultImageUrl;

        $minPrice = $inventories->isNotEmpty() ? $inventories->min('price') : 75000;

        // Promo aktif spesifik park atau global
        $now = Carbon::now();
        $promotions = Promotion::where('is_active', true)
            ->where(function ($q) use ($park) {
                $q->whereNull('park_id')->orWhere('park_id', $park->id);
            })
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->get();

        return Inertia::render('Parks/Show', [
            'park' => [
                'id' => $park->id,
                'slug' => $park->slug,
                'name' => $park->name,
                'description' => $park->description,
                'image_url' => $imageUrl,
                'category' => $category,
                'location_address' => $park->location_address,
                'city' => $park->city,
                'latitude' => $park->latitude,
                'longitude' => $park->longitude,
                'maps_place_name' => $park->maps_place_name,
                'open_time' => $park->open_time,
                'close_time' => $park->close_time,
                'default_daily_capacity' => $park->default_daily_capacity,
                'min_price' => $minPrice,
                'zones' => $park->zones->map(function ($zone) {
                    return [
                        'id' => $zone->id,
                        'name' => $zone->name,
                        'description' => $zone->description,
                        'attractions' => $zone->attractions->map(function ($attraction) {
                            return [
                                'id' => $attraction->id,
                                'name' => $attraction->name,
                                'description' => $attraction->description,
                                'image_url' => $attraction->image_url,
                                'min_height_cm' => $attraction->min_height_cm,
                                'status' => $attraction->status,
                            ];
                        }),
                    ];
                }),
                'ticket_tiers' => $park->ticketTiers->values()->map(function ($tier) use ($inventories) {
                    $inv = $inventories->firstWhere('ticket_tier_id', $tier->id);

                    return [
                        'id' => $tier->id,
                        'name' => $tier->name,
                        'code' => $tier->code,
                        'description' => $tier->description,
                        'min_age' => $tier->min_age,
                        'max_age' => $tier->max_age,
                        'max_height_cm' => $tier->max_height_cm,
                        'price' => $inv ? $inv->price : $tier->initial_price,
                        'quota' => $inv ? ($inv->total_quota - $inv->booked_quota - $inv->locked_quota) : $tier->initial_quota,
                        'inventory_id' => $inv?->id,
                    ];
                }),
            ],
            'inventories' => $inventories,
            'selectedDate' => $selectedDate,
            'capacity' => $capacity,
            'holiday' => $nationalHoliday,
            'promotions' => $promotions,
            'today' => $today,
        ]);
    }
}
