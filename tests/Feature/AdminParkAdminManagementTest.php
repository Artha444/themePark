<?php

namespace Tests\Feature;

use App\Models\Park;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminParkAdminManagementTest extends TestCase
{
    use RefreshDatabase;

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

    private function createParkAdminFor(Park $park, string $email = 'parkadmin@example.com'): User
    {
        return User::create([
            'name' => 'Park Admin',
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => $park->id,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function parkPayload(array $overrides = []): array
    {
        return [
            'name' => 'Destinasi Baru',
            'category' => 'Theme Park & Wahana',
            'description' => 'Destinasi uji coba',
            'location_address' => 'Jl. Uji No. 10, Bandung',
            'city' => 'Bandung',
            'latitude' => -6.9175,
            'longitude' => 107.6191,
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 3000,
            'admin_name' => 'Pengelola Baru',
            'admin_email' => 'pengelola@example.com',
            'admin_password' => 'password123',
            ...$overrides,
        ];
    }

    public function test_super_admin_creates_park_with_its_park_admin(): void
    {
        $this->actingAs($this->createSuperAdmin())
            ->post(route('admin.parks.store'), $this->parkPayload())
            ->assertRedirect(route('admin.manage'));

        $park = Park::where('name', 'Destinasi Baru')->firstOrFail();

        $this->assertDatabaseHas('parks', [
            'id' => $park->id,
            'city' => 'Bandung',
        ]);

        // Satu destinasi baru langsung memiliki satu Admin Park.
        $this->assertDatabaseHas('users', [
            'email' => 'pengelola@example.com',
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => $park->id,
        ]);

        $this->assertSame(1, Zone::where('park_id', $park->id)->count());
    }

    public function test_creating_park_requires_a_valid_park_admin_email(): void
    {
        $superAdmin = $this->createSuperAdmin();
        $this->actingAs($superAdmin);

        $this->post(route('admin.parks.store'), $this->parkPayload([
            'admin_email' => $superAdmin->email,
        ]))->assertSessionHasErrors('admin_email');

        $this->assertDatabaseMissing('parks', ['name' => 'Destinasi Baru']);
    }

    public function test_park_admin_cannot_create_or_update_parks(): void
    {
        $park = Park::create([
            'name' => 'Park Lama',
            'city' => 'Solo',
            'slug' => 'park-lama',
            'location_address' => 'Jl. Lama No. 1, Solo',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);
        $parkAdmin = $this->createParkAdminFor($park);

        $this->actingAs($parkAdmin)
            ->post(route('admin.parks.store'), $this->parkPayload())
            ->assertForbidden();

        $this->actingAs($parkAdmin)
            ->post(route('admin.parks.update', $park->id), $this->parkPayload([
                'name' => 'Diubah Park Admin',
            ]))
            ->assertForbidden();

        $this->assertDatabaseMissing('parks', ['name' => 'Destinasi Baru']);
        $this->assertDatabaseHas('parks', ['id' => $park->id, 'name' => 'Park Lama']);
    }

    public function test_super_admin_assigns_admin_to_existing_park_without_park_admin(): void
    {
        $park = Park::create([
            'name' => 'Park Tanpa Admin',
            'city' => 'Malang',
            'slug' => 'park-tanpa-admin',
            'location_address' => 'Jl. Baru No. 2, Malang',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);

        $this->actingAs($this->createSuperAdmin())
            ->post(route('admin.parks.admin', $park->id), [
                'admin_name' => 'Pengelola Malang',
                'admin_email' => 'malang@example.com',
                'admin_password' => 'password123',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'malang@example.com',
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => $park->id,
        ]);
    }

    public function test_a_park_keeps_exactly_one_park_admin_when_saved_again(): void
    {
        $park = Park::create([
            'name' => 'Park Satu Admin',
            'city' => 'Semarang',
            'slug' => 'park-satu-admin',
            'location_address' => 'Jl. Satu No. 3, Semarang',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);
        $this->createParkAdminFor($park, 'lama@example.com');

        $this->actingAs($this->createSuperAdmin())
            ->post(route('admin.parks.admin', $park->id), [
                'admin_name' => 'Pengelola Baru',
                'admin_email' => 'baru@example.com',
                'admin_password' => 'passwordbaru',
            ])
            ->assertRedirect();

        $admins = User::where('role', 'PARK_ADMIN')
            ->where('assigned_park_id', $park->id)
            ->get();

        $this->assertCount(1, $admins);
        $this->assertSame('baru@example.com', $admins->first()->email);
        $this->assertDatabaseMissing('users', ['email' => 'lama@example.com']);
    }

    public function test_global_manage_page_exposes_the_park_admin_account(): void
    {
        $park = Park::create([
            'name' => 'Park Dengan Admin',
            'city' => 'Depok',
            'slug' => 'park-dengan-admin',
            'location_address' => 'Jl. Admin No. 6, Depok',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);
        $this->createParkAdminFor($park, 'admin.depok@example.com');

        $this->actingAs($this->createSuperAdmin())
            ->get(route('admin.manage'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/SuperAdminManageParks')
                ->where('parksPaginated.data.0.admin.email', 'admin.depok@example.com')
                ->where('parksPaginated.data.0.admin.role', 'PARK_ADMIN')
            );
    }

    public function test_park_admin_without_assigned_park_is_denied_access(): void
    {
        $orphanAdmin = User::create([
            'name' => 'Admin Yatim',
            'email' => 'yatim@example.com',
            'password' => bcrypt('password'),
            'role' => 'PARK_ADMIN',
            'assigned_park_id' => null,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($orphanAdmin)
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }

    public function test_deleting_a_park_also_removes_its_park_admin(): void
    {
        $park = Park::create([
            'name' => 'Park Akan Dihapus',
            'city' => 'Cirebon',
            'slug' => 'park-akan-dihapus',
            'location_address' => 'Jl. Hapus No. 7, Cirebon',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);
        $admin = $this->createParkAdminFor($park, 'hapus@example.com');

        $this->actingAs($this->createSuperAdmin())
            ->delete(route('admin.parks.destroy', $park->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('parks', ['id' => $park->id]);
        $this->assertDatabaseMissing('users', ['id' => $admin->id]);
    }

    public function test_one_park_cannot_have_two_park_admins_at_database_level(): void
    {
        $park = Park::create([
            'name' => 'Park Unik',
            'city' => 'Yogyakarta',
            'slug' => 'park-unik',
            'location_address' => 'Jl. Unik No. 4, Yogyakarta',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);
        $this->createParkAdminFor($park, 'pertama@example.com');

        $this->expectException(QueryException::class);

        $this->createParkAdminFor($park, 'kedua@example.com');
    }

    public function test_staff_account_may_share_the_same_park_with_the_park_admin(): void
    {
        $park = Park::create([
            'name' => 'Park Dengan Staff',
            'city' => 'Bogor',
            'slug' => Str::slug('Park Dengan Staff'),
            'location_address' => 'Jl. Staff No. 5, Bogor',
            'open_time' => '09:00',
            'close_time' => '21:00',
            'default_daily_capacity' => 1000,
            'is_active' => true,
        ]);
        $this->createParkAdminFor($park, 'admin.park@example.com');

        // Constraint unik hanya berlaku untuk role PARK_ADMIN,
        // sehingga petugas gerbang tetap boleh ditugaskan di park yang sama.
        User::create([
            'name' => 'Petugas Gerbang',
            'email' => 'petugas@example.com',
            'password' => bcrypt('password'),
            'role' => 'GATE_OFFICER',
            'assigned_park_id' => $park->id,
            'email_verified_at' => now(),
        ]);

        $this->assertSame(2, User::where('assigned_park_id', $park->id)->count());
    }
}
