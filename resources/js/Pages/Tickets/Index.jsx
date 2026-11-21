import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
    MapPin, Clock, Search, X, ChevronRight, ChevronLeft,
    Sparkles, CheckCircle2, ShieldCheck, Plus, ArrowUp,
    Compass, ArrowUpDown,
} from 'lucide-react';
import SiteNavbar, { NAV_SECTIONS } from '@/Components/SiteNavbar';
import MyTicketsModal from '@/Components/MyTicketsModal';

/* Easing konsisten dengan landing page Vurasi */
const EASE = [0.22, 1, 0.36, 1];

/* =========================================================================
   DEKORASI SVG (Karakter visual Vurasi persis Landing Page)
========================================================================= */
function TicketDeco({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
            <path
                fill="#AC4A2E"
                d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
            />
            <path d="M13 5v2M13 11v2M13 17v2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" />
        </svg>
    );
}

function Sparkle({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
            <path d="M12 2c.8 5 4.2 8.4 9.2 9.2-5 .8-8.4 4.2-9.2 9.2-.8-5-4.2-8.4-9.2-9.2 5-.8 8.4-4.2 9.2-9.2Z" />
        </svg>
    );
}

function SectionDivider({ label = 'Vurasi' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-hidden="true"
            className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-8 sm:gap-4 sm:px-5 sm:py-10 lg:px-6"
        >
            <span className="h-px flex-1 border-t-2 border-dashed border-zinc-300" />
            <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-zinc-900 bg-zinc-50 text-base leading-none text-orange-600"
            >
                &#10035;
            </motion.span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-400 sm:block">
                {label}
            </span>
            <span className="h-px flex-1 border-t-2 border-dashed border-zinc-300" />
        </motion.div>
    );
}

function FaqItem({ faq, idx, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE }}
            className="border-t border-zinc-900/15 last:border-b"
        >
            <h3>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left cursor-pointer"
                >
                    <span className="flex items-baseline gap-4">
                        <span aria-hidden="true" className="font-anton text-sm tracking-widest text-orange-600">
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                            className={`text-base font-bold transition-colors duration-300 sm:text-lg ${
                                open ? 'text-orange-600' : 'text-zinc-950 group-hover:text-orange-600'
                            }`}
                        >
                            {faq.q}
                        </span>
                    </span>
                    <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center border transition-colors duration-300 ${
                            open ? 'border-orange-500 bg-orange-600 text-white' : 'border-zinc-900/20 bg-white text-zinc-700 group-hover:border-orange-500/50'
                        }`}
                    >
                        <Plus className="h-4 w-4" />
                    </motion.span>
                </button>
            </h3>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="jawaban"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                    >
                        <p className="mb-5 max-w-2xl pb-1 pl-10 pr-10 text-sm leading-relaxed text-zinc-600">{faq.a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* Navigasi bersama - Daftar Park aktif saat di halaman tiket */
const NAV_LINKS = NAV_SECTIONS.map((s) => ({
    label: s.label,
    href: s.href ?? `/#${s.id}`,
    active: s.href === '/tickets',
}));

const ITEMS_PER_PAGE = 12;

