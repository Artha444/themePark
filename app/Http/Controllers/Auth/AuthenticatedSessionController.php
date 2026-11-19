<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(Request $request): Response
    {
        // Tangkap dan simpan URL sebelum login agar pengguna diarahkan kembali setelah login
        if ($request->filled('return')) {
            session()->put('url.intended', $request->query('return'));
        } elseif ($request->filled('redirect')) {
            session()->put('url.intended', $request->query('redirect'));
        } elseif (! session()->has('url.intended')) {
            $prev = url()->previous();
            if ($prev && ! \Illuminate\Support\Str::contains($prev, ['/login', '/logout', '/register', '/forgot-password', '/reset-password'])) {
                session()->put('url.intended', $prev);
            }
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        \Log::info('AuthenticatedSessionController@store: attempt login', ['email' => $request->email]);

        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();
        \Log::info('AuthenticatedSessionController@store: login success', ['id' => $user?->id, 'role' => $user?->role]);

        // Prioritaskan URL sebelum login yang tersimpan di session
        $intendedUrl = session()->pull('url.intended');

        // Redirect cerdas berdasarkan role user
        if ($user->isSuperAdmin() || $user->isParkAdmin()) {
            return redirect()->to($intendedUrl ?: route('admin.dashboard'));
        }

        if ($user->isStaff()) {
            return redirect()->to($intendedUrl ?: route('scanner.index'));
        }

        // Pengunjung (CUSTOMER) diarahkan kembali ke tempat terakhir sebelum login
        return redirect()->to($intendedUrl ?: route('orders.history'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
