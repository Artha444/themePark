<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('orders.history', absolute: false));
    }

    #[DataProvider('nonCustomerRoleLandingRoutes')]
    public function test_non_customer_roles_are_redirected_to_their_role_page(
        string $role,
        string $routeName,
    ): void {
        $user = User::factory()->create(['role' => $role]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route($routeName, absolute: false));
    }

    public static function nonCustomerRoleLandingRoutes(): array
    {
        return [
            'super admin' => ['SUPER_ADMIN', 'admin.dashboard'],
            'park admin' => ['PARK_ADMIN', 'admin.dashboard'],
            'staff' => ['STAFF', 'scanner.index'],
            'gate officer' => ['GATE_OFFICER', 'scanner.index'],
        ];
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
