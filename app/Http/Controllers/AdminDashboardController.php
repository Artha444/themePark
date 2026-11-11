<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\Zone;
use App\Models\Attraction;
use App\Models\Order;
use App\Models\IssuedTicket;
use App\Models\CheckInLog;
use App\Models\ParkDailyCapacity;
use App\Models\DailyInventory;
use App\Models\TicketTier;
use App\Models\Promotion;
use App\Models\Gate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        $allParks = Park::where('is_active', true)->orderBy('name')->get();

        // Mode Role: default ke SUPER_ADMIN (Admin Pusat), atau PARK_ADMIN (Admin Wahana/Destinasi)
        // Mendukung simulasi role melalui query param ?as_role=SUPER_ADMIN / ?as_role=PARK_ADMIN
        $simulatedRole = $request->query('as_role', session('admin_role', 'SUPER_ADMIN'));
        session(['admin_role' => $simulatedRole]);

        $isSuperAdmin = ($simulatedRole === 'SUPER_ADMIN');

        // Jika Park Admin, tentukan park yang dia miliki (default ke park pertama jika belum diset)
        $assignedParkId = $request->query('assigned_park_id', session('assigned_park_id', $allParks->first()?->id));
        session(['assigned_park_id' => $assignedParkId]);

        // Tentukan park yang aktif sedang dibuka di dashboard
        $selectedParkId = $isSuperAdmin ? $request->query('park_id', $allParks->first()?->id) : $assignedParkId;
        
        $park = $allParks->firstWhere('id', $selectedParkId) ?: $allParks->first();

        // 1. Metrics Hari Ini
        $totalRevenueToday = Order::whereDate('created_at', $today)
            ->where('status', 'PAID')
            ->sum('total_amount');

        $totalTicketsSoldToday = IssuedTicket::whereDate('created_at', $today)
            ->when($park, function ($q) use ($park) {
                $q->where('park_id', $park->id);
            })
            ->count();

        $totalCheckInsToday = CheckInLog::whereDate('scan_time', $today)
            ->where('scan_result', 'SUCCESS')
            ->when($park, function ($q) use ($park) {
                $q->whereHas('gate', function ($g) use ($park) {
                    $g->where('park_id', $park->id);
                });
            })
            ->count();

        $capacityToday = $park ? ParkDailyCapacity::where('park_id', $park->id)
            ->where('visit_date', $today)
            ->first() : null;

        // 2. Kalender Kapasitas & Jadwal Tutup 14 Hari ke Depan
        $calendarCapacities = [];
        if ($park) {
            $endDate = Carbon::today()->addDays(14)->format('Y-m-d');
            $calendarCapacities = ParkDailyCapacity::where('park_id', $park->id)
                ->whereBetween('visit_date', [$today, $endDate])
                ->orderBy('visit_date', 'asc')
                ->get();
        }

        // 3. Ticket Tiers & Inventori Hari Ini
        $ticketTiers = $park ? TicketTier::where('park_id', $park->id)->orderBy('created_at')->get() : collect();
        $dailyInventories = $park ? DailyInventory::with('ticketTier')
            ->whereHas('ticketTier', function ($t) use ($park) {
                $t->where('park_id', $park->id);
            })
            ->where('visit_date', $today)
            ->get() : collect();

        // 4. Attractions & Zones
        $attractions = Attraction::with('zone')
            ->when($park, function ($q) use ($park) {
                $q->whereHas('zone', function ($z) use ($park) {
                    $z->where('park_id', $park->id);
                });
            })
            ->orderBy('name')
            ->get();

        $zones = $park ? Zone::where('park_id', $park->id)->get() : collect();

        // 5. Promotions — tampilkan promo milik park ini + promo global (park_id null)
        $promotions = Promotion::with('park')
            ->where(function ($q) use ($park) {
                $q->whereNull('park_id')
                  ->orWhere('park_id', $park?->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // 6. Recent Orders & Live Check-ins (scoped to park if park selected)
        $recentOrders = Order::with(['items.dailyInventory.ticketTier', 'park'])
            ->when($park, function ($q) use ($park) {
                $q->where('park_id', $park->id);
            })
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        $liveCheckIns = CheckInLog::with(['ticket.orderItem.dailyInventory.ticketTier', 'gate', 'staffUser'])
            ->orderBy('scan_time', 'desc')
            ->take(10)
            ->get();

        $gates = $park ? Gate::where('park_id', $park->id)->get() : collect();

        return Inertia::render('Admin/Dashboard', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $simulatedRole, // 'SUPER_ADMIN' atau 'PARK_ADMIN'
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin, // Hanya Super Admin yang bisa tambah/edit tempat
            'metrics' => [
                'revenue_today' => $totalRevenueToday,
                'tickets_sold_today' => $totalTicketsSoldToday,
                'checkins_today' => $totalCheckInsToday,
                'booked_capacity' => $capacityToday ? $capacityToday->booked_count : 0,
                'max_capacity' => $capacityToday ? $capacityToday->max_capacity : ($park ? $park->default_daily_capacity : 5000),
            ],
            'calendarCapacities' => $calendarCapacities,
            'ticketTiers' => $ticketTiers,
            'dailyInventories' => $dailyInventories,
            'attractions' => $attractions,
            'zones' => $zones,
            'promotions' => $promotions,
            'recentOrders' => $recentOrders,
            'liveCheckIns' => $liveCheckIns,
            'gates' => $gates,
        ]);
    }

    // =========================================================
    // KHUSUS ADMIN PUSAT (SUPER ADMIN): TAMBAH & EDIT TEMPAT
    // =========================================================
    public function storePark(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'location_address' => 'required|string',
            'open_time' => 'required',
            'close_time' => 'required',
            'default_daily_capacity' => 'required|integer|min:100',
        ]);

        $slug = Str::slug($request->name) . '-' . rand(10, 99);

        $newPark = Park::create([
            'name' => $request->name,
            'category' => $request->category ?: 'Theme Park & Wahana',
            'slug' => $slug,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'location_address' => $request->location_address,
            'open_time' => $request->open_time,
            'close_time' => $request->close_time,
            'default_daily_capacity' => $request->default_daily_capacity,
            'is_active' => true,
        ]);

        // Buatkan otomatis 1 Zona default untuk tempat baru ini
        Zone::create([
            'park_id' => $newPark->id,
            'name' => 'Zona Utama / Hall 1',
            'description' => 'Area wahana utama dan instalasi pameran.',
        ]);

        return redirect()->route('admin.dashboard', ['park_id' => $newPark->id])
            ->with('success', "Tempat baru '{$newPark->name}' berhasil ditambahkan oleh Admin Pusat.");
    }

    public function updatePark(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'location_address' => 'required|string',
            'open_time' => 'required',
            'close_time' => 'required',
            'default_daily_capacity' => 'required|integer|min:100',
        ]);

        $park = Park::findOrFail($id);
        $park->update([
            'name' => $request->name,
            'category' => $request->category ?: $park->category,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'location_address' => $request->location_address,
            'open_time' => $request->open_time,
            'close_time' => $request->close_time,
            'default_daily_capacity' => $request->default_daily_capacity,
        ]);

        return redirect()->back()->with('success', "Informasi tempat '{$park->name}' berhasil diperbarui.");
    }

    // ==========================================
    // MANAJEMEN WAHANA (BISA DILAKUKAN PARK ADMIN)
    // ==========================================
    public function storeAttraction(Request $request)
    {
        $request->validate([
            'zone_id' => 'required|exists:zones,id',
            'name' => 'required|string|max:120',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'min_height_cm' => 'required|integer|min:0',
            'status' => 'required|in:OPERATIONAL,MAINTENANCE,CLOSED',
        ]);

        Attraction::create([
            'zone_id' => $request->zone_id,
            'name' => $request->name,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'min_height_cm' => $request->min_height_cm,
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Wahana baru berhasil ditambahkan.');
    }

    public function updateAttractionStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:OPERATIONAL,MAINTENANCE,CLOSED',
        ]);

        $attraction = Attraction::findOrFail($id);
        $attraction->update(['status' => $request->status]);

        return redirect()->back()->with('success', 'Status wahana ' . $attraction->name . ' berhasil diubah menjadi ' . $request->status);
    }

    // ==========================================
    // JADWAL BUKA/TUTUP & KAPASITAS HARIAN
    // ==========================================
    public function toggleClosedDate(Request $request)
    {
        $request->validate([
            'park_id' => 'required|exists:parks,id',
            'visit_date' => 'required|date',
        ]);

        $capacity = ParkDailyCapacity::firstOrCreate(
            ['park_id' => $request->park_id, 'visit_date' => $request->visit_date],
            [
                'max_capacity' => 5000,
                'booked_count' => 0,
                'locked_count' => 0,
                'is_closed' => false,
            ]
        );

        $capacity->update([
            'is_closed' => !$capacity->is_closed,
        ]);

        $statusText = $capacity->is_closed ? 'DITUTUP' : 'DIBUKA KEMBALI';
        return redirect()->back()->with('success', "Tanggal {$request->visit_date} berhasil diatur menjadi {$statusText}.");
    }

    public function updateCapacity(Request $request)
    {
        $request->validate([
            'park_id' => 'required|exists:parks,id',
            'visit_date' => 'required|date',
            'max_capacity' => 'required|integer|min:10',
        ]);

        ParkDailyCapacity::updateOrCreate(
            ['park_id' => $request->park_id, 'visit_date' => $request->visit_date],
            ['max_capacity' => $request->max_capacity]
        );

        return redirect()->back()->with('success', "Kapasitas kuota tanggal {$request->visit_date} berhasil diperbarui.");
    }

    // ==========================================
    // TIER TIKET & INVENTORI HARGA
    // ==========================================
    public function storeTicketTier(Request $request)
    {
        $request->validate([
            'park_id' => 'required|exists:parks,id',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'min_age' => 'nullable|integer|min:0',
            'max_age' => 'nullable|integer|min:0',
            'max_height_cm' => 'nullable|integer|min:0',
            'initial_price' => 'required|integer|min:1000',
            'initial_quota' => 'required|integer|min:10',
        ]);

        $code = 'TIER-' . strtoupper(Str::slug(substr($request->name, 0, 15))) . '-' . rand(10, 99);

        $tier = TicketTier::create([
            'park_id' => $request->park_id,
            'code' => $code,
            'name' => $request->name,
            'description' => $request->description,
            'min_age' => $request->min_age,
            'max_age' => $request->max_age,
            'max_height_cm' => $request->max_height_cm,
            'perks' => ['Akses Seluruh Area Pameran', 'E-Tiket Langsung Scan'],
            'is_active' => true,
        ]);

        for ($i = 0; $i < 14; $i++) {
            $date = Carbon::today()->addDays($i)->format('Y-m-d');
            $cap = ParkDailyCapacity::firstOrCreate(
                ['park_id' => $request->park_id, 'visit_date' => $date],
                ['max_capacity' => 5000, 'booked_count' => 0, 'locked_count' => 0, 'is_closed' => false]
            );

            DailyInventory::firstOrCreate(
                ['ticket_tier_id' => $tier->id, 'visit_date' => $date],
                [
                    'park_daily_capacity_id' => $cap->id,
                    'price' => $request->initial_price,
                    'total_quota' => $request->initial_quota,
                    'booked_quota' => 0,
                    'is_open' => true,
                ]
            );
        }

        return redirect()->back()->with('success', 'Kategori tiket ' . $tier->name . ' berhasil dibuat.');
    }

    public function toggleTicketTier($id)
    {
        $tier = TicketTier::findOrFail($id);
        $tier->update(['is_active' => !$tier->is_active]);

        $status = $tier->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Kategori tiket {$tier->name} berhasil {$status}.");
    }

    public function updateInventory(Request $request)
    {
        $request->validate([
            'inventory_id' => 'required|exists:daily_inventories,id',
            'price' => 'required|integer|min:0',
            'total_quota' => 'required|integer|min:0',
            'is_open' => 'required|boolean',
        ]);

        $inv = DailyInventory::findOrFail($request->inventory_id);
        $inv->update([
            'price' => $request->price,
            'total_quota' => $request->total_quota,
            'is_open' => $request->is_open,
        ]);

        return redirect()->back()->with('success', 'Harga & kuota inventori tiket berhasil diperbarui.');
    }

    // ==========================================
    // KUPON PROMO
    // ==========================================
    public function storePromotion(Request $request)
    {
        $request->validate([
            'code'              => 'required|string|max:30|unique:promotions,code',
            'discount_type'     => 'required|in:PERCENTAGE,FIXED',
            'discount_value'    => 'required|integer|min:1',
            'min_order_amount'  => 'required|integer|min:0',
            'valid_until'       => 'required|date|after_or_equal:today',
            'scope'             => 'required|in:park,global',
            'park_id'           => 'nullable|exists:parks,id',
        ]);

        // Jika scope = park → simpan park_id; jika global → park_id null
        $parkId = ($request->scope === 'park') ? $request->park_id : null;

        Promotion::create([
            'park_id'            => $parkId,
            'code'               => strtoupper($request->code),
            'discount_type'      => $request->discount_type,
            'discount_value'     => $request->discount_value,
            'min_order_amount'   => $request->min_order_amount,
            'max_discount_amount'=> $request->discount_type === 'PERCENTAGE' ? 100000 : $request->discount_value,
            'max_redemptions'    => 1000,
            'valid_from'         => Carbon::now(),
            'valid_until'        => Carbon::parse($request->valid_until)->endOfDay(),
            'is_active'          => true,
        ]);

        $scopeLabel = $parkId ? 'khusus untuk park ini' : 'berlaku di semua park (global)';
        return redirect()->back()->with('success', "Kupon promo {$request->code} berhasil diterbitkan — {$scopeLabel}.");
    }

    public function togglePromotion($id)
    {
        $promo = Promotion::findOrFail($id);
        $promo->update(['is_active' => !$promo->is_active]);

        $status = $promo->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Kupon promo {$promo->code} berhasil {$status}.");
    }
}
