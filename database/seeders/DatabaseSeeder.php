<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Park;
use App\Models\Zone;
use App\Models\Attraction;
use App\Models\StaffUser;
use App\Models\Gate;
use App\Models\TicketTier;
use App\Models\ParkDailyCapacity;
use App\Models\DailyInventory;
use App\Models\Promotion;
use App\Models\PromotionRedemption;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\QuotaReservation;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\IssuedTicket;
use App\Models\CheckInLog;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. User Login bawaan (Web Auth)
        User::firstOrCreate(
            ['email' => 'admin@vurasi.test'],
            [
                'name' => 'Super Administrator',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
            ]
        );

        // ==========================================
        // 1. CREATE PARKS (2 Theme Parks / Galeri)
        // ==========================================
        $park1 = Park::create([
            'name' => 'Wonderpark World Resort',
            'slug' => 'wonderpark-world',
            'description' => 'Taman hiburan keluarga terbesar dengan 4 zona tematik spektakuler, wahana gravitasi interaktif, dan pertunjukan parade harian.',
            'location_address' => 'Jl. Boulevard Fantasi No. 1, Kawasan Wisata Terpadu, Jakarta Barat',
            'open_time' => '09:00:00',
            'close_time' => '22:00:00',
            'default_daily_capacity' => 10000,
            'is_active' => true,
        ]);

        $park2 = Park::create([
            'name' => 'Vurasi Art Pavilion & Light Park',
            'slug' => 'vurasi-art-pavilion',
            'description' => 'Eksplorasi instalasi seni rupa visual kontemporer, galeri cahaya imersif, dan pertunjukan pemetaan proyeksi 360 derajat.',
            'location_address' => 'Jl. Seni Rupa Merdeka No. 88, Dago Atas, Bandung',
            'open_time' => '10:00:00',
            'close_time' => '21:00:00',
            'default_daily_capacity' => 4500,
            'is_active' => true,
        ]);

        // ==========================================
        // 2. CREATE ZONES
        // ==========================================
        // Park 1 Zones
        $zone1 = Zone::create(['park_id' => $park1->id, 'name' => 'Extreme Thrill Realm', 'description' => 'Zona wahana pemacu adrenalin tingkat tinggi dan kecepatan gravitasi.']);
        $zone2 = Zone::create(['park_id' => $park1->id, 'name' => 'Fantasy Kingdom', 'description' => 'Dunia dongeng megah yang ramah untuk keluarga dan anak-anak.']);
        $zone3 = Zone::create(['park_id' => $park1->id, 'name' => 'Water Adventure Bay', 'description' => 'Wahana seluncuran air berkecepatan tinggi dan laguna ombak raksasa.']);
        $zone4 = Zone::create(['park_id' => $park1->id, 'name' => 'Sci-Fi Galaxy', 'description' => 'Eksplorasi futuristik dengan simulator penerbangan antariksa 4D VR.']);

        // Park 2 Zones
        $zoneArt1 = Zone::create(['park_id' => $park2->id, 'name' => 'Kinetic Motion Gallery', 'description' => 'Koleksi patung bergerak kinetik dan permainan ilusi optik visual.']);
        $zoneArt2 = Zone::create(['park_id' => $park2->id, 'name' => 'Immersive Light Garden', 'description' => 'Hutan cahaya neon LED interaktif dengan sensor respons sentuhan.']);
        $zoneArt3 = Zone::create(['park_id' => $park2->id, 'name' => 'Projection Dome Theater', 'description' => 'Kubah pertunjukan seni digital proyeksi 360 derajat dengan musik orkestra.']);

        // ==========================================
        // 3. CREATE ATTRACTIONS
        // ==========================================
        // Wonderpark Attractions
        Attraction::create(['zone_id' => $zone1->id, 'name' => 'HyperSpeed Roller Coaster', 'description' => 'Roller coaster baja dengan 3 kali putaran loop 360 derajat.', 'min_height_cm' => 135, 'status' => 'OPERATIONAL']);
        Attraction::create(['zone_id' => $zone1->id, 'name' => 'Drop Tower 80M', 'description' => 'Terjun bebas tanpa gravitasi dari ketinggian menara 80 meter.', 'min_height_cm' => 140, 'status' => 'OPERATIONAL']);
        Attraction::create(['zone_id' => $zone2->id, 'name' => 'Grand Carousel Fantasi', 'description' => 'Komedi putar bertingkat dua dengan 60 patung kuda ukiran klasik.', 'min_height_cm' => 0, 'status' => 'OPERATIONAL']);
        Attraction::create(['zone_id' => $zone2->id, 'name' => 'Sky Ferris Wheel of Lights', 'description' => 'Bianglala raksasa dengan panorama pemandangan kota dari ketinggian.', 'min_height_cm' => 0, 'status' => 'OPERATIONAL']);
        Attraction::create(['zone_id' => $zone3->id, 'name' => 'Mega Splash Typhoon', 'description' => 'Seluncuran terowongan air spiral menuju kolam ombak.', 'min_height_cm' => 120, 'status' => 'MAINTENANCE']);
        Attraction::create(['zone_id' => $zone4->id, 'name' => 'Galaxy VR Simulator 4D', 'description' => 'Simulasi jelajah galaksi bintang dengan efek gerak haptic realistik.', 'min_height_cm' => 110, 'status' => 'OPERATIONAL']);

        // Vurasi Art Pavilion Attractions
        Attraction::create(['zone_id' => $zoneArt1->id, 'name' => 'Pendulum Harmony Sculpture', 'description' => 'Instalasi pendulum magnetik bergerak dengan pola fraktal geometris.', 'min_height_cm' => 0, 'status' => 'OPERATIONAL']);
        Attraction::create(['zone_id' => $zoneArt2->id, 'name' => 'Luminescent Forest Path', 'description' => 'Lorong cermin infinity dipadukan dengan ribuan lampu serat optik kristal.', 'min_height_cm' => 0, 'status' => 'OPERATIONAL']);
        Attraction::create(['zone_id' => $zoneArt3->id, 'name' => 'Cosmic Symphony 360 Dome', 'description' => 'Pertunjukan visualisasi tata surya digital dengan tata suara imersif.', 'min_height_cm' => 0, 'status' => 'OPERATIONAL']);

        // ==========================================
        // 4. CREATE GATES
        // ==========================================
        $gateMain1 = Gate::create(['park_id' => $park1->id, 'gate_name' => 'Turnstile Gate Utara (Reguler)', 'gate_type' => 'MAIN_ENTRY', 'is_active' => true]);
        $gateVIP1  = Gate::create(['park_id' => $park1->id, 'gate_name' => 'Fast Track Gate Barat (VIP)', 'gate_type' => 'VIP_ENTRY', 'is_active' => true]);
        $gateMain2 = Gate::create(['park_id' => $park2->id, 'gate_name' => 'Pavilion Lobby Gate', 'gate_type' => 'MAIN_ENTRY', 'is_active' => true]);

        // ==========================================
        // 5. CREATE STAFF USERS
        // ==========================================
        $staffGate = StaffUser::create([
            'full_name' => 'Budi Santoso',
            'email' => 'budi.gate@wonderpark.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'GATE_OFFICER',
            'is_active' => true,
        ]);

        $staffSupervisor = StaffUser::create([
            'full_name' => 'Siti Rahmawati',
            'email' => 'siti.supervisor@wonderpark.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'SUPERVISOR',
            'is_active' => true,
        ]);

        $staffAdmin = StaffUser::create([
            'full_name' => 'Hendra Setiawan',
            'email' => 'hendra.admin@wonderpark.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'ADMIN',
            'is_active' => true,
        ]);

        // ==========================================
        // 6. CREATE TICKET TIERS
        // ==========================================
        // Park 1 Tiers
        $tierAdult = TicketTier::create([
            'park_id' => $park1->id,
            'code' => 'TIER-ADULT',
            'name' => 'Tiket Masuk Reguler Dewasa',
            'description' => 'Akses penuh ke seluruh wahana reguler dan area pameran (Pengunjung tinggi > 120 cm).',
            'weekday_price' => 150000,
            'weekend_price' => 180000,
            'min_age' => 12,
            'max_age' => 65,
            'perks' => ['Akses All-Day Pass', 'Bebas Masuk Seluruh Zona', 'Voucher Minuman'],
            'is_active' => true,
        ]);

        $tierChild = TicketTier::create([
            'park_id' => $park1->id,
            'code' => 'TIER-CHILD',
            'name' => 'Tiket Masuk Anak & Pelajar',
            'description' => 'Khusus anak usia 2-11 tahun atau pelajar dengan kartu pelajar aktif (Tinggi 80 - 120 cm).',
            'weekday_price' => 95000,
            'weekend_price' => 120000,
            'min_age' => 2,
            'max_age' => 11,
            'max_height_cm' => 120,
            'perks' => ['Akses All-Day Pass', 'Area Kids Playground', 'Pendampingan Ramah Anak'],
            'is_active' => true,
        ]);

        $tierVIP = TicketTier::create([
            'park_id' => $park1->id,
            'code' => 'TIER-VIP',
            'name' => 'VIP Fast Pass All Access',
            'description' => 'Jalur prioritas bebas antrean di semua wahana utama + akses Exclusive VIP Lounge.',
            'weekday_price' => 300000,
            'weekend_price' => 350000,
            'min_age' => 0,
            'perks' => ['Fast Track Express Queue', 'Lounge VIP Gratis Snek & Kopi', 'Voucher Makan Rp 50.000', 'Parkir Khusus'],
            'is_active' => true,
        ]);

        // Park 2 Tiers
        $tierArtAll = TicketTier::create([
            'park_id' => $park2->id,
            'code' => 'TIER-ART-ALL',
            'name' => 'Tiket Terusan Pameran Seni',
            'description' => 'Akses seluruh instalasi cahaya, galeri kinetik, dan 1x tiket pertunjukan Dome Theater.',
            'weekday_price' => 85000,
            'weekend_price' => 110000,
            'min_age' => 0,
            'perks' => ['Akses Seluruh Galeri Seni', 'Katalog Pameran Digital', 'Sesi Foto Tanpa Batas'],
            'is_active' => true,
        ]);

        // =======================================================
        // 7. CREATE DAILY CAPACITIES & INVENTORIES (14 HARI KE DEPAN)
        // =======================================================
        for ($i = 0; $i < 14; $i++) {
            $date = Carbon::today()->addDays($i)->format('Y-m-d');
            $isWeekend = Carbon::today()->addDays($i)->isWeekend();
            // Simulasikan hari ke-8 sebagai hari perawatan gerbang (is_closed)
            $isClosedDay = ($i === 8);
            // Simulasikan hari Sabtu depan sebagai hari ramai (Hampir Habis)
            $isBusyDay = ($i === 5);

            // Kapasitas Park 1
            $bookedPark1 = $isClosedDay ? 0 : ($isBusyDay ? 8800 : ($i === 0 ? 3500 : 1200));
            $dailyCap1 = ParkDailyCapacity::create([
                'park_id' => $park1->id,
                'visit_date' => $date,
                'max_capacity' => 10000,
                'booked_count' => $bookedPark1,
                'locked_count' => 0,
                'is_closed' => $isClosedDay,
            ]);

            // Inventori Park 1 - Adult
            DailyInventory::create([
                'park_daily_capacity_id' => $dailyCap1->id,
                'ticket_tier_id' => $tierAdult->id,
                'visit_date' => $date,
                'price' => $isWeekend ? 180000 : 150000,
                'total_quota' => 6000,
                'booked_quota' => (int)($bookedPark1 * 0.6),
                'is_open' => !$isClosedDay,
            ]);

            // Inventori Park 1 - Child
            DailyInventory::create([
                'park_daily_capacity_id' => $dailyCap1->id,
                'ticket_tier_id' => $tierChild->id,
                'visit_date' => $date,
                'price' => $isWeekend ? 120000 : 95000,
                'total_quota' => 3000,
                'booked_quota' => (int)($bookedPark1 * 0.3),
                'is_open' => !$isClosedDay,
            ]);

            // Inventori Park 1 - VIP
            DailyInventory::create([
                'park_daily_capacity_id' => $dailyCap1->id,
                'ticket_tier_id' => $tierVIP->id,
                'visit_date' => $date,
                'price' => $isWeekend ? 350000 : 300000,
                'total_quota' => 1000,
                'booked_quota' => (int)($bookedPark1 * 0.1),
                'is_open' => !$isClosedDay,
            ]);

            // Kapasitas & Inventori Park 2
            $dailyCap2 = ParkDailyCapacity::create([
                'park_id' => $park2->id,
                'visit_date' => $date,
                'max_capacity' => 4500,
                'booked_count' => $isWeekend ? 3200 : 900,
                'locked_count' => 0,
                'is_closed' => false,
            ]);

            DailyInventory::create([
                'park_daily_capacity_id' => $dailyCap2->id,
                'ticket_tier_id' => $tierArtAll->id,
                'visit_date' => $date,
                'price' => $isWeekend ? 110000 : 85000,
                'total_quota' => 4500,
                'booked_quota' => $isWeekend ? 3200 : 900,
                'is_open' => true,
            ]);
        }

        // ==========================================
        // 8. CREATE PROMOTIONS
        // ==========================================
        $promoSeru = Promotion::create([
            'code' => 'SERU20',
            'discount_type' => 'PERCENTAGE',
            'discount_value' => 20,
            'min_order_amount' => 200000,
            'max_discount_amount' => 60000,
            'max_redemptions' => 1000,
            'valid_from' => Carbon::now()->subDays(5),
            'valid_until' => Carbon::now()->addMonths(2),
            'is_active' => true,
        ]);

        $promoPotongan = Promotion::create([
            'code' => 'WONDER50K',
            'discount_type' => 'FIXED',
            'discount_value' => 50000,
            'min_order_amount' => 300000,
            'max_discount_amount' => 50000,
            'max_redemptions' => 500,
            'valid_from' => Carbon::now()->subDays(5),
            'valid_until' => Carbon::now()->addMonths(2),
            'is_active' => true,
        ]);

        $promoSeni = Promotion::create([
            'code' => 'SENIHEMAT',
            'discount_type' => 'PERCENTAGE',
            'discount_value' => 15,
            'min_order_amount' => 150000,
            'max_discount_amount' => 40000,
            'max_redemptions' => 300,
            'valid_from' => Carbon::now()->subDays(2),
            'valid_until' => Carbon::now()->addMonths(1),
            'is_active' => true,
        ]);

        // ==========================================
        // 9. CREATE CUSTOMERS (Pelanggan Terdaftar & Guest)
        // ==========================================
        $customer1 = Customer::create([
            'full_name' => 'Ahmad Rizki',
            'email' => 'ahmad.rizki@example.com',
            'phone' => '081234567890',
            'is_email_verified' => true,
        ]);

        $customer2 = Customer::create([
            'full_name' => 'Dewi Anggraini',
            'email' => 'dewi.anggraini@example.com',
            'phone' => '081987654321',
            'is_email_verified' => true,
        ]);

        // ==========================================
        // 10. ORDERS, ORDER ITEMS, & PROMOTION REDEMPTIONS
        // ==========================================
        $todayDate = Carbon::today()->format('Y-m-d');
        $invTodayAdult = DailyInventory::where('visit_date', $todayDate)
            ->where('ticket_tier_id', $tierAdult->id)
            ->first();
        $invTodayChild = DailyInventory::where('visit_date', $todayDate)
            ->where('ticket_tier_id', $tierChild->id)
            ->first();

        // -------------------------------------------------------------
        // ORDER 1: Pelanggan Terdaftar, status PAID dengan Promo SERU20
        // -------------------------------------------------------------
        $order1 = Order::create([
            'order_code' => 'WP-202610-8812',
            'customer_id' => $customer1->id,
            'customer_name' => $customer1->full_name,
            'customer_email' => $customer1->email,
            'customer_phone' => $customer1->phone,
            'subtotal_amount' => 300000,
            'discount_amount' => 60000,
            'total_amount' => 240000,
            'status' => 'PAID',
            'expires_at' => Carbon::now()->addHours(2),
        ]);

        $orderItem1 = OrderItem::create([
            'order_id' => $order1->id,
            'daily_inventory_id' => $invTodayAdult->id,
            'quantity' => 2,
            'unit_price' => $invTodayAdult->price,
            'subtotal' => 300000,
        ]);

        PromotionRedemption::create([
            'promotion_id' => $promoSeru->id,
            'order_id' => $order1->id,
            'customer_email' => $order1->customer_email,
            'discount_applied' => 60000,
            'redeemed_at' => Carbon::now()->subMinutes(40),
        ]);

        $payment1 = Payment::create([
            'order_id' => $order1->id,
            'gateway_provider' => 'QRIS_NATIONAL',
            'payment_method' => 'QRIS',
            'transaction_reference' => 'TRX-QRIS-99120',
            'amount' => 240000,
            'status' => 'SUCCESS',
            'paid_at' => Carbon::now()->subMinutes(35),
        ]);

        // E-Tickets untuk Order 1
        $ticket1 = IssuedTicket::create([
            'order_item_id' => $orderItem1->id,
            'park_id' => $park1->id,
            'valid_date' => $todayDate,
            'ticket_code' => 'TKT-WP-ADULT-01',
            'qr_token' => 'WONDERPARK-QR-8812-A',
            'status' => 'USED',
            'first_used_at' => Carbon::now()->subMinutes(10),
        ]);

        $ticket2 = IssuedTicket::create([
            'order_item_id' => $orderItem1->id,
            'park_id' => $park1->id,
            'valid_date' => $todayDate,
            'ticket_code' => 'TKT-WP-ADULT-02',
            'qr_token' => 'WONDERPARK-QR-8812-B',
            'status' => 'VALID',
        ]);

        // Log Check-in Turnstile untuk Ticket 1
        CheckInLog::create([
            'ticket_id' => $ticket1->id,
            'gate_id' => $gateMain1->id,
            'scanned_by' => $staffGate->id,
            'scan_time' => Carbon::now()->subMinutes(10),
            'scan_result' => 'SUCCESS',
            'device_metadata' => ['device' => 'Turnstile Lane 1 PWA', 'ip' => '10.0.1.5'],
        ]);

        // Log Check-in Percobaan Duplikasi (Duplicate Scan Test)
        CheckInLog::create([
            'ticket_id' => $ticket1->id,
            'gate_id' => $gateVIP1->id,
            'scanned_by' => $staffGate->id,
            'scan_time' => Carbon::now()->subMinutes(2),
            'scan_result' => 'ALREADY_USED',
            'device_metadata' => ['device' => 'Turnstile Lane 2 PWA', 'ip' => '10.0.1.6', 'note' => 'Penolakan otomatis sistem'],
        ]);

        // -------------------------------------------------------------
        // ORDER 2: Guest Checkout (customer_id = null) untuk simulasi Cek Pesanan
        // -------------------------------------------------------------
        $order2 = Order::create([
            'order_code' => 'WP-GUEST-7701',
            'customer_id' => null, // GUEST CHECKOUT
            'customer_name' => 'Fajar Pratama',
            'customer_email' => 'fajar.guest@gmail.com',
            'customer_phone' => '085711223344',
            'subtotal_amount' => 190000,
            'discount_amount' => 0,
            'total_amount' => 190000,
            'status' => 'PAID',
            'expires_at' => Carbon::now()->addHours(2),
        ]);

        $orderItem2 = OrderItem::create([
            'order_id' => $order2->id,
            'daily_inventory_id' => $invTodayChild->id,
            'quantity' => 2,
            'unit_price' => $invTodayChild->price,
            'subtotal' => 190000,
        ]);

        Payment::create([
            'order_id' => $order2->id,
            'gateway_provider' => 'BCA_VIRTUAL_ACCOUNT',
            'payment_method' => 'VIRTUAL_ACCOUNT',
            'transaction_reference' => 'TRX-VA-770188',
            'amount' => 190000,
            'status' => 'SUCCESS',
            'paid_at' => Carbon::now()->subMinutes(20),
        ]);

        IssuedTicket::create([
            'order_item_id' => $orderItem2->id,
            'park_id' => $park1->id,
            'valid_date' => $todayDate,
            'ticket_code' => 'TKT-WP-CHILD-01',
            'qr_token' => 'WONDERPARK-QR-7701-C1',
            'status' => 'VALID',
        ]);

        IssuedTicket::create([
            'order_item_id' => $orderItem2->id,
            'park_id' => $park1->id,
            'valid_date' => $todayDate,
            'ticket_code' => 'TKT-WP-CHILD-02',
            'qr_token' => 'WONDERPARK-QR-7701-C2',
            'status' => 'VALID',
        ]);

        // -------------------------------------------------------------
        // ORDER 3: Pending Checkout (Menahan Quota Reservations)
        // -------------------------------------------------------------
        $order3 = Order::create([
            'order_code' => 'WP-PENDING-4402',
            'customer_id' => $customer2->id,
            'customer_name' => $customer2->full_name,
            'customer_email' => $customer2->email,
            'customer_phone' => $customer2->phone,
            'subtotal_amount' => 300000,
            'discount_amount' => 0,
            'total_amount' => 300000,
            'status' => 'PENDING',
            'expires_at' => Carbon::now()->addMinutes(15),
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'daily_inventory_id' => $invTodayAdult->id,
            'quantity' => 2,
            'unit_price' => $invTodayAdult->price,
            'subtotal' => 300000,
        ]);

        // Quota Reservation sementara 15 menit
        QuotaReservation::create([
            'order_id' => $order3->id,
            'daily_inventory_id' => $invTodayAdult->id,
            'park_daily_capacity_id' => $invTodayAdult->park_daily_capacity_id,
            'quantity' => 2,
            'expires_at' => Carbon::now()->addMinutes(15),
            'is_released' => false,
        ]);

        Payment::create([
            'order_id' => $order3->id,
            'gateway_provider' => 'MANDIRI_BILL',
            'payment_method' => 'VIRTUAL_ACCOUNT',
            'transaction_reference' => 'TRX-VA-440299',
            'amount' => 300000,
            'status' => 'PENDING',
        ]);

        // -------------------------------------------------------------
        // ORDER 4: Refunded Order (Terhubung dengan tabel REFUNDS)
        // -------------------------------------------------------------
        $order4 = Order::create([
            'order_code' => 'WP-REFUND-1109',
            'customer_id' => $customer1->id,
            'customer_name' => $customer1->full_name,
            'customer_email' => $customer1->email,
            'customer_phone' => $customer1->phone,
            'subtotal_amount' => 150000,
            'discount_amount' => 0,
            'total_amount' => 150000,
            'status' => 'REFUNDED',
            'expires_at' => Carbon::now()->subDays(1),
        ]);

        $orderItem4 = OrderItem::create([
            'order_id' => $order4->id,
            'daily_inventory_id' => $invTodayAdult->id,
            'quantity' => 1,
            'unit_price' => 150000,
            'subtotal' => 150000,
        ]);

        $payment4 = Payment::create([
            'order_id' => $order4->id,
            'gateway_provider' => 'QRIS_NATIONAL',
            'payment_method' => 'QRIS',
            'transaction_reference' => 'TRX-QRIS-110922',
            'amount' => 150000,
            'status' => 'REFUNDED',
            'paid_at' => Carbon::now()->subDays(1)->subHours(3),
        ]);

        Refund::create([
            'order_id' => $order4->id,
            'payment_id' => $payment4->id,
            'refund_reference' => 'REF-202610-001',
            'amount' => 150000,
            'reason' => 'Pengunjung berhalangan hadir mendadak dikarenakan sakit, pengajuan H-1 disetujui sesuai regulasi tiket.',
            'status' => 'APPROVED',
            'processed_by' => $staffSupervisor->id,
        ]);

        IssuedTicket::create([
            'order_item_id' => $orderItem4->id,
            'park_id' => $park1->id,
            'valid_date' => Carbon::today()->subDays(1)->format('Y-m-d'),
            'ticket_code' => 'TKT-WP-REFUNDED-01',
            'qr_token' => 'WONDERPARK-QR-REFUNDED-01',
            'status' => 'CANCELLED',
        ]);
    }
}
