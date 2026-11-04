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

        $parks = Park::where('is_active', true)->get();

        $selectedPark = null;
        if ($parkId) {
            $selectedPark = $parks->firstWhere('id', $parkId) ?: $parks->firstWhere('slug', $parkId);
        }
        if (!$selectedPark && $parks->isNotEmpty()) {
            $selectedPark = $parks->first();
        }

        // Get daily capacity for selected date & park
        $capacity = null;
        $inventories = collect();

        if ($selectedPark) {
            $capacity = ParkDailyCapacity::where('park_id', $selectedPark->id)
                ->where('visit_date', $date)
                ->first();

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
            'selectedDate' => $date,
            'capacity' => $capacity,
            'inventories' => $inventories,
        ]);
    }

    public function checkPromo(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric',
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
            'success' => true,
            'code' => $promo->code,
            'discount_amount' => (int)$discount,
            'discount_type' => $promo->discount_type,
        ]);
    }
}
