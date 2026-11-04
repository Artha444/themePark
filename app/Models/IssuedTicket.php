<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IssuedTicket extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_item_id',
        'park_id',
        'valid_date',
        'ticket_code',
        'qr_token',
        'status',
        'first_used_at',
    ];

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function park()
    {
        return $this->belongsTo(Park::class);
    }

    public function checkInLogs()
    {
        return $this->hasMany(CheckInLog::class, 'ticket_id');
    }
}
