<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    /**
     * Tampilkan halaman Login khusus Admin & Staff.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Login', [
            'status' => session('status'),
        ]);
    }

    /**
     * Proses autentikasi khusus Admin & Staff.
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (!Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        $user = Auth::user();

        // Validasi: Pengunjung (CUSTOMER) dilarang masuk melalui gerbang admin
        if ($user->role === 'CUSTOMER') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Akun Anda terdaftar sebagai Pengunjung. Halaman ini hanya untuk Administrator & Staf.',
            ]);
        }

        $request->session()->regenerate();

        // Redirect cerdas sesuai role
        if ($user->isStaff()) {
            return redirect()->intended(route('scanner.index'));
        }

        return redirect()->intended(route('admin.dashboard'));
    }
}
