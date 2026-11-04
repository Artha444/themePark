<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotaReservation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'daily_inventory_id',
        'park_daily_capacity_id',
        'quantity',
        'expires_at',
        'is_released',
    ];
}
