<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\Attraction;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\CheckInLog;
use App\Models\ParkDailyCapacity;
use App\Models\DailyInventory;
use App\Models\Gate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->format('Y-m-d');
        $park = Park::where('is_active', true)->first();

        // 1. Metrics
        $totalRevenueToday = Order::whereDate('created_at', $today)
            ->where('status', 'PAID')
            ->sum('total_amount');

        $totalTicketsSoldToday = IssuedTicket::whereDate('created_at', $today)->count();
        $totalCheckInsToday = CheckInLog::whereDate('scan_time', $today)
            ->where('scan_result', 'SUCCESS')
            ->count();

        $capacityToday = ParkDailyCapacity::where('park_id', $park->id)
            ->where('visit_date', $today)
            ->first();

        // 2. Attractions List
        $attractions = Attraction::with('zone')->orderBy('name')->get();

        // 3. Daily Inventories Today
        $inventories = DailyInventory::with('ticketTier')
            ->where('visit_date', $today)
            ->get();

        // 4. Recent Orders
        $recentOrders = Order::with('items.dailyInventory.ticketTier')
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        // 5. Recent Check-in Stream
        $liveCheckIns = CheckInLog::with(['ticket.orderItem.dailyInventory.ticketTier', 'gate', 'staffUser'])
            ->orderBy('scan_time', 'desc')
            ->take(10)
            ->get();

        // 6. Active Gates
        $gates = Gate::where('park_id', $park->id)->get();

        return Inertia::render('Admin/Dashboard', [
            'park' => $park,
            'metrics' => [
                'revenue_today' => $totalRevenueToday,
                'tickets_sold_today' => $totalTicketsSoldToday,
                'checkins_today' => $totalCheckInsToday,
                'booked_capacity' => $capacityToday ? $capacityToday->booked_count : 0,
                'max_capacity' => $capacityToday ? $capacityToday->max_capacity : $park->default_daily_capacity,
            ],
            'attractions' => $attractions,
            'inventories' => $inventories,
            'recentOrders' => $recentOrders,
            'liveCheckIns' => $liveCheckIns,
            'gates' => $gates,
        ]);
    }

    public function updateAttractionStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:OPERATIONAL,MAINTENANCE,CLOSED',
        ]);

        $attraction = Attraction::findOrFail($id);
        $attraction->update(['status' => $request->status]);

        return redirect()->back()->with('success', 'Status wahana berhasil diperbarui.');
    }

    public function updateCapacity(Request $request)
    {
        $request->validate([
            'visit_date' => 'required|date',
            'max_capacity' => 'required|integer|min:100',
        ]);

        $park = Park::where('is_active', true)->first();

        ParkDailyCapacity::updateOrCreate(
            ['park_id' => $park->id, 'visit_date' => $request->visit_date],
            ['max_capacity' => $request->max_capacity]
        );

        return redirect()->back()->with('success', 'Kapasitas harian berhasil diperbarui.');
    }
}
