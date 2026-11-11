<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('SUPER_ADMIN')->after('email'); // SUPER_ADMIN, PARK_ADMIN
            $table->uuid('assigned_park_id')->nullable()->after('role');
            $table->foreign('assigned_park_id')->references('id')->on('parks')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['assigned_park_id']);
            $table->dropColumn(['role', 'assigned_park_id']);
        });
    }
};

