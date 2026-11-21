/**
 * VURASI — DETAIL DESTINASI (versi ringkas & fokus)
 *
 * Hirarki informasi: hero pendek → jam operasional → DAFTAR TIKET.
 * Seluruh dekorasi & motion mendukung dua hal itu, bukan mengalahkannya.
 *
 * LOGIKA BISNIS TIDAK BERUBAH:
 * - Ganti tanggal → GET /parks/{id}?date=... (preserveState)
 * - Promo → POST /api/tickets/check-promo
 * - Checkout → GET /tickets/checkout?items=...&date=...&promo=...
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    motion, AnimatePresence, MotionConfig, animate,
    useMotionValue, useSpring, useTransform, useScroll,
} from 'framer-motion';
import {
    MapPin, Clock, Users, ArrowRight, Ticket, ShieldCheck,
    CheckCircle2, Tag, Calendar, Plus, Minus, AlertCircle,
    Loader2, ExternalLink, Copy, Check, Gift, Sparkles,
} from 'lucide-react';
import SiteNavbar, { NAV_SECTIONS } from '@/Components/SiteNavbar';
import MyTicketsModal from '@/Components/MyTicketsModal';

const EASE = [0.22, 1, 0.36, 1];
const fmtID = new Intl.NumberFormat('id-ID');
const rupiah = (n) => `Rp ${fmtID.format(n || 0)}`;
const fmtCount = (v) => fmtID.format(Math.round(v || 0));
const fmtRupiah = (v) => `Rp ${fmtID.format(Math.round(v || 0))}`;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: EASE },
});

const NAV_LINKS = NAV_SECTIONS.map((s) => ({
    label: s.label,
    href: s.href ?? `/#${s.id}`,
    active: s.href === '/tickets',
}));

/* Status & jam buka dihitung dari jam lokal pengunjung (sama dengan landing). */
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
    const bt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}.${String(t % 60).padStart(2, '0')}`;
    if (open == null || close == null) {
        return { isOpen: true, label: 'Buka setiap hari', hours: 'Setiap hari' };
    }
    const cur = now.getHours() * 60 + now.getMinutes();
    return {
        isOpen: cur >= open && cur < close,
        label: cur >= open && cur < close ? `Buka sekarang · tutup ${bt(close)}` : `Tutup · buka ${bt(open)}`,
        hours: `${bt(open)} – ${bt(close)} WIB`,
    };
}

/* ---- Dekorasi ringan ---- */
function Sparkle({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
            <path d="M12 2c.8 5 4.2 8.4 9.2 9.2-5 .8-8.4 4.2-9.2 9.2-.8-5-4.2-8.4-9.2-9.2 5-.8 8.4-4.2 9.2-9.2Z" />
        </svg>
    );
}

function AnimatedValue({ value, format = fmtCount, className = '' }) {
    const ref = useRef(null);
    const previous = useRef(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const target = Number(value) || 0;
        const from = previous.current;
        previous.current = target;
        if (prefersReducedMotion()) {
            el.textContent = format(target);
            return undefined;
        }
        const controls = animate(from, target, {
            duration: 0.7,
            ease: EASE,
            onUpdate: (v) => { el.textContent = format(v); },
        });
        return () => controls.stop();
    }, [value]);

    return <span ref={ref} className={className}>{format(0)}</span>;
}

/* ========================================================================= */
export default function ParkDetail({
    park,
    promotions = [],
    today,
    selectedDate: initialDate,
    capacity,
    holiday,
}) {
    /* state pemesanan */
    const [visitDate, setVisitDate] = useState(initialDate || today);
    const [quantities, setQuantities] = useState({});
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoApplied, setPromoApplied] = useState('');
    const [promoError, setPromoError] = useState('');
    const [loadingPromo, setLoadingPromo] = useState(false);

    /* state interaksi */
    const [lookupModalOpen, setLookupModalOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const [showAllAttractions, setShowAllAttractions] = useState(false);

    const zones = park.zones || [];
    const tiers = park.ticket_tiers || [];
    const allAttractions = zones.flatMap((z) =>
        (z.attractions || []).map((a) => ({ ...a, zoneName: z.name }))
    );
    const operationalCount = allAttractions.filter((a) => a.status === 'OPERATIONAL').length;
    const status = parkStatus(park);
    const totalCapacity = capacity?.max_capacity || park.default_daily_capacity || 5000;
    const minPrice = park.min_price || (tiers.length ? Math.min(...tiers.map((t) => Number(t.price) || 0)) : 75000);

    const visibleAttractions = showAllAttractions ? allAttractions : allAttractions.slice(0, 4);

    const dateOptions = useMemo(() => {
        const base = today ? new Date(`${today}T00:00:00`) : new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return {
                iso,
                day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                num: d.getDate(),
                month: d.toLocaleDateString('id-ID', { month: 'short' }),
            };
        });
    }, [today]);

    const nameWords = String(park.name || '').trim().split(/\s+/).filter(Boolean);
    const headSolid = nameWords.slice(0, Math.max(1, nameWords.length - 1)).join(' ');
    const headOutline = nameWords.length > 1 ? nameWords[nameWords.length - 1] : '';

    /* Parallax hero — ringan, dua lapis saja */
    const heroRef = useRef(null);
    const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const imageY = useTransform(heroProgress, [0, 1], [0, 60]);

    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springX = useSpring(pointerX, { stiffness: 60, damping: 18 });
    const springY = useSpring(pointerY, { stiffness: 60, damping: 18 });
    const decoX = useTransform(springX, [-1, 1], [-14, 14]);
    const decoY = useTransform(springY, [-1, 1], [-9, 9]);

    const handleHeroPointer = (e) => {
        if (prefersReducedMotion()) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
        pointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const resetHeroPointer = () => {
        pointerX.set(0);
        pointerY.set(0);
    };

    /* ---- aksi (logika lama) ---- */
    const handleDateChange = (newDate) => {
        if (!newDate || newDate === visitDate) return;
        setVisitDate(newDate);
        setQuantities({});
        setPromoApplied('');
        setPromoDiscount(0);
        setPromoError('');
        router.get(`/parks/${park.id}`, { date: newDate }, { preserveState: true, preserveScroll: true });
    };

    const handleQuantityChange = (inventoryId, delta) => {
        if (!inventoryId) return;
        setQuantities((prev) => ({
            ...prev,
            [inventoryId]: Math.max(0, (prev[inventoryId] || 0) + delta),
        }));
    };

    const itemsSelected = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([invId, qty]) => {
            const tier = tiers.find((t) => String(t.inventory_id) === String(invId));
            return {
                inventory_id: invId,
                quantity: qty,
                price: tier ? Number(tier.price) || 0 : 0,
            };
        });

    const subtotal = itemsSelected.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalQuantity = itemsSelected.reduce((acc, item) => acc + item.quantity, 0);
    const finalTotal = Math.max(0, subtotal - promoDiscount);

    const applyPromo = async () => {
        if (!promoCode.trim()) return;
        setLoadingPromo(true);
        setPromoError('');
        try {
            const response = await fetch('/api/tickets/check-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ code: promoCode, subtotal, park_id: park?.id }),
            });
            const data = await response.json();
            if (data.success) {
                setPromoDiscount(data.discount_amount);
                setPromoApplied(data.code);
            } else {
                setPromoError(data.message || 'Kode promo tidak valid');
                setPromoDiscount(0);
                setPromoApplied('');
            }
        } catch (e) {
            setPromoError('Gagal memverifikasi promo');
        } finally {
            setLoadingPromo(false);
        }
    };

    const handleCheckout = () => {
        if (itemsSelected.length === 0) return;
        const items = itemsSelected.map((i) => ({ inventory_id: i.inventory_id, quantity: i.quantity }));
        const params = new URLSearchParams({ items: JSON.stringify(items), date: visitDate });
        if (promoApplied) params.append('promo', promoApplied);
        router.get(`/tickets/checkout?${params.toString()}`);
    };

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
        } catch (e) { /* opsional */ }
        setCopiedCode(code);
        setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    };

    return (
        <>
            <Head title={`${park.name} — Jam Buka & Tiket Masuk | Vurasi`} />

            <MotionConfig reducedMotion="user">
                <div className="vurasi min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-orange-500 selection:text-white">
                    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[80] focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white">
                        Lewati ke konten utama
                    </a>

                    <SiteNavbar links={NAV_LINKS} onCekPesanan={() => setLookupModalOpen(true)} />

                    <main id="main">
                        {/* ================= HEADER GAMBAR ================= */}
                        <section
                            ref={heroRef}
                            onMouseMove={handleHeroPointer}
                            onMouseLeave={resetHeroPointer}
                            className="relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden bg-zinc-950 pb-10 pt-28 sm:min-h-[30rem] sm:pb-14 sm:pt-32"
                        >
                            {/* Gambar destinasi sebagai header penuh (bukan kartu) */}
                            <motion.div style={{ x: decoX, y: decoY }} className="absolute inset-0" aria-hidden="true">
                                <motion.img
                                    src={park.image_url}
                                    alt=""
                                    style={{ y: imageY, scale: 1.12 }}
                                    className="h-full w-full object-cover object-center"
                                />
                            </motion.div>
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/30" aria-hidden="true" />
                            <div className="dots-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

                            <div className="relative mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: EASE }}
                                    className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-orange-600 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg"
                                >
                                    <Ticket className="h-3.5 w-3.5" />
                                    {park.category}
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
                                    className="mt-4 max-w-3xl font-anton text-4xl uppercase leading-[0.94] text-white sm:text-5xl lg:text-6xl"
                                >
                                    <span className="block">{headSolid}</span>
                                    {headOutline && <span className="block stroke-word-dark">{headOutline}</span>}
                                </motion.h1>

                                {/* Jam operasional langsung terlihat di header */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
                                    className="mt-4 flex flex-wrap items-center gap-2"
                                >
                                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white">
                                        <motion.span
                                            animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="h-1.5 w-1.5 rounded-full bg-white"
                                        />
                                        {status.isOpen ? 'Buka sekarang' : 'Sedang tutup'}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-zinc-950/50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
                                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                                        {status.hours}
                                    </span>
                                    {holiday && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                            <Sparkles className="h-3 w-3" /> Libur nasional
                                        </span>
                                    )}
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.26 }}
                                    className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-zinc-300"
                                >
                                    {park.description || 'Destinasi wisata dengan berbagai wahana rekreasi dan pertunjukan seni.'}
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
                                    className="mt-5 flex flex-wrap items-center gap-4"
                                >
                                    <motion.a
                                        href="#tiket"
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-2 border-white bg-orange-600 px-6 text-xs font-extrabold uppercase tracking-widest text-white shadow-[3px_3px_0_rgba(0,0,0,0.5)] cursor-pointer"
                                    >
                                        Lihat Daftar Tiket
                                        <ArrowRight className="h-4 w-4" />
                                    </motion.a>
                                    <span className="text-xs text-zinc-300">
                                        Mulai <span className="font-anton text-lg text-orange-400">{rupiah(minPrice)}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                                        <MapPin className="h-3.5 w-3.5 text-orange-400" />
                                        {park.city || park.location_address}
                                    </span>
                                </motion.div>
                            </div>

                            <motion.div aria-hidden="true" style={{ scaleX: heroProgress }} className="absolute inset-x-0 bottom-0 h-1 origin-left bg-gradient-to-r from-orange-500 to-white" />
                        </section>

                        {/* ================= BAR INFO (jam, lokasi, harga) ================= */}
                        <section aria-label="Informasi kunjungan" className="border-y-2 border-zinc-950 bg-zinc-950 text-white">
                            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-3 py-4 sm:grid-cols-4 sm:px-5 lg:px-6">
                                {[
                                    { icon: Clock, label: 'Jam Operasional', value: status.hours, accent: true },
                                    { icon: CheckCircle2, label: 'Status Hari Ini', value: status.isOpen ? 'Buka sekarang' : 'Sedang tutup' },
                                    { icon: MapPin, label: 'Lokasi', value: park.city || park.location_address || '—' },
                                    { icon: Users, label: 'Kapasitas / hari', value: fmtID.format(totalCapacity) },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.accent ? 'bg-orange-600' : 'bg-white/10'}`}>
                                            <item.icon className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</p>
                                            <p className="truncate text-xs font-bold sm:text-sm">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ================= DAFTAR TIKET ================= */}
                        <section id="tiket" className="scroll-mt-20 bg-zinc-50 py-10 sm:py-14">
                            <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
                                <motion.div {...reveal(0)} className="mb-5 flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-600">&sect; 01 — Pemesanan</p>
                                        <h2 className="mt-1 font-anton text-3xl uppercase tracking-wide text-zinc-950 sm:text-4xl">
                                            Daftar <span className="stroke-word">Tiket</span>
                                        </h2>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-900/15 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-600">
                                        <Clock className="h-3.5 w-3.5 text-orange-600" />
                                        Buka {status.hours}
                                    </span>
                                </motion.div>

                                <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                                    {/* KARCIS PEMESANAN */}
                                    <motion.div
                                        {...reveal(0.05)}
                                        className="overflow-hidden rounded-[1.6rem] border-2 border-zinc-950 bg-white shadow-[7px_7px_0_#18181b]"
                                    >
                                        <div className="flex items-center justify-between border-b-2 border-dashed border-white/20 bg-zinc-950 px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-600 text-white"><Ticket className="h-4 w-4" /></span>
                                                <div>
                                                    <p className="font-anton text-base uppercase leading-none text-white">Pilih Tiket</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{park.name}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Resmi</span>
                                        </div>

                                        <div className="p-5 sm:p-6">
                                            {/* Tanggal */}
                                            <div>
                                                <label htmlFor="visit-date" className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                                                    <Calendar className="h-3.5 w-3.5 text-orange-600" /> Tanggal Kunjungan
                                                </label>
                                                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                                                    {dateOptions.map((d) => {
                                                        const active = visitDate === d.iso;
                                                        return (
                                                            <button
                                                                key={d.iso}
                                                                type="button"
                                                                onClick={() => handleDateChange(d.iso)}
                                                                className={`relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl cursor-pointer ${
                                                                    active ? 'text-white' : 'border border-zinc-900/15 bg-zinc-50 text-zinc-600 hover:border-orange-400'
                                                                }`}
                                                            >
                                                                {active && (
                                                                    <motion.span layoutId="tanggal-aktif" transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="absolute inset-0 rounded-xl border-2 border-zinc-950 bg-[#B8340E] shadow-[2px_2px_0_#18181b]" />
                                                                )}
                                                                <span className="relative z-10 text-[9px] font-bold uppercase opacity-80">{d.day}</span>
                                                                <span className="relative z-10 font-anton text-lg leading-none">{d.num}</span>
                                                                <span className="relative z-10 text-[9px] uppercase opacity-70">{d.month}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <input
                                                    id="visit-date"
                                                    type="date"
                                                    min={today}
                                                    value={visitDate}
                                                    onChange={(e) => handleDateChange(e.target.value)}
                                                    className="mt-1 w-full rounded-xl border border-zinc-900/20 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                                />
                                            </div>

                                            {/* Daftar tier tiket */}
                                            <div className="mt-6">
                                                <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-zinc-700">Kategori Tiket</h3>
                                                {tiers.length ? (
                                                    <div className="space-y-2.5">
                                                        {tiers.map((tier) => {
                                                            const invId = tier.inventory_id;
                                                            const qty = quantities[invId] || 0;
                                                            const remaining = Number(tier.quota) || 0;
                                                            const isSoldOut = remaining <= 0 || !invId;
                                                            return (
                                                                <motion.div
                                                                    key={tier.id}
                                                                    layout
                                                                    animate={{
                                                                        borderColor: qty > 0 ? '#ea580c' : 'rgba(24,24,27,0.15)',
                                                                        backgroundColor: qty > 0 ? 'rgba(255,247,237,0.9)' : 'rgb(250,250,250)',
                                                                    }}
                                                                    transition={{ duration: 0.25 }}
                                                                    className="rounded-2xl border-2 p-3.5"
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="min-w-0 flex-1">
                                                                            <h4 className="text-sm font-bold text-zinc-950">{tier.name}</h4>
                                                                            <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                                                                                {tier.description || 'Akses masuk turnstile resmi'}
                                                                            </p>
                                                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                                <span className="font-anton text-xl text-zinc-950">{rupiah(tier.price)}</span>
                                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isSoldOut ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                                    {isSoldOut ? 'Habis' : `Sisa ${remaining}`}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-2 pt-1">
                                                                            <motion.button type="button" onClick={() => handleQuantityChange(invId, -1)} disabled={qty === 0 || isSoldOut} whileTap={{ scale: 0.88 }} aria-label={`Kurangi ${tier.name}`} className="grid h-9 w-9 place-items-center rounded-xl border-2 border-zinc-900/20 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                                                                                <Minus className="h-4 w-4" />
                                                                            </motion.button>
                                                                            <span className="w-6 text-center font-anton text-lg text-zinc-950">
                                                                                <AnimatePresence mode="popLayout" initial={false}>
                                                                                    <motion.span key={qty} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }} className="block">{qty}</motion.span>
                                                                                </AnimatePresence>
                                                                            </span>
                                                                            <motion.button type="button" onClick={() => handleQuantityChange(invId, 1)} disabled={isSoldOut || qty >= remaining} whileTap={{ scale: 0.88 }} aria-label={`Tambah ${tier.name}`} className="grid h-9 w-9 place-items-center rounded-xl border-2 border-zinc-950 bg-orange-600 text-white shadow-[2px_2px_0_#18181b] transition-colors hover:bg-orange-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                                                                                <Plus className="h-4 w-4" />
                                                                            </motion.button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="rounded-xl border border-dashed border-zinc-900/20 p-4 text-center text-xs text-zinc-400">Belum ada tiket tersedia untuk tanggal ini.</p>
                                                )}
                                            </div>

                                            {/* Promo */}
                                            <div className="mt-6 border-t-2 border-dashed border-zinc-900/15 pt-4">
                                                <label htmlFor="promo-code" className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                                                    <Tag className="h-3.5 w-3.5 text-orange-600" /> Kode Promo
                                                </label>
                                                <div className="flex gap-2">
                                                    <input id="promo-code" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="MASUKKAN KODE" className="min-w-0 flex-1 rounded-xl border border-zinc-900/20 bg-zinc-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-orange-500" />
                                                    <button type="button" onClick={applyPromo} disabled={loadingPromo || !promoCode.trim()} className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-950 bg-zinc-950 px-3 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40 cursor-pointer">
                                                        {loadingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pakai'}
                                                    </button>
                                                </div>
                                                <AnimatePresence mode="wait" initial={false}>
                                                    {promoApplied && (
                                                        <motion.p key={promoApplied} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> {promoApplied} dipakai — hemat {rupiah(promoDiscount)}
                                                        </motion.p>
                                                    )}
                                                    {promoError && (
                                                        <motion.p key={promoError} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                                                            <AlertCircle className="h-3.5 w-3.5" /> {promoError}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Total & checkout */}
                                            <div className="mt-5 rounded-2xl border-2 border-zinc-950 bg-zinc-50 p-4">
                                                <div className="flex justify-between text-xs text-zinc-500">
                                                    <span>Subtotal ({totalQuantity} tiket)</span>
                                                    <span className="font-semibold text-zinc-800"><AnimatedValue value={subtotal} format={fmtRupiah} /></span>
                                                </div>
                                                {promoDiscount > 0 && (
                                                    <div className="mt-1.5 flex justify-between text-xs font-semibold text-emerald-600">
                                                        <span>Diskon</span>
                                                        <span>-<AnimatedValue value={promoDiscount} format={fmtRupiah} /></span>
                                                    </div>
                                                )}
                                                <div className="mt-3 flex items-baseline justify-between border-t-2 border-dashed border-zinc-900/15 pt-3">
                                                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">Total Bayar</span>
                                                    <span className="font-anton text-3xl text-orange-600"><AnimatedValue value={finalTotal} format={fmtRupiah} /></span>
                                                </div>
                                            </div>

                                            <motion.button
                                                type="button"
                                                onClick={handleCheckout}
                                                disabled={totalQuantity === 0}
                                                whileHover={totalQuantity ? { y: -2 } : {}}
                                                whileTap={totalQuantity ? { scale: 0.98 } : {}}
                                                className="relative mt-4 flex min-h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-zinc-950 bg-orange-600 text-xs font-extrabold uppercase tracking-widest text-white shadow-[4px_4px_0_#18181b] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                            >
                                                {totalQuantity > 0 && (
                                                    <motion.span aria-hidden="true" animate={{ x: ['-120%', '220%'] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }} className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 blur-sm" />
                                                )}
                                                <Ticket className="relative z-10 h-4 w-4" />
                                                <span className="relative z-10">Bayar Sekarang ({totalQuantity})</span>
                                                <ArrowRight className="relative z-10 h-4 w-4" />
                                            </motion.button>
                                            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-zinc-500">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> QRIS, Virtual Account & e-wallet · E-tiket QR instan
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* INFO PENDUKUNG (sticky) */}
                                    <div className="space-y-4 lg:sticky lg:top-24">
                                        {/* Jam operasional detail */}
                                        <motion.div {...reveal(0.08)} className="rounded-[1.4rem] border-2 border-zinc-950 bg-white p-5 shadow-[5px_5px_0_#18181b]">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="flex items-center gap-2 font-anton text-xl uppercase text-zinc-950">
                                                    <Clock className="h-5 w-5 text-orange-600" /> Jam Operasional
                                                </h3>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${status.isOpen ? 'bg-emerald-600 text-white' : 'bg-zinc-950 text-zinc-300'}`}>
                                                    {status.isOpen ? 'Buka' : 'Tutup'}
                                                </span>
                                            </div>
                                            <p className="mt-3 font-anton text-3xl leading-none text-[#B8340E]">{status.hours}</p>
                                            <div className="mt-4 space-y-2 border-t border-dashed border-zinc-900/20 pt-3 text-xs">
                                                <div className="flex justify-between"><span className="text-zinc-500">Senin – Jumat</span><span className="font-bold text-zinc-900">{status.hours}</span></div>
                                                <div className="flex justify-between"><span className="text-zinc-500">Sabtu – Minggu</span><span className="font-bold text-zinc-900">{status.hours}</span></div>
                                                {holiday && <div className="flex justify-between text-rose-600"><span>Hari libur nasional</span><span className="font-bold">Buka sesuai jadwal</span></div>}
                                            </div>
                                            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                                                Disarankan tiba 15 menit sebelum jam buka untuk antrean gerbang turnstile.
                                            </p>
                                        </motion.div>

                                        {/* Lokasi */}
                                        <motion.div {...reveal(0.12)} className="rounded-[1.4rem] border-2 border-zinc-950 bg-white p-5 shadow-[5px_5px_0_#18181b]">
                                            <h3 className="flex items-center gap-2 font-anton text-lg uppercase text-zinc-950">
                                                <MapPin className="h-5 w-5 text-orange-600" /> Lokasi
                                            </h3>
                                            <p className="mt-2 text-xs leading-relaxed text-zinc-600">{park.location_address || park.city || 'Alamat belum tersedia.'}</p>
                                            <a
                                                href={park.latitude && park.longitude
                                                    ? `https://www.google.com/maps/search/?api=1&query=${park.latitude},${park.longitude}`
                                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.location_address || park.name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-2 border-zinc-950 bg-zinc-950 px-4 text-[10px] font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 cursor-pointer"
                                            >
                                                Buka di Maps <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </motion.div>

                                        {/* Promo ringkas */}
                                        {promotions.length > 0 && (
                                            <motion.div {...reveal(0.16)} className="rounded-[1.4rem] border-2 border-orange-600/50 bg-orange-50/70 p-5">
                                                <h3 className="flex items-center gap-2 font-anton text-lg uppercase text-zinc-950">
                                                    <Gift className="h-5 w-5 text-orange-600" /> Promo Tersedia
                                                </h3>
                                                <div className="mt-3 space-y-2">
                                                    {promotions.slice(0, 3).map((p) => (
                                                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-orange-600/20 bg-white p-2.5">
                                                            <div className="min-w-0">
                                                                <p className="truncate font-mono text-xs font-extrabold tracking-wider text-zinc-950">{p.code}</p>
                                                                <p className="truncate text-[10px] text-zinc-500">{p.discount_type === 'PERCENTAGE' ? `Diskon ${p.discount_value}%` : `Potong ${rupiah(p.discount_value)}`}</p>
                                                            </div>
                                                            <button type="button" onClick={() => copyCode(p.code)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-900/15 bg-zinc-50 text-orange-600 transition-colors hover:border-orange-500 cursor-pointer" aria-label={`Salin kode ${p.code}`}>
                                                                {copiedCode === p.code ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-[10px] text-zinc-500">Ketuk kode untuk menyalin, lalu masukkan di kolom promo.</p>
                                            </motion.div>
                                        )}

                                        {/* Wahana singkat */}
                                        {allAttractions.length > 0 && (
                                            <motion.div {...reveal(0.2)} className="rounded-[1.4rem] border-2 border-zinc-950 bg-white p-5 shadow-[5px_5px_0_#18181b]">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="flex items-center gap-2 font-anton text-lg uppercase text-zinc-950">
                                                        <Sparkles className="h-5 w-5 text-orange-600" /> Wahana Unggulan
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-emerald-600">{operationalCount}/{allAttractions.length} buka</span>
                                                </div>
                                                <ul className="mt-3 space-y-2">
                                                    {visibleAttractions.map((a) => (
                                                        <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                                                            <span className="truncate text-zinc-700">{a.name}</span>
                                                            <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${a.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-label={a.status} />
                                                        </li>
                                                    ))}
                                                </ul>
                                                {allAttractions.length > 4 && (
                                                    <button type="button" onClick={() => setShowAllAttractions((v) => !v)} className="mt-3 text-[11px] font-bold uppercase tracking-wider text-orange-600 hover:underline cursor-pointer">
                                                        {showAllAttractions ? 'Tampilkan lebih sedikit' : `Lihat semua (${allAttractions.length})`}
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>

                    <footer className="bg-zinc-950 pb-8 pt-6 text-zinc-400">
                        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-3 sm:px-5 lg:px-6">
                            <div className="flex items-center gap-3">
                                <img src="/images/vurasi-logo.png" alt="Vurasi" width="1180" height="490" className="h-7 w-auto" />
                                <span className="text-sm italic leading-none text-orange-500">paviliun seni</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                <Link href="/tickets" className="hover:text-white cursor-pointer">Destinasi lain</Link>
                                <Link href="/promotions" className="hover:text-white cursor-pointer">Promo</Link>
                                <Link href="/#tentang" className="hover:text-white cursor-pointer">Tentang Kami</Link>
                                <button type="button" onClick={() => setLookupModalOpen(true)} className="hover:text-white cursor-pointer">Cek E-Tiket</button>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-600">© {new Date().getFullYear()} Vurasi MultiPark</span>
                        </div>
                    </footer>

                    <MyTicketsModal open={lookupModalOpen} onClose={() => setLookupModalOpen(false)} />
                </div>
            </MotionConfig>
        </>
    );
}
