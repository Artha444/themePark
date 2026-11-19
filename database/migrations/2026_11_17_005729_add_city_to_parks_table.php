<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parks', function (Blueprint $table) {
            $table->string('city', 100)->nullable()->after('location_address');
        });

        // Backfill: ambil nama kota dari bagian terakhir location_address
        // (format alamat yang dipakai seeder: "... , Jakarta Barat" / "... , Bandung")
        foreach (DB::table('parks')->select('id', 'location_address')->get() as $park) {
            $segments = explode(',', (string) $park->location_address);
            $city = trim(end($segments));

            if ($city !== '' && mb_strlen($city) <= 100) {
                DB::table('parks')->where('id', $park->id)->update(['city' => $city]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parks', function (Blueprint $table) {
            $table->dropColumn('city');
        });
    }
};
