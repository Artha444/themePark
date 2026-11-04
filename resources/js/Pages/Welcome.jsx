/**
 * VURASI PAMERAN SENI & THEME PARK — LANDING PAGE
 * 
 * Struktur Section Terstruktur Sesuai Skema Database (ERD):
 * 1. Navbar: Logo, Menu (Tiket, Wahana, Info Pengunjung, FAQ), Cek Pesanan (Guest Checkout Lookup), Login/Daftar, Beli Tiket
 * 2. Hero: Visual besar, Nama Taman (parks.name), Tagline, Jam Buka (open_time - close_time), Quick Date Picker ("Pilih Tanggal Kunjungan")
 * 3. Ketersediaan Tanggal: Kalender kuota harian (park_daily_capacities & daily_inventories) dengan badge Tersedia/Hampir Habis/Tutup/Habis
 * 4. Pilihan Tiket: Kartu ticket_tiers dengan harga "Mulai dari Rp X" dari daily_inventories terendah, perks, syarat usia/tinggi, tombol beli
 * 5. Promo: Banner promo aktif dari promotions (valid date & is_active)
 * 6. Wahana Unggulan: 4-6 attractions dikelompokkan per zones dengan min_height_cm dan status (OPERATIONAL/MAINTENANCE)
 * 7. Cara Pemesanan: 3 langkah singkat (Pilih tanggal & tiket -> Bayar sebelum expires_at -> Scan E-Tiket QR di gerbang)
 * 8. Info Pengunjung: Alamat lengkap (location_address), jam operasional, aturan masuk, dan Ringkasan Kebijakan Refund (tabel refunds)
 * 9. FAQ & Footer: Pertanyaan umum, kontak, dan link kebijakan
 * 10. Modal Cek Pesanan: Guest lookup menggunakan order_code + email (karena orders.customer_id nullable)
 */

import { Head, Link } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useRef } from 'react';

/* ---------- SVG Symbols (Art & Theme Park Motif khas Plumy) ---------- */
function TicketingSymbols() {
    return (
        <svg className="hidden" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <symbol id="s-star" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 0c1.1 6.9 5.1 10.9 12 12-6.9 1.1-10.9 5.1-12 12-1.1-6.9-5.1-10.9-12-12C6.9 10.9 10.9 6.1 12 0Z" />
                </symbol>
                <symbol id="s-ticket-art" viewBox="0 0 220 160">
                    <g stroke="#8B0A14" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#FBF1E4" d="M30 40h160c6 0 10 4 10 10v20a16 16 0 0 0 0 32v20c0 6-4 10-10 10H30c-6 0-10-4-10-10V92a16 16 0 0 0 0-32V50c0-6 4-10 10-10Z" />
                        <path fill="none" strokeDasharray="6 6" d="M148 40v82" />
                        <path fill="#8B0A14" stroke="none" d="M64 80c1-5 4-8 9-9-5-1-8-4-9-9-1 5-4 8-9 9 5 1 8 4 9 9Z" />
                        <rect x="52" y="60" width="70" height="40" rx="6" fill="none" strokeWidth="3" />
                        <path fill="none" strokeWidth="4" d="M165 58v46m10-46v46m8-46v46m7-46v46" />
                    </g>
                </symbol>
                <symbol id="s-palette" viewBox="0 0 220 170">
                    <g stroke="#8B0A14" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#F4E6D6" d="M174 112c12-18 6-44-12-58s-48-18-72-8-48 30-48 54c0 30 28 48 64 48 18 0 34-6 42-16a18 18 0 0 0 26-20Z" />
                        <circle cx="152" cy="116" r="12" fill="#FBF1E4" />
                        <circle cx="76" cy="88" r="8" fill="#79B1DC" stroke="none" />
                        <circle cx="106" cy="68" r="8" fill="#8B0A14" stroke="none" />
                        <circle cx="138" cy="74" r="8" fill="#F59E0B" stroke="none" />
                    </g>
                </symbol>
                <symbol id="s-wheel" viewBox="0 0 220 180">
                    <g stroke="#8B0A14" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="110" cy="80" r="54" fill="none" />
                        <circle cx="110" cy="80" r="10" fill="#79B1DC" />
                        <path fill="none" d="M110 26v108M56 80h108M72 42l76 76M72 118l76-76" />
                        <circle cx="110" cy="24" r="7" fill="#FBF1E4" />
                        <circle cx="164" cy="80" r="7" fill="#FBF1E4" />
                        <circle cx="110" cy="134" r="7" fill="#FBF1E4" />
                        <circle cx="56" cy="80" r="7" fill="#FBF1E4" />
                        <path fill="none" d="M86 154l24-74 24 74M74 154h72" />
                    </g>
                </symbol>
            </defs>
        </svg>
    );
}

