<?php

namespace App\Http\Controllers;

use App\Models\Attraction;
use App\Models\CheckInLog;
use App\Models\DailyInventory;
use App\Models\Gate;
use App\Models\IssuedTicket;
use App\Models\NationalHoliday;
use App\Models\Order;
use App\Models\Park;
use App\Models\ParkDailyCapacity;
use App\Models\Promotion;
use App\Models\TicketTier;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

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

        // 2. Kalender Kapasitas & Jadwal Tutup (60 Hari ke Depan untuk Kalender Bulanan Interaktif)
        $calendarCapacities = [];
        if ($park) {
            $endDate = Carbon::today()->addDays(60)->format('Y-m-d');
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

        // 7. National Holidays (untuk manajemen kalender libur nasional)
        $nationalHolidays = NationalHoliday::orderBy('holiday_date', 'asc')->get();

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
            'nationalHolidays' => $nationalHolidays,
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

        $slug = Str::slug($request->name).'-'.rand(10, 99);

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

        return redirect()->back()->with('success', 'Status wahana '.$attraction->name.' berhasil diubah menjadi '.$request->status);
    }

    // ==========================================
    // JADWAL BUKA/TUTUP & KAPASITAS HARIAN
    // ==========================================
    public function updateRegularSchedule(Request $request)
    {
        $request->validate([
            'park_id' => 'required|exists:parks,id',
            'regular_closed_days' => 'nullable|array',
            'regular_closed_days.*' => 'integer|between:1,7', // 1=Senin ... 7=Minggu
        ]);

        $park = Park::findOrFail($request->park_id);
        $closedDays = $request->input('regular_closed_days', []);
        $park->update(['regular_closed_days' => $closedDays]);

        // Sinkronkan kapasitas masa depan yang masih berstatus REGULAR
        $capacities = ParkDailyCapacity::where('park_id', $park->id)
            ->where('visit_date', '>=', Carbon::today()->format('Y-m-d'))
            ->where('override_status', 'REGULAR')
            ->get();

        foreach ($capacities as $cap) {
            $isClosed = $park->isRegularClosedOnDate($cap->visit_date);
            $cap->update([
                'is_closed' => $isClosed,
                'closure_reason' => $isClosed ? 'Jadwal Libur Rutin Mingguan' : null,
            ]);

            // Sinkronkan open/close tiket
            DailyInventory::where('park_daily_capacity_id', $cap->id)
                ->where('booked_quota', 0)
                ->update(['is_open' => ! $isClosed]);
        }

        return redirect()->back()->with('success', 'Pengaturan jadwal tutup rutin mingguan berhasil diperbarui.');
    }

    public function setSpecialSchedule(Request $request)
    {
        $request->validate([
            'park_id' => 'required|exists:parks,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'override_status' => 'required|in:SPECIAL_CLOSED,SPECIAL_OPEN,REGULAR',
            'closure_reason' => 'nullable|string|max:255',
        ]);

        $park = Park::findOrFail($request->park_id);
        $startDate = Carbon::parse($request->start_date);
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : $startDate->copy();

        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');
            $status = $request->override_status;

            if ($status === 'SPECIAL_CLOSED') {
                $isClosed = true;
                $reason = $request->closure_reason ?: 'Penutupan Khusus / Maintenance';
            } elseif ($status === 'SPECIAL_OPEN') {
                $isClosed = false;
                $reason = null;
            } else { // REGULAR (reset ke aturan mingguan)
                $isClosed = $park->isRegularClosedOnDate($dateStr);
                $reason = $isClosed ? 'Jadwal Libur Rutin Mingguan' : null;
            }

            $cap = ParkDailyCapacity::updateOrCreate(
                ['park_id' => $park->id, 'visit_date' => $dateStr],
                [
                    'max_capacity' => $park->default_daily_capacity ?? 5000,
                    'is_closed' => $isClosed,
                    'override_status' => $status,
                    'closure_reason' => $reason,
                ]
            );

            // Sinkronkan status jual tiket
            DailyInventory::where('park_daily_capacity_id', $cap->id)
                ->where('booked_quota', 0)
                ->update(['is_open' => ! $isClosed]);

            $current->addDay();
        }

        $label = $request->override_status === 'SPECIAL_CLOSED' ? 'Tutup Khusus' : ($request->override_status === 'SPECIAL_OPEN' ? 'Buka Khusus' : 'Direset ke Rutin');

        return redirect()->back()->with('success', "Jadwal khusus berhasil diterapkan ({$label}) dari {$request->start_date} s/d {$endDate->format('Y-m-d')}.");
    }

    public function toggleClosedDate(Request $request)
    {
        $request->validate([
            'park_id' => 'required|exists:parks,id',
            'visit_date' => 'required|date',
            'closure_reason' => 'nullable|string|max:255',
        ]);

        $park = Park::findOrFail($request->park_id);
        $capacity = ParkDailyCapacity::firstOrCreate(
            ['park_id' => $park->id, 'visit_date' => $request->visit_date],
            [
                'max_capacity' => $park->default_daily_capacity ?? 5000,
                'booked_count' => 0,
                'locked_count' => 0,
                'is_closed' => false,
                'override_status' => 'REGULAR',
            ]
        );

        $newIsClosed = ! $capacity->is_closed;
        $newOverride = $newIsClosed ? 'SPECIAL_CLOSED' : 'SPECIAL_OPEN';
        $newReason = $newIsClosed ? ($request->closure_reason ?: 'Tutup Khusus / Insidental') : null;

        $capacity->update([
            'is_closed' => $newIsClosed,
            'override_status' => $newOverride,
            'closure_reason' => $newReason,
        ]);

        // Sinkronkan tiket
        DailyInventory::where('park_daily_capacity_id', $capacity->id)
            ->where('booked_quota', 0)
            ->update(['is_open' => ! $newIsClosed]);

        $statusText = $newIsClosed ? 'DITUTUP KHUSUS' : 'DIBUKA KHUSUS';

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
            'weekday_price' => 'nullable|integer|min:0',
            'weekend_price' => 'nullable|integer|min:0',
            'holiday_price' => 'nullable|integer|min:0',
            'initial_price' => 'nullable|integer|min:0',
            'initial_quota' => 'required|integer|min:10',
        ]);

        $code = 'TIER-'.strtoupper(Str::slug(substr($request->name, 0, 15))).'-'.rand(10, 99);

        $weekdayPrice = $request->weekday_price ?? $request->initial_price ?? 75000;
        $weekendPrice = $request->weekend_price ?? (int) ($weekdayPrice * 1.2);
        $holidayPrice = $request->holiday_price ?? (int) ($weekendPrice * 1.15);

        $tier = TicketTier::create([
            'park_id' => $request->park_id,
            'code' => $code,
            'name' => $request->name,
            'description' => $request->description,
            'weekday_price' => $weekdayPrice,
            'weekend_price' => $weekendPrice,
            'holiday_price' => $holidayPrice,
            'min_age' => $request->min_age,
            'max_age' => $request->max_age,
            'max_height_cm' => $request->max_height_cm,
            'perks' => ['Akses Seluruh Area Pameran', 'E-Tiket Langsung Scan'],
            'is_active' => true,
        ]);

        for ($i = 0; $i < 14; $i++) {
            $date = Carbon::today()->addDays($i)->format('Y-m-d');
            $isWeekend = Carbon::parse($date)->isWeekend();
            $isHoliday = NationalHoliday::whereDate('holiday_date', $date)->exists();

            $price = $isHoliday ? $holidayPrice : ($isWeekend ? $weekendPrice : $weekdayPrice);

            $cap = ParkDailyCapacity::firstOrCreate(
                ['park_id' => $request->park_id, 'visit_date' => $date],
                ['max_capacity' => 5000, 'booked_count' => 0, 'locked_count' => 0, 'is_closed' => false]
            );

            DailyInventory::firstOrCreate(
                ['ticket_tier_id' => $tier->id, 'visit_date' => $date],
                [
                    'park_daily_capacity_id' => $cap->id,
                    'price' => $price,
                    'total_quota' => $request->initial_quota,
                    'booked_quota' => 0,
                    'is_open' => true,
                ]
            );
        }

        return redirect()->back()->with('success', 'Kategori tiket '.$tier->name.' berhasil dibuat.');
    }

    public function updateTicketTierRates(Request $request, $id)
    {
        $tier = TicketTier::findOrFail($id);

        $request->validate([
            'weekday_price' => 'required|integer|min:0',
            'weekend_price' => 'required|integer|min:0',
            'holiday_price' => 'required|integer|min:0',
        ]);

        $tier->update([
            'weekday_price' => $request->weekday_price,
            'weekend_price' => $request->weekend_price,
            'holiday_price' => $request->holiday_price,
        ]);

        // Sinkronkan harga tiket di masa depan yang belum terjual (booked_quota == 0)
        $futureInventories = DailyInventory::where('ticket_tier_id', $tier->id)
            ->where('visit_date', '>=', Carbon::today()->format('Y-m-d'))
            ->where('booked_quota', 0)
            ->get();

        foreach ($futureInventories as $inv) {
            $isHoliday = NationalHoliday::whereDate('holiday_date', $inv->visit_date)->exists();
            $isWeekend = Carbon::parse($inv->visit_date)->isWeekend();

            $newPrice = $isHoliday
                ? $request->holiday_price
                : ($isWeekend ? $request->weekend_price : $request->weekday_price);

            $inv->update(['price' => $newPrice]);
        }

        return redirect()->back()->with('success', "Tarif harga untuk {$tier->name} berhasil diperbarui (Weekday, Weekend, Libur Nasional).");
    }

    public function toggleTicketTier($id)
    {
        $tier = TicketTier::findOrFail($id);
        $tier->update(['is_active' => ! $tier->is_active]);

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
            'code' => 'required|string|max:30|unique:promotions,code',
            'discount_type' => 'required|in:PERCENTAGE,FIXED',
            'discount_value' => 'required|integer|min:1',
            'min_order_amount' => 'required|integer|min:0',
            'valid_until' => 'required|date|after_or_equal:today',
            'scope' => 'required|in:park,global',
            'park_id' => 'nullable|exists:parks,id',
        ]);

        // Jika scope = park → simpan park_id; jika global → park_id null
        $parkId = ($request->scope === 'park') ? $request->park_id : null;

        Promotion::create([
            'park_id' => $parkId,
            'code' => strtoupper($request->code),
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'min_order_amount' => $request->min_order_amount,
            'max_discount_amount' => $request->discount_type === 'PERCENTAGE' ? 100000 : $request->discount_value,
            'max_redemptions' => 1000,
            'valid_from' => Carbon::now(),
            'valid_until' => Carbon::parse($request->valid_until)->endOfDay(),
            'is_active' => true,
        ]);

        $scopeLabel = $parkId ? 'khusus untuk park ini' : 'berlaku di semua park (global)';

        return redirect()->back()->with('success', "Kupon promo {$request->code} berhasil diterbitkan — {$scopeLabel}.");
    }

    public function togglePromotion($id)
    {
        $promo = Promotion::findOrFail($id);
        $promo->update(['is_active' => ! $promo->is_active]);

        $status = $promo->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Kupon promo {$promo->code} berhasil {$status}.");
    }

    // ==========================================
    // MANAJEMEN HARI LIBUR NASIONAL
    // ==========================================
    public function storeNationalHoliday(Request $request)
    {
        $request->validate([
            'holiday_date' => 'required|date|unique:national_holidays,holiday_date',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
        ]);

        NationalHoliday::create([
            'holiday_date' => $request->holiday_date,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return redirect()->back()->with('success', "Hari libur {$request->name} ({$request->holiday_date}) berhasil ditambahkan ke kalender.");
    }

    public function updateNationalHoliday(Request $request, $id)
    {
        $holiday = NationalHoliday::findOrFail($id);

        $request->validate([
            'holiday_date' => 'required|date|unique:national_holidays,holiday_date,'.$holiday->id,
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
        ]);

        $holiday->update([
            'holiday_date' => $request->holiday_date,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return redirect()->back()->with('success', "Hari libur {$holiday->name} berhasil diperbarui.");
    }

    public function destroyNationalHoliday($id)
    {
        $holiday = NationalHoliday::findOrFail($id);
        $name = $holiday->name;
        $holiday->delete();

        return redirect()->back()->with('success', "Hari libur {$name} berhasil dihapus dari daftar kalender libur.");
    }
}
