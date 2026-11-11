<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserOrderHistoryController extends Controller
{
    /**
     * Tampilkan riwayat pesanan tiket milik user yang sedang login.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Ambil pesanan milik user (berdasarkan user_id atau email jika checkout sebelumnya memakai email yang sama)
        $orders = Order::with([
                'park',
                'items.dailyInventory.ticketTier',
                'items.issuedTickets',
                'payment',
            ])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('customer_email', $user->email);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Orders/History', [
            'orders' => $orders,
        ]);
    }
}