function Star({ className = 'h-3 w-3 text-plumymaroon' }) {
    return (
        <svg className={className} aria-hidden="true">
            <use href="#s-star" />
        </svg>
    );
}

/* ---------- Modal Cek Pesanan (Guest Checkout Lookup) ---------- */
function OrderLookupModal({ open, onClose }) {
    const [orderCode, setOrderCode] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const inputRef = useRef(null);

    const handleLookup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            const res = await fetch('/api/orders/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ order_code: orderCode, email: email }),
            });

            const data = await res.json();
            if (res.ok && data.success && data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                setErrorMessage(data.message || 'Pesanan tidak ditemukan. Pastikan kode pesanan dan email sesuai.');
            }
        } catch {
            setErrorMessage('Terjadi gangguan jaringan. Silakan coba kembali.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog className="relative z-50 font-plumy" onClose={onClose} initialFocus={inputRef}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-plumyink/50 backdrop-blur-xs" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md rounded-[28px] border-2 border-plumymaroon/40 bg-plumycream p-7 sm:p-9 shadow-2xl">
                                <div className="flex items-center justify-between pb-4 border-b border-plumymaroon/20">
                                    <div>
                                        <p className="font-script text-2xl text-plumymaroon">status e-tiket</p>
                                        <h3 className="text-xl font-bold uppercase tracking-wide text-plumyink">
                                            Cek Pesanan Tiket
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="grid h-8 w-8 place-items-center rounded-full border border-plumymaroon/30 text-plumymaroon hover:bg-plumybeige"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <p className="mt-3 text-xs leading-relaxed text-plumyink/75">
                                    Pembeli tanpa akun (Guest Checkout) dapat mengakses status pembayaran dan e-tiket QR dengan memasukkan nomor pesanan dan email.
                                </p>

                                {errorMessage && (
                                    <div className="mt-4 rounded-xl bg-red-100 border border-red-300 p-3 text-xs text-red-800">
                                        {errorMessage}
                                    </div>
                                )}

                                <form onSubmit={handleLookup} className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-plumymaroon mb-1">
                                            Kode Pesanan (Order Code)
                                        </label>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            required
                                            value={orderCode}
                                            onChange={(e) => setOrderCode(e.target.value)}
                                            placeholder="Contoh: ORD-202610-ABCD"
                                            className="w-full rounded-xl border border-plumymaroon/40 bg-plumybeige/40 px-4 py-2.5 text-sm text-plumyink focus:border-plumymaroon focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-plumymaroon mb-1">
                                            Email Pemesan
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nama@email.com"
                                            className="w-full rounded-xl border border-plumymaroon/40 bg-plumybeige/40 px-4 py-2.5 text-sm text-plumyink focus:border-plumymaroon focus:outline-none"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full rounded-full bg-plumymaroon py-3 text-xs font-semibold uppercase tracking-wider text-plumycream hover:bg-[#6e080f] disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            {loading ? 'Mencari Data Pesanan...' : 'Buka E-Tiket Saya →'}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

/* =========================================================================
   KOMPONEN UTAMA LANDING PAGE
========================================================================= */
export default function Welcome({
    parks = [],
    selectedPark,
    capacities = [],
    ticketTiers = [],
    promotions = [],
    featuredAttractions = [],
    today,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [lookupModalOpen, setLookupModalOpen] = useState(false);
    const [heroDate, setHeroDate] = useState(today || new Date().toISOString().split('T')[0]);

    const activePark = selectedPark || parks[0] || {
        id: '1',
        name: 'Wonderpark World Resort',
        description: 'Taman hiburan tematik dan galeri kurasi seni visual kontemporer.',
        open_time: '09:00:00',
        close_time: '21:00:00',
        location_address: 'Jl. Boulevard Fantasi No. 1, Kawasan Wisata Terpadu',
    };

    const navLinkClass = 'text-[13px] font-semibold uppercase tracking-[0.12em] text-plumyink hover:text-plumymaroon transition-colors';

    return (
        <div className="plumy min-h-screen bg-plumycream font-plumy text-plumyink">
            <TicketingSymbols />
            <Head title={`${activePark.name} — Tiket Resmi, Wahana & Info Pengunjung`} />

            {/* ================= 1. NAVBAR ================= */}
            <header className="sticky top-0 z-40 border-b border-plumymaroon/15 bg-plumysky shadow-xs">
                <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3 sm:px-8">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                            className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-full lg:hidden"
                        >
                            <span className="block h-0.5 w-5 bg-plumyink rounded" />
                            <span className="block h-0.5 w-5 bg-plumyink rounded" />
                            <span className="block h-0.5 w-5 bg-plumyink rounded" />
                        </button>
                        <a href="#hero" className="flex flex-col">
                            <span className="font-script text-[30px] font-bold lowercase leading-none text-plumymaroon">
                                {activePark.name.split(' ')[0]}
                            </span>
                            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-plumyink/80">
                                ticketing &amp; art park
                            </span>
                        </a>
                    </div>

                    {/* Nav Desktop: Tiket, Wahana, Info Pengunjung, FAQ */}
                    <nav className="hidden items-center gap-6 lg:flex">
                        <a href="#tanggal" className={navLinkClass}>Jadwal</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#tiket" className={navLinkClass}>Tiket</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#wahana" className={navLinkClass}>Wahana</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#info" className={navLinkClass}>Info Pengunjung</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#faq" className={navLinkClass}>FAQ</a>
                    </nav>

                    {/* Action Buttons: Cek Pesanan, Auth, Beli Tiket */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setLookupModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-plumymaroon/40 bg-plumycream/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-plumymaroon hover:bg-plumycream transition-all shadow-2xs"
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <span className="hidden sm:inline">Cek Pesanan</span>
                        </button>

                        <Link
                            href="/login"
                            className="hidden text-xs font-semibold uppercase tracking-wider text-plumyink/80 hover:text-plumymaroon sm:inline-block px-2"
                        >
                            Masuk
                        </Link>

                        <Link
                            href={`/tickets?park_id=${activePark.id}`}
                            className="rounded-full bg-plumymaroon px-5 py-2 text-xs font-semibold uppercase tracking-wider text-plumycream hover:bg-[#6e080f] shadow-xs transition-transform hover:scale-105"
                        >
                            Beli Tiket
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {menuOpen && (
                    <nav className="border-t border-plumymaroon/20 bg-plumysky px-6 py-4 lg:hidden">
                        <ul className="space-y-3">
                            {[['#tanggal', 'Jadwal & Kuota'], ['#tiket', 'Pilihan Tiket'], ['#wahana', 'Wahana & Atraksi'], ['#info', 'Info Pengunjung & Aturan Masuk'], ['#faq', 'Pertanyaan Umum (FAQ)']].map(([href, label]) => (
                                <li key={href}>
                                    <a
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className="block text-sm font-semibold uppercase tracking-wider text-plumyink"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                            <li className="pt-2 border-t border-plumymaroon/20">
                                <Link href="/login" className="block text-sm font-semibold uppercase tracking-wider text-plumymaroon">
                                    Login / Daftar Akun
                                </Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </header>

            <main>
                {/* ================= 2. HERO SECTION ================= */}
                <section id="hero" className="grid border-b border-plumymaroon/20 lg:min-h-[580px] lg:grid-cols-2">
                    {/* Visual Kiri: Stripes-v, Blob, Ilustrasi */}
                    <div className="stripes-v relative flex items-center justify-center overflow-hidden px-6 py-14 sm:px-10">
                        <div className="pointer-events-none absolute left-6 top-6 text-plumymaroon/60">
                            <Star className="h-6 w-6 rotate-12" />
                        </div>
                        <div className="pointer-events-none absolute bottom-8 right-8 text-plumymaroon/60">
                            <Star className="h-8 w-8 -rotate-12" />
                        </div>

                        <div className="relative mx-auto flex h-full max-w-sm items-center justify-center">
                            <div className="blob bg-plumycream px-10 py-12 text-center shadow-lg">
                                <p className="font-script text-5xl font-bold lowercase leading-none text-plumymaroon sm:text-6xl">
                                    {activePark.name.split(' ')[0]}
                                </p>
                                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-plumyink/80">
                                    resor wahana seni &amp; pameran
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-2 text-plumymaroon">
                                    <Star className="h-2.5 w-2.5" />
                                    <Star className="h-3.5 w-3.5" />
                                    <Star className="h-2.5 w-2.5" />
                                </div>
                            </div>

                            <div className="sticker absolute -left-2 top-2 bg-plumycream p-3 rotate-[-8deg]">
                                <svg className="h-20 w-24"><use href="#s-ticket-art" /></svg>
                            </div>

                            <div className="sticker absolute -bottom-2 right-0 bg-plumybeige p-3 rotate-[9deg]">
                                <svg className="h-20 w-20"><use href="#s-wheel" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Konten Kanan: Nama Taman, Tagline, Jam Buka, & Date Picker Langsung */}
                    <div className="flex flex-col justify-center bg-plumycream px-6 py-12 sm:px-12 lg:px-16">
                        <div className="mb-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-plumymaroon">
                            <Star className="h-3 w-3" />
                            <span>Buka Setiap Hari: {activePark.open_time?.substring(0, 5)} – {activePark.close_time?.substring(0, 5)} WIB</span>
                        </div>

                        <h1 className="text-[40px] font-semibold uppercase leading-[1.02] tracking-[0.02em] text-plumyink sm:text-[54px] lg:text-[62px]">
                            {activePark.name}
                        </h1>

                        <p className="mt-4 max-w-lg text-[15px] leading-[1.65] text-plumyink/75">
                            {activePark.description || 'Eksplorasi zona seni cahaya interaktif, wahana petualangan seru, dan kurasi instalasi rupa berstandar internasional.'}
                        </p>

                        <div className="mt-3 flex items-center gap-1.5 text-xs text-plumyink/70">
                            <svg className="h-4 w-4 text-plumymaroon shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span className="truncate">{activePark.location_address}</span>
                        </div>

                        {/* Quick Date Picker ("Pilih Tanggal Kunjungan") Langsung di Hero */}
                        <div className="mt-8 rounded-[24px] border-2 border-plumymaroon/40 bg-plumybeige/80 p-5 shadow-xs">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-plumymaroon mb-2">
                                Rencanakan Kunjungan Anda
                            </span>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="w-full sm:flex-1 relative">
                                    <input
                                        type="date"
                                        min={today}
                                        value={heroDate}
                                        onChange={(e) => setHeroDate(e.target.value)}
                                        className="w-full rounded-xl border border-plumymaroon/40 bg-plumycream px-4 py-3 text-sm font-semibold text-plumyink focus:border-plumymaroon focus:outline-none"
                                    />
                                </div>
                                <Link
                                    href={`/tickets?park_id=${activePark.id}&date=${heroDate}`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-plumymaroon px-7 py-3 text-sm font-semibold uppercase tracking-wider text-plumycream hover:bg-[#6e080f] shadow-sm transition-all whitespace-nowrap"
                                >
                                    Cari Tiket →
                                </Link>
                            </div>
                            <p className="mt-2 text-[11px] text-plumyink/60">
                                *Sistem otomatis mengecek kuota harian gerbang &amp; ketersediaan tiket.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= 3. KETERSEDIAAN TANGGAL & KUOTA ================= */}
                <section id="tanggal" className="scroll-mt-20 bg-plumybeige/50 px-4 py-16 sm:px-8 border-b border-plumymaroon/15">
                    <div className="mx-auto max-w-content">
                        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-1">
                                    Status Kapasitas Harian
                                </span>
                                <h2 className="text-[28px] font-semibold uppercase tracking-wide text-plumyink sm:text-[36px]">
                                    Ketersediaan Tanggal Kunjungan
                                </h2>
                                <p className="text-xs text-plumyink/70 mt-1">
                                    Berdasarkan kuota resmi gerbang masuk ({activePark.name}). Pilih tanggal untuk mengunci reservasi.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Tersedia</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Hampir Habis</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> Tutup/Habis</span>
                            </div>
                        </div>

                        {/* Strip Kalender 14 Hari */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
                            {capacities.length > 0 ? capacities.slice(0, 14).map((c) => {
                                const isClosed = c.is_closed || c.remaining_quota <= 0;
                                const isWarning = c.status_label === 'Hampir Habis';

                                return (
                                    <Link
                                        key={c.id || c.visit_date}
                                        href={isClosed ? '#' : `/tickets?park_id=${activePark.id}&date=${c.visit_date}`}
                                        className={`rounded-2xl border p-3.5 text-center transition-all ${
                                            isClosed
                                                ? 'opacity-60 bg-gray-100 border-gray-300 pointer-events-none cursor-not-allowed'
                                                : isWarning
                                                ? 'border-amber-300 bg-amber-50/80 hover:border-amber-500 hover:shadow-xs'
                                                : 'border-plumymaroon/30 bg-plumycream hover:border-plumymaroon hover:shadow-xs'
                                        }`}
                                    >
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-plumyink/60 block">
                                            {new Date(c.visit_date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </span>
                                        <span className="font-mono text-xl font-extrabold text-plumyink my-1 block">
                                            {new Date(c.visit_date).getDate()}
                                        </span>
                                        <span className="text-[10px] text-plumyink/70 block mb-2">
                                            {new Date(c.visit_date).toLocaleDateString('id-ID', { month: 'short' })}
                                        </span>

                                        <span className={`inline-block w-full py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            c.is_closed
                                                ? 'bg-rose-100 text-rose-800'
                                                : c.remaining_quota <= 0
                                                ? 'bg-rose-100 text-rose-800'
                                                : isWarning
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {c.status_label}
                                        </span>
                                    </Link>
                                );
                            }) : (
                                <p className="col-span-full py-8 text-center text-sm text-plumyink/60">
                                    Memuat jadwal ketersediaan tanggal...
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ================= 4. PILIHAN TIKET (TICKET TIERS) ================= */}
                <section id="tiket" className="scroll-mt-20 px-4 py-20 sm:px-8">
                    <div className="mx-auto max-w-content">
                        <div className="mb-14 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-2">
                                Kategori Resmi Masuk
                            </span>
                            <h2 className="text-[34px] font-semibold uppercase tracking-[0.03em] text-plumyink sm:text-[44px]">
                                Pilihan Kategori Tiket Masuk
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-[14px] text-plumyink/75">
                                Seluruh tiket telah mencakup akses pameran seni dan wahana sesuai tier yang dipilih.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {ticketTiers.map((tier) => (
                                <div
                                    key={tier.id}
                                    className="rounded-[28px] border-2 border-plumymaroon/30 bg-plumycream p-7 flex flex-col justify-between shadow-xs hover:-translate-y-1 transition-all"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-plumybeige text-plumymaroon">
                                                {tier.code || 'TIER RESMI'}
                                            </span>
                                            {tier.max_height_cm && (
                                                <span className="text-[11px] font-semibold text-plumyink/70">
                                                    Maks. {tier.max_height_cm} cm
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-bold uppercase tracking-wide text-plumyink">
                                            {tier.name}
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-plumyink/70">
                                            {tier.description || 'Akses masuk pameran & instalasi seni.'}
                                        </p>

                                        {/* Syarat Usia / Batasan */}
                                        <div className="mt-4 py-2 border-y border-plumymaroon/15 text-[11px] text-plumyink/80 flex items-center gap-2">
                                            <Star className="h-2.5 w-2.5 text-plumymaroon shrink-0" />
                                            <span>
                                                {tier.min_age || tier.max_age
                                                    ? `Usia: ${tier.min_age ? tier.min_age + '+' : '0'} s/d ${tier.max_age || 'Dewasa'} tahun`
                                                    : 'Berlaku untuk semua usia'}
                                            </span>
                                        </div>

                                        {/* Perks List */}
                                        <ul className="mt-4 space-y-2 text-xs text-plumyink/85">
                                            {(tier.perks || []).map((perk, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-2">
                                                    <span className="text-emerald-700 font-bold">✓</span>
                                                    <span>{perk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-plumymaroon/20">
                                        <div className="flex items-baseline justify-between mb-4">
                                            <span className="text-[11px] uppercase tracking-wider text-plumyink/60">
                                                Mulai dari
                                            </span>
                                            <p className="text-2xl font-bold text-plumymaroon">
                                                Rp {new Intl.NumberFormat('id-ID').format(tier.starting_price || 50000)}
                                            </p>
                                        </div>

                                        <Link
                                            href={`/tickets?park_id=${activePark.id}&tier_id=${tier.id}`}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-plumymaroon py-3 text-xs font-semibold uppercase tracking-wider text-plumycream hover:bg-[#6e080f] shadow-xs transition-colors"
                                        >
                                            Beli Tiket Ini →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 5. PROMO AKTIF (PROMOTIONS) ================= */}
                {promotions.length > 0 && (
                    <section id="promo" className="bg-plumybeige/70 px-4 py-16 sm:px-8 border-y border-plumymaroon/15">
                        <div className="mx-auto max-w-content">
                            <div className="mb-8 text-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-1">
                                    Penawaran Spesial
                                </span>
                                <h2 className="text-[28px] font-semibold uppercase tracking-wide text-plumyink sm:text-[36px]">
                                    Kupon &amp; Promo Kunjungan
                                </h2>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {promotions.map((promo) => (
                                    <div
                                        key={promo.id}
                                        className="rounded-[24px] border-2 border-dashed border-plumymaroon/50 bg-plumycream p-6 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="rounded-full bg-plumymaroon px-3 py-1 text-[10px] font-bold uppercase text-plumycream">
                                                    {promo.discount_type === 'PERCENTAGE' ? `Diskon ${promo.discount_value}%` : `Potongan Rp ${promo.discount_value.toLocaleString()}`}
                                                </span>
                                                <span className="text-[10px] text-plumyink/60">
                                                    s/d {new Date(promo.valid_until).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <h3 className="font-mono text-2xl font-extrabold text-plumymaroon tracking-wider mt-2">
                                                {promo.code}
                                            </h3>
                                            <p className="mt-1 text-xs text-plumyink/70">
                                                Min. pembelian Rp {new Intl.NumberFormat('id-ID').format(promo.min_order_amount || 0)}.
                                            </p>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-plumymaroon/15 flex items-center justify-between">
                                            <span className="text-[11px] text-plumyink/70">Masukkan saat checkout</span>
                                            <Link
                                                href={`/tickets?park_id=${activePark.id}&promo=${promo.code}`}
                                                className="text-xs font-semibold text-plumymaroon underline hover:text-[#6e080f]"
                                            >
                                                Terapkan Promo →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ================= 6. WAHANA UNGGULAN (ATTRACTIONS PER ZONES) ================= */}
                <section id="wahana" className="scroll-mt-20 px-4 py-20 sm:px-8">
                    <div className="mx-auto max-w-content">
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-1">
                                    Daya Tarik {activePark.name}
                                </span>
                                <h2 className="text-[34px] font-semibold uppercase tracking-[0.03em] text-plumyink sm:text-[44px]">
                                    Wahana &amp; Instalasi Unggulan
                                </h2>
                                <p className="text-xs text-plumyink/70 mt-1 max-w-md">
                                    Tiap wahana dirancang dengan standar keselamatan tertinggi dan batasan tinggi badan pengunjung.
                                </p>
                            </div>
                            <Link
                                href={`/tickets?park_id=${activePark.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-plumymaroon underline decoration-2 underline-offset-4 hover:text-[#6e080f]"
                            >
                                Lihat Semua Wahana &amp; Jadwal Show →
                            </Link>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredAttractions.map((attr) => (
                                <div
                                    key={attr.id}
                                    className="rounded-[24px] border border-plumymaroon/30 bg-plumycream p-6 flex flex-col justify-between shadow-xs"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-plumymaroon bg-plumybeige px-3 py-1 rounded-full">
                                                {attr.zone_name}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                attr.status === 'OPERATIONAL'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {attr.status === 'OPERATIONAL' ? '✓ Operasional' : '⚠ Perawatan'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold uppercase tracking-wide text-plumyink">
                                            {attr.name}
                                        </h3>
                                        <p className="mt-2 text-xs text-plumyink/70 line-clamp-3">
                                            {attr.description || 'Pengalaman seni visual dan wahana interaktif seru.'}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-plumymaroon/15 flex items-center justify-between text-xs text-plumyink/75">
                                        <span>Min. Tinggi: <strong>{attr.min_height_cm > 0 ? `${attr.min_height_cm} cm` : 'Bebas'}</strong></span>
                                        <span className="font-script text-base text-plumymaroon">termasuk tiket</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 7. CARA PEMESANAN (3 LANGKAH) ================= */}
                <section className="bg-plumybeige px-4 py-20 sm:px-8 border-t border-plumymaroon/20">
                    <div className="mx-auto max-w-content">
                        <div className="mb-14 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-2">
                                Alur Pembelian E-Tiket
                            </span>
                            <h2 className="text-[34px] font-semibold uppercase tracking-[0.03em] text-plumyink sm:text-[44px]">
                                3 Langkah Cepat &amp; Praktis
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-[14px] text-plumyink/75">
                                Transaksi instan dan tiket digital langsung siap di ponsel Anda tanpa perlu antre di loket fisik.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: 'Pilih Tanggal & Tiket',
                                    desc: 'Tentukan tanggal kunjungan di kalender kapasitas gerbang dan pilih jumlah kategori tiket yang Anda perlukan.',
                                },
                                {
                                    step: '02',
                                    title: 'Bayar Sebelum Batas Waktu',
                                    desc: 'Selesaikan transaksi dengan aman via QRIS atau VA sebelum batas waktu 15 menit (expires_at) habis agar kuota tidak dirilis kembali.',
                                },
                                {
                                    step: '03',
                                    title: 'Terima & Scan E-Tiket QR',
                                    desc: 'E-Tiket dengan Barcode QR resmi otomatis terbit. Cukup tunjukkan layar smartphone Anda ke turnstile pintu masuk.',
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="rounded-[28px] border border-plumymaroon/30 bg-plumycream p-8 flex flex-col justify-between shadow-xs"
                                >
                                    <div>
                                        <span className="font-mono text-4xl font-extrabold text-plumymaroon/30 block mb-4">
                                            {item.step}
                                        </span>
                                        <h3 className="text-xl font-bold uppercase tracking-wide text-plumyink">
                                            {item.title}
                                        </h3>
                                        <p className="mt-3 text-xs leading-relaxed text-plumyink/75">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-plumymaroon/15 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-plumymaroon">
                                        <Star className="h-2.5 w-2.5" />
                                        <span>Proses Terverifikasi</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 8. INFO PENGUNJUNG & KEBIJAKAN REFUND ================= */}
                <section id="info" className="scroll-mt-20 px-4 py-20 sm:px-8">
                    <div className="mx-auto max-w-content">
                        <div className="grid gap-12 lg:grid-cols-2">
                            {/* Kiri: Alamat & Jam Operasional */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-2">
                                    Panduan Kunjungan
                                </span>
                                <h2 className="text-[34px] font-semibold uppercase tracking-wide text-plumyink sm:text-[40px]">
                                    Lokasi &amp; Jam Operasional
                                </h2>
                                
                                <div className="mt-6 space-y-4 text-xs text-plumyink/80 leading-relaxed">
                                    <div className="rounded-2xl border border-plumymaroon/25 bg-plumycream p-5">
                                        <strong className="block text-sm uppercase text-plumyink mb-1">Alamat Resmi:</strong>
                                        <p>{activePark.location_address}</p>
                                        <p className="mt-1 text-[11px] text-plumyink/60">Tersedia area parkir luas, halte shuttle bus, dan akses ramah difabel.</p>
                                    </div>

                                    <div className="rounded-2xl border border-plumymaroon/25 bg-plumycream p-5">
                                        <strong className="block text-sm uppercase text-plumyink mb-1">Waktu Buka Gerbang:</strong>
                                        <p>Senin – Minggu: {activePark.open_time?.substring(0, 5)} s/d {activePark.close_time?.substring(0, 5)} WIB</p>
                                        <p className="mt-1 text-[11px] text-plumyink/60">Pintu masuk terakhir ditutup 1 jam sebelum jam operasional taman berakhir.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Kanan: Aturan Masuk & Ringkasan Kebijakan Refund */}
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-2">
                                    Ketentuan Resmi
                                </span>
                                <h2 className="text-[34px] font-semibold uppercase tracking-wide text-plumyink sm:text-[40px]">
                                    Aturan &amp; Kebijakan Refund
                                </h2>

                                <div className="mt-6 space-y-4 text-xs text-plumyink/80 leading-relaxed">
                                    <div className="rounded-2xl border border-plumymaroon/25 bg-plumycream p-5">
                                        <strong className="block text-sm uppercase text-plumyink mb-2">Tata Tertib Pengunjung:</strong>
                                        <ul className="space-y-1.5 list-disc pl-4">
                                            <li>Dilarang membawa makanan dan minuman dari luar ke dalam area pameran.</li>
                                            <li>Kamera profesional/tripod untuk kebutuhan komersial wajib berizin ke manajemen.</li>
                                            <li>Pengunjung di bawah 12 tahun wajib didampingi orang dewasa.</li>
                                        </ul>
                                    </div>

                                    {/* Kebijakan Refund (Sesuai skema tabel refunds) */}
                                    <div className="rounded-2xl border-2 border-dashed border-plumymaroon/40 bg-plumybeige/60 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="h-3 w-3 text-plumymaroon" />
                                            <strong className="text-sm uppercase text-plumymaroon">Ringkasan Kebijakan Refund:</strong>
                                        </div>
                                        <p className="text-xs leading-relaxed text-plumyink/75">
                                            Pengajuan pengembalian dana (refund) dapat diajukan maksimal <strong>H-1 sebelum tanggal kunjungan (23.59 WIB)</strong> melalui customer care resmi. Tiket yang sudah melewati tanggal validitas atau berstatus <em>USED</em> tidak dapat di-refund.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= 9. FAQ & FOOTER ================= */}
                <section id="faq" className="scroll-mt-20 bg-plumybeige/40 px-4 py-20 sm:px-8 border-t border-plumymaroon/15">
                    <div className="mx-auto max-w-content">
                        <div className="mb-12 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-plumymaroon block mb-2">
                                Bantuan Cepat
                            </span>
                            <h2 className="text-[34px] font-semibold uppercase tracking-wide text-plumyink sm:text-[40px]">
                                Pertanyaan Umum (FAQ)
                            </h2>
                        </div>

                        <div className="mx-auto max-w-3xl space-y-4">
                            {[
                                {
                                    q: 'Apakah tiket hangus jika saya datang terlambat di jam buka?',
                                    a: 'Tidak. E-Tiket Anda berlaku sepanjang hari operasional untuk tanggal kunjungan yang dipilih, mulai dari jam gerbang buka hingga 1 jam sebelum taman tutup.',
                                },
                                {
                                    q: 'Apakah jadwal kunjungan bisa di-reschedule?',
                                    a: 'Ya, reschedule dapat dilakukan maksimal H-1 sebelum tanggal kedatangan awal, selama kuota pada tanggal baru masih tersedia di sistem.',
                                },
                                {
                                    q: 'Apakah anak-anak perlu membeli tiket sendiri?',
                                    a: 'Anak dengan tinggi badan di bawah 90 cm atau usia di bawah 2 tahun bebas biaya tiket (gratis). Anak usia 2-12 tahun dapat menggunakan tiket kategori Anak & Pelajar.',
                                },
                                {
                                    q: 'Bagaimana cara mengecek tiket jika saya memesan tanpa akun (Guest Checkout)?',
                                    a: 'Gunakan tombol "Cek Pesanan" di bagian atas halaman ini, lalu masukkan Kode Pesanan dan Email yang Anda daftarkan saat transaksi.',
                                },
                            ].map((faq, idx) => (
                                <details
                                    key={idx}
                                    className="group rounded-[20px] border border-plumymaroon/30 bg-plumycream p-5 [&_summary::-webkit-details-marker]:hidden"
                                >
                                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-plumyink">
                                        <span className="text-sm uppercase tracking-wide">{faq.q}</span>
                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-plumybeige text-xs text-plumymaroon transition-transform group-open:rotate-180">
                                            ↓
                                        </span>
                                    </summary>
                                    <p className="mt-3 text-xs leading-relaxed text-plumyink/75 pt-3 border-t border-plumymaroon/15">
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer Editorial */}
                <footer className="stripes-v-warm border-t-2 border-plumymaroon/30 px-4 pb-12 pt-20 sm:px-8">
                    <div className="mx-auto max-w-content text-center">
                        <div className="blob mx-auto w-fit bg-plumycream px-12 py-8 shadow-md">
                            <p className="font-script text-5xl font-bold lowercase leading-none text-plumymaroon">
                                {activePark.name.split(' ')[0]}
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-2 text-plumymaroon">
                                <Star className="h-2.5 w-2.5" />
                                <Star className="h-3.5 w-3.5" />
                                <Star className="h-2.5 w-2.5" />
                            </div>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-wider text-plumyink/80">
                            <a href="#hero" className="hover:text-plumymaroon">Beranda</a>
                            <Star className="h-2 w-2 text-plumymaroon" />
                            <a href="#tiket" className="hover:text-plumymaroon">Pesan Tiket</a>
                            <Star className="h-2 w-2 text-plumymaroon" />
                            <button type="button" onClick={() => setLookupModalOpen(true)} className="hover:text-plumymaroon">Cek Pesanan Guest</button>
                            <Star className="h-2 w-2 text-plumymaroon" />
                            <a href="#info" className="hover:text-plumymaroon">Kebijakan Refund</a>
                        </div>

                        <p className="mt-8 text-xs text-plumyink/60">
                            © {new Date().getFullYear()} {activePark.name}. Seluruh Hak Cipta Dilindungi. Sistem Ticketing Pameran Seni &amp; Resor Wahana.
                        </p>
                    </div>
                </footer>
            </main>

            {/* Modal Cek Pesanan (Guest Checkout Lookup) */}
            <OrderLookupModal
                open={lookupModalOpen}
                onClose={() => setLookupModalOpen(false)}
            />
        </div>
    );
}
