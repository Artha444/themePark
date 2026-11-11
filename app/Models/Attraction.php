<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attraction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'zone_id',
        'name',
        'description',
        'image_url',
        'min_height_cm',
        'max_height_cm',
        'status',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
