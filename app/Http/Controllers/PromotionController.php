<?php

namespace App\Http\Controllers;

use App\Models\Park;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    /**
     * Tampilkan katalog lengkap kupon promo & event.
     */
    public function index(Request $request): Response
    {
        $now = Carbon::now();

        $promotions = Promotion::with('park')
            ->where('is_active', true)
            ->where('valid_from', '<=', $now)
            ->where('valid_until', '>=', $now)
            ->orderBy('created_at', 'desc')
            ->get();

        $parks = Park::where('is_active', true)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'slug', 'city']);

        return Inertia::render('Promotions/Index', [
            'promotions' => $promotions,
            'parks' => $parks,
        ]);
    }
}
