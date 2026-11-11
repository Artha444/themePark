<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketTier extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'park_id',
        'code',
        'name',
        'description',
        'weekday_price',
        'weekend_price',
        'min_age',
        'max_age',
        'max_height_cm',
        'perks',
        'is_active',
    ];

    protected $casts = [
        'perks' => 'array',
        'is_active' => 'boolean',
    ];

    public function park()
    {
        return $this->belongsTo(Park::class);
    }

    public function dailyInventories()
    {
        return $this->hasMany(DailyInventory::class);
    }
}
