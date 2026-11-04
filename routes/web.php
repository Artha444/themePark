<?php

use App\Http\Controllers\ParkController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\TicketStatusController;
use App\Http\Controllers\GateScannerController;
use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. PUBLIC VISITOR ECOSYSTEM
// Landing page pameran seni & theme park
Route::get('/', [ParkController::class, 'index'])->name('home');
Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');
Route::post('/api/tickets/check-promo', [TicketController::class, 'checkPromo'])->name('tickets.check-promo');
Route::post('/api/orders/lookup', [CheckoutController::class, 'lookupOrder'])->name('orders.lookup');

Route::get('/tickets/checkout', [CheckoutController::class, 'index'])->name('tickets.checkout');
Route::post('/tickets/checkout', [CheckoutController::class, 'store'])->name('tickets.checkout.store');
Route::get('/tickets/order/{order_code}', [CheckoutController::class, 'showOrder'])->name('tickets.order');
Route::get('/tickets/view/{ticket_code}', [TicketStatusController::class, 'show'])->name('tickets.view');

// 2. GATE OFFICER SCANNER PWA
Route::get('/scanner', [GateScannerController::class, 'index'])->name('scanner.index');
Route::post('/api/scanner/check-in', [GateScannerController::class, 'checkIn'])->name('scanner.check-in');

// 3. ADMIN MANAGEMENT ECOSYSTEM
Route::get('/admin', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
Route::post('/admin/attractions/{id}/status', [AdminDashboardController::class, 'updateAttractionStatus'])->name('admin.attractions.status');
Route::post('/admin/capacity', [AdminDashboardController::class, 'updateCapacity'])->name('admin.capacity.update');

require __DIR__.'/auth.php';
