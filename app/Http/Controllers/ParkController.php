<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\ParkDailyCapacity;
use App\Models\DailyInventory;
use App\Models\Promotion;
use App\Models\Attraction;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ParkController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        $endDate = Carbon::today()->addDays(14)->format('Y-m-d');

        // 1. Ambil semua Theme Park aktif
        $parks = Park::where('is_active', true)->get();

        // 2. Tentukan Theme Park yang dipilih
        $selectedParkId = $request->query('park');
        $selectedPark = null;

        if ($selectedParkId) {
            $selectedPark = $parks->firstWhere('id', $selectedParkId) 
                ?: $parks->firstWhere('slug', $selectedParkId);
        }

        if (!$selectedPark && $parks->isNotEmpty()) {
            $selectedPark = $parks->first();
        }

        $capacities = [];
        $ticketTiersData = [];
        $featuredAttractions = [];

        if ($selectedPark) {
            // 3. Ketersediaan tanggal (park_daily_capacities 14 hari ke depan)
            $dailyCaps = ParkDailyCapacity::where('park_id', $selectedPark->id)
                ->whereBetween('visit_date', [$today, $endDate])
                ->orderBy('visit_date', 'asc')
                ->get();

            $capacities = $dailyCaps->map(function ($cap) {
                $remaining = max(0, $cap->max_capacity - $cap->booked_count - $cap->locked_count);
                $percent = $cap->max_capacity > 0 ? ($remaining / $cap->max_capacity) * 100 : 0;
                
                $statusLabel = 'Tersedia';
                if ($cap->is_closed) {
                    $statusLabel = 'Tutup';
                } elseif ($remaining <= 0) {
                    $statusLabel = 'Habis';
                } elseif ($percent <= 20) {
                    $statusLabel = 'Hampir Habis';
                }

                return [
                    'id' => $cap->id,
                    'visit_date' => $cap->visit_date,
                    'max_capacity' => $cap->max_capacity,
                    'remaining_quota' => $remaining,
                    'is_closed' => (bool)$cap->is_closed,
                    'status_label' => $statusLabel,
                ];
            });

            // 4. Pilihan tiket (ticket_tiers) + harga terendah dari daily_inventories mendatang
            $tiers = $selectedPark->ticketTiers()->where('is_active', true)->get();
            
            // Ambil harga terendah per tier di tanggal-tanggal mendatang
            $minPrices = DailyInventory::whereIn('ticket_tier_id', $tiers->pluck('id'))
                ->where('visit_date', '>=', $today)
                ->where('is_open', true)
                ->groupBy('ticket_tier_id')
                ->selectRaw('ticket_tier_id, MIN(price) as min_price')
                ->pluck('min_price', 'ticket_tier_id');

            $ticketTiersData = $tiers->map(function ($tier) use ($minPrices) {
                $perks = is_array($tier->perks) ? $tier->perks : json_decode($tier->perks ?? '[]', true);
                return [
                    'id' => $tier->id,
                    'code' => $tier->code,
                    'name' => $tier->name,
                    'description' => $tier->description,
                    'min_age' => $tier->min_age,
                    'max_age' => $tier->max_age,
                    'max_height_cm' => $tier->max_height_cm,
                    'perks' => $perks ?: [
                        'Akses seluruh instalasi & galeri seni',
                        'Bebas antrean fisik gerbang turnstile',
                    ],
                    'starting_price' => $minPrices->get($tier->id) ?? 50000,
                ];
            });

            // 5. Wahana unggulan (4-6 attractions dikelompokkan per zones)
            $featuredAttractions = Attraction::with('zone')
                ->whereHas('zone', function ($q) use ($selectedPark) {
                    $q->where('park_id', $selectedPark->id);
                })
                ->take(6)
                ->get()
                ->map(function ($attr) {
                    return [
                        'id' => $attr->id,
                        'name' => $attr->name,
                        'description' => $attr->description,
                        'min_height_cm' => $attr->min_height_cm,
                        'max_height_cm' => $attr->max_height_cm,
                        'status' => $attr->status,
                        'zone_name' => $attr->zone ? $attr->zone->name : 'Zona Utama',
                    ];
                });
        }

        // 6. Promo aktif (promotions: is_active dan valid date)
        $now = Carbon::now();
        $promotions = Promotion::where('is_active', true)
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->take(3)
            ->get();

        return Inertia::render('Welcome', [
            'parks' => $parks,
            'selectedPark' => $selectedPark,
            'capacities' => $capacities,
            'ticketTiers' => $ticketTiersData,
            'promotions' => $promotions,
            'featuredAttractions' => $featuredAttractions,
            'today' => $today,
        ]);
    }
}
