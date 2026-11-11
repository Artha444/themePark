<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\Promotion;
use App\Models\DailyInventory;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ParkController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');

        // Ambil semua Theme Park / Galeri yang aktif beserta relasi
        $parks = Park::withCount(['zones', 'ticketTiers'])
            ->with(['zones.attractions', 'ticketTiers'])
            ->where('is_active', true)
            ->get()
            ->map(function ($park) use ($today) {
                // Hitung total atraksi/wahana
                $totalAttractions = $park->zones->sum(function ($zone) {
                    return $zone->attractions->count();
                });

                // Ambil harga terendah dari inventori tiket aktif mendatang
                $tierIds = $park->ticketTiers->pluck('id');
                $minPrice = DailyInventory::whereIn('ticket_tier_id', $tierIds)
                    ->where('visit_date', '>=', $today)
                    ->where('is_open', true)
                    ->min('price') ?? 75000;

                // Tentukan kategori & cover image representatif
                $category = $park->category ?: (str_contains(strtolower($park->name), 'art') || str_contains(strtolower($park->name), 'pavilion') ? 'Art & Light Exhibition' : 'Theme Park & Wahana');
                $isArt = str_contains(strtolower($category), 'art') || str_contains(strtolower($park->name), 'art');
                $defaultImageUrl = $isArt
                    ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80'
                    : 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=800&q=80';
                $imageUrl = !empty($park->image_url) ? $park->image_url : $defaultImageUrl;

                return [
                    'id' => $park->id,
                    'slug' => $park->slug,
                    'name' => $park->name,
                    'description' => $park->description,
                    'location_address' => $park->location_address,
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

        // Ambil promo aktif lintas destinasi
        $now = Carbon::now();
        $promotions = Promotion::where('is_active', true)
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->take(3)
            ->get();

        return Inertia::render('Welcome', [
            'parks' => $parks,
            'promotions' => $promotions,
            'today' => $today,
        ]);
    }

    public function show($id)
    {
        $today = Carbon::today()->format('Y-m-d');

        $park = Park::with(['zones.attractions', 'ticketTiers.dailyInventories' => function ($q) use ($today) {
                $q->where('visit_date', '>=', $today)
                  ->where('is_open', true)
                  ->orderBy('visit_date');
            }])
            ->where('is_active', true)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('slug', $id);
            })
            ->firstOrFail();

        // Kategori
        $category = $park->category ?: (str_contains(strtolower($park->name), 'art') || str_contains(strtolower($park->name), 'pavilion') ? 'Art & Light Exhibition' : 'Theme Park & Wahana');
        $isArt = str_contains(strtolower($category), 'art') || str_contains(strtolower($park->name), 'art');
        $defaultImageUrl = $isArt
            ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80'
            : 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=1200&q=80';
        $imageUrl = !empty($park->image_url) ? $park->image_url : $defaultImageUrl;

        // Ambil harga tiket terendah
        $tierIds = $park->ticketTiers->pluck('id');
        $minPrice = DailyInventory::whereIn('ticket_tier_id', $tierIds)
            ->where('visit_date', '>=', $today)
            ->where('is_open', true)
            ->min('price') ?? 75000;

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
                'ticket_tiers' => $park->ticketTiers->where('is_active', true)->values()->map(function ($tier) use ($today) {
                    $nextInv = $tier->dailyInventories->firstWhere('visit_date', $today)
                        ?: $tier->dailyInventories->first();

                    return [
                        'id' => $tier->id,
                        'name' => $tier->name,
                        'code' => $tier->code,
                        'description' => $tier->description,
                        'min_age' => $tier->min_age,
                        'max_age' => $tier->max_age,
                        'max_height_cm' => $tier->max_height_cm,
                        'price' => $nextInv ? $nextInv->price : $tier->initial_price,
                        'quota' => $nextInv ? $nextInv->total_quota : $tier->initial_quota,
                    ];
                }),
            ],
            'promotions' => $promotions,
            'today' => $today,
        ]);
    }
}
