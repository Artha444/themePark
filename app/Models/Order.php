<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_code',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'subtotal_amount',
        'discount_amount',
        'total_amount',
        'status',
        'expires_at',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function reservations()
    {
        return $this->hasMany(QuotaReservation::class);
    }
}
