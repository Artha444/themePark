<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParkDailyCapacity extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'park_id',
        'visit_date',
        'max_capacity',
        'booked_count',
        'locked_count',
        'is_closed',
    ];

    public function park()
    {
        return $this->belongsTo(Park::class);
    }

    public function inventories()
    {
        return $this->hasMany(DailyInventory::class);
    }
}
