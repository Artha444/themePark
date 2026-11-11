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
        // 1. Tambahkan park_id ke tabel orders
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('park_id')->nullable()->after('order_code');
            $table->foreign('park_id')->references('id')->on('parks')->nullOnDelete();
        });

        // 2. Ubah foreign key check_in_logs.scanned_by agar bisa merujuk ke users (atau staff_users tetap didukung)
        Schema::table('check_in_logs', function (Blueprint $table) {
            // Drop foreign key lama ke staff_users
            $table->dropForeign(['scanned_by']);
        });

        // 3. Ubah foreign key refunds.processed_by
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropForeign(['processed_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['park_id']);
            $table->dropColumn('park_id');
        });

        Schema::table('check_in_logs', function (Blueprint $table) {
            $table->foreign('scanned_by')->references('id')->on('staff_users')->nullOnDelete();
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->foreign('processed_by')->references('id')->on('staff_users');
        });
    }
};
