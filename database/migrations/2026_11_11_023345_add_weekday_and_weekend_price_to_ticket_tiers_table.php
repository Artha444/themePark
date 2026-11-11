<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ticket_tiers', function (Blueprint $table) {
            $table->bigInteger('weekday_price')->default(100000)->after('description');
            $table->bigInteger('weekend_price')->default(120000)->after('weekday_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_tiers', function (Blueprint $table) {
            $table->dropColumn(['weekday_price', 'weekend_price']);
        });
    }
};
