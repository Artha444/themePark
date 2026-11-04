<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffUser extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'full_name',
        'email',
        'password_hash',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function checkInLogs()
    {
        return $this->hasMany(CheckInLog::class, 'scanned_by');
    }
}
