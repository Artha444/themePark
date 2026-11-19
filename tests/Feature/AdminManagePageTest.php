<?php

namespace Tests\Feature;

use App\Models\Park;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminManagePageTest extends TestCase
{
    use RefreshDatabase;

    private function createPark(string $name, string $city): Park
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

    public function test_super_admin_opens_global_manage_parks_page(): void
    {
        $park = $this->createPark('Park Kelola', 'Bandung');
        $superAdmin = $this->createSuperAdmin();

        // Tanpa ?park_id, Admin Pusat melihat daftar seluruh destinasi (multi-park)
        $this->actingAs($superAdmin)
            ->get(route('admin.manage'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/SuperAdminManageParks')
                ->where('adminRole', 'SUPER_ADMIN')
                ->where('isSuperAdmin', true)
                ->where('summary.total_parks', 1)
                ->has('parksPaginated.data', 1)
                ->where('parksPaginated.data.0.id', $park->id)
            );
    }

    public function test_super_admin_opens_per_park_manage_page_with_park_id(): void
    {
        $park = $this->createPark('Park Kelola', 'Bandung');
        $superAdmin = $this->createSuperAdmin();

        // Dengan ?park_id, Admin Pusat masuk ke pengaturan destinasi tersebut
        // tanpa kehilangan role Admin Pusat.
        $this->actingAs($superAdmin)
            ->get(route('admin.manage', ['park_id' => $park->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/ManagePark')
                ->where('park.id', $park->id)
                ->where('adminRole', 'SUPER_ADMIN')
                ->where('isSuperAdmin', true)
                ->has('calendarCapacities')
                ->has('ticketTiers')
                ->has('attractions')
            );
    }

    public function test_park_admin_opens_manage_page_scoped_to_assigned_park(): void
    {
        $parkA = $this->createPark('Park A', 'Solo');
        $this->createPark('Park B', 'Malang');

        $parkAdmin = User::create([
            'name' => 'Park Admin',
            'email' => 'parkadmin@example.com',
            'password' => bcrypt('password'),
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => $parkA->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($parkAdmin)
            ->get(route('admin.manage'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/ManagePark')
                // Park aktif terkunci ke park yang ditugaskan
                ->where('park.id', $parkA->id)
                ->where('adminRole', 'PARK_ADMIN')
                ->where('isSuperAdmin', false)
            );
    }
}
