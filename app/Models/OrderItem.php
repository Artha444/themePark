<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'daily_inventory_id',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function dailyInventory()
    {
        return $this->belongsTo(DailyInventory::class);
    }

    public function issuedTickets()
    {
        return $this->hasMany(IssuedTicket::class);
    }
}
