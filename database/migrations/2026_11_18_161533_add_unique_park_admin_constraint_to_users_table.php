<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Satu park hanya boleh memiliki satu Admin Park.
     *
     * Foreign key saja tidak cukup, jadi ditambahkan partial unique index:
     * unik untuk assigned_park_id, tetapi hanya untuk baris ber-role PARK_ADMIN
     * (user lain seperti GATE_OFFICER tetap boleh berbagi park yang sama).
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // SQLite & PostgreSQL mendukung partial unique index.
        if (in_array($driver, ['sqlite', 'pgsql'], true)) {
            DB::statement(
                "CREATE UNIQUE INDEX IF NOT EXISTS users_park_admin_unique
                 ON users (assigned_park_id)
                 WHERE role = 'PARK_ADMIN' AND assigned_park_id IS NOT NULL"
            );

            return;
        }

        // MySQL/MariaDB tidak mendukung partial index; aturan ini tetap
        // ditegakkan di level aplikasi (validasi SaveParkAdminRequest).
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['sqlite', 'pgsql'], true)) {
            DB::statement('DROP INDEX IF EXISTS users_park_admin_unique');
        }
    }
};
