import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, MotionConfig } from 'framer-motion';
import {
    MapPin, Clock, Users, ArrowRight, ArrowLeft, Ticket,
    ShieldCheck, Sparkles, CheckCircle2,
    Layers, Tag, Info, ChevronRight, Calendar, Plus, Minus, AlertCircle, Loader2, ExternalLink
} from 'lucide-react';

/* Easing konsisten dengan landing page */
const EASE = [0.22, 1, 0.36, 1];

/* Bungkus animasi masuk layar — dipicu sekali saat elemen terlihat */
const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.55, delay, ease: EASE },
});

export default function ParkDetail({ park, promotions = [], today, selectedDate: initialDate, inventories = [] }) {
    const [visitDate, setVisitDate] = useState(initialDate || today);
    const [quantities, setQuantities] = useState({});
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoApplied, setPromoApplied] = useState('');
    const [promoError, setPromoError] = useState('');
    const [loadingPromo, setLoadingPromo] = useState(false);

    // Menghitung total wahana dari seluruh zona
    const allAttractions = park.zones?.flatMap((z) =>
        z.attractions.map((att) => ({ ...att, zoneName: z.name }))
    ) || [];

    const operationalCount = allAttractions.filter((a) => a.status === 'OPERATIONAL').length;

    const handleDateChange = (newDate) => {
        setVisitDate(newDate);
        setQuantities({});
        router.get(`/parks/${park.id}`, { date: newDate }, { preserveState: true, preserveScroll: true });
    };

    const handleQuantityChange = (inventoryId, delta) => {
        setQuantities(prev => {
            const current = prev[inventoryId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [inventoryId]: next };
        });
    };

    // Subtotal calculation
    const itemsSelected = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([invId, qty]) => {
            const tier = park.ticket_tiers?.find(t => t.inventory_id === invId);
            return {
                inventory_id: invId,
                quantity: qty,
                price: tier ? tier.price : 0,
                name: tier ? tier.name : '',
            };
        });

    const subtotal = itemsSelected.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalQuantity = itemsSelected.reduce((acc, item) => acc + item.quantity, 0);

    const applyPromo = async () => {
        if (!promoCode.trim()) return;
        setLoadingPromo(true);
        setPromoError('');

        try {
            const response = await fetch('/api/tickets/check-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    code: promoCode,
                    subtotal,
                    park_id: park?.id,
                }),
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

        const checkoutData = itemsSelected.map(i => ({
            inventory_id: i.inventory_id,
            quantity: i.quantity,
        }));

        const params = new URLSearchParams({
            items: JSON.stringify(checkoutData),
            date: visitDate,
        });

        if (promoApplied) {
            params.append('promo', promoApplied);
        }

        router.get(`/tickets/checkout?${params.toString()}`);
    };

    const finalTotal = Math.max(0, subtotal - promoDiscount);

    return (
        <>
            <Head title={`${park.name} - Info & Tiket Masuk`} />

            <MotionConfig reducedMotion="user">
                <div className="min-h-screen bg-[#f5efda] font-sans text-zinc-800 selection:bg-orange-500 selection:text-white">

                    {/* TOP NAVBAR — bar tinta gelap */}
                    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/95 backdrop-blur-md">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                            <Link
                                href="/tickets"
                                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 transition-colors hover:text-orange-400"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Kembali ke Beranda</span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <span className="hidden rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-widest text-zinc-300 sm:inline-flex">
                                    {park.category}
                                </span>
                                <Link
                                    href={`/tickets?park_id=${park.id}`}
                                    className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/30 transition-colors hover:bg-orange-500 active:scale-95 cursor-pointer"
                                >
                                    <Ticket className="h-4 w-4" />
                                    <span>Pesan Tiket</span>
                                </Link>
                            </div>
                        </div>
                    </header>

                    {/* HERO BANNER — poster gelap dengan judul Anton */}
                    <div className="relative h-80 overflow-hidden bg-zinc-950 sm:h-96 lg:h-[420px]">
                        <img
                            src={park.image_url}
                            alt={park.name}
                            className="h-full w-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-4 pb-8 text-white sm:px-6 sm:pb-12 lg:px-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ duration: 0.45, ease: EASE }}
                                className="mb-4 inline-flex w-max items-center gap-2 rounded-full bg-orange-600 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider shadow-md shadow-orange-600/30"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                {park.category}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                                className="mb-3 font-anton text-4xl uppercase leading-[0.95] tracking-[0.02em] sm:text-6xl"
                            >
                                {park.name}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
                                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-zinc-300"
                            >
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 shrink-0 text-orange-400" />
                                    {park.location_address}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 shrink-0 text-orange-400" />
                                    Buka: {park.open_time?.substring(0, 5)} - {park.close_time?.substring(0, 5)} WIB
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4 shrink-0 text-orange-400" />
                                    Kapasitas: {park.default_daily_capacity?.toLocaleString()} / hari
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    {/* CONTENT CONTAINER */}
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-3">

                            {/* KOLOM KIRI (2/3): INFORMASI LENGKAP, ATRAKSI & ZONA */}
                            <div className="space-y-8 lg:col-span-2">

                                {/* Tentang Kawasan — kartu kertas brutalist */}
                                <motion.section {...reveal(0)} className="rounded-3xl border border-zinc-900 bg-white p-6 shadow-[5px_5px_0_0_#18181b] sm:p-8">
                                    <h2 className="mb-3 flex items-center gap-2 font-anton text-xl uppercase tracking-[0.03em] text-zinc-950 sm:text-2xl">
                                        <Info className="h-5 w-5 text-orange-600" />
                                        Tentang Kawasan
                                    </h2>
                                    <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
                                        {park.description || 'Destinasi wisata terpadu dengan berbagai wahana rekreasi dan pertunjukan seni spektakuler.'}
                                    </p>

                                    {/* Lokasi & Peta Google Maps */}
                                    <div className="mt-6 rounded-2xl border border-zinc-900/10 bg-zinc-50 p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-zinc-900">
                                                        {park.maps_place_name || park.name}
                                                    </h3>
                                                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                                                        {park.location_address}
                                                    </p>
                                                </div>
                                            </div>
                                            {park.latitude && park.longitude ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${park.latitude},${park.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shrink-0 shadow-sm"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Buka di Google Maps
                                                </a>
                                            ) : (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.location_address || park.name)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shrink-0 shadow-sm"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Cari di Google Maps
                                                </a>
                                            )}
                                        </div>

                                        {park.latitude && park.longitude && (
                                            <div className="mt-4 rounded-xl overflow-hidden border border-zinc-900/10 h-48 w-full shadow-inner">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    marginHeight="0"
                                                    marginWidth="0"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(park.longitude) - 0.008}%2C${parseFloat(park.latitude) - 0.005}%2C${parseFloat(park.longitude) + 0.008}%2C${parseFloat(park.latitude) + 0.005}&layer=mapnik&marker=${park.latitude}%2C${park.longitude}`}
                                                    title={`Peta Lokasi ${park.name}`}
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Statistik ringkas */}
                                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed border-zinc-900/20 pt-6 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-zinc-900/10 bg-zinc-950/[0.03] p-4">
                                            <span className="block text-xs font-bold uppercase text-zinc-400">Zona Tematik</span>
                                            <span className="mt-1 block font-anton text-2xl text-zinc-950">
                                                {park.zones?.length || 0} <span className="text-sm text-zinc-500">Area</span>
                                            </span>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-900/10 bg-zinc-950/[0.03] p-4">
                                            <span className="block text-xs font-bold uppercase text-zinc-400">Wahana Aktif</span>
                                            <span className="mt-1 block font-anton text-2xl text-emerald-600">
                                                {operationalCount}<span className="text-zinc-400">/{allAttractions.length}</span> <span className="text-sm text-zinc-500">Buka</span>
                                            </span>
                                        </div>
                                        <div className="col-span-2 rounded-2xl border border-zinc-900/10 bg-zinc-950/[0.03] p-4 sm:col-span-1">
                                            <span className="block text-xs font-bold uppercase text-zinc-400">Kategori Tiket</span>
                                            <span className="mt-1 block font-anton text-2xl text-orange-600">
                                                {park.ticket_tiers?.length || 0} <span className="text-sm text-zinc-500">Pilihan</span>
                                            </span>
                                        </div>
                                    </div>
                                </motion.section>

                                {/* DAFTAR WAHANA & ATRAKSI */}
                                <motion.section {...reveal(0.08)} className="rounded-3xl border border-zinc-900 bg-white p-6 shadow-[5px_5px_0_0_#18181b] sm:p-8">
                                    <div className="mb-6 flex items-center justify-between gap-4 border-b border-dashed border-zinc-900/20 pb-4">
                                        <div>
                                            <h2 className="flex items-center gap-2 font-anton text-xl uppercase tracking-[0.03em] text-zinc-950 sm:text-2xl">
                                                <Layers className="h-5 w-5 text-orange-600" />
                                                Wahana &amp; Atraksi di Sini
                                            </h2>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                Temukan beragam instalasi dan wahana seru yang dapat Anda nikmati
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full border border-zinc-900/15 bg-zinc-950/[0.04] px-3 py-1 text-xs font-bold text-zinc-600">
                                            {allAttractions.length} Wahana
                                        </span>
                                    </div>

                                    {/* Daftar Wahana Grid — muncul satu per satu */}
                                    {allAttractions.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {allAttractions.map((att, idx) => (
                                                <motion.div
                                                    key={att.id}
                                                    initial={{ opacity: 0, y: 24 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true, amount: 0.2 }}
                                                    transition={{ duration: 0.45, delay: (idx % 4) * 0.08, ease: EASE }}
                                                    whileHover={{ y: -4 }}
                                                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-900/15 bg-white transition-colors duration-200 hover:border-orange-500/60"
                                                >
                                                    {att.image_url && (
                                                        <div className="h-36 w-full overflow-hidden bg-zinc-100">
                                                            <img
                                                                src={att.image_url}
                                                                alt={att.name}
                                                                loading="lazy"
                                                                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex flex-1 flex-col justify-between space-y-2 p-4">
                                                        <div>
                                                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                                                <span className="rounded bg-zinc-950 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                                                                    {att.zoneName}
                                                                </span>
                                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                                                    att.status === 'OPERATIONAL'
                                                                        ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700'
                                                                        : att.status === 'MAINTENANCE'
                                                                        ? 'border-amber-500/30 bg-amber-50 text-amber-700'
                                                                        : 'border-rose-500/30 bg-rose-50 text-rose-700'
                                                                }`}>
                                                                    {att.status === 'OPERATIONAL' ? '✓ Operasional' :
                                                                     att.status === 'MAINTENANCE' ? '⚠ Pemeliharaan' : '✕ Tutup'}
                                                                </span>
                                                            </div>

                                                            <h3 className="text-base font-bold text-zinc-950 transition-colors group-hover:text-orange-600">
                                                                {att.name}
                                                            </h3>

                                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                                                                {att.description || 'Instalasi pameran dan wahana unggulan.'}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between border-t border-dashed border-zinc-900/15 pt-2 text-[11px] text-zinc-400">
                                                            <span>Syarat Tinggi:</span>
                                                            <span className="font-semibold text-zinc-700">
                                                                {att.min_height_cm > 0 ? `Min. ${att.min_height_cm} cm` : 'Semua Umur'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center text-xs text-zinc-400">
                                            Belum ada wahana yang terdaftar di tempat ini.
                                        </div>
                                    )}
                                </motion.section>

                                {/* KUPON PROMO AKTIF — kartu mini bergaya tiket */}
                                {promotions.length > 0 && (
                                    <motion.section
                                        {...reveal(0.12)}
                                        className="rounded-3xl border border-orange-600/40 bg-gradient-to-br from-[#f5efda] to-orange-100/60 p-6 shadow-[5px_5px_0_0_#ea580c] sm:p-8"
                                    >
                                        <h2 className="mb-2 flex items-center gap-2 font-anton text-lg uppercase tracking-[0.03em] text-zinc-950 sm:text-xl">
                                            <Tag className="h-5 w-5 text-orange-600" />
                                            Promo &amp; Voucher Diskon Tersedia
                                        </h2>
                                        <p className="mb-4 text-xs text-zinc-600">
                                            Gunakan kode voucher berikut saat melakukan checkout tiket:
                                        </p>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {promotions.map((p, idx) => (
                                                <motion.div
                                                    key={p.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.4, delay: idx * 0.08, ease: EASE }}
                                                    whileHover={{ y: -3 }}
                                                    className="relative flex items-center justify-between rounded-2xl border border-orange-600/30 bg-white p-4 shadow-[3px_3px_0_0_#18181b]"
                                                >
                                                    <div className="min-w-0">
                                                        <span className="inline-block rounded-lg bg-orange-600 px-2.5 py-1 font-mono text-sm font-black tracking-widest text-white">
                                                            {p.code}
                                                        </span>
                                                        <p className="mt-2 truncate text-xs font-medium text-zinc-500 pr-2">
                                                            {p.description || `Diskon ${p.discount_type === 'PERCENTAGE' ? `${p.discount_value}%` : `Rp ${Number(p.discount_value).toLocaleString('id-ID')}`}`}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <span className="block text-[10px] font-bold uppercase text-zinc-400">Berlaku s/d</span>
                                                        <span className="text-xs font-semibold text-zinc-700">{p.valid_until?.substring(0, 10)}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}

                            </div>

                            {/* KOLOM KANAN (1/3): KARTU TIKET STICKY PEMILIHAN & PEMBAYARAN LANGSUNG */}
                            <div className="space-y-6">
                                <motion.aside
                                    initial={{ opacity: 0, x: 32 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
                                    className="sticky top-24 overflow-hidden rounded-3xl border border-zinc-900 bg-white shadow-[6px_6px_0_0_#18181b]"
                                >
                                    {/* Band atas bergaya tiket */}
                                    <div className="flex items-center justify-between border-b border-dashed border-white/20 bg-zinc-950 px-6 py-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Beli Tiket Langsung</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Resmi &amp; Terverifikasi</span>
                                    </div>

                                    <div className="relative p-6 sm:p-7">
                                        {/* Notch sobekan di bawah band */}
                                        <span aria-hidden="true" className="absolute -top-[9px] left-1/2 h-[18px] w-[18px] -translate-x-1/2 rounded-full border border-zinc-900 bg-[#f5efda]" />

                                        {/* Pilihan Tanggal Kunjungan */}
                                        <div className="mb-5">
                                            <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-700">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-orange-600" />
                                                    Tanggal Kunjungan
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={visitDate}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="w-full rounded-xl border border-zinc-900/20 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            />
                                        </div>

                                        {/* Pilihan Kategori Tiket & Kontrol Jumlah */}
                                        <div className="mb-5 space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                                                Pilih Tiket:
                                            </h4>

                                            {park.ticket_tiers?.map((tier) => {
                                                const invId = tier.inventory_id;
                                                const qty = quantities[invId] || 0;
                                                const isSoldOut = tier.quota <= 0;

                                                return (
                                                    <div
                                                        key={tier.id}
                                                        className={`rounded-2xl border p-3.5 transition-all ${
                                                            qty > 0
                                                                ? 'border-orange-600 bg-orange-50/50 shadow-sm'
                                                                : 'border-zinc-900/15 bg-zinc-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <h5 className="text-xs font-bold text-zinc-950">{tier.name}</h5>
                                                                <p className="mt-0.5 text-[11px] text-zinc-500 leading-tight">
                                                                    {tier.description || 'Akses turnstile resmi'}
                                                                </p>
                                                                <div className="mt-1.5 flex items-center gap-2">
                                                                    <span className="font-anton text-base text-zinc-950">
                                                                        Rp {new Intl.NumberFormat('id-ID').format(tier.price)}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-400">
                                                                        {isSoldOut ? 'Habis' : `Sisa ${tier.quota}`}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Quantity Buttons */}
                                                            <div className="flex items-center gap-2 shrink-0 pt-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(invId, -1)}
                                                                    disabled={qty === 0 || isSoldOut}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-900/20 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </button>
                                                                <span className="w-5 text-center text-xs font-bold text-zinc-950">
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(invId, 1)}
                                                                    disabled={isSoldOut || qty >= tier.quota}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-900/20 bg-orange-600 text-white transition hover:bg-orange-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Input Promo Code */}
                                        <div className="mb-5 border-t border-dashed border-zinc-900/15 pt-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                    placeholder="Punya Kode Promo?"
                                                    className="w-full rounded-xl border border-zinc-900/20 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-900 outline-none focus:border-orange-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={applyPromo}
                                                    disabled={loadingPromo || !promoCode.trim()}
                                                    className="shrink-0 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                                                >
                                                    {loadingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gunakan'}
                                                </button>
                                            </div>
                                            {promoApplied && (
                                                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Kode {promoApplied} diterapkan (-Rp {new Intl.NumberFormat('id-ID').format(promoDiscount)})
                                                </p>
                                            )}
                                            {promoError && (
                                                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {promoError}
                                                </p>
                                            )}
                                        </div>

                                        {/* Total Summary */}
                                        <div className="mb-5 rounded-2xl border border-zinc-900/10 bg-zinc-50 p-4 space-y-2">
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>Subtotal ({totalQuantity} tiket)</span>
                                                <span className="font-semibold text-zinc-800">Rp {new Intl.NumberFormat('id-ID').format(subtotal)}</span>
                                            </div>
                                            {promoDiscount > 0 && (
                                                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                                                    <span>Diskon Promo</span>
                                                    <span>-Rp {new Intl.NumberFormat('id-ID').format(promoDiscount)}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-dashed border-zinc-900/10 pt-2 flex items-baseline justify-between">
                                                <span className="text-xs font-bold uppercase text-zinc-700">Total Pembayaran</span>
                                                <span className="font-anton text-2xl text-orange-600">
                                                    Rp {new Intl.NumberFormat('id-ID').format(finalTotal)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Tombol Lanjut ke Pembayaran */}
                                        <button
                                            type="button"
                                            onClick={handleCheckout}
                                            disabled={totalQuantity === 0}
                                            className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-center text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                        >
                                            <Ticket className="h-4 w-4" />
                                            <span>Bayar Sekarang ({totalQuantity})</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </button>

                                        <div className="mt-5 space-y-2 text-[11px] text-zinc-500">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                                                <span>Pembayaran instan QRIS, Virtual Account, & Kartu</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                                <span>E-Ticket QR Code resmi instan terverifikasi</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.aside>
                            </div>

                        </div>

                        {/* Link kembali ke destinasi lain */}
                        <motion.div {...reveal(0)} className="mt-12 flex justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-900/20 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:border-orange-500 hover:text-orange-600 cursor-pointer"
                            >
                                Jelajahi Destinasi Lain
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    </div>

                    {/* FOOTER MINI */}
                    <footer className="mt-8 border-t border-white/10 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
                        <p>
                            © {new Date().getFullYear()} <span className="text-zinc-300">{park.name}</span> · Sistem Pemesanan Tiket Multi-Park
                        </p>
                    </footer>

                </div>
            </MotionConfig>
        </>
    );
}