export default function TicketCatalogIndex({
    parks = [],
    categories = [],
}) {
    const [lookupModalOpen, setLookupModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [sortBy, setSortBy] = useState('name_asc'); // name_asc | name_desc | price_asc | price_desc
    const [currentPage, setCurrentPage] = useState(1);

    const catalogRef = useRef(null);

    // Format Rupiah
    const rupiah = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(n || 0)}`;

    // Gabungkan list kategori unik dengan kategori default utama
    const allCategories = useMemo(() => {
        const unique = new Set(categories);
        unique.add('Theme Park & Wahana');
        unique.add('Art & Light Exhibition');
        return Array.from(unique);
    }, [categories]);

    // Hitung jumlah destinasi per kategori untuk ditampilkan di pill filter
    const categoryCounts = useMemo(() => {
        const counts = { ALL: parks.length };
        parks.forEach((p) => {
            if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
        });
        return counts;
    }, [parks]);

    // Filter & Sort list destinasi (dirancang untuk performa tinggi hingga 100+ destinasi)
    const filteredAndSortedParks = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        // 1. Filter Search & Kategori
        const result = parks.filter((p) => {
            const matchesCategory =
                selectedCategory === 'ALL' ||
                (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

            if (!matchesCategory) return false;

            if (!q) return true;

            const nameMatch = p.name?.toLowerCase().includes(q);
            const addressMatch = p.location_address?.toLowerCase().includes(q);
            const cityMatch = p.city?.toLowerCase().includes(q);
            const catMatch = p.category?.toLowerCase().includes(q);

            return nameMatch || addressMatch || cityMatch || catMatch;
        });

        // 2. Sorting (Utamakan yang tiketnya sudah tersedia di posisi paling atas)
        result.sort((a, b) => {
            const aHasTicket = !!a.min_price && a.min_price > 0;
            const bHasTicket = !!b.min_price && b.min_price > 0;

            // Park dengan tiket tersedia selalu di atas
            if (aHasTicket && !bHasTicket) return -1;
            if (!aHasTicket && bHasTicket) return 1;

            if (sortBy === 'name_asc') {
                return (a.name || '').localeCompare(b.name || '');
            }
            if (sortBy === 'name_desc') {
                return (b.name || '').localeCompare(a.name || '');
            }
            if (sortBy === 'price_asc') {
                return (a.min_price || 0) - (b.min_price || 0);
            }
            if (sortBy === 'price_desc') {
                return (b.min_price || 0) - (a.min_price || 0);
            }
            return 0;
        });

        return result;
    }, [parks, searchQuery, selectedCategory, sortBy]);

    // Reset ke halaman 1 setiap kali filter atau pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, sortBy]);

    // Pagination calculations (Menangani 100+ destinasi secara ringan & mulus)
    const totalItems = filteredAndSortedParks.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedParks = useMemo(() => {
        return filteredAndSortedParks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedParks, startIndex]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        if (catalogRef.current) {
            catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Tombol kembali ke atas
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 300);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Generate smart page numbers: e.g. [1, 2, 3, '...', 10]
    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (currentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }, [totalPages, currentPage]);

    return (
        <>
            <Head title="Katalog Destinasi & Tiket Wahana | Vurasi" />

            <MotionConfig reducedMotion="user">
                <div className="vurasi min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-orange-500 selection:text-white pb-24">
                    {/* Navbar bersama — terhubung dengan Landing Page */}
                    <SiteNavbar links={NAV_LINKS} onCekPesanan={() => setLookupModalOpen(true)} />

                    {/* =========================================================
                        HERO BANNER KATALOG (Gaya Landing Page Vurasi)
                    ========================================================= */}
                    <section className="relative overflow-hidden bg-white pb-12 pt-28 sm:pb-16 sm:pt-32">
                        {/* Latar terang ala hero landing: dot pattern + blob biru/oranye */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="dots-bg-light absolute inset-0 opacity-60" />
                            <div className="absolute -right-28 -top-28 h-[30rem] w-[30rem] rounded-full bg-[#62C6EA]/20 blur-3xl" />
                            <div className="absolute -left-36 bottom-0 h-[24rem] w-[24rem] rounded-full bg-orange-300/20 blur-3xl" />
                        </div>

                        {/* Dekorasi floating tiket & kilau */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
                                className="absolute left-[5%] top-[25%]"
                            >
                                <TicketDeco className="h-10 w-10 -rotate-[22deg] sm:h-12 sm:w-12 opacity-80" />
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 0.8 }}
                                className="absolute right-[8%] top-[28%]"
                            >
                                <TicketDeco className="h-12 w-12 rotate-[18deg] sm:h-14 sm:w-14 opacity-80" />
                            </motion.div>
                            <motion.span
                                animate={{ scale: [0.7, 1, 0.7], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
                                className="absolute left-[18%] top-[18%] text-orange-500"
                            >
                                <Sparkle className="h-6 w-6" />
                            </motion.span>
                            <motion.span
                                animate={{ scale: [1, 0.7, 1], opacity: [0.9, 0.4, 0.9] }}
                                transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
                                className="absolute right-[20%] top-[20%] text-[#62C6EA]"
                            >
                                <Sparkle className="h-7 w-7" />
                            </motion.span>
                        </div>

                        <div className="relative z-10 mx-auto max-w-[1200px] px-3 text-center sm:px-5">
                            {/* Pill Header */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, ease: EASE }}
                                className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0_#18181b]"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                                Katalog Resmi Wahana &amp; Pameran Seni ({parks.length} Tempat)
                            </motion.div>

                            {/* Headline Anton Besar */}
                            <motion.h1
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                                className="mt-4 font-anton text-4xl uppercase leading-[0.95] tracking-[0.02em] text-zinc-950 sm:text-6xl lg:text-7xl"
                            >
                                Semua Destinasi &amp; <span className="stroke-word">Tiket Wahana</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                                className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base"
                            >
                                Temukan theme park, wahana bermain, dan galeri pameran seni interaktif di jaringan resmi Vurasi. Pesan tiket langsung dan nikmati akses masuk gerbang tanpa antre.
                            </motion.p>

                            {/* Trust Badges */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                                className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-wider text-zinc-800 sm:gap-5"
                            >
                                <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-white px-4 py-2 shadow-[3px_3px_0_#18181b]">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    E-Tiket QR Terbit Instan
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-white px-4 py-2 shadow-[3px_3px_0_#18181b]">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Garansi Bebas Reschedule
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-white px-4 py-2 shadow-[3px_3px_0_#18181b]">
                                    <ShieldCheck className="h-4 w-4 text-orange-600" />
                                    100% Kuota Gerbang Resmi
                                </span>
                            </motion.div>
                        </div>
                    </section>

                    {/* =========================================================
                        PANEL FILTER & PENCARIAN (Dirancang untuk 100+ Destinasi)
                    ========================================================= */}
                    <div ref={catalogRef} className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6 -mt-4 relative z-20">
                        <div className="rounded-3xl border-2 border-zinc-900 bg-white p-4 sm:p-6 shadow-[6px_6px_0_#18181b] space-y-5">
                            {/* Baris Atas: Input Search & Dropdown Sorting */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search Input */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama destinasi, wahana, kota, atau alamat..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-2xl border-2 border-zinc-900/15 bg-zinc-50 py-3 pl-11 pr-10 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-orange-500 focus:bg-white"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            aria-label="Hapus pencarian"
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown Sorting */}
                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-56">
                                        <ArrowUpDown className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            aria-label="Urutkan destinasi"
                                            className="w-full appearance-none rounded-2xl border-2 border-zinc-900/15 bg-zinc-50 py-3 pl-10 pr-8 text-xs font-bold text-zinc-700 outline-none transition focus:border-orange-500 focus:bg-white cursor-pointer"
                                        >
                                            <option value="name_asc">Nama (A &rarr; Z)</option>
                                            <option value="name_desc">Nama (Z &rarr; A)</option>
                                            <option value="price_asc">Harga Terendah</option>
                                            <option value="price_desc">Harga Tertinggi</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Baris Kategori: Pills Kategori Responsif */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('ALL')}
                                    className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                        selectedCategory === 'ALL'
                                            ? 'border-zinc-900 bg-orange-600 text-white shadow-[2px_2px_0_#18181b]'
                                            : 'border-zinc-900/10 bg-white text-zinc-700 hover:border-zinc-900/30 hover:bg-zinc-50'
                                    }`}
                                >
                                    Semua ({parks.length})
                                </button>
                                {allCategories.map((cat) => {
                                    const count = categoryCounts[cat] || 0;
                                    const isSelected = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                                isSelected
                                                    ? 'border-zinc-900 bg-orange-600 text-white shadow-[2px_2px_0_#18181b]'
                                                    : 'border-zinc-900/10 bg-white text-zinc-700 hover:border-zinc-900/30 hover:bg-zinc-50'
                                            }`}
                                        >
                                            {cat} {count > 0 && `(${count})`}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Indikator Hasil Pencarian & Halaman */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                                <div>
                                    Menampilkan <strong className="text-zinc-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</strong> dari <strong className="text-zinc-900 font-bold">{totalItems}</strong> destinasi
                                    {(searchQuery || selectedCategory !== 'ALL') && (
                                        <span className="ml-1.5 text-zinc-400">
                                            (difilter dari {parks.length} total)
                                        </span>
                                    )}
                                </div>

                                {(searchQuery || selectedCategory !== 'ALL') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('ALL');
                                        }}
                                        className="text-orange-600 hover:underline font-bold text-xs cursor-pointer"
                                    >
                                        Reset Semua Filter
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* =========================================================
                        GRID KARTU PARK (SIMPLE, ELEGAN, CEPAT DIBACA)
                    ========================================================= */}
                    <main className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6 mt-8">
                        {paginatedParks.length === 0 ? (
                            <div className="rounded-3xl border-2 border-dashed border-zinc-900/20 bg-white p-12 text-center my-6 shadow-[4px_4px_0_#18181b]">
                                <div className="h-16 w-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4 border-2 border-zinc-900 shadow-[3px_3px_0_#18181b]">
                                    <Compass className="h-8 w-8" />
                                </div>
                                <h3 className="font-anton text-2xl uppercase tracking-wide text-zinc-900">
                                    Destinasi Tidak Ditemukan
                                </h3>
                                <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                                    Tidak ada destinasi yang cocok dengan kata kunci "{searchQuery}" pada kategori yang dipilih.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('ALL');
                                    }}
                                    className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[3px_3px_0_#18181b] hover:bg-orange-500 transition cursor-pointer"
                                >
                                    Tampilkan Semua Destinasi
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedParks.map((p) => {
                                    const hasTickets = !!p.min_price && p.min_price > 0;

                                    return (
                                        <Link
                                            key={p.id}
                                            href={`/parks/${p.slug || p.id}`}
                                            className={`group relative rounded-2xl border-2 border-zinc-900 bg-white overflow-hidden shadow-[4px_4px_0_#18181b] hover:-translate-y-1 hover:shadow-[7px_7px_0_#18181b] transition-all duration-300 flex flex-col cursor-pointer ${
                                                hasTickets
                                                    ? 'hover:border-orange-600'
                                                    : 'hover:border-zinc-500'
                                            }`}
                                        >
                                            {/* Thumbnail Gambar Park */}
                                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                                                <img
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    loading="lazy"
                                                    className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                                                        !hasTickets ? 'grayscale-[35%] brightness-[0.92]' : ''
                                                    }`}
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=800&q=80';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent opacity-60" />

                                                {/* Chip Kategori di pojok atas kiri */}
                                                <div className="absolute left-3 top-3">
                                                    <span className="rounded-full border-2 border-zinc-900 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 shadow-[2px_2px_0_#18181b]">
                                                        {p.category}
                                                    </span>
                                                </div>

                                                {/* Status Badge di pojok kanan atas */}
                                                <div className="absolute right-3 top-3">
                                                    {hasTickets ? (
                                                        p.open_time && (
                                                            <span className="rounded-full border border-white/40 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                                Buka
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="rounded-full border-2 border-zinc-900 bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-950 shadow-[2px_2px_0_#18181b]">
                                                            Segera Hadir
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Badan Kartu */}
                                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className={`font-anton text-xl uppercase tracking-wide line-clamp-1 transition-colors ${
                                                            hasTickets
                                                                ? 'text-zinc-950 group-hover:text-orange-600'
                                                                : 'text-zinc-800 group-hover:text-zinc-950'
                                                        }`}>
                                                            {p.name}
                                                        </h3>
                                                    </div>

                                                    {/* Lokasi */}
                                                    <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1.5 line-clamp-1">
                                                        <MapPin className={`h-3.5 w-3.5 shrink-0 ${hasTickets ? 'text-orange-600' : 'text-zinc-400'}`} />
                                                        {p.city ? `${p.city} • ` : ''}{p.location_address || 'Indonesia'}
                                                    </p>

                                                    {/* Jam Operasional */}
                                                    {p.open_time && (
                                                        <p className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
                                                            <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                                                            {p.open_time.substring(0, 5)} - {p.close_time?.substring(0, 5) || '18:00'} WIB
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Bar Bawah (Harga Mulai Dari + Tombol Aksi) */}
                                                <div className="border-t-2 border-dashed border-zinc-900/15 pt-3 flex items-center justify-between">
                                                    <div>
                                                        {hasTickets ? (
                                                            <>
                                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                                    Mulai dari
                                                                </span>
                                                                <span className="font-anton text-lg text-orange-600 leading-tight">
                                                                    {rupiah(p.min_price)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                                                    Jadwal Belum Rilis
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-zinc-400">
                                                                    Tiket segera dibuka
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {hasTickets ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border-2 border-zinc-900 bg-orange-600 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-[2px_2px_0_#18181b] group-hover:bg-orange-500 transition">
                                                            <span>Pesan</span>
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border-2 border-zinc-900/15 bg-zinc-100 text-zinc-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider group-hover:bg-zinc-200 transition">
                                                            <span>Lihat Info</span>
                                                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* =====================================================
                            PAGINATION (Penting untuk Penanganan 100+ Destinasi)
                        ===================================================== */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200/90 pt-6">
                                <span className="text-xs text-zinc-500">
                                    Halaman <strong className="text-zinc-900 font-bold">{currentPage}</strong> dari <strong className="text-zinc-900 font-bold">{totalPages}</strong> ({totalItems} destinasi)
                                </span>

                                <div className="flex items-center gap-1.5">
                                    {/* Tombol Sebelumnya */}
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        aria-label="Halaman sebelumnya"
                                        className="flex h-9 items-center gap-1 rounded-full border-2 border-zinc-900/20 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline">Sebelumnya</span>
                                    </button>

                                    {/* Nomor Halaman */}
                                    {pageNumbers.map((num, i) => {
                                        if (num === '...') {
                                            return (
                                                <span key={`dots-${i}`} className="px-2 text-xs text-zinc-400 font-bold">
                                                    ...
                                                </span>
                                            );
                                        }

                                        const isActive = currentPage === num;
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => handlePageChange(num)}
                                                className={`h-9 w-9 rounded-full text-xs font-bold transition cursor-pointer ${
                                                    isActive
                                                        ? 'border-2 border-zinc-900 bg-orange-600 text-white shadow-[2px_2px_0_#18181b]'
                                                        : 'border-2 border-zinc-900/20 bg-white text-zinc-700 hover:border-zinc-900 hover:bg-zinc-50'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}

                                    {/* Tombol Berikutnya */}
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        aria-label="Halaman berikutnya"
                                        className="flex h-9 items-center gap-1 rounded-full border-2 border-zinc-900/20 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    >
                                        <span className="hidden sm:inline">Berikutnya</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Pembatas bergaya Vurasi Landing */}
                    <div className="mt-16">
                        <SectionDivider label="Bantuan & FAQ" />
                    </div>

                    {/* =========================================================
                        SECTION FAQ / PERTANYAAN UMUM
                    ========================================================= */}
                    <section className="bg-[#f5efda] py-16 text-zinc-950 sm:py-24">
                        <div className="mx-auto max-w-4xl px-3 sm:px-5 lg:px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 28 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.4 }}
                                transition={{ duration: 0.55, ease: EASE }}
                                className="mb-10"
                            >
                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
                                    &sect; Panduan &amp; Bantuan
                                </p>
                                <h2 className="mt-2 font-anton text-4xl uppercase tracking-[0.02em] sm:text-5xl">
                                    Pertanyaan <span className="stroke-word">Umum</span>
                                </h2>
                                <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-600">
                                    Hal penting seputar proses pemesanan tiket di jaringan Vurasi.
                                </p>
                            </motion.div>

                            <div>
                                {[
                                    {
                                        q: 'Bagaimana cara memesan tiket wahana atau pameran seni?',
                                        a: 'Pilih salah satu destinasi di atas, lalu Anda akan diarahkan ke halaman detail tempat tersebut untuk memilih tanggal kunjungan, kategori tiket, dan menyelesaikan pembayaran secara aman.',
                                    },
                                    {
                                        q: 'Apakah saya bisa mengubah tanggal kunjungan (reschedule)?',
                                        a: 'Ya, reschedule dapat dilakukan secara gratis melalui menu "Cek Pesanan" di pojok atas, selama kuota tanggal tujuan baru masih tersedia.',
                                    },
                                    {
                                        q: 'Bagaimana cara menggunakan E-Tiket di gerbang masuk?',
                                        a: 'Cukup tunjukkan Barcode / QR Code E-Tiket dari layar smartphone kepada petugas turnstile. Anda tidak perlu mencetak tiket fisik.',
                                    },
                                    {
                                        q: 'Apakah bisa memesan tiket tanpa memiliki akun?',
                                        a: 'Bisa. Pengguna dapat memesan sebagai tamu (Guest). E-Tiket otomatis dikirimkan ke email Anda dan dapat dilihat kapan saja lewat tombol Cek Pesanan.',
                                    },
                                ].map((faq, idx) => (
                                    <FaqItem key={idx} faq={faq} idx={idx} defaultOpen={idx === 0} />
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* =========================================================
                        FOOTER VURASI (Identik dengan Landing Page)
                    ========================================================= */}
                    <footer className="bg-zinc-950 text-zinc-400">
                        <div className="mx-auto max-w-[1440px] px-3 pb-10 pt-14 sm:px-5 lg:px-6">
                            <img
                                src="/images/vurasi-logo.png"
                                alt=""
                                aria-hidden="true"
                                width="1180"
                                height="490"
                                className="h-14 w-auto select-none opacity-20 sm:h-20"
                            />

                            <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-4">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">Tentang Kami</h4>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src="/images/vurasi-logo.png"
                                            alt="Vurasi"
                                            width="1180"
                                            height="490"
                                            className="h-7 w-auto"
                                        />
                                        <span className="text-sm italic leading-none text-orange-500">paviliun seni</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-500">
                                        Platform resmi pemesanan tiket multi-park, theme park &amp; galeri pameran seni interaktif Indonesia.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-white font-bold">Destinasi Terpopuler</h4>
                                    <ul className="mt-3 space-y-2 text-xs">
                                        {parks.slice(0, 5).map((p) => (
                                            <li key={p.id}>
                                                <Link
                                                    href={`/parks/${p.slug || p.id}`}
                                                    className="hover:text-white transition"
                                                >
                                                    {p.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-white font-bold">Akses &amp; Layanan</h4>
                                    <ul className="mt-3 space-y-2 text-xs">
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => setLookupModalOpen(true)}
                                                className="hover:text-white cursor-pointer transition"
                                            >
                                                Cek E-Tiket Saya
                                            </button>
                                        </li>
                                        <li>
                                            <Link href="/#faq" className="hover:text-white transition">
                                                Kebijakan &amp; Refund
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/scanner" className="hover:text-white transition">
                                                Gate Scanner Petugas
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/login" className="hover:text-white font-semibold text-orange-400 transition">
                                                Login Akun / Pengelola
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-white font-bold">Keamanan Transaksi</h4>
                                    <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                                        Token QR unik terenkripsi anti-duplikasi, pembayaran gateway resmi Midtrans, dan kuota gerbang terverifikasi real-time.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-widest text-zinc-600">
                                <span>&copy; {new Date().getFullYear()} Vurasi MultiPark Ticketing System</span>
                                <span className="normal-case italic">"ruang terbuka untuk seni yang bercahaya"</span>
                            </div>
                        </div>
                    </footer>

                    {/* Tombol Kembali ke Atas */}
                    {scrolled && (
                        <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            aria-label="Kembali ke atas"
                            className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-900 text-white shadow-[3px_3px_0_#EA580C] hover:bg-orange-600 transition cursor-pointer"
                        >
                            <ArrowUp className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </MotionConfig>

            {/* Modal Cek Pesanan (Tiket Saya) */}
            <MyTicketsModal open={lookupModalOpen} onClose={() => setLookupModalOpen(false)} />
        </>
    );
}
