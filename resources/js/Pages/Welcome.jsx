/**
 * VURASI PAMERAN SENI — SIMPLE GALLERY LANDING
 *
 * Design system: Minimal & clean
 * - Kertas & tinta: zinc-50 / zinc-950, border sederhana, aksen brand orange-600
 * - Tipografi jelas tanpa efek outline / stroke-word berlebihan
 * - Layout rapi, grid seimbang, sedikit bayangan
 *
 * Interaksi yang dipertahankan (logika tidak berubah):
 * - Hero slider autoplay 6s, panah, keyboard (←/→), pause saat hover/focus
 * - Progress bar sederhana (tanpa animasi ken-burns)
 * - Scroll-spy navbar, status buka/tutup real-time
 * - FAQ accordion, copy kode promo, tombol back-to-top
 * - Modal Cek Pesanan Guest
 *
 * Aksesibilitas: skip-link, target sentuh ≥ 44px, aria-label, prefers-reduced-motion
 *
 * LOGIKA BISNIS TIDAK BERUBAH:
 * - Quick booking → /tickets?park_id=...&date=...&qty=...
 * - Kartu park → /parks/{id}, promo → salin kupon
 * - Modal Cek Pesanan Guest → POST /api/orders/lookup lalu redirect
 */

import { Head, Link } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState, useRef, useEffect } from 'react';

