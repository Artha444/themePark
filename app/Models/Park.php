<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Park extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'category',
        'slug',
        'description',
        'image_url',
        'location_address',
        'city',
        'latitude',
        'longitude',
        'maps_place_name',
        'open_time',
        'close_time',
        'default_daily_capacity',
        'regular_closed_days',
        'is_active',
    ];

    protected $casts = [
        'regular_closed_days' => 'array',
        'is_active' => 'boolean',
    ];

    public function isRegularClosedOnDate($date): bool
    {
        $closedDays = $this->regular_closed_days ?? [];
        if (empty($closedDays) || ! is_array($closedDays)) {
            return false;
        }
        // Carbon dayOfWeekIso: 1 (Senin) .. 7 (Minggu)
        $dayOfWeekIso = Carbon::parse($date)->dayOfWeekIso;

        return in_array($dayOfWeekIso, $closedDays);
    }

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

    /**
     * Admin Park yang bertanggung jawab atas destinasi ini.
     * Relasi satu-ke-satu: satu park hanya punya satu Admin Park.
     */
    public function admin()
    {
        return $this->hasOne(User::class, 'assigned_park_id')
            ->where('role', 'PARK_ADMIN');
    }
}
