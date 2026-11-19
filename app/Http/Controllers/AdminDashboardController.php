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
use App\Models\User;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    /**
     * Konteks admin berdasarkan role efektif: role asli user, atau simulasi
     * role untuk SUPER_ADMIN (tombol 👑 Pusat / 🏢 Park di sidebar).
     *
     * Simulasi dikirim lewat query param ?as_role=SUPER_ADMIN|PARK_ADMIN lalu
     * dipersist di session. Hanya SUPER_ADMIN asli yang boleh mensimulasikan;
     * role user lain tidak pernah bisa dinaikkan.
     *
     * @return array{0: Collection<int, Park>, 1: Park|null, 2: bool, 3: string}
     */
    private function resolveAdminContext(Request $request): array
    {
        $allParks = Park::where('is_active', true)->orderBy('name')->get();

        $user = auth()->user();
        $isRealSuperAdmin = $user && $user->isSuperAdmin();

        // Simulasi role hanya berlaku untuk SUPER_ADMIN asli
        if ($isRealSuperAdmin && $request->has('as_role')) {
            session(['admin_role' => $request->query('as_role') === 'PARK_ADMIN' ? 'PARK_ADMIN' : 'SUPER_ADMIN']);
        }
        $isSuperAdmin = $isRealSuperAdmin && session('admin_role') !== 'PARK_ADMIN';
        $effectiveRole = $isSuperAdmin ? 'SUPER_ADMIN' : 'PARK_ADMIN';

        // Park yang aktif:
        // - Park Admin asli: terkunci ke park yang ditugaskan (wajib ada)
        // - Super Admin (pusat maupun simulasi park): bebas pilih lewat ?park_id=
        if ($user && $user->isParkAdmin()) {
            abort_if($user->assigned_park_id === null, 403, 'Akun Admin Park ini belum ditautkan ke destinasi mana pun.');

            $selectedParkId = $user->assigned_park_id;
        } else {
            $selectedParkId = $request->query('park_id', $allParks->first()?->id);
        }

        $park = $allParks->firstWhere('id', $selectedParkId) ?: $allParks->first();

        return [$allParks, $park, $isSuperAdmin, $effectiveRole];
    }

    /**
     * Halaman Dashboard Utama (Ikhtisar Statistik & Monitoring Harian)
     */
    public function index(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $park, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);
        $user = auth()->user();

        // Overview Pusat hanya untuk perspektif Admin Pusat.
        // Admin Park diarahkan langsung ke halaman operasional park miliknya.
        if (! $isSuperAdmin && $park) {
            return redirect()->route('admin.parks.detail', ['id' => $park->id]);
        }

        // ===== GLOBAL OVERVIEW (DASHBOARD PUSAT) =====
        // Super Admin melihat makro SEMUA park; Park Admin hanya park miliknya.
        $scopedParks = $isSuperAdmin
            ? $allParks
            : $allParks->filter(fn (Park $p) => $p->id === $park?->id)->values();
        $scopedIds = $scopedParks->pluck('id')->all();

        // KPI 1: Total pendapatan (PAID) hari ini dari seluruh park
        $totalRevenueToday = Order::query()
            ->whereDate('created_at', $today)
            ->where('status', 'PAID')
            ->whereIn('park_id', $scopedIds)
            ->sum('total_amount');

        // KPI 1b: Total tiket terjual hari ini (seluruh park)
        $totalTicketsToday = IssuedTicket::query()
            ->whereDate('created_at', $today)
            ->whereIn('park_id', $scopedIds)
            ->count();

        // KPI 2: Total pengunjung (check-in turnstile) hari ini
        $totalCheckInsToday = CheckInLog::query()
            ->whereDate('scan_time', $today)
            ->where('scan_result', 'SUCCESS')
            ->whereHas('gate', fn ($g) => $g->whereIn('park_id', $scopedIds))
            ->count();

        // Status operasional per park hari ini (kapasitas harian / jadwal rutin)
        $capacitiesToday = ParkDailyCapacity::whereIn('park_id', $scopedIds)
            ->where('visit_date', $today)
            ->get()
            ->keyBy('park_id');

        $isHolidayToday = NationalHoliday::whereDate('holiday_date', $today)->exists();

        // Tiket terjual & omzet hari ini, diagregasi per park sekaligus (hindari N+1)
        $ticketsPerPark = IssuedTicket::query()
            ->whereDate('created_at', $today)
            ->whereIn('park_id', $scopedIds)
            ->groupBy('park_id')
            ->selectRaw('park_id, COUNT(*) as tickets')
            ->pluck('tickets', 'park_id');

        $revenuePerPark = Order::query()
            ->whereDate('created_at', $today)
            ->where('status', 'PAID')
            ->whereIn('park_id', $scopedIds)
            ->groupBy('park_id')
            ->selectRaw('park_id, SUM(total_amount) as revenue')
            ->pluck('revenue', 'park_id');

        // Ringkasan high-level per park: Nama, Kota, Status, Tiket Terjual
        $parksSummary = $scopedParks->map(function (Park $p) use ($capacitiesToday, $ticketsPerPark, $revenuePerPark, $isHolidayToday) {
            $cap = $capacitiesToday->get($p->id);
            $isClosed = $cap ? $cap->is_closed : $p->isRegularClosedOnDate(Carbon::today());

            return [
                'id' => $p->id,
                'name' => $p->name,
                'city' => $p->city ?: null,
                'category' => $p->category,
                'image_url' => $p->image_url,
                'is_closed' => (bool) $isClosed,
                'status' => $isClosed ? 'TUTUP' : 'BUKA',
                'closure_reason' => $isClosed ? ($cap?->closure_reason ?: ($isHolidayToday ? 'Libur Nasional' : 'Jadwal Tutup')) : null,
                'tickets_today' => (int) ($ticketsPerPark[$p->id] ?? 0),
                'revenue_today' => (int) ($revenuePerPark[$p->id] ?? 0),
                'max_capacity' => $cap?->max_capacity ?? $p->default_daily_capacity,
            ];
        })->values();

        // KPI 3: Status operasional global (berapa park buka / tutup hari ini)
        $openCount = $parksSummary->where('is_closed', false)->count();
        $closedCount = $parksSummary->where('is_closed', true)->count();

        // Grafik Komparasi: 5 park pendapatan tertinggi vs 5 terendah hari ini
        $sortedByRevenue = $parksSummary->sortByDesc('revenue_today')->values();
        $topParks = $sortedByRevenue->take(5)->map(
            fn (array $p) => collect($p)->only(['id', 'name', 'city', 'revenue_today', 'tickets_today'])->all()
        )->values();

        $bottomParks = $sortedByRevenue->count() > 5
            ? $sortedByRevenue->slice(-5)->reverse()->map(
                fn (array $p) => collect($p)->only(['id', 'name', 'city', 'revenue_today', 'tickets_today'])->all()
            )->values()
            : collect();

        $user = auth()->user();

        return Inertia::render('Admin/Overview', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
            'overview' => [
                'totals' => [
                    'revenue_today' => (int) $totalRevenueToday,
                    'tickets_today' => $totalTicketsToday,
                    'checkins_today' => $totalCheckInsToday,
                    'parks_total' => $scopedParks->count(),
                    'parks_open' => $openCount,
                    'parks_closed' => $closedCount,
                ],
                'is_holiday_today' => $isHolidayToday,
                'top_parks' => $topParks,
                'bottom_parks' => $bottomParks,
                'parks_summary' => $parksSummary,
            ],
        ]);
    }

    /**
     * Laporan Penjualan Tiket per Park (Grafik Perbandingan & Tren Harian)
     */
    public function sales(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $park, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);
        $user = auth()->user();

        // Rentang periode: 7 / 14 / 30 hari ke belakang
        $allowedDays = [7, 14, 30];
        $days = in_array((int) $request->query('days'), $allowedDays, true)
            ? (int) $request->query('days')
            : 14;

        $start = Carbon::today()->subDays($days - 1)->startOfDay();
        $end = Carbon::today()->endOfDay();

        // Lingkup park: Super Admin membandingkan seluruh park,
        // Park Admin hanya melihat park miliknya.
        $scopedParks = $isSuperAdmin
            ? $allParks
            : $allParks->filter(fn (Park $p) => $p->id === $park?->id)->values();

        // 1. Tiket terbit (terjual) per park dalam periode
        $ticketsPerPark = IssuedTicket::query()
            ->selectRaw('park_id, COUNT(*) as tickets')
            ->whereBetween('created_at', [$start, $end])
            ->when(! $isSuperAdmin && $park, fn ($q) => $q->where('park_id', $park->id))
            ->groupBy('park_id')
            ->pluck('tickets', 'park_id');

        // 2. Omzet (pesanan berstatus PAID) per park dalam periode
        $revenuePerPark = Order::query()
            ->selectRaw('park_id, SUM(total_amount) as revenue')
            ->where('status', 'PAID')
            ->whereBetween('created_at', [$start, $end])
            ->when(! $isSuperAdmin && $park, fn ($q) => $q->where('park_id', $park->id))
            ->groupBy('park_id')
            ->pluck('revenue', 'park_id');

        // 3. Jumlah pesanan (PAID) per park dalam periode
        $ordersPerPark = Order::query()
            ->selectRaw('park_id, COUNT(*) as orders')
            ->where('status', 'PAID')
            ->whereBetween('created_at', [$start, $end])
            ->when(! $isSuperAdmin && $park, fn ($q) => $q->where('park_id', $park->id))
            ->groupBy('park_id')
            ->pluck('orders', 'park_id');

        // 4. Check-in gerbang per park dalam periode
        $checkinsPerPark = CheckInLog::query()
            ->join('gates', 'gates.id', '=', 'check_in_logs.gate_id')
            ->selectRaw('gates.park_id as park_id, COUNT(*) as checkins')
            ->where('check_in_logs.scan_result', 'SUCCESS')
            ->whereBetween('check_in_logs.scan_time', [$start, $end])
            ->when(! $isSuperAdmin && $park, fn ($q) => $q->where('gates.park_id', $park->id))
            ->groupBy('gates.park_id')
            ->pluck('checkins', 'park_id');

        // 5. Tren harian penjualan tiket per park (hari tanpa penjualan tetap terisi 0)
        $dailyRows = IssuedTicket::query()
            ->selectRaw('DATE(created_at) as sale_date, park_id, COUNT(*) as tickets')
            ->whereBetween('created_at', [$start, $end])
            ->when(! $isSuperAdmin && $park, fn ($q) => $q->where('park_id', $park->id))
            ->groupByRaw('DATE(created_at), park_id')
            ->get();

        $daily = [];
        foreach ($start->copy()->toPeriod(Carbon::today()) as $date) {
            $row = [
                'date' => $date->format('Y-m-d'),
                'label' => $date->format('d M'),
                'total' => 0,
            ];
            foreach ($scopedParks as $p) {
                $row[$p->name] = 0;
            }
            $daily[$date->format('Y-m-d')] = $row;
        }

        $parkNameById = $scopedParks->pluck('name', 'id');
        foreach ($dailyRows as $row) {
            $dateKey = substr((string) $row->sale_date, 0, 10);
            $parkName = $parkNameById[$row->park_id] ?? null;

            if ($parkName === null || ! isset($daily[$dateKey])) {
                continue;
            }

            $daily[$dateKey][$parkName] += (int) $row->tickets;
            $daily[$dateKey]['total'] += (int) $row->tickets;
        }

        $daily = array_values($daily);

        // 6. Ringkasan per park untuk grafik & tabel
        $perPark = $scopedParks->map(fn (Park $p) => [
            'park_id' => $p->id,
            'name' => $p->name,
            'tickets' => (int) ($ticketsPerPark[$p->id] ?? 0),
            'revenue' => (int) ($revenuePerPark[$p->id] ?? 0),
            'orders' => (int) ($ordersPerPark[$p->id] ?? 0),
            'checkins' => (int) ($checkinsPerPark[$p->id] ?? 0),
        ])->values();

        // 7. Hari terbaik (tanggal dengan penjualan tiket tertinggi)
        $bestDay = null;
        foreach ($daily as $row) {
            if ($row['total'] <= 0 || ($bestDay !== null && $row['total'] <= $bestDay['tickets'])) {
                continue;
            }

            $bestDay = [
                'date' => $row['date'],
                'label' => $row['label'],
                'tickets' => $row['total'],
            ];
        }

        return Inertia::render('Admin/Sales', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
            'metrics' => [
                'revenue_today' => $revenuePerPark[$park?->id] ?? 0,
                'tickets_sold_today' => $ticketsPerPark[$park?->id] ?? 0,
                'checkins_today' => $checkinsPerPark[$park?->id] ?? 0,
            ],
            'sales' => [
                'period_days' => $days,
                'start_date' => $start->format('Y-m-d'),
                'end_date' => $today,
                'totals' => [
                    'tickets' => array_sum(array_column($perPark->toArray(), 'tickets')),
                    'revenue' => array_sum(array_column($perPark->toArray(), 'revenue')),
                    'orders' => array_sum(array_column($perPark->toArray(), 'orders')),
                    'checkins' => array_sum(array_column($perPark->toArray(), 'checkins')),
                ],
                'best_day' => $bestDay,
                'per_park' => $perPark,
                'daily' => $daily,
            ],
        ]);
    }

    /**
     * Halaman Detail Per Park (Drill-Down View):
     * manajemen inventaris harian, log akses gerbang, dan laporan keuangan parsial cabang.
     */
    public function parkDetail(Request $request, string $id)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $selectedPark, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);

        // Park yang diminta dari URL
        $park = Park::findOrFail($id);

        // Park Admin hanya boleh melihat detail park miliknya sendiri
        if (! $isSuperAdmin && $park->id !== $selectedPark?->id) {
            return redirect()
                ->route('admin.parks.detail', ['id' => $selectedPark?->id])
                ->with('error', 'Akses ditolak. Anda hanya dapat melihat detail destinasi milik Anda sendiri.');
        }

        // ===== KPI PARK HARI INI =====
        $capacityToday = ParkDailyCapacity::where('park_id', $park->id)
            ->where('visit_date', $today)
            ->first();

        $revenueToday = Order::where('park_id', $park->id)
            ->where('status', 'PAID')
            ->whereDate('created_at', $today)
            ->sum('total_amount');

        $ticketsToday = IssuedTicket::where('park_id', $park->id)
            ->whereDate('created_at', $today)
            ->count();

        $checkinsToday = CheckInLog::whereDate('scan_time', $today)
            ->where('scan_result', 'SUCCESS')
            ->whereHas('gate', fn ($g) => $g->where('park_id', $park->id))
            ->count();

        // ===== LAPORAN KEUANGAN PARSIAL =====
        $revenue7Days = Order::where('park_id', $park->id)
            ->where('status', 'PAID')
            ->whereBetween('created_at', [Carbon::today()->subDays(6)->startOfDay(), Carbon::today()->endOfDay()])
            ->sum('total_amount');

        $revenue30Days = Order::where('park_id', $park->id)
            ->where('status', 'PAID')
            ->whereBetween('created_at', [Carbon::today()->subDays(29)->startOfDay(), Carbon::today()->endOfDay()])
            ->sum('total_amount');

        $paidOrders30Days = Order::where('park_id', $park->id)
            ->where('status', 'PAID')
            ->whereBetween('created_at', [Carbon::today()->subDays(29)->startOfDay(), Carbon::today()->endOfDay()])
            ->count();

        $discount30Days = Order::where('park_id', $park->id)
            ->where('status', 'PAID')
            ->whereBetween('created_at', [Carbon::today()->subDays(29)->startOfDay(), Carbon::today()->endOfDay()])
            ->sum('discount_amount');

        $pendingOrdersToday = Order::where('park_id', $park->id)
            ->whereDate('created_at', $today)
            ->where('status', 'PENDING')
            ->get(['total_amount']);

        // ===== MANAJEMEN INVENTARIS HARIAN (Tiket & Kuota Hari Ini) =====
        $dailyInventories = DailyInventory::with('ticketTier')
            ->whereHas('ticketTier', fn ($t) => $t->where('park_id', $park->id))
            ->where('visit_date', $today)
            ->get()
            ->map(fn (DailyInventory $inv) => [
                'id' => $inv->id,
                'tier_name' => $inv->ticketTier?->name ?: 'Tanpa Tier',
                'tier_code' => $inv->ticketTier?->code,
                'price' => (int) $inv->price,
                'total_quota' => (int) $inv->total_quota,
                'booked_quota' => (int) $inv->booked_quota,
                'remaining_quota' => max(0, (int) $inv->total_quota - (int) $inv->booked_quota),
                'is_open' => (bool) $inv->is_open,
            ])->values();

        // ===== LOG AKSES GERBANG (GATE ACCESS LOGGING) =====
        $gates = Gate::where('park_id', $park->id)->orderBy('gate_name')->get(['id', 'gate_name', 'gate_type', 'is_active']);

        $checkinsPerGate = CheckInLog::query()
            ->whereDate('scan_time', $today)
            ->where('scan_result', 'SUCCESS')
            ->whereIn('gate_id', $gates->pluck('id'))
            ->groupBy('gate_id')
            ->selectRaw('gate_id, COUNT(*) as checkins')
            ->pluck('checkins', 'gate_id');

        $gateLogs = CheckInLog::with(['ticket.orderItem.dailyInventory.ticketTier', 'gate', 'staffUser'])
            ->whereHas('gate', fn ($g) => $g->where('park_id', $park->id))
            ->orderBy('scan_time', 'desc')
            ->take(15)
            ->get()
            ->map(fn (CheckInLog $log) => [
                'id' => $log->id,
                'scan_time' => (string) $log->scan_time,
                'ticket_code' => $log->ticket?->ticket_code,
                'gate_name' => $log->gate?->gate_name ?: 'Gerbang Masuk',
                'staff_name' => $log->staffUser?->full_name ?: 'Turnstile Scanner',
                'scan_result' => $log->scan_result,
            ])->values();

        // ===== PESANAN TERBARU PARK INI =====
        $recentOrders = Order::with(['items.dailyInventory.ticketTier'])
            ->where('park_id', $park->id)
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        return Inertia::render('Admin/Parks/Show', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
            'detail' => [
                'status' => [
                    'is_closed' => $capacityToday ? (bool) $capacityToday->is_closed : $park->isRegularClosedOnDate(Carbon::today()),
                    'reason' => $capacityToday?->closure_reason,
                ],
                'capacity' => [
                    'booked' => $capacityToday?->booked_count ?? 0,
                    'max' => $capacityToday?->max_capacity ?? $park->default_daily_capacity,
                ],
                'metrics' => [
                    'revenue_today' => (int) $revenueToday,
                    'tickets_today' => $ticketsToday,
                    'checkins_today' => $checkinsToday,
                ],
                'finance' => [
                    'revenue_today' => (int) $revenueToday,
                    'revenue_7_days' => (int) $revenue7Days,
                    'revenue_30_days' => (int) $revenue30Days,
                    'discount_30_days' => (int) $discount30Days,
                    'paid_orders_30_days' => $paidOrders30Days,
                    'avg_order_value_30_days' => $paidOrders30Days > 0 ? (int) round($revenue30Days / $paidOrders30Days) : 0,
                    'pending_orders_today' => $pendingOrdersToday->count(),
                    'pending_amount_today' => (int) $pendingOrdersToday->sum('total_amount'),
                ],
                'inventories' => $dailyInventories,
                'gates' => $gates->map(fn (Gate $gate) => [
                    'id' => $gate->id,
                    'gate_name' => $gate->gate_name,
                    'gate_type' => $gate->gate_type,
                    'is_active' => (bool) $gate->is_active,
                    'checkins_today' => (int) ($checkinsPerGate[$gate->id] ?? 0),
                ])->values(),
                'gate_logs' => $gateLogs,
            ],
            'recentOrders' => $recentOrders,
        ]);
    }

    /**
     * Halaman Pesanan Masuk & Log Scan Turnstile
     */
    public function orders(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $park, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);
        $user = auth()->user();

        // Pesanan Masuk: Jika Park Admin, HANYA pesanan untuk park miliknya
        $recentOrders = Order::with(['items.dailyInventory.ticketTier', 'park'])
            ->when(! $isSuperAdmin || $park, function ($q) use ($park) {
                if ($park) {
                    $q->where('park_id', $park->id);
                }
            })
            ->orderBy('created_at', 'desc')
            ->take(12)
            ->get();

        // Live Scan Turnstile: Untuk Park Admin, HANYA log scan dari gerbang park miliknya
        $liveCheckIns = CheckInLog::with(['ticket.orderItem.dailyInventory.ticketTier', 'gate', 'staffUser'])
            ->when(! $isSuperAdmin || $park, function ($q) use ($park) {
                if ($park) {
                    $q->whereHas('gate', function ($g) use ($park) {
                        $g->where('park_id', $park->id);
                    });
                }
            })
            ->orderBy('scan_time', 'desc')
            ->take(15)
            ->get();

        return Inertia::render('Admin/Orders', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
            'recentOrders' => $recentOrders,
            'liveCheckIns' => $liveCheckIns,
        ]);
    }

    /**
     * Halaman Manajemen Kupon & Kode Promo
     */
    public function promotions(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $park, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);
        $user = auth()->user();

        // Jika Super Admin: promo milik park terpilih + promo global (park_id null).
        // Jika Park Admin: HANYA promo milik park miliknya.
        $promotions = Promotion::with('park')
            ->when($isSuperAdmin, function ($q) use ($park) {
                $q->where(function ($sub) use ($park) {
                    $sub->whereNull('park_id')
                        ->orWhere('park_id', $park?->id);
                });
            }, function ($q) use ($park) {
                $q->where('park_id', $park?->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Promotions', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
            'promotions' => $promotions,
        ]);
    }

    /**
     * Halaman Kalender Hari Libur Nasional (Khusus Super Admin)
     */
    public function holidays(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $park, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);
        $user = auth()->user();

        if (! $isSuperAdmin) {
            return redirect()
                ->route('admin.dashboard', ['park_id' => $park?->id])
                ->with('error', 'Akses ditolak. Kalender hari libur nasional hanya dapat dikelola oleh Super Admin.');
        }

        return Inertia::render('Admin/Holidays', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
            'nationalHolidays' => NationalHoliday::orderBy('holiday_date', 'asc')->get(),
        ]);
    }

    /**
     * Halaman Khusus Pengaturan Destinasi & Tiket (Jadwal Buka/Tutup, Kuota, Tier Tiket & Tarif, Wahana)
     */
    public function managePark(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        [$allParks, $park, $isSuperAdmin, $effectiveRole] = $this->resolveAdminContext($request);
        $user = auth()->user();

        // JIKA SUPER ADMIN (Admin Pusat):
        // Jika request membawa param ?park_id=... dan BUKAN halaman utama kelola park,
        // izinkan Super Admin masuk ke detail pengaturan tiket destinasi tersebut TANPA mengubah role Super Admin!
        if ($isSuperAdmin && ! $request->has('park_id')) {
            $search = $request->query('search', '');
            $categoryFilter = $request->query('category', 'ALL');

            $parksQuery = Park::withCount(['zones', 'ticketTiers', 'gates'])
                ->with(['zones.attractions', 'admin'])
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('city', 'like', "%{$search}%")
                            ->orWhere('location_address', 'like', "%{$search}%");
                    });
                })
                ->when($categoryFilter && $categoryFilter !== 'ALL', function ($q) use ($categoryFilter) {
                    $q->where('category', $categoryFilter);
                })
                ->orderBy('created_at', 'desc');

            $parksPaginated = $parksQuery->paginate(12)->withQueryString();

            // Ringkasan metrik global
            $totalParksCount = Park::count();
            $activeParksCount = Park::where('is_active', true)->count();
            $categories = Park::whereNotNull('category')->distinct()->pluck('category')->filter()->values();

            return Inertia::render('Admin/SuperAdminManageParks', [
                'parks' => $allParks,
                'park' => $park,
                'parksPaginated' => $parksPaginated,
                'filters' => [
                    'search' => $search,
                    'category' => $categoryFilter,
                ],
                'summary' => [
                    'total_parks' => $totalParksCount,
                    'active_parks' => $activeParksCount,
                    'inactive_parks' => $totalParksCount - $activeParksCount,
                ],
                'categories' => $categories,
                'adminRole' => $effectiveRole,
                'isSuperAdmin' => true,
                'canManageParks' => true,
            ]);
        }

        $capacityToday = $park ? ParkDailyCapacity::where('park_id', $park->id)
            ->where('visit_date', $today)
            ->first() : null;

        $totalRevenueToday = Order::whereDate('created_at', $today)
            ->where('status', 'PAID')
            ->when(! $isSuperAdmin || $park, function ($q) use ($park) {
                if ($park) {
                    $q->where('park_id', $park->id);
                }
            })
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

        // Kalender Kapasitas & Jadwal Tutup (60 Hari ke Depan)
        $calendarCapacities = [];
        if ($park) {
            $endDate = Carbon::today()->addDays(60)->format('Y-m-d');
            $calendarCapacities = ParkDailyCapacity::where('park_id', $park->id)
                ->whereBetween('visit_date', [$today, $endDate])
                ->orderBy('visit_date', 'asc')
                ->get();
        }

        // Ticket Tiers & Inventori Hari Ini
        $ticketTiers = $park ? TicketTier::where('park_id', $park->id)->orderBy('created_at')->get() : collect();
        $dailyInventories = $park ? DailyInventory::with('ticketTier')
            ->whereHas('ticketTier', function ($t) use ($park) {
                $t->where('park_id', $park->id);
            })
            ->where('visit_date', $today)
            ->get() : collect();

        // Attractions & Zones
        $attractions = Attraction::with('zone')
            ->when($park, function ($q) use ($park) {
                $q->whereHas('zone', function ($z) use ($park) {
                    $z->where('park_id', $park->id);
                });
            })
            ->orderBy('name')
            ->get();

        $zones = $park ? Zone::where('park_id', $park->id)->get() : collect();
        $gates = $park ? Gate::where('park_id', $park->id)->get() : collect();
        $nationalHolidays = NationalHoliday::orderBy('holiday_date', 'asc')->get();

        return Inertia::render('Admin/ManagePark', [
            'parks' => $allParks,
            'park' => $park,
            'today' => $today,
            'adminRole' => $effectiveRole,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageParks' => $isSuperAdmin,
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
            'gates' => $gates,
            'nationalHolidays' => $nationalHolidays,
        ]);
    }

    // =========================================================
    // KHUSUS ADMIN PUSAT (SUPER ADMIN): TAMBAH & EDIT TEMPAT
    // =========================================================
    public function storePark(Request $request)
    {
        $this->ensureSuperAdmin();

        $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'location_address' => 'required|string',
            'city' => 'nullable|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'maps_place_name' => 'nullable|string|max:255',
            'open_time' => 'required',
            'close_time' => 'required',
            'default_daily_capacity' => 'required|integer|min:100',
            // Akun Admin Park yang bertanggung jawab atas destinasi baru ini.
            'admin_name' => 'required|string|max:150',
            'admin_email' => 'required|string|lowercase|email|max:255|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        $newPark = DB::transaction(function () use ($request): Park {
            $newPark = Park::create([
                'name' => $request->name,
                'category' => $request->category ?: 'Theme Park & Wahana',
                'slug' => Str::slug($request->name).'-'.rand(10, 99),
                'description' => $request->description,
                'image_url' => $request->image_url,
                'location_address' => $request->location_address,
                'city' => $request->city ?: (Str::of($request->location_address)->afterLast(',')->trim()->toString() ?: null),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'maps_place_name' => $request->maps_place_name,
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

            // Satu destinasi = satu Admin Park.
            User::create([
                'name' => $request->admin_name,
                'email' => $request->admin_email,
                'password' => Hash::make($request->admin_password),
                'role' => 'PARK_ADMIN',
                'assigned_park_id' => $newPark->id,
                'email_verified_at' => now(),
            ]);

            return $newPark;
        });

        return redirect()->route('admin.manage')
            ->with('success', "Destinasi '{$newPark->name}' beserta akun Admin Park berhasil dibuat.");
    }

    /**
     * Tetapkan atau perbarui Admin Park untuk destinasi yang sudah ada.
     * Satu park hanya memiliki satu Admin Park, jadi pemanggilan ulang
     * akan memperbarui akun yang sama (bukan menambah admin kedua).
     */
    public function saveParkAdmin(Request $request, $id)
    {
        $this->ensureSuperAdmin();

        $park = Park::findOrFail($id);
        $existingAdmin = User::where('role', 'PARK_ADMIN')
            ->where('assigned_park_id', $park->id)
            ->first();

        $request->validate([
            'admin_name' => 'required|string|max:150',
            'admin_email' => [
                'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($existingAdmin?->id),
            ],
            'admin_password' => $existingAdmin
                ? ['nullable', 'string', 'min:8']
                : ['required', 'string', 'min:8'],
        ]);

        if ($existingAdmin) {
            $existingAdmin->name = $request->admin_name;
            $existingAdmin->email = $request->admin_email;

            if ($request->filled('admin_password')) {
                $existingAdmin->password = Hash::make($request->admin_password);
            }

            $existingAdmin->save();

            return redirect()->back()->with('success', "Akun Admin Park untuk '{$park->name}' berhasil diperbarui.");
        }

        User::create([
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            'password' => Hash::make($request->admin_password),
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => $park->id,
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', "Admin Park untuk '{$park->name}' berhasil dibuat.");
    }

    private function ensureSuperAdmin(): void
    {
        abort_unless(auth()->user()?->isSuperAdmin(), 403, 'Hanya Admin Pusat yang berwenang mengelola destinasi.');
    }

    public function updatePark(Request $request, $id)
    {
        $this->ensureSuperAdmin();

        $request->validate([
            'name' => 'required|string|max:150',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'location_address' => 'required|string',
            'city' => 'nullable|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'maps_place_name' => 'nullable|string|max:255',
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
            'city' => $request->city ?: $park->city,
            'latitude' => $request->latitude ?? $park->latitude,
            'longitude' => $request->longitude ?? $park->longitude,
            'maps_place_name' => $request->maps_place_name ?? $park->maps_place_name,
            'open_time' => $request->open_time,
            'close_time' => $request->close_time,
            'default_daily_capacity' => $request->default_daily_capacity,
        ]);

        return redirect()->back()->with('success', "Informasi tempat '{$park->name}' berhasil diperbarui.");
    }

    public function toggleParkStatus($id)
    {
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Hanya Admin Pusat yang berwenang mengubah status aktif tempat.');
        }

        $park = Park::findOrFail($id);
        $park->is_active = ! $park->is_active;
        $park->save();

        $statusText = $park->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status tempat '{$park->name}' berhasil {$statusText}.");
    }

    public function destroyPark($id)
    {
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Hanya Admin Pusat yang berwenang menghapus tempat.');
        }

        $park = Park::findOrFail($id);
        $name = $park->name;

        // Cegah penghapusan jika ada order terkait
        $hasOrders = Order::where('park_id', $id)->exists();
        if ($hasOrders) {
            // Jika ada order, lakukan soft non-aktifkan agar transaksi & laporan keuangan tidak rusak
            $park->is_active = false;
            $park->save();

            return redirect()->back()->with('success', "Tempat '{$name}' telah memiliki riwayat pesanan tiket, sehingga dinonaktifkan (diarsipkan) dan disembunyikan dari publik.");
        }

        // Satu park satu Admin Park: saat park dihapus permanen, akun adminnya
        // ikut dihapus agar tidak menjadi akun yatim tanpa destinasi.
        $parkAdmin = User::where('role', 'PARK_ADMIN')
            ->where('assigned_park_id', $park->id)
            ->first();

        DB::transaction(function () use ($park, $parkAdmin): void {
            $park->delete();

            if ($parkAdmin) {
                $parkAdmin->delete();
            }
        });

        return redirect()->back()->with('success', "Tempat '{$name}' berhasil dihapus dari sistem.");
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
        $user = auth()->user();
        $isSuperAdmin = $user && $user->isSuperAdmin();

        $request->validate([
            'code' => 'required|string|max:30|unique:promotions,code',
            'discount_type' => 'required|in:PERCENTAGE,FIXED',
            'discount_value' => 'required|integer|min:1',
            'min_order_amount' => 'required|integer|min:0',
            'valid_until' => 'required|date|after_or_equal:today',
            'scope' => 'nullable|in:park,global',
            'park_id' => 'nullable|exists:parks,id',
        ]);

        // Aturan Scope: Super Admin khusus menerbitkan promo global (park_id = null),
        // sedangkan Park Admin khusus menerbitkan promo untuk park miliknya.
        if ($isSuperAdmin) {
            $parkId = null;
        } else {
            $assignedParkId = $user?->assigned_park_id ?? $request->park_id;
            $parkId = $assignedParkId;

            if (! $parkId) {
                return redirect()->back()->withErrors(['park_id' => 'Park ID tujuan wajib ditentukan untuk admin park.']);
            }
        }

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

        $user = auth()->user();
        $isSuperAdmin = $user && $user->isSuperAdmin();

        // Jika kupon global (park_id null), HANYA Super Admin yang boleh mengubah statusnya
        if (is_null($promo->park_id) && ! $isSuperAdmin) {
            return redirect()->back()->withErrors(['error' => 'Hanya Super Admin yang memiliki hak akses untuk mengaktifkan atau menonaktifkan kupon promo global.']);
        }

        // Jika Park Admin, pastikan kupon tersebut benar milik park-nya
        if (! $isSuperAdmin) {
            $assignedParkId = $user?->assigned_park_id;
            if ($assignedParkId && $promo->park_id !== $assignedParkId) {
                return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki hak akses untuk mengelola kupon promo dari tempat/park lain.']);
            }
        }

        $promo->update(['is_active' => ! $promo->is_active]);

        $status = $promo->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Kupon promo {$promo->code} berhasil {$status}.");
    }

    // ==========================================
    // MANAJEMEN HARI LIBUR NASIONAL (KHUSUS SUPER ADMIN)
    // ==========================================
    public function storeNationalHoliday(Request $request)
    {
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            return redirect()->back()->withErrors(['error' => 'Akses ditolak. Hanya Super Admin yang dapat menambahkan hari libur nasional.']);
        }

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
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            return redirect()->back()->withErrors(['error' => 'Akses ditolak. Hanya Super Admin yang dapat memperbarui hari libur nasional.']);
        }

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
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            return redirect()->back()->withErrors(['error' => 'Akses ditolak. Hanya Super Admin yang dapat menghapus hari libur nasional.']);
        }

        $holiday = NationalHoliday::findOrFail($id);
        $name = $holiday->name;
        $holiday->delete();

        return redirect()->back()->with('success', "Hari libur {$name} berhasil dihapus dari daftar kalender libur.");
    }
}
