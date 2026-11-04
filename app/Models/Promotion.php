<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'max_redemptions',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    public function redemptions()
    {
        return $this->hasMany(PromotionRedemption::class);
    }
}
