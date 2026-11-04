<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'payment_id',
        'refund_reference',
        'amount',
        'reason',
        'status',
        'processed_by',
    ];
}
