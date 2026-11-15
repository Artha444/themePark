<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use SodiumException;
use Tests\TestCase;

class NeonAuthSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_neon_jwt_creates_a_customer_session(): void
    {
        $neonUserId = 'c0d29d1c-22f0-4b89-a502-93ab7ea34510';
        $this->createNeonAuthUser($neonUserId, 'visitor@example.com', 'Visitor');
        $token = $this->configureNeonJwt($neonUserId);

        $response = $this->postJson(route('neon.session.store'), [], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk()
            ->assertJsonPath('redirect', '/my-orders');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'visitor@example.com',
            'neon_auth_user_id' => $neonUserId,
            'role' => 'CUSTOMER',
        ]);
    }

    public function test_missing_neon_token_returns_401(): void
    {
        Http::preventStrayRequests();

        $response = $this->postJson(route('neon.session.store'));

        $response->assertUnauthorized();
        $this->assertGuest();
    }

    public function test_invalid_neon_jwt_signature_returns_401(): void
    {
        $neonUserId = 'c0d29d1c-22f0-4b89-a502-93ab7ea34510';
        $this->createNeonAuthUser($neonUserId, 'visitor@example.com', 'Visitor');
        $token = $this->configureNeonJwt($neonUserId, true);

        $response = $this->postJson(route('neon.session.store'), [], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertUnauthorized();
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_expired_neon_jwt_returns_401(): void
    {
        $neonUserId = 'c0d29d1c-22f0-4b89-a502-93ab7ea34510';
        $token = $this->configureNeonJwt($neonUserId, false, [
            'exp' => time() - 1,
        ]);

        $response = $this->postJson(route('neon.session.store'), [], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertUnauthorized();
        $this->assertGuest();
    }

    public function test_neon_login_cannot_authenticate_a_staff_account(): void
    {
        $neonUserId = 'c0d29d1c-22f0-4b89-a502-93ab7ea34510';
        $this->createNeonAuthUser($neonUserId, 'staff@example.com', 'Staff');
        $token = $this->configureNeonJwt($neonUserId);
        User::factory()->create([
            'email' => 'staff@example.com',
            'role' => 'SUPER_ADMIN',
        ]);

        $response = $this->postJson(route('neon.session.store'), [], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertForbidden();
        $this->assertGuest();
        $this->assertDatabaseCount('users', 1);
    }

    private function createNeonAuthUser(string $id, string $email, string $name): void
    {
        $attachedDatabases = DB::select('PRAGMA database_list');
        $neonAuthDatabaseAttached = collect($attachedDatabases)
            ->contains(fn (object $database): bool => $database->name === 'neon_auth');

        if (! $neonAuthDatabaseAttached) {
            DB::statement("ATTACH DATABASE ':memory:' AS neon_auth");
        }

        DB::statement('DROP TABLE IF EXISTS "neon_auth"."user"');
        DB::statement('CREATE TABLE "neon_auth"."user" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            "emailVerified" INTEGER NOT NULL,
            banned INTEGER
        )');
        DB::table('neon_auth.user')->insert([
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'emailVerified' => true,
            'banned' => false,
        ]);
    }

    /**
     * @throws SodiumException
     */
    private function configureNeonJwt(
        string $subject,
        bool $signWithDifferentKey = false,
        array $claimOverrides = [],
    ): string {
        $baseUrl = 'https://auth.example.test/project/auth';
        $origin = 'https://auth.example.test';
        $jwksUrl = $baseUrl.'/.well-known/jwks.json';
        $keyPair = sodium_crypto_sign_keypair();
        $publicKey = sodium_crypto_sign_publickey($keyPair);
        $secretKey = sodium_crypto_sign_secretkey($keyPair);
        $keyId = 'test-key';

        Cache::flush();
        config(['services.neon_auth.base_url' => $baseUrl]);
        Http::preventStrayRequests();
        Http::fake([
            $jwksUrl => Http::response([
                'keys' => [[
                    'kid' => $keyId,
                    'kty' => 'OKP',
                    'crv' => 'Ed25519',
                    'use' => 'sig',
                    'alg' => 'EdDSA',
                    'x' => $this->base64UrlEncode($publicKey),
                ]],
            ]),
        ]);

        if ($signWithDifferentKey) {
            $secretKey = sodium_crypto_sign_secretkey(
                sodium_crypto_sign_keypair(),
            );
        }

        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'EdDSA',
            'kid' => $keyId,
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));
        $payload = $this->base64UrlEncode(json_encode(array_merge([
            'sub' => $subject,
            'iss' => $origin,
            'aud' => $origin,
            'exp' => time() + 300,
            'iat' => time(),
        ], $claimOverrides), JSON_THROW_ON_ERROR));
        $signingInput = $header.'.'.$payload;
        $signature = sodium_crypto_sign_detached($signingInput, $secretKey);

        return $signingInput.'.'.$this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
