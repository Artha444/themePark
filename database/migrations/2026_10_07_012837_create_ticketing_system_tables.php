<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. customers
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name', 120);
            $table->string('email', 150)->unique();
            $table->string('phone', 30)->nullable();
            $table->string('password_hash', 255)->nullable();
            $table->boolean('is_email_verified')->default(false);
            $table->timestamps();
        });

        // 2. staff_users
        Schema::create('staff_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name', 120);
            $table->string('email', 150)->unique();
            $table->string('password_hash', 255);
            $table->string('role')->default('GATE_OFFICER');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. parks
        Schema::create('parks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 170)->unique();
            $table->text('description')->nullable();
            $table->text('location_address');
            $table->time('open_time')->default('09:00:00');
            $table->time('close_time')->default('18:00:00');
            $table->integer('default_daily_capacity')->default(10000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. zones
        Schema::create('zones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('park_id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('park_id')->references('id')->on('parks')->cascadeOnDelete();
        });

        // 5. attractions
        Schema::create('attractions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('zone_id');
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->integer('min_height_cm')->default(0);
            $table->integer('max_height_cm')->nullable();
            $table->string('status')->default('OPERATIONAL');
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->cascadeOnDelete();
        });

        // 6. park_daily_capacities
        Schema::create('park_daily_capacities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('park_id');
            $table->date('visit_date');
            $table->integer('max_capacity');
            $table->integer('booked_count')->default(0);
            $table->integer('locked_count')->default(0);
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->foreign('park_id')->references('id')->on('parks')->cascadeOnDelete();
            $table->unique(['park_id', 'visit_date']);
            $table->index(['park_id', 'visit_date', 'is_closed']);
        });

        // 7. ticket_tiers
        Schema::create('ticket_tiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('park_id');
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->integer('min_age')->nullable();
            $table->integer('max_age')->nullable();
            $table->integer('max_height_cm')->nullable();
            $table->jsonb('perks')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('park_id')->references('id')->on('parks')->cascadeOnDelete();
        });

        // 8. daily_inventories
        Schema::create('daily_inventories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('park_daily_capacity_id');
            $table->uuid('ticket_tier_id');
            $table->date('visit_date');
            $table->bigInteger('price');
            $table->integer('total_quota');
            $table->integer('booked_quota')->default(0);
            $table->integer('locked_quota')->default(0);
            $table->boolean('is_open')->default(true);
            $table->timestamps();

            $table->foreign('park_daily_capacity_id')->references('id')->on('park_daily_capacities')->cascadeOnDelete();
            $table->foreign('ticket_tier_id')->references('id')->on('ticket_tiers')->cascadeOnDelete();
            $table->unique(['ticket_tier_id', 'visit_date']);
        });

        // 9. promotions
        Schema::create('promotions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('discount_type')->default('PERCENTAGE');
            $table->bigInteger('discount_value');
            $table->bigInteger('min_order_amount')->default(0);
            $table->bigInteger('max_discount_amount')->nullable();
            $table->integer('max_redemptions')->default(1000);
            $table->timestamp('valid_from');
            $table->timestamp('valid_until');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 10. orders
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_code', 35)->unique();
            $table->uuid('customer_id')->nullable();
            $table->string('customer_name', 120);
            $table->string('customer_email', 150);
            $table->string('customer_phone', 30);
            $table->bigInteger('subtotal_amount')->default(0);
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('total_amount')->default(0);
            $table->string('status')->default('PENDING');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->index(['status', 'expires_at']);
        });

        // 11. order_items
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuid('daily_inventory_id');
            $table->integer('quantity');
            $table->bigInteger('unit_price');
            $table->bigInteger('subtotal');
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('daily_inventory_id')->references('id')->on('daily_inventories');
        });

        // 12. quota_reservations
        Schema::create('quota_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuid('daily_inventory_id');
            $table->uuid('park_daily_capacity_id');
            $table->integer('quantity');
            $table->timestamp('expires_at');
            $table->boolean('is_released')->default(false);
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('daily_inventory_id')->references('id')->on('daily_inventories')->cascadeOnDelete();
            $table->foreign('park_daily_capacity_id')->references('id')->on('park_daily_capacities')->cascadeOnDelete();
        });

        // 13. promotion_redemptions
        Schema::create('promotion_redemptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('promotion_id');
            $table->uuid('order_id');
            $table->string('customer_email', 150);
            $table->bigInteger('discount_applied');
            $table->timestamp('redeemed_at')->useCurrent();

            $table->foreign('promotion_id')->references('id')->on('promotions')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->unique(['promotion_id', 'order_id']);
        });

        // 14. payments
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->unique();
            $table->string('gateway_provider', 50);
            $table->string('payment_method', 50);
            $table->string('transaction_reference', 150)->nullable();
            $table->bigInteger('amount');
            $table->string('status')->default('PENDING');
            $table->timestamp('paid_at')->nullable();
            $table->jsonb('gateway_payload')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });

        // 15. refunds
        Schema::create('refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuid('payment_id');
            $table->string('refund_reference', 150)->nullable();
            $table->bigInteger('amount');
            $table->text('reason');
            $table->string('status')->default('PENDING');
            $table->uuid('processed_by')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('payment_id')->references('id')->on('payments');
            $table->foreign('processed_by')->references('id')->on('staff_users');
        });

        // 16. issued_tickets
        Schema::create('issued_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_item_id');
            $table->uuid('park_id');
            $table->date('valid_date');
            $table->string('ticket_code', 40)->unique();
            $table->text('qr_token')->unique();
            $table->string('status')->default('VALID');
            $table->timestamp('first_used_at')->nullable();
            $table->timestamps();

            $table->foreign('order_item_id')->references('id')->on('order_items')->cascadeOnDelete();
            $table->foreign('park_id')->references('id')->on('parks');
        });

        // 17. gates
        Schema::create('gates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('park_id');
            $table->string('gate_name', 100);
            $table->string('gate_type')->default('MAIN_ENTRY');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('park_id')->references('id')->on('parks')->cascadeOnDelete();
        });

        // 18. check_in_logs
        Schema::create('check_in_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('gate_id');
            $table->uuid('scanned_by')->nullable();
            $table->timestamp('scan_time')->useCurrent();
            $table->string('scan_result');
            $table->jsonb('device_metadata')->nullable();

            $table->foreign('ticket_id')->references('id')->on('issued_tickets')->cascadeOnDelete();
            $table->foreign('gate_id')->references('id')->on('gates');
            $table->foreign('scanned_by')->references('id')->on('staff_users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_in_logs');
        Schema::dropIfExists('gates');
        Schema::dropIfExists('issued_tickets');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('promotion_redemptions');
        Schema::dropIfExists('quota_reservations');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('daily_inventories');
        Schema::dropIfExists('ticket_tiers');
        Schema::dropIfExists('park_daily_capacities');
        Schema::dropIfExists('attractions');
        Schema::dropIfExists('zones');
        Schema::dropIfExists('parks');
        Schema::dropIfExists('staff_users');
        Schema::dropIfExists('customers');
    }
};
