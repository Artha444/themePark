<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NeonAuthSessionController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $claims = $request->attributes->get('neon_auth_claims');

        // Gunakan koneksi neon jika database default saat ini adalah lokal (sqlite/mysql)
        $dbConn = config('database.default') === 'sqlite' ? DB::connection('neon') : DB::connection();

        $neonUser = $dbConn->table('neon_auth.user')
            ->where('id', $claims['sub'])
            ->first();

        if ($neonUser === null
            || ! (bool) $neonUser->emailVerified
            || (bool) $neonUser->banned
            || ! is_string($neonUser->email)
            || $neonUser->email === ''
        ) {
            return response()->json(['message' => 'The Neon Auth user is not eligible to sign in.'], 403);
        }

        $user = DB::transaction(function () use ($neonUser): ?User {
            $user = User::query()
                ->where('neon_auth_user_id', $neonUser->id)
                ->lockForUpdate()
                ->first();

            if ($user === null) {
                $email = Str::lower($neonUser->email);
                $user = User::query()
                    ->where('email', $email)
                    ->lockForUpdate()
                    ->first();

                if ($user !== null && (! $user->isCustomer()
                    || ($user->neon_auth_user_id !== null && $user->neon_auth_user_id !== $neonUser->id)
                )) {
                    return null;
                }

                if ($user === null) {
                    $user = User::query()->create([
                        'name' => trim((string) $neonUser->name) ?: $email,
                        'email' => $email,
                        'email_verified_at' => now(),
                        'role' => 'CUSTOMER',
                        'neon_auth_user_id' => $neonUser->id,
                        'password' => Hash::make(Str::random(64)),
                    ]);
                } else {
                    $user->forceFill([
                        'neon_auth_user_id' => $neonUser->id,
                        'email_verified_at' => $user->email_verified_at ?? now(),
                    ])->save();
                }
            }

            return $user->isCustomer() ? $user : null;
        });

        if ($user === null) {
            return response()->json(['message' => 'This account cannot be linked to a visitor account.'], 403);
        }

        // Login dengan persistent remember cookie (true) agar sesi tidak hilang saat browser ditutup
        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        $intendedUrl = session()->pull('url.intended');

        return response()->json([
            'redirect' => $intendedUrl ?: route('orders.history', absolute: false),
        ]);
    }
}
