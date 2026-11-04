<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckInLog extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'gate_id',
        'scanned_by',
        'scan_time',
        'scan_result',
        'device_metadata',
    ];

    protected $casts = [
        'device_metadata' => 'array',
    ];

    public function ticket()
    {
        return $this->belongsTo(IssuedTicket::class, 'ticket_id');
    }

    public function gate()
    {
        return $this->belongsTo(Gate::class);
    }

    public function staffUser()
    {
        return $this->belongsTo(StaffUser::class, 'scanned_by');
    }
}
