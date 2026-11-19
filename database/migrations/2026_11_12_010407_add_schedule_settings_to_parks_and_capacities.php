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
        Schema::table('parks', function (Blueprint $table) {
            if (! Schema::hasColumn('parks', 'regular_closed_days')) {
                // Array hari tutup rutin mingguan (1=Senin .. 7=Minggu), JSON
                $table->json('regular_closed_days')->nullable()->after('default_daily_capacity');
            }
        });

        Schema::table('park_daily_capacities', function (Blueprint $table) {
            if (! Schema::hasColumn('park_daily_capacities', 'override_status')) {
                $table->string('override_status')->default('REGULAR')->after('is_closed');
            }

            if (! Schema::hasColumn('park_daily_capacities', 'closure_reason')) {
                $table->string('closure_reason')->nullable()->after('override_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parks', function (Blueprint $table) {
            if (Schema::hasColumn('parks', 'regular_closed_days')) {
                $table->dropColumn('regular_closed_days');
            }
        });

        Schema::table('park_daily_capacities', function (Blueprint $table) {
            if (Schema::hasColumn('park_daily_capacities', 'closure_reason')) {
                $table->dropColumn('closure_reason');
            }

            if (Schema::hasColumn('park_daily_capacities', 'override_status')) {
                $table->dropColumn('override_status');
            }
        });
    }
};
