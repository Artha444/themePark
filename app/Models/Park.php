<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Park extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'location_address',
        'open_time',
        'close_time',
        'default_daily_capacity',
        'is_active',
    ];

    public function zones()
    {
        return $this->hasMany(Zone::class);
    }

    public function ticketTiers()
    {
        return $this->hasMany(TicketTier::class);
    }

    public function dailyCapacities()
    {
        return $this->hasMany(ParkDailyCapacity::class);
    }

    public function gates()
    {
        return $this->hasMany(Gate::class);
    }
}
