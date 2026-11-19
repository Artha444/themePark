<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->guest(route('login'));
        }

        // Validasi: Hanya SUPER_ADMIN dan PARK_ADMIN yang boleh akses admin
        $user = Auth::user();
        if ($user->role === 'CUSTOMER') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthorized.'], 403)
                : redirect()->guest(route('login'))->withErrors([
                    'email' => 'Akun Anda tidak memiliki hak akses administrator. Silakan hubungi pengelola sistem.',
                ]);
        }

        return $next($request);
    }
}
