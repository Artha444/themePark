<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
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

    /**
     * Daftar e-tiket milik user yang sedang login (JSON) — dipakai modal
     * "Cek Pesanan" di landing agar tiket langsung tampil tanpa input kode.
     *
     * @return JsonResponse
     */
    public function apiMine(Request $request)
    {
        $user = $request->user();

        $orders = Order::with([
            'park',
            'items.dailyInventory.ticketTier',
            'items.issuedTickets',
        ])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('customer_email', $user->email);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (Order $order) {
                return [
                    'order_code' => $order->order_code,
                    'status' => $order->status,
                    'total_amount' => (int) $order->total_amount,
                    'created_at' => $order->created_at?->toISOString(),
                    'park' => [
                        'name' => $order->park?->name,
                        'category' => $order->park?->category,
                        'location' => $order->park?->location_address,
                        'image_url' => $order->park?->image_url,
                    ],
                    'tickets' => $order->items
                        ->flatMap(fn ($item) => $item->issuedTickets->map(fn ($ticket) => [
                            'ticket_code' => $ticket->ticket_code,
                            'status' => $ticket->status,
                            'valid_date' => $ticket->valid_date,
                            'tier' => $item->dailyInventory?->ticketTier?->name,
                        ]))
                        ->values()
                        ->all(),
                ];
            })
            ->all();

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }
}
