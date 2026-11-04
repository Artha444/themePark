<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyInventory extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'park_daily_capacity_id',
        'ticket_tier_id',
        'visit_date',
        'price',
        'total_quota',
        'booked_quota',
        'locked_quota',
        'is_open',
    ];

    public function parkDailyCapacity()
    {
        return $this->belongsTo(ParkDailyCapacity::class);
    }

    public function ticketTier()
    {
        return $this->belongsTo(TicketTier::class);
    }
}
