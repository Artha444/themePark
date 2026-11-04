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
}
