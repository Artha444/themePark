<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'password_hash',
        'is_email_verified',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
