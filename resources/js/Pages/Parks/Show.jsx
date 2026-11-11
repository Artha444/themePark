import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    MapPin, Clock, Users, ArrowRight, ArrowLeft, Ticket,
    ShieldCheck, Sparkles, AlertCircle, CheckCircle2,
    Calendar, Layers, Tag, ChevronRight, Info
} from 'lucide-react';

export default function ParkDetail({ park, promotions = [], today }) {
    const [selectedTab, setSelectedTab] = useState('attractions');

    // Menghitung total wahana dari seluruh zona
    const allAttractions = park.zones?.flatMap((z) =>
        z.attractions.map((att) => ({ ...att, zoneName: z.name }))
    ) || [];

    const operationalCount = allAttractions.filter((a) => a.status === 'OPERATIONAL').length;

    return (
        <>
            <Head title={`${park.name} - Info & Tiket Masuk`} />

            <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white">
                
                {/* TOP NAVBAR */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Kembali ke Beranda</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex px-3 py-1 text-xs font-semibold bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                                {park.category}
                            </span>
                            <Link
                                href={`/tickets?park_id=${park.id}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition hover:shadow-orange-600/30 active:scale-95"
                            >
                                <Ticket className="w-4 h-4" />
                                <span>Pesan Tiket</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* HERO BANNER SECTION */}
                <div className="relative h-80 sm:h-96 lg:h-[420px] bg-slate-900 overflow-hidden">
                    <img
                        src={park.image_url}
                        alt={park.name}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                    <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8 sm:pb-12 text-white">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-orange-600 rounded-full w-max mb-3 shadow-md">
                            <Sparkles className="w-3.5 h-3.5" />
                            {park.category}
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
                            {park.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                                {park.location_address}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                                Buka: {park.open_time?.substring(0, 5)} - {park.close_time?.substring(0, 5)} WIB
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-orange-400 shrink-0" />
                                Kapasitas: {park.default_daily_capacity?.toLocaleString()} / hari
                            </span>
                        </div>
                    </div>
                </div>

                {/* CONTENT CONTAINER */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
                        
                        {/* KOLOM KIRI (2/3): INFORMASI LENGKAP, ATRAKSI & ZONA */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Tentang Kawasan */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                                <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-orange-600" />
                                    Tentang Kawasan
                                </h2>
                                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                    {park.description || 'Destinasi wisata terpadu dengan berbagai wahana rekreasi dan pertunjukan seni spektakuler.'}
                                </p>

                                {/* Highlights Quick Badges */}
                                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-xs text-slate-400 font-bold uppercase block">Zona Tematik</span>
                                        <span className="text-xl font-black text-slate-900 mt-1 block">
                                            {park.zones?.length || 0} Area
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-xs text-slate-400 font-bold uppercase block">Wahana Aktif</span>
                                        <span className="text-xl font-black text-emerald-600 mt-1 block">
                                            {operationalCount} / {allAttractions.length} Buka
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                                        <span className="text-xs text-slate-400 font-bold uppercase block">Kategori Tiket</span>
                                        <span className="text-xl font-black text-orange-600 mt-1 block">
                                            {park.ticket_tiers?.length || 0} Pilihan
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* TAB DAFTAR WAHANA & ZONA */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <Layers className="w-5 h-5 text-orange-600" />
                                            Wahana &amp; Atraksi di Sini
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Temukan beragam instalasi dan wahana seru yang dapat Anda nikmati
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                        {allAttractions.length} Wahana
                                    </span>
                                </div>

                                {/* Daftar Wahana Grid */}
                                {allAttractions.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {allAttractions.map((att) => (
                                            <div
                                                key={att.id}
                                                className="border border-slate-200 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-md transition duration-200 bg-white flex flex-col justify-between"
                                            >
                                                {att.image_url && (
                                                    <div className="h-36 w-full overflow-hidden bg-slate-100">
                                                        <img
                                                            src={att.image_url}
                                                            alt={att.name}
                                                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                                        />
                                                    </div>
                                                )}

                                                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                                                {att.zoneName}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                att.status === 'OPERATIONAL'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : att.status === 'MAINTENANCE'
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {att.status === 'OPERATIONAL' ? '✓ Operasional' :
                                                                 att.status === 'MAINTENANCE' ? '⚠ Pemeliharaan' : '✕ Tutup'}
                                                            </span>
                                                        </div>

                                                        <h3 className="font-bold text-slate-900 text-base">
                                                            {att.name}
                                                        </h3>

                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                            {att.description || 'Instalasi pameran dan wahana unggulan.'}
                                                        </p>
                                                    </div>

                                                    <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                                                        <span>Syarat Tinggi:</span>
                                                        <span className="font-semibold text-slate-700">
                                                            {att.min_height_cm > 0 ? `Min. ${att.min_height_cm} cm` : 'Semua Umur'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400 text-xs">
                                        Belum ada wahana yang terdaftar di tempat ini.
                                    </div>
                                )}
                            </div>

                            {/* KUPON PROMO AKTIF */}
                            {promotions.length > 0 && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-orange-200">
                                    <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                                        <Tag className="w-5 h-5 text-orange-600" />
                                        Promo &amp; Voucher Diskon Tersedia
                                    </h2>
                                    <p className="text-xs text-slate-600 mb-4">
                                        Gunakan kode voucher berikut saat melakukan checkout tiket:
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {promotions.map((p) => (
                                            <div key={p.id} className="bg-white rounded-2xl p-4 border border-orange-200/80 shadow-xs flex items-center justify-between">
                                                <div>
                                                    <span className="font-mono font-black text-sm tracking-widest text-orange-600 bg-orange-100/60 px-2.5 py-1 rounded-lg">
                                                        {p.code}
                                                    </span>
                                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                                        {p.description || `Diskon ${p.discount_type === 'PERCENTAGE' ? `${p.discount_value}%` : `Rp ${Number(p.discount_value).toLocaleString('id-ID')}`}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Berlaku s/d</span>
                                                    <span className="text-xs font-semibold text-slate-700">{p.valid_until?.substring(0, 10)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* KOLOM KANAN (1/3): KARTU ESTIMASI HARGA & ORDER CTA */}
                        <div className="space-y-6">
                            
                            {/* Sticky Card Tiket */}
                            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md sticky top-24">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Pemesanan Tiket Resmi
                                </span>
                                <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-slate-100">
                                    <span className="text-xs text-slate-500 font-medium">Mulai dari</span>
                                    <span className="text-2xl sm:text-3xl font-black text-orange-600">
                                        Rp {new Intl.NumberFormat('id-ID').format(park.min_price || 75000)}
                                    </span>
                                    <span className="text-xs text-slate-400">/orang</span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Pilihan Kategori Tiket:
                                    </h4>

                                    {park.ticket_tiers?.map((tier) => (
                                        <div key={tier.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                                            <div>
                                                <h5 className="font-bold text-xs text-slate-900">{tier.name}</h5>
                                                <span className="text-[11px] text-slate-500">
                                                    {tier.description || 'Akses masuk turnstile gerbang utama'}
                                                </span>
                                            </div>
                                            <span className="font-extrabold text-xs text-slate-800">
                                                Rp {new Intl.NumberFormat('id-ID').format(tier.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href={`/tickets?park_id=${park.id}`}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-600/30 transition active:scale-95 text-center"
                                >
                                    <Ticket className="w-4 h-4" />
                                    <span>Pilih Tanggal &amp; Beli Tiket</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>

                                <div className="mt-5 space-y-2 text-[11px] text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>E-Ticket QR Code resmi instan terverifikasi</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Konfirmasi pemesanan real-time tanpa antre</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* FOOTER MINI */}
                <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
                    <p>© {new Date().getFullYear()} {park.name} · Sistem Pemesanan Tiket Multi-Park</p>
                </footer>

            </div>
        </>
    );
}

