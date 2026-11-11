<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'role', // SUPER_ADMIN, PARK_ADMIN
        'assigned_park_id',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function assignedPark()
    {
        return $this->belongsTo(Park::class, 'assigned_park_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function isParkAdmin(): bool
    {
        return $this->role === 'PARK_ADMIN';
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['STAFF', 'GATE_OFFICER']);
    }

    public function isCustomer(): bool
    {
        return $this->role === 'CUSTOMER';
    }

    public function isManagementOrStaff(): bool
    {
        return in_array($this->role, ['SUPER_ADMIN', 'PARK_ADMIN', 'STAFF', 'GATE_OFFICER']);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
