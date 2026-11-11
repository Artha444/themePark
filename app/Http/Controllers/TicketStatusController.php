<?php

namespace App\Http\Controllers;

use App\Models\IssuedTicket;
use Inertia\Inertia;
use Illuminate\Http\Request;

class TicketStatusController extends Controller
{
    public function show($ticket_code)
    {
        $ticket = IssuedTicket::with(['orderItem.dailyInventory.ticketTier', 'park', 'checkInLogs.gate'])
            ->where('ticket_code', $ticket_code)
            ->firstOrFail();

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function reschedule(Request $request, $ticket_code)
    {
        $request->validate([
            'new_date' => 'required|date|after_or_equal:today',
        ]);

        $ticket = IssuedTicket::with(['orderItem.dailyInventory.ticketTier', 'park'])
            ->where('ticket_code', $ticket_code)
            ->firstOrFail();

        if ($ticket->status !== 'VALID') {
            return back()->withErrors(['reschedule' => 'Hanya tiket berstatus VALID yang dapat di-reschedule.']);
        }

        $parkId = $ticket->park_id;
        $tierId = $ticket->order_item?->daily_inventory?->ticket_tier_id;
        $newDate = $request->new_date;

        if ($newDate === $ticket->valid_date) {
            return back()->withErrors(['reschedule' => 'Tanggal baru tidak boleh sama dengan tanggal tiket saat ini.']);
        }

        // Cek / buat kapasitas harian destinasi untuk tanggal baru
        $capacity = \App\Models\ParkDailyCapacity::firstOrCreate(
            [
                'park_id' => $parkId,
                'visit_date' => $newDate,
            ],
            [
                'max_capacity' => $ticket->park?->default_daily_capacity ?? 5000,
                'booked_count' => 0,
                'locked_count' => 0,
                'is_closed' => false,
            ]
        );

        if ($capacity->is_closed) {
            return back()->withErrors(['reschedule' => 'Taman wisata ditutup pada tanggal yang Anda pilih.']);
        }

        if ($capacity->booked_count >= $capacity->max_capacity) {
            return back()->withErrors(['reschedule' => 'Kuota harian taman wisata untuk tanggal tersebut sudah penuh.']);
        }

        // Cek / buat inventori tiket tier untuk tanggal baru
        $newInventory = \App\Models\DailyInventory::firstOrCreate(
            [
                'ticket_tier_id' => $tierId,
                'visit_date' => $newDate,
            ],
            [
                'park_daily_capacity_id' => $capacity->id,
                'price' => $ticket->order_item?->unit_price ?? 75000,
                'total_quota' => 1000,
                'booked_quota' => 0,
                'locked_quota' => 0,
                'is_open' => true,
            ]
        );

        if (!$newInventory->is_open) {
            return back()->withErrors(['reschedule' => 'Kategori tiket ini ditutup pada tanggal tersebut.']);
        }

        if ($newInventory->booked_quota >= $newInventory->total_quota) {
            return back()->withErrors(['reschedule' => 'Kuota kategori tiket untuk tanggal tersebut sudah habis.']);
        }

        // Lakukan pemindahan (Gratis tanpa biaya tambahan)
        \Illuminate\Support\Facades\DB::transaction(function () use ($ticket, $newDate, $capacity, $newInventory) {
            // Kurangi kuota lama
            $oldDate = $ticket->valid_date;
            $oldCap = \App\Models\ParkDailyCapacity::where('park_id', $ticket->park_id)->where('visit_date', $oldDate)->first();
            if ($oldCap && $oldCap->booked_count > 0) {
                $oldCap->decrement('booked_count', 1);
            }
            if ($ticket->order_item?->daily_inventory) {
                $ticket->order_item->daily_inventory->decrement('booked_quota', 1);
            }

            // Tambah kuota baru
            $capacity->increment('booked_count', 1);
            $newInventory->increment('booked_quota', 1);

            // Update tiket
            $ticket->update([
                'valid_date' => $newDate,
            ]);
        });

        return back()->with('success', 'Tiket berhasil di-reschedule ke tanggal ' . $newDate . ' secara gratis!');
    }
}
