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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('snap_token')->nullable()->after('status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_type', 50)->nullable()->after('payment_method');
            $table->string('transaction_id', 100)->nullable()->after('transaction_reference');
            $table->string('fraud_status', 50)->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('snap_token');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_type', 'transaction_id', 'fraud_status']);
        });
    }
};
