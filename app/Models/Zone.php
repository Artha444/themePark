<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'park_id',
        'name',
        'description',
    ];

    public function park()
    {
        return $this->belongsTo(Park::class);
    }

    public function attractions()
    {
        return $this->hasMany(Attraction::class);
    }
}
