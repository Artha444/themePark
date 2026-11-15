<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\Auth\NeonAuthSessionController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\GateScannerController;
use App\Http\Controllers\MidtransNotificationController;
use App\Http\Controllers\ParkController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketStatusController;
use App\Http\Controllers\UserOrderHistoryController;
use App\Http\Middleware\VerifyNeonAuthToken;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. PUBLIC VISITOR ECOSYSTEM
Route::get('/', [ParkController::class, 'index'])->name('home');
Route::get('/parks/{id}', [ParkController::class, 'show'])->name('parks.show');
Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');
Route::get('/auth/neon/callback', fn () => Inertia::render('Auth/NeonCallback'))
    ->name('neon.callback');
Route::post('/auth/neon/session', NeonAuthSessionController::class)
    ->middleware([VerifyNeonAuthToken::class, 'throttle:10,1'])
    ->name('neon.session.store');
Route::post('/api/tickets/check-promo', [TicketController::class, 'checkPromo'])->name('tickets.check-promo');
Route::post('/api/orders/lookup', [CheckoutController::class, 'lookupOrder'])->name('orders.lookup');

// Protected Checkout: Wajib Login Terlebih Dahulu
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/tickets/checkout', [CheckoutController::class, 'index'])->name('tickets.checkout');
    Route::post('/tickets/checkout', [CheckoutController::class, 'store'])->name('tickets.checkout.store');
    Route::get('/my-orders', [UserOrderHistoryController::class, 'index'])->name('orders.history');
});

Route::get('/tickets/order/{order_code}', [CheckoutController::class, 'showOrder'])->name('tickets.order');
Route::post('/tickets/order/{order_code}/confirm-success', [CheckoutController::class, 'confirmFrontendSuccess'])->name('tickets.order.confirm-success');
Route::get('/tickets/view/{ticket_code}', [TicketStatusController::class, 'show'])->name('tickets.view');
Route::post('/tickets/view/{ticket_code}/reschedule', [TicketStatusController::class, 'reschedule'])->name('tickets.reschedule');

// MIDTRANS WEBHOOK / NOTIFICATION
Route::post('/midtrans/notification', [MidtransNotificationController::class, 'handle'])->name('midtrans.notification');
Route::post('/api/midtrans/notification', [MidtransNotificationController::class, 'handle']);

// 2. GATE OFFICER SCANNER PWA
Route::get('/scanner', [GateScannerController::class, 'index'])->name('scanner.index');
Route::post('/api/scanner/check-in', [GateScannerController::class, 'checkIn'])->name('scanner.check-in');

// 3. ADMIN & STAFF MANAGEMENT ECOSYSTEM
Route::get('/admin/login', [AdminAuthController::class, 'create'])->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'store'])->name('admin.login.store');

Route::get('/admin', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

// Manajemen Destinasi / Tempat (Khusus Admin Pusat / Super Admin)
Route::post('/admin/parks', [AdminDashboardController::class, 'storePark'])->name('admin.parks.store');
Route::post('/admin/parks/{id}/update', [AdminDashboardController::class, 'updatePark'])->name('admin.parks.update');

// Manajemen Wahana
Route::post('/admin/attractions', [AdminDashboardController::class, 'storeAttraction'])->name('admin.attractions.store');
Route::post('/admin/attractions/{id}/status', [AdminDashboardController::class, 'updateAttractionStatus'])->name('admin.attractions.status');

// Manajemen Jadwal Buka/Tutup & Kapasitas Gerbang
Route::post('/admin/capacity', [AdminDashboardController::class, 'updateCapacity'])->name('admin.capacity.update');
Route::post('/admin/capacity/toggle-closed', [AdminDashboardController::class, 'toggleClosedDate'])->name('admin.capacity.toggle-closed');
Route::post('/admin/capacity/regular-schedule', [AdminDashboardController::class, 'updateRegularSchedule'])->name('admin.capacity.regular-schedule');
Route::post('/admin/capacity/special-schedule', [AdminDashboardController::class, 'setSpecialSchedule'])->name('admin.capacity.special-schedule');

// Manajemen Tier Tiket & Inventori Harga
Route::post('/admin/tickets/tiers', [AdminDashboardController::class, 'storeTicketTier'])->name('admin.tickets.tiers.store');
Route::post('/admin/tickets/tiers/{id}/toggle', [AdminDashboardController::class, 'toggleTicketTier'])->name('admin.tickets.tiers.toggle');
Route::post('/admin/tickets/tiers/{id}/rates', [AdminDashboardController::class, 'updateTicketTierRates'])->name('admin.tickets.tiers.rates');
Route::post('/admin/inventory/update', [AdminDashboardController::class, 'updateInventory'])->name('admin.inventory.update');

// Manajemen Kupon Promo
Route::post('/admin/promotions', [AdminDashboardController::class, 'storePromotion'])->name('admin.promotions.store');
Route::post('/admin/promotions/{id}/toggle', [AdminDashboardController::class, 'togglePromotion'])->name('admin.promotions.toggle');

// Manajemen Hari Libur Nasional
Route::post('/admin/holidays', [AdminDashboardController::class, 'storeNationalHoliday'])->name('admin.holidays.store');
Route::post('/admin/holidays/{id}/update', [AdminDashboardController::class, 'updateNationalHoliday'])->name('admin.holidays.update');
Route::delete('/admin/holidays/{id}', [AdminDashboardController::class, 'destroyNationalHoliday'])->name('admin.holidays.destroy');

require __DIR__.'/auth.php';