/* =========================================================================
   IKON (SVG inline, gaya Lucide — stroke 2, konsisten di seluruh halaman)
========================================================================= */
function Icon({ children, className = 'h-4 w-4', stroke = 2 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconMenu = (p) => <Icon {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;
const IconArrowUpRight = (p) => <Icon {...p}><path d="M7 17 17 7" /><path d="M7 7h10v10" /></Icon>;
const IconChevronL = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevronR = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>;
const IconMapPin = (p) => <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>;
const IconFerris = (p) => <Icon {...p}><circle cx="12" cy="13" r="2" /><path d="M12 3v8M12 15v6M4 6l6 6M20 6l-6 6M2 21h20" /></Icon>;
const IconZap = (p) => <Icon {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Icon>;
const IconShield = (p) => <Icon {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></Icon>;
const IconCard = (p) => <Icon {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="m9 12 2 2 4-4" /></Icon>;
const IconCopy = (p) => <Icon {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" /></Icon>;
const IconArrowUp = (p) => <Icon {...p}><path d="m18 15-6-6-6 6" /></Icon>;
const IconMinus = (p) => <Icon {...p}><path d="M5 12h14" /></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>;
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 11v2" /><path d="M13 17v2" /></Icon>;
const IconSun = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Icon>;

/* =========================================================================
   UTIL
========================================================================= */
const fmtID = new Intl.NumberFormat('id-ID');
const rupiah = (n) => `Rp ${fmtID.format(n || 0)}`;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Status buka/tutup per park — dihitung dari jam lokal pengunjung. */
function parkStatus(park, now = new Date()) {
    const toMin = (t) => {
        if (!t) return null;
        const [h, m] = String(t).split(':');
        const hh = Number(h);
        const mm = Number(m) || 0;
        if (Number.isNaN(hh)) return null;
        return hh * 60 + mm;
    };
    const open = toMin(park.open_time);
    const close = toMin(park.close_time);
    if (open == null || close == null) return { isOpen: true, label: 'Buka setiap hari' };

    const cur = now.getHours() * 60 + now.getMinutes();
    const bt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}.${String(t % 60).padStart(2, '0')}`;
    if (cur >= open && cur < close) {
        return { isOpen: true, label: `Buka sekarang · tutup ${bt(close)} WIB` };
    }
    return { isOpen: false, label: `Tutup · buka ${bt(open)} WIB` };
}

/* =========================================================================
   HOOK & KOMPONEN INTERAKSI
========================================================================= */

/* Scroll-spy: highlight link navbar yang section-nya sedang terlihat. */
function useScrollSpy(ids = []) {
    const [active, setActive] = useState('');
    const key = ids.join('|');

    useEffect(() => {
        if (!key) return undefined;
        const sections = key.split('|').map((id) => document.getElementById(id)).filter(Boolean);
        if (!sections.length) return undefined;

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: '-40% 0px -55% 0px' }
        );
        sections.forEach((s) => obs.observe(s));
        return () => obs.disconnect();
    }, [key]);

    return active;
}

/* Posisi scroll: dipakai untuk garis navbar & tombol kembali ke atas. */
function useScrolled(threshold = 24) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);
    return scrolled;
}

/* =========================================================================
   MODAL CEK PESANAN (GUEST CHECKOUT LOOKUP) — logic tidak berubah
========================================================================= */
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
                setErrorMessage(data.message || 'Pesanan tidak ditemukan. Periksa kembali Kode Pesanan dan Email Anda.');
            }
        } catch {
            setErrorMessage('Terjadi gangguan jaringan. Silakan coba kembali.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full border-0 border-b-2 border-zinc-300 bg-transparent px-1 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-600';

    return (
        <Transition show={open} as={Fragment}>
            <Dialog className="relative z-50 font-sans" onClose={onClose} initialFocus={inputRef}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-zinc-950/70" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <DialogPanel className="w-full max-w-md border border-zinc-200 bg-zinc-50 p-6 sm:p-8 shadow-lg">
                                <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-orange-600">E-Tiket</p>
                                        <h3 className="mt-1 text-lg font-bold text-zinc-900">Cek Pesanan Tiket</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Tutup dialog"
                                        className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center text-zinc-400 hover:text-zinc-900 cursor-pointer"
                                    >
                                        <IconX className="h-5 w-5" />
                                    </button>
                                </div>

                                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                                    Masukkan Kode Pesanan dan Email yang Anda daftarkan saat membeli tiket untuk melihat status e-tiket QR Code Anda.
                                </p>

                                {errorMessage && (
                                    <div role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                        {errorMessage}
                                    </div>
                                )}

                                <form onSubmit={handleLookup} className="mt-5 space-y-5">
                                    <div>
                                        <label htmlFor="lookup-code" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                            Kode Pesanan (Order Code)
                                        </label>
                                        <input
                                            ref={inputRef}
                                            id="lookup-code"
                                            type="text"
                                            required
                                            value={orderCode}
                                            onChange={(e) => setOrderCode(e.target.value)}
                                            placeholder="Contoh: WP-GUEST-7701"
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="lookup-email" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                            Email Pemesan
                                        </label>
                                        <input
                                            id="lookup-email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nama@email.com"
                                            className={inputCls}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex w-full items-center justify-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-50 hover:bg-transparent hover:text-zinc-900 disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? 'Mencari Tiket...' : 'Buka E-Tiket Saya'}
                                        {!loading && <IconArrowRight className="h-4 w-4" />}
                                    </button>
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
   KOMPONEN UTAMA
========================================================================= */
export default function Welcome({ parks = [], promotions = [], today, auth = {} }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [lookupModalOpen, setLookupModalOpen] = useState(false);

    // Interaktivitas global
    const scrolled = useScrolled(16);
    const user = auth?.user;
    const navItems = [
        { id: 'quick-booking', label: 'Pesan Cepat' },
        { id: 'parks', label: 'Destinasi' },
        { id: 'promo', label: 'Kupon' },
        { id: 'keunggulan', label: 'Keunggulan' },
        { id: 'faq', label: 'Bantuan' },
    ];
    const activeSection = useScrollSpy(navItems.map((n) => n.id));

    // Copy kode promo
    const [copiedCode, setCopiedCode] = useState(null);
    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            /* clipboard opsional — feedback tetap ditampilkan */
        }
        setCopiedCode(code);
        setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    };

    // State Quick Booking
    const [selectedParkId, setSelectedParkId] = useState(() => parks[0]?.id || '');
    const [selectedDate, setSelectedDate] = useState(() => today || new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState(2);

    // State Hero Carousel
    const [currentSlide, setCurrentSlide] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);
    const [reducedMotion] = useState(prefersReducedMotion);
    const sliderRef = useRef(null);

    const heroSlides = [
        {
            tag: 'Sekarang tayang',
            title: 'Instalasi Cahaya Kristal',
            desc: 'Galeri pameran seni rupa modern & kubah proyeksi 360°.',
            bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80',
            buttonParkId: parks[1]?.id || parks[0]?.id || '',
        },
        {
            tag: 'Taman seru',
            title: 'Wahana Tematik Turnstile Resmi',
            desc: 'Kuota gerbang dicek real-time — tiket QR terbit instan.',
            bgImage: 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=1600&q=80',
            buttonParkId: parks[0]?.id || '',
        },
    ];

    useEffect(() => {
        if (heroPaused || reducedMotion || heroSlides.length < 2) return undefined;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [heroPaused, reducedMotion, heroSlides.length]);

    const goSlide = (dir) => setCurrentSlide((prev) => (prev + dir + heroSlides.length) % heroSlides.length);

    // Keyboard navigation untuk slider (←/→) saat fokus di area hero
    useEffect(() => {
        const el = sliderRef.current;
        if (!el) return undefined;
        const onKey = (e) => {
            if (e.key === 'ArrowLeft') goSlide(-1);
            if (e.key === 'ArrowRight') goSlide(1);
        };
        el.addEventListener('keydown', onKey);
        return () => el.removeEventListener('keydown', onKey);
    }, [heroSlides.length]);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        const targetPark = selectedParkId || parks[0]?.id;
        if (targetPark) {
            window.location.href = `/tickets?park_id=${targetPark}&date=${selectedDate}&qty=${quantity}`;
        }
    };

    // Agregat utk baris statistik hero
    const totalZones = parks.reduce((a, p) => a + (p.total_zones || 0), 0);
    const totalAttractions = parks.reduce((a, p) => a + (p.total_attractions || 0), 0);
    const startFrom = Math.min(...[...parks.map((p) => p.min_price || 75000), 75000]);

    const marqueeItems = [
        'E-Tiket QR Code terbit instan, tanpa cetak fisik',
        'Kuota gerbang dicek real-time saat pemesanan',
        'Refund & reschedule hingga H-1 kunjungan',
        'Pembayaran QRIS, Virtual Account, dan e-wallet',
        'Semua park & galeri dalam satu akun',
    ];

    const navLinkCls = (id) =>
        `relative py-2 cursor-pointer ${
            activeSection === id ? 'text-orange-600' : 'text-zinc-600 hover:text-zinc-900'
        }`;

    /* Gaya input Quick Booking */
    const inputCls =
        'w-full border-0 border-b-2 border-zinc-300 bg-transparent px-1 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-orange-600';

    return (
        <div className="vurasi min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
            <Head title="Vurasi Pameran Seni — Paviliun Seni & Cahaya" />

            {/* Skip link (aksesibilitas) */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
            >
                Lewati ke konten utama
            </a>

            {/* ================= 1. HEADER ================= */}
            <header
                className={`sticky top-0 z-40 border-b bg-zinc-50/95 backdrop-blur-sm ${
                    scrolled ? 'border-zinc-200' : 'border-transparent'
                }`}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="-ml-2 flex h-11 w-11 items-center justify-center text-zinc-700 hover:text-zinc-900 md:hidden cursor-pointer"
                            aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                            aria-expanded={menuOpen}
                        >
                            {menuOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
                        </button>

                        <Link href="/" className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold tracking-wide text-zinc-900">
                                Vurasi<span className="text-orange-600">*</span>
                            </span>
                            <span className="hidden text-sm italic text-zinc-400 sm:inline">
                                paviliun seni
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-widest md:flex" aria-label="Navigasi utama">
                        {navItems.map((item) => (
                            <a key={item.id} href={`#${item.id}`} className={navLinkCls(item.id)}>
                                {item.label}
                                <span
                                    aria-hidden="true"
                                    className={`absolute -bottom-0.5 left-0 h-0.5 bg-orange-600 ${
                                        activeSection === item.id ? 'w-full' : 'w-0'
                                    }`}
                                />
                            </a>
                        ))}
                    </nav>

                    {/* Right Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setLookupModalOpen(true)}
                            className="flex h-11 items-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 cursor-pointer"
                        >
                            <IconSearch className="h-4 w-4" />
                            <span className="hidden sm:inline">Cek Pesanan</span>
                        </button>

                        {user ? (
                            <Link
                                href="/my-orders"
                                className="hidden h-11 items-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700 sm:inline-flex"
                            >
                                <IconTicket className="h-4 w-4" />
                                <span>Tiket Saya ({user.name.split(' ')[0]})</span>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="hidden h-11 items-center px-3 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-orange-600 sm:inline-flex"
                            >
                                Masuk
                            </Link>
                        )}

                        <a
                            href="#quick-booking"
                            className="inline-flex h-11 items-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-4 text-xs font-bold uppercase tracking-widest text-zinc-50 hover:bg-transparent hover:text-zinc-900 cursor-pointer"
                        >
                            Pesan Tiket
                        </a>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <nav aria-label="Navigasi seluler" className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 space-y-1 md:hidden">
                        {navItems.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={() => setMenuOpen(false)}
                                className={`flex min-h-[44px] items-center justify-between px-3 text-sm font-semibold uppercase tracking-widest ${
                                    activeSection === item.id ? 'text-orange-600' : 'text-zinc-700 hover:text-zinc-900'
                                }`}
                            >
                                {item.label}
                                <IconArrowRight className="h-4 w-4" />
                            </a>
                        ))}
                        <div className="flex gap-2 border-t border-zinc-200 pt-3">
                            {user ? (
                                <Link href="/my-orders" className="flex-1 border-2 border-orange-600 bg-orange-600 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white">
                                    Tiket Saya ({user.name.split(' ')[0]})
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="flex-1 border-2 border-zinc-900 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-zinc-900">
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="flex-1 border-2 border-zinc-900 bg-zinc-900 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-zinc-50">
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                )}
            </header>

            <main id="main">
                {/* ================= 2. HERO ================= */}
                <section className="relative pb-10 pt-10 sm:pt-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Eyebrow */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm uppercase tracking-widest text-orange-600">Paviliun Seni &amp; Cahaya</span>
                            <span className="h-px flex-1 bg-zinc-300" aria-hidden="true" />
                            <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-zinc-400 sm:inline">
                                Tiket resmi turnstile · {today || 'Hari ini'}
                            </span>
                        </div>

                        {/* Judul */}
                        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
                            <span className="block">Ruang Terbuka</span>
                            <span className="block">untuk Seni yang Bercahaya<span className="text-orange-600">.</span></span>
                        </h1>

                        {/* Aksi + deskripsi */}
                        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
                            <div className="lg:col-span-5">
                                <p className="max-w-md text-sm leading-relaxed text-zinc-500 sm:text-base">
                                    Beli tiket <strong className="font-semibold text-zinc-900">Wonderpark</strong> dan{' '}
                                    <strong className="font-semibold text-zinc-900">Vurasi Art Pavilion</strong> dalam satu portal — pameran seni rupa,
                                    instalasi cahaya kristal, dan wahana tematik. Kuota gerbang dicek real-time, e-tiket QR terbit instan.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link
                                        href={`/tickets?park_id=${heroSlides[1].buttonParkId}`}
                                        className="inline-flex items-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-bold uppercase tracking-widest text-zinc-50 hover:bg-transparent hover:text-zinc-900 cursor-pointer"
                                    >
                                        Pesan Tiket
                                        <IconArrowRight className="h-4 w-4" />
                                    </Link>
                                    <a
                                        href="#parks"
                                        className="inline-flex items-center gap-2 border-b-2 border-zinc-900 px-1 py-3 text-sm font-bold uppercase tracking-widest text-zinc-900 hover:border-orange-600 hover:text-orange-600"
                                    >
                                        Lihat Semua Destinasi ({parks.length})
                                        <IconArrowUpRight className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>

                            {/* Statistik */}
                            <dl className="grid grid-cols-2 gap-px overflow-hidden border border-zinc-200 bg-zinc-200 sm:grid-cols-4 lg:col-span-7 lg:col-start-9">
                                {[
                                    { k: 'Destinasi', v: parks.length },
                                    { k: 'Zona Tematik', v: totalZones },
                                    { k: 'Atraksi', v: totalAttractions },
                                    { k: 'Mulai dari', v: rupiah(startFrom) },
                                ].map((s) => (
                                    <div key={s.k} className="bg-zinc-50 px-4 py-5 sm:py-6">
                                        <dt className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{s.k}</dt>
                                        <dd className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">{s.v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>

                    {/* Slider — autoplay + counter (tanpa ken-burns) */}
                    <section
                        ref={sliderRef}
                        tabIndex={-1}
                        aria-roledescription="carousel"
                        aria-label="Sorotan destinasi"
                        className="relative mt-10 outline-none"
                        onMouseEnter={() => setHeroPaused(true)}
                        onMouseLeave={() => setHeroPaused(false)}
                        onFocus={() => setHeroPaused(true)}
                        onBlur={() => setHeroPaused(false)}
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="relative h-[340px] overflow-hidden bg-zinc-950 sm:h-[420px] lg:h-[480px]">
                                {heroSlides.map((slide, index) => (
                                    <div
                                        key={index}
                                        role="group"
                                        aria-roledescription="slide"
                                        aria-label={`${index + 1} dari ${heroSlides.length}`}
                                        aria-hidden={index !== currentSlide}
                                        className={`absolute inset-0 ${
                                            index === currentSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                                        }`}
                                    >
                                        <img
                                            src={slide.bgImage}
                                            alt={slide.title}
                                            width="1600"
                                            height="900"
                                            className="absolute inset-0 h-full w-full object-cover opacity-80"
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

                                        {/* Caption slide */}
                                        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-8">
                                            <div className="max-w-xl">
                                                <span className="inline-flex items-center gap-1.5 border border-white/30 bg-zinc-950/50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                                                    <IconSun className="h-3.5 w-3.5 text-orange-400" />
                                                    {slide.tag}
                                                </span>
                                                <p className="mt-3 text-2xl italic leading-snug text-white sm:text-3xl">{slide.title}</p>
                                                <p className="mt-1 max-w-md text-xs text-zinc-300 sm:text-sm">{slide.desc}</p>
                                            </div>

                                            <Link
                                                href={`/tickets?park_id=${slide.buttonParkId}`}
                                                tabIndex={index === currentSlide ? 0 : -1}
                                                aria-hidden={index !== currentSlide}
                                                className="inline-flex min-h-[44px] items-center gap-2 border-2 border-white/80 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-zinc-900 cursor-pointer"
                                            >
                                                Lihat &amp; Pesan
                                                <IconArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>

                                        {/* Counter */}
                                        <div aria-hidden="true" className="absolute right-4 top-4 text-4xl font-bold text-white/90 sm:text-5xl">
                                            <span>{String(index + 1).padStart(2, '0')}</span>
                                            <span className="text-lg text-white/40 sm:text-xl"> / {String(heroSlides.length).padStart(2, '0')}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Panah slider */}
                                {heroSlides.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => goSlide(-1)}
                                            aria-label="Slide sebelumnya"
                                            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-zinc-950/40 text-white hover:bg-white hover:text-zinc-900 cursor-pointer sm:left-5"
                                        >
                                            <IconChevronL className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => goSlide(1)}
                                            aria-label="Slide berikutnya"
                                            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-zinc-950/40 text-white hover:bg-white hover:text-zinc-900 cursor-pointer sm:right-5"
                                        >
                                            <IconChevronR className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Titik + progress sederhana */}
                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {heroSlides.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setCurrentSlide(i)}
                                            aria-label={`Tampilkan slide ${i + 1}`}
                                            aria-current={i === currentSlide}
                                            className={`h-2.5 cursor-pointer rounded-full ${
                                                i === currentSlide ? 'w-7 bg-zinc-900' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="h-1 flex-1 max-w-[180px] overflow-hidden bg-zinc-200" aria-hidden="true">
                                    <div
                                        className="h-full bg-orange-600"
                                        style={{
                                            width: heroPaused || reducedMotion ? '100%' : undefined,
                                            animation: heroPaused || reducedMotion ? 'none' : 'hero-progress 6s linear',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </section>

                {/* ================= 2b. INFO BAR (tanpa marquee animasi) ================= */}
                <div className="border-y border-zinc-900 bg-zinc-950 py-3 text-zinc-100" aria-label="Informasi layanan">
                    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-[11px] font-semibold uppercase tracking-widest sm:px-6 lg:px-8">
                        {marqueeItems.map((item, i) => (
                            <span key={i} className="flex items-center gap-2 whitespace-nowrap">
                                <IconSun className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ================= 3. QUICK BOOKING ================= */}
                <section id="quick-booking" className="relative z-20 -mt-6 scroll-mt-24 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-5xl">
                        <div className="border-2 border-zinc-900 bg-zinc-50 p-5 shadow-sm sm:p-7">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl leading-none text-orange-600">&sect;</p>
                                    <h2 className="text-2xl font-bold uppercase tracking-wide text-zinc-950 sm:text-3xl">Pesan Cepat</h2>
                                </div>
                                <p className="hidden text-sm italic text-zinc-500 sm:block">pilih park, tanggal &amp; jumlah kunjungan</p>
                            </div>

                            <form onSubmit={handleQuickSearch} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label htmlFor="qb-park" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                                        Destinasi
                                    </label>
                                    <select id="qb-park" value={selectedParkId} onChange={(e) => setSelectedParkId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                                        {parks.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="qb-date" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                                        Tanggal Kunjungan
                                    </label>
                                    <input
                                        id="qb-date"
                                        type="date"
                                        min={today}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        required
                                        className={`${inputCls} cursor-pointer`}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="qb-qty" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                                        Jumlah (Orang)
                                    </label>
                                    <div className="flex items-center border-b-2 border-zinc-300 focus-within:border-orange-600">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity((q) => Math.max(1, Number(q) - 1))}
                                            aria-label="Kurangi jumlah tiket"
                                            className="flex h-11 w-11 items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer"
                                        >
                                            <IconMinus className="h-4 w-4" />
                                        </button>
                                        <input
                                            id="qb-qty"
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                                            required
                                            className="w-full min-w-0 border-0 bg-transparent py-1.5 text-center text-sm font-bold text-zinc-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setQuantity((q) => Math.min(20, Number(q) + 1))}
                                            aria-label="Tambah jumlah tiket"
                                            className="flex h-11 w-11 items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer"
                                        >
                                            <IconPlus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-4 text-xs font-bold uppercase tracking-widest text-zinc-50 hover:bg-transparent hover:text-zinc-900 cursor-pointer"
                                    >
                                        <IconSearch className="h-4 w-4" />
                                        Cari Tiket
                                        <IconArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                {/* ================= 4. DESTINASI ================= */}
                <section id="parks" className="scroll-mt-20 py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-sm uppercase tracking-widest text-orange-600">&sect; 01 — Pilihan Kawasan</p>
                                <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight text-zinc-950 sm:text-5xl">
                                    Jelajahi Galeri
                                </h2>
                                <p className="mt-3 max-w-lg text-sm text-zinc-500">
                                    Tentukan destinasi favorit Anda — pameran cahaya, seni rupa, atau wahana tematik — dan dapatkan tiket terverifikasi turnstile.
                                </p>
                            </div>
                            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                <IconMapPin className="h-4 w-4 text-orange-600" />
                                {parks.length} Destinasi Aktif
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                            {parks.map((park, idx) => {
                                const status = parkStatus(park);
                                return (
                                    <article key={park.id} className="group border border-zinc-200 bg-white p-0">
                                        <Link href={`/parks/${park.id}`} className="block">
                                            {/* Baris indeks + status */}
                                            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                                                <p className="text-sm font-bold tracking-widest text-zinc-400">
                                                    № {String(idx + 1).padStart(2, '0')}
                                                </p>
                                                <span
                                                    className={`flex min-h-[28px] items-center gap-1.5 px-2.5 text-[11px] font-bold uppercase tracking-widest ${
                                                        status.isOpen ? 'border border-emerald-300 bg-emerald-50 text-emerald-700' : 'border border-zinc-300 bg-zinc-100 text-zinc-500'
                                                    }`}
                                                >
                                                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Gambar */}
                                            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-200">
                                                <img
                                                    src={park.image_url}
                                                    alt={`Suasana ${park.name}`}
                                                    width="1200"
                                                    height="900"
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />
                                                <span className="absolute left-4 top-4 border border-zinc-900 bg-zinc-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-900">
                                                    {park.category}
                                                </span>
                                            </div>

                                            {/* Nama */}
                                            <div className="px-4 pt-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="text-xl font-bold uppercase tracking-tight text-zinc-950 group-hover:text-orange-600 sm:text-2xl">
                                                            {park.name}
                                                        </h3>
                                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                                                            <IconMapPin className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                                                            <span className="truncate font-medium">{park.location_address}</span>
                                                        </p>
                                                    </div>
                                                    <span
                                                        aria-hidden="true"
                                                        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-900 group-hover:bg-zinc-900 group-hover:text-zinc-50"
                                                    >
                                                        <IconArrowUpRight className="h-5 w-5" />
                                                    </span>
                                                </div>

                                                <p className="mt-3 text-sm leading-relaxed text-zinc-500 line-clamp-2">{park.description}</p>

                                                {/* Info zona & atraksi */}
                                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
                                                    <span className="inline-flex items-center gap-1.5 border border-zinc-200 px-2.5 py-1 font-semibold">
                                                        <IconFerris className="h-3.5 w-3.5 text-orange-600" />
                                                        {park.total_zones} Zona · {(park.zones_preview || []).join(' · ')}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 border border-zinc-200 px-2.5 py-1 font-semibold">
                                                        <IconZap className="h-3.5 w-3.5 text-orange-600" />
                                                        {park.total_attractions} Atraksi
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Footer harga */}
                                        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 px-4 py-4">
                                            <div>
                                                <span className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Mulai dari</span>
                                                <p className="text-xl font-bold text-zinc-950">{rupiah(park.min_price || 75000)}</p>
                                            </div>
                                            <Link
                                                href={`/tickets?park_id=${park.id}`}
                                                className="inline-flex min-h-[44px] items-center gap-2 border-b-2 border-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-900 hover:border-orange-600 hover:text-orange-600 cursor-pointer"
                                            >
                                                Beli Tiket
                                                <IconArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ================= 5. KUPON ================= */}
                {promotions.length > 0 && (
                    <section id="promo" className="scroll-mt-20 border-y border-zinc-200 bg-white py-16 sm:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-widest text-orange-600">&sect; 02 — Penawaran Terbatas</p>
                                    <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight text-zinc-950 sm:text-4xl">Kupon Diskon</h2>
                                    <p className="mt-3 max-w-lg text-sm text-zinc-500">
                                        Salin kode di halaman pemesanan untuk potongan instan — kuota terbatas sesuai masa berlaku.
                                    </p>
                                </div>
                                <p className="text-base italic text-zinc-400">salin sebelum kehabisan…</p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                {promotions.map((promo) => (
                                    <div key={promo.id} className="flex h-full items-stretch border border-zinc-200 bg-zinc-50 hover:border-zinc-900">
                                        <div className="flex-1 p-5">
                                            <span className="inline-block border border-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                                                {promo.discount_type === 'PERCENTAGE' ? `Diskon ${promo.discount_value}%` : `Potongan Rp ${promo.discount_value.toLocaleString()}`}
                                            </span>
                                            <h3 className="mt-3 font-mono text-2xl font-black tracking-wider text-zinc-950">
                                                {promo.code}
                                            </h3>
                                            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                                                Min. transaksi Rp {fmtID.format(promo.min_order_amount || 0)}.
                                            </p>
                                            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                                                <IconClock className="h-3.5 w-3.5 text-orange-600" />
                                                Masa berlaku aktif
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-center border-l border-dashed border-zinc-300 p-4">
                                            <button
                                                type="button"
                                                onClick={() => copyCode(promo.code)}
                                                aria-label={`Salin kode promo ${promo.code}`}
                                                className={`inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 border px-3 text-[11px] font-bold uppercase tracking-widest cursor-pointer ${
                                                    copiedCode === promo.code
                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                                        : 'border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-zinc-50'
                                                }`}
                                            >
                                                {copiedCode === promo.code ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                                                <span className="max-sm:hidden">{copiedCode === promo.code ? 'Tersalin' : 'Salin'}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ================= 6. KEUNGGULAN ================= */}
                <section id="keunggulan" className="scroll-mt-20 py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-10 max-w-2xl">
                            <p className="text-sm uppercase tracking-widest text-orange-600">&sect; 03 — Kenapa Vurasi</p>
                            <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight text-zinc-950 sm:text-4xl">Cara memesan yang lebih baik</h2>
                            <p className="mt-3 text-base italic text-zinc-500">cepat, aman, dan tanpa antrean</p>
                        </div>

                        <div className="border-t border-zinc-200">
                            {[
                                {
                                    num: '01',
                                    title: 'MultiPark Terpadu',
                                    desc: 'Satu akun dan portal untuk berbagai theme park & pameran seni.',
                                    icon: <IconFerris className="h-5 w-5" />,
                                },
                                {
                                    num: '02',
                                    title: 'E-Tiket QR Instan',
                                    desc: 'Tiket digital terbit instan siap di-scan turnstile gerbang tanpa cetak fisik.',
                                    icon: <IconZap className="h-5 w-5" />,
                                },
                                {
                                    num: '03',
                                    title: 'Garansi Kuota Masuk',
                                    desc: 'Sistem terhubung langsung ke kuota harian resmi gerbang turnstile.',
                                    icon: <IconShield className="h-5 w-5" />,
                                },
                                {
                                    num: '04',
                                    title: 'Pembayaran Mudah',
                                    desc: 'Mendukung QRIS instan, Virtual Account BCA, Mandiri, dan kartu lainnya.',
                                    icon: <IconCard className="h-5 w-5" />,
                                },
                            ].map((item) => (
                                <div
                                    key={item.num}
                                    className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 border-b border-zinc-200 px-2 py-5 sm:grid-cols-[80px_1fr_1.5fr] sm:items-center sm:px-4 sm:py-6"
                                >
                                    <span className="text-2xl font-bold text-zinc-300 sm:text-3xl">
                                        {item.num}
                                    </span>
                                    <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 sm:text-lg">
                                        <span className="text-orange-600">{item.icon}</span>
                                        {item.title}
                                    </h3>
                                    <p className="col-span-2 text-sm leading-relaxed text-zinc-500 sm:col-span-1">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 7. FAQ ================= */}
                <section id="faq" className="scroll-mt-20 border-t border-zinc-200 bg-white py-16 sm:py-20">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-10">
                            <p className="text-sm uppercase tracking-widest text-orange-600">&sect; 04 — Bantuan</p>
                            <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight text-zinc-950 sm:text-4xl">Pertanyaan Umum</h2>
                            <p className="mt-3 text-sm text-zinc-500">Hal yang sering ditanyakan seputar pemesanan tiket multi-park.</p>
                        </div>

                        <div>
                            {[
                                {
                                    q: 'Apakah satu tiket berlaku untuk semua park?',
                                    a: 'Tidak. Setiap tiket diterbitkan spesifik untuk Theme Park atau Galeri yang Anda pilih saat pemesanan.',
                                },
                                {
                                    q: 'Bagaimana cara mengecek e-tiket jika membeli tanpa login (Guest Checkout)?',
                                    a: 'Cukup klik tombol "Cek Pesanan" di bagian atas halaman, lalu masukkan Kode Pesanan dan Email yang Anda daftarkan.',
                                },
                                {
                                    q: 'Apakah tiket harus dicetak dalam bentuk kertas?',
                                    a: 'Tidak perlu. Cukup tunjukkan E-Tiket berformat Barcode / QR Code langsung dari layar smartphone kepada petugas gerbang turnstile.',
                                },
                                {
                                    q: 'Apakah saya bisa mengajukan refund?',
                                    a: 'Pengembalian dana (refund) dapat diajukan maksimal H-1 sebelum tanggal kedatangan tiket melalui layanan customer care.',
                                },
                            ].map((faq, idx) => (
                                <FaqItem key={idx} faq={faq} defaultOpen={idx === 0} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= FOOTER ================= */}
                <footer className="bg-zinc-950 text-zinc-400">
                    <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
                        <p aria-hidden="true" className="select-none text-5xl font-bold leading-none text-white/5 sm:text-7xl">
                            VURASI*
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-4">
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold tracking-wide text-white">Vurasi</span>
                                    <span className="text-sm italic leading-none text-orange-500">paviliun seni</span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                                    Platform resmi pemesanan tiket multi-park, theme park &amp; galeri pameran seni interaktif Indonesia.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-white">Destinasi</h4>
                                <ul className="mt-3 space-y-2 text-xs">
                                    {parks.map((p) => (
                                        <li key={p.id}>
                                            <Link href={`/tickets?park_id=${p.id}`} className="hover:text-white cursor-pointer">
                                                {p.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-white">Bantuan &amp; Akses</h4>
                                <ul className="mt-3 space-y-2 text-xs">
                                    <li>
                                        <button type="button" onClick={() => setLookupModalOpen(true)} className="hover:text-white cursor-pointer">
                                            Cek E-Tiket Saya
                                        </button>
                                    </li>
                                    <li>
                                        <a href="#faq" className="hover:text-white">
                                            Kebijakan Refund
                                        </a>
                                    </li>
                                    <li>
                                        <Link href="/scanner" className="hover:text-white">
                                            Gate Scanner Petugas
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/admin" className="hover:text-white">
                                            Admin Portal
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-white">Keamanan</h4>
                                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                                    Token QR unik anti-duplikasi, pembayaran QRIS nasional, dan kuota gerbang terverifikasi real-time.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-widest text-zinc-600">
                            <span>&copy; {new Date().getFullYear()} Vurasi MultiPark Ticketing System</span>
                            <span className="normal-case italic">"ruang terbuka untuk seni yang bercahaya"</span>
                        </div>
                    </div>
                </footer>
            </main>

            {/* ================= TOMBOL KEMBALI KE ATAS ================= */}
            {scrolled && (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
                    aria-label="Kembali ke bagian atas"
                    className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center border border-zinc-900 bg-zinc-900 text-white hover:bg-transparent hover:text-zinc-900 cursor-pointer"
                >
                    <IconArrowUp className="h-5 w-5" />
                </button>
            )}

            {/* Modal Cek Pesanan Guest */}
            <OrderLookupModal open={lookupModalOpen} onClose={() => setLookupModalOpen(false)} />
        </div>
    );
}

/* =========================================================================
   FAQ ITEM — accordion sederhana
========================================================================= */
function FaqItem({ faq, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-zinc-200 last:border-b">
            <h3>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left hover:text-orange-600 cursor-pointer"
                >
                    <span className="text-base font-bold text-zinc-900 sm:text-lg">{faq.q}</span>
                    <span
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-900 ${
                            open ? 'bg-zinc-900 text-zinc-50' : 'bg-zinc-50 text-zinc-900'
                        }`}
                    >
                        {open ? <IconX className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
                    </span>
                </button>
            </h3>
            {open && (
                <div>
                    <p className="mb-5 max-w-2xl pr-10 text-sm leading-relaxed text-zinc-600">{faq.a}</p>
                </div>
            )}
        </div>
    );
}
