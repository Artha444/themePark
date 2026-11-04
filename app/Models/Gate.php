<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'park_id',
        'gate_name',
        'gate_type',
        'is_active',
    ];

    public function park()
    {
        return $this->belongsTo(Park::class);
    }
}
