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
        'park_id',
        'user_id',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function park()
    {
        return $this->belongsTo(Park::class);
    }

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
