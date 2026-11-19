<?php

namespace Tests\Feature;

use App\Models\DailyInventory;
use App\Models\Gate;
use App\Models\Order;
use App\Models\Park;
use App\Models\ParkDailyCapacity;
use App\Models\TicketTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOverviewPageTest extends TestCase
{
    use RefreshDatabase;

    private function createPark(string $name, string $city, array $extra = []): Park
    {
        return Park::create([
            'name' => $name,
            'city' => $city,
            'slug' => Str::slug($name).'-'.Str::random(4),
            'category' => 'Theme Park & Wahana',
            'location_address' => "Jl. Contoh No. 1, {$city}",
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 5000,
            'is_active' => true,
            ...$extra,
        ]);
    }

    private function createOrder(Park $park, string $status, int $total): Order
    {
        return Order::create([
            'order_code' => 'ORD-'.Str::upper(Str::random(8)),
            'park_id' => $park->id,
            'customer_name' => 'Pengunjung Uji',
            'customer_email' => 'uji@example.com',
            'customer_phone' => '081200000001',
            'subtotal_amount' => $total,
            'discount_amount' => 0,
            'total_amount' => $total,
            'expires_at' => now()->addHours(2),
            'status' => $status,
        ]);
    }

    private function createSuperAdmin(): User
    {
        return User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password'),
            'role' => 'SUPER_ADMIN',
            'email_verified_at' => now(),
        ]);
    }

    private function createParkAdmin(Park $park): User
    {
        return User::create([
            'name' => 'Park Admin',
            'email' => 'parkadmin@example.com',
            'password' => bcrypt('password'),
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => $park->id,
            'email_verified_at' => now(),
        ]);
    }

    public function test_global_overview_aggregates_all_parks_and_operational_status(): void
    {
        $parkA = $this->createPark('Park Andalan', 'Jakarta');
        $parkB = $this->createPark('Park Senja', 'Bandung');
        $this->createPark('Park Cilik', 'Surabaya');

        $this->createOrder($parkA, 'PAID', 150000);
        $this->createOrder($parkA, 'PAID', 50000);
        $this->createOrder($parkA, 'PENDING', 999999); // belum lunas: tidak dihitung
        $this->createOrder($parkB, 'PAID', 100000);

        // Park Senja ditutup khusus hari ini
        ParkDailyCapacity::create([
            'park_id' => $parkB->id,
            'visit_date' => today()->format('Y-m-d'),
            'max_capacity' => 5000,
            'is_closed' => true,
            'override_status' => 'SPECIAL_CLOSED',
            'closure_reason' => 'Maintenance Wahana',
        ]);

        $superAdmin = $this->createSuperAdmin();
        $response = $this->actingAs($superAdmin)->get(route('admin.dashboard'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Overview')
                ->has('overview.parks_summary', 3)
                // Total pendapatan seluruh park hari ini: hanya PAID (150rb + 50rb + 100rb)
                ->where('overview.totals.revenue_today', 300000)
                ->where('overview.totals.parks_total', 3)
                ->where('overview.totals.parks_open', 2)
                ->where('overview.totals.parks_closed', 1)
                // Grafik komparasi: park pendapatan tertinggi di urutan pertama
                ->where('overview.top_parks.0.name', 'Park Andalan')
                ->where('overview.top_parks.0.revenue_today', 200000)
                // Park tertutup muncul di daftar terendah
                ->has('overview.bottom_parks')
                // Ringkasan high-level: nama, kota, status, dan tiket terjual tersedia
                ->where('overview.parks_summary.0.name', 'Park Andalan')
                ->where('overview.parks_summary.0.city', 'Jakarta')
                ->where('overview.parks_summary.0.status', 'BUKA')
                ->has('overview.parks_summary.0.tickets_today')
                ->has('overview.parks_summary.0.revenue_today')
                ->has('overview.parks_summary.2.name')
                ->has('overview.parks_summary.2.city')
                ->has('overview.parks_summary.2.tickets_today')
                ->where('overview.parks_summary.2.is_closed', true)
                ->where('overview.parks_summary.2.closure_reason', 'Maintenance Wahana')
                ->where('overview.parks_summary.2.name', 'Park Senja')
            );
    }

    public function test_park_detail_page_renders_inventory_gates_and_finance(): void
    {
        $park = $this->createPark('Park Detail', 'Yogyakarta');

        $capacity = ParkDailyCapacity::create([
            'park_id' => $park->id,
            'visit_date' => today()->format('Y-m-d'),
            'max_capacity' => 10000,
            'booked_count' => 120,
        ]);

        $tier = TicketTier::create([
            'park_id' => $park->id,
            'code' => 'TIER-'.Str::upper(Str::random(6)),
            'name' => 'Dewasa Reguler',
            'weekday_price' => 100000,
            'weekend_price' => 120000,
            'holiday_price' => 135000,
        ]);

        $this->createOrder($park, 'PAID', 250000);
        $this->createOrder($park, 'PENDING', 75000);

        DailyInventory::create([
            'park_daily_capacity_id' => $capacity->id,
            'ticket_tier_id' => $tier->id,
            'visit_date' => today()->format('Y-m-d'),
            'price' => 100000,
            'total_quota' => 2000,
            'booked_quota' => 300,
            'is_open' => true,
        ]);

        $gate = Gate::create([
            'park_id' => $park->id,
            'gate_name' => 'Gerbang Utama',
            'gate_type' => 'MAIN_ENTRY',
            'is_active' => true,
        ]);

        $this->assertNotNull($gate->id);

        $superAdmin = $this->createSuperAdmin();
        $response = $this->actingAs($superAdmin)->get(route('admin.parks.detail', $park->id));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Parks/Show')
                ->where('park.name', 'Park Detail')
                // Manajemen inventaris harian
                ->has('detail.inventories', 1)
                ->where('detail.inventories.0.tier_name', 'Dewasa Reguler')
                ->where('detail.inventories.0.price', 100000)
                ->where('detail.inventories.0.remaining_quota', 1700)
                // Laporan keuangan parsial: hanya PAID
                ->where('detail.finance.revenue_today', 250000)
                ->where('detail.finance.pending_orders_today', 1)
                ->where('detail.finance.pending_amount_today', 75000)
                // Log akses gerbang: gerbang terdaftar
                ->has('detail.gates', 1)
                ->where('detail.gates.0.gate_name', 'Gerbang Utama')
                ->has('detail.gate_logs')
            );
    }

    public function test_park_admin_cannot_open_other_parks_detail(): void
    {
        $parkA = $this->createPark('Park Milik A', 'Medan');
        $parkB = $this->createPark('Park Milik B', 'Semarang');

        $parkAdmin = $this->createParkAdmin($parkA);

        $this->followingRedirects()
            ->actingAs($parkAdmin)
            ->get(route('admin.parks.detail', $parkB->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                // Dialihkan kembali ke detail park miliknya sendiri
                ->component('Admin/Parks/Show')
                ->where('park.id', $parkA->id)
                ->where('adminRole', 'PARK_ADMIN')
            );
    }

    public function test_super_admin_can_simulate_park_admin_perspective(): void
    {
        $parkA = $this->createPark('Park Simulasi A', 'Jakarta');
        $this->createPark('Park Simulasi B', 'Bandung');
        $superAdmin = $this->createSuperAdmin();

        // Aktifkan simulasi Admin Park: /admin mengarahkan ke detail park aktif
        $this->actingAs($superAdmin)
            ->get(route('admin.dashboard', ['as_role' => 'PARK_ADMIN']))
            ->assertRedirect(route('admin.parks.detail', ['id' => $parkA->id]));

        $this->followingRedirects()
            ->actingAs($superAdmin)
            ->get(route('admin.dashboard', ['as_role' => 'PARK_ADMIN']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Parks/Show')
                ->where('adminRole', 'PARK_ADMIN')
                ->where('isSuperAdmin', false)
            );

        // Kembali ke perspektif Admin Pusat: Overview Pusat tampil lagi
        $this->actingAs($superAdmin)
            ->get(route('admin.dashboard', ['as_role' => 'SUPER_ADMIN']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Overview')
                ->where('adminRole', 'SUPER_ADMIN')
                ->where('isSuperAdmin', true)
            );
    }

    public function test_park_admin_simulation_does_not_escalate_privileges(): void
    {
        $this->createPark('Park Satu', 'Jakarta');
        $parkAdmin = $this->createParkAdmin($this->createPark('Park Milik', 'Solo'));

        // User non-super-admin tidak bisa menyimulasikan SUPER_ADMIN:
        // tetap diperlakukan sebagai Admin Park dan diarahkan ke park miliknya
        $this->actingAs($parkAdmin)
            ->get(route('admin.dashboard', ['as_role' => 'SUPER_ADMIN']))
            ->assertRedirect(route('admin.parks.detail', ['id' => $parkAdmin->assigned_park_id]));
    }

    public function test_update_park_persists_city(): void
    {
        $park = $this->createPark('Park Kota Lama', 'Salatiga');
        $superAdmin = $this->createSuperAdmin();

        $this->actingAs($superAdmin)
            ->post(route('admin.parks.update', $park->id), [
                'name' => 'Park Kota Baru',
                'location_address' => 'Jl. Baru No. 2',
                'city' => 'Solo',
                'latitude' => -7.5666,
                'longitude' => 110.8166,
                'open_time' => '09:00',
                'close_time' => '21:00',
                'default_daily_capacity' => 5000,
            ]);

        $this->assertDatabaseHas('parks', [
            'id' => $park->id,
            'name' => 'Park Kota Baru',
            'city' => 'Solo',
        ]);
    }
}
