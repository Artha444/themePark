<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Park;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminSalesPageTest extends TestCase
{
    use RefreshDatabase;

    private function createPark(string $name): Park
    {
        return Park::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(4),
            'category' => 'Theme Park & Wahana',
            'location_address' => 'Jl. Contoh No. 1',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 5000,
            'is_active' => true,
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

    public function test_sales_page_renders_per_park_chart_data(): void
    {
        $parkA = $this->createPark('Park A Seni');
        $parkB = $this->createPark('Park B Wahana');

        Order::create([
            'order_code' => 'ORD-A1-'.Str::random(4),
            'park_id' => $parkA->id,
            'customer_name' => 'Budi',
            'customer_email' => 'budi@example.com',
            'customer_phone' => '081200000001',
            'subtotal_amount' => 150000,
            'discount_amount' => 0,
            'total_amount' => 150000,
            'expires_at' => now()->addHours(2),
            'status' => 'PAID',
        ]);

        // Pesanan belum dibayar: tidak boleh dihitung sebagai omzet
        Order::create([
            'order_code' => 'ORD-A2-'.Str::random(4),
            'park_id' => $parkA->id,
            'customer_name' => 'Sinta',
            'customer_email' => 'sinta@example.com',
            'customer_phone' => '081200000002',
            'subtotal_amount' => 99000,
            'discount_amount' => 0,
            'total_amount' => 99000,
            'expires_at' => now()->addHours(2),
            'status' => 'PENDING',
        ]);

        Order::create([
            'order_code' => 'ORD-B1-'.Str::random(4),
            'park_id' => $parkB->id,
            'customer_name' => 'Andi',
            'customer_email' => 'andi@example.com',
            'customer_phone' => '081200000003',
            'subtotal_amount' => 100000,
            'discount_amount' => 0,
            'total_amount' => 100000,
            'expires_at' => now()->addHours(2),
            'status' => 'PAID',
        ]);

        $superAdmin = $this->createSuperAdmin();
        $response = $this->actingAs($superAdmin)->get(route('admin.sales', ['days' => 7]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sales')
                ->has('sales.per_park', 2)
                ->where('sales.period_days', 7)
                ->where('sales.totals.tickets', 0) // belum ada tiket terbit pada data uji
                ->where('sales.totals.orders', 2) // hanya pesanan PAID yang dihitung
                ->where('sales.totals.revenue', 250000) // 150.000 + 100.000 (PENDING tidak masuk)
                ->has('sales.daily', 7)
                ->has('sales.per_park.0.park_id')
                ->has('sales.per_park.0.name')
                ->has('sales.per_park.0.tickets')
                ->has('sales.per_park.0.revenue')
                ->has('sales.per_park.0.checkins')
            );
    }

    public function test_sales_page_defaults_to_14_day_period_on_invalid_days(): void
    {
        $this->createPark('Park Satu');

        $superAdmin = $this->createSuperAdmin();
        $this->actingAs($superAdmin)->get(route('admin.sales', ['days' => 99]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Sales')
                ->where('sales.period_days', 14)
            );
    }
}
