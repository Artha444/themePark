<?php

namespace App\Http\Controllers;

use App\Models\Gate;
use App\Models\StaffUser;
use App\Models\IssuedTicket;
use App\Models\CheckInLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class GateScannerController extends Controller
{
    public function index()
    {
        $gates = Gate::where('is_active', true)->get();
        $staff = StaffUser::where('is_active', true)->first();
        
        $recentLogs = CheckInLog::with(['ticket.orderItem.dailyInventory.ticketTier', 'gate'])
            ->orderBy('scan_time', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('Scanner/Index', [
            'gates' => $gates,
            'staff' => $staff,
            'recentLogs' => $recentLogs,
        ]);
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'qr_token' => 'required|string',
            'gate_id' => 'required|uuid',
            'staff_id' => 'nullable|uuid',
        ]);

        $gate = Gate::findOrFail($request->gate_id);
        $token = trim($request->qr_token);

        // Search by qr_token or ticket_code
        $ticket = IssuedTicket::with(['orderItem.dailyInventory.ticketTier', 'park'])
            ->where(function ($q) use ($token) {
                $q->where('qr_token', $token)
                  ->orWhere('ticket_code', $token);
            })
            ->first();

        if (!$ticket) {
            CheckInLog::create([
                'ticket_id' => null,
                'gate_id' => $gate->id,
                'scanned_by' => $request->staff_id,
                'scan_time' => Carbon::now(),
                'scan_result' => 'INVALID_CODE',
                'device_metadata' => ['raw_input' => $token],
            ]);

            return response()->json([
                'success' => false,
                'status' => 'INVALID',
                'title' => 'TIKET TIDAK DITEMUKAN',
                'message' => 'Kode QR atau nomor tiket tidak terdaftar di sistem.',
            ], 404);
        }

        $today = Carbon::today()->format('Y-m-d');

        // Check if ticket is for today
        if ($ticket->valid_date !== $today) {
            CheckInLog::create([
                'ticket_id' => $ticket->id,
                'gate_id' => $gate->id,
                'scanned_by' => $request->staff_id,
                'scan_time' => Carbon::now(),
                'scan_result' => 'EXPIRED',
                'device_metadata' => ['valid_date' => $ticket->valid_date],
            ]);

            return response()->json([
                'success' => false,
                'status' => 'EXPIRED',
                'title' => 'TANGGAL TIDAK SESUAI',
                'message' => "Tiket ini berlaku untuk tanggal {$ticket->valid_date}, bukan hari ini ({$today}).",
                'ticket' => $ticket,
            ], 422);
        }

        // Check status
        if ($ticket->status === 'USED') {
            CheckInLog::create([
                'ticket_id' => $ticket->id,
                'gate_id' => $gate->id,
                'scanned_by' => $request->staff_id,
                'scan_time' => Carbon::now(),
                'scan_result' => 'ALREADY_USED',
                'device_metadata' => ['first_used_at' => $ticket->first_used_at],
            ]);

            return response()->json([
                'success' => false,
                'status' => 'ALREADY_USED',
                'title' => 'TIKET SUDAH DIGUNAKAN',
                'message' => 'Tiket ini telah di-scan pada ' . Carbon::parse($ticket->first_used_at)->format('H:i:s WIB'),
                'ticket' => $ticket,
            ], 422);
        }

        if ($ticket->status !== 'VALID') {
            CheckInLog::create([
                'ticket_id' => $ticket->id,
                'gate_id' => $gate->id,
                'scanned_by' => $request->staff_id,
                'scan_time' => Carbon::now(),
                'scan_result' => 'INVALID_STATUS',
            ]);

            return response()->json([
                'success' => false,
                'status' => 'INVALID',
                'title' => 'TIKET TIDAK AKTIF',
                'message' => "Status tiket saat ini adalah {$ticket->status}.",
                'ticket' => $ticket,
            ], 422);
        }

        // Success - update ticket status
        $ticket->update([
            'status' => 'USED',
            'first_used_at' => Carbon::now(),
        ]);

        $log = CheckInLog::create([
            'ticket_id' => $ticket->id,
            'gate_id' => $gate->id,
            'scanned_by' => $request->staff_id,
            'scan_time' => Carbon::now(),
            'scan_result' => 'SUCCESS',
            'device_metadata' => ['gate_name' => $gate->gate_name],
        ]);

        return response()->json([
            'success' => true,
            'status' => 'GRANTED',
            'title' => 'AKSES DITERIMA',
            'message' => 'Silakan masuk! Selamat menikmati petualangan.',
            'ticket' => $ticket->load('orderItem.dailyInventory.ticketTier'),
            'timestamp' => Carbon::now()->format('H:i:s'),
        ]);
    }
}
