import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar, Ticket, CheckCircle2, ChevronRight, Tag, AlertCircle, 
    ArrowLeft, MapPin, Search, Filter, ShieldAlert, RefreshCw, X, ChevronDown, Clock, Info
} from 'lucide-react';

export default function TicketIndex({ 
    parks = [], 
    park, 
    categories = [], 
    selectedDate, 
    capacity, 
    inventories = [] 
}) {
    // 1. TANGGAL KUNJUNGAN: BISA JAUH-JAUH HARI (6 BULAN KE DEPAN)
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    
    // Hitung tanggal maksimal 6 bulan ke depan (~180 hari)
    const maxDateObj = new Date(today);
    maxDateObj.setMonth(maxDateObj.getMonth() + 6);
    const maxDateIso = maxDateObj.toISOString().split('T')[0];

    // Quick pills untuk 7 hari ke depan
    const quickDateOptions = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const dayName = i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return { iso, dayName, dateFormatted, isWeekend: d.getDay() === 0 || d.getDay() === 6 };
    });

    // 2. STATE UNTUK PENCARIAN & KATEGORI THEME PARK (SOLUSI 90-100+ PARK)
    const [parkSearch, setParkSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [isParkDropdownOpen, setIsParkDropdownOpen] = useState(false);

    // Kategori default gabungan jika ada
    const allCategories = useMemo(() => {
        const unique = new Set(categories);
        unique.add('Theme Park & Wahana');
        unique.add('Art & Light Exhibition');
        return Array.from(unique);
    }, [categories]);

    // Filter daftar park berdasarkan search query & kategori
    const filteredParks = useMemo(() => {
        return parks.filter((p) => {
            const matchesSearch = 
                p.name.toLowerCase().includes(parkSearch.toLowerCase()) ||
                (p.location_address && p.location_address.toLowerCase().includes(parkSearch.toLowerCase()));
            
            const matchesCategory = 
                selectedCategory === 'ALL' || 
                (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }, [parks, parkSearch, selectedCategory]);

    const [quantities, setQuantities] = useState({});
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoApplied, setPromoApplied] = useState('');
    const [promoError, setPromoError] = useState('');
    const [loadingPromo, setLoadingPromo] = useState(false);

    const handleQuantityChange = (inventoryId, delta) => {
        setQuantities(prev => {
            const current = prev[inventoryId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [inventoryId]: next };
        });
    };

    const handleDateSelect = (isoDate) => {
        router.get('/tickets', { date: isoDate, park_id: park?.id }, { preserveState: false });
    };

    const handleParkSelect = (parkId) => {
        setIsParkDropdownOpen(false);
        router.get('/tickets', { date: selectedDate, park_id: parkId }, { preserveState: false });
    };

    // Subtotal calculation
    const itemsSelected = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([invId, qty]) => {
            const inv = inventories.find(i => i.id === invId);
            return {
                inventory_id: invId,
                quantity: qty,
                price: inv ? inv.price : 0,
                name: inv ? inv.ticket_tier.name : '',
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
            date: selectedDate,
        });

        if (promoApplied) {
            params.append('promo', promoApplied);
        }

        router.get(`/tickets/checkout?${params.toString()}`);
    };

    const total = Math.max(0, subtotal - promoDiscount);

    return (
        <>
            <Head title={`Pesan Tiket | ${park?.name || 'Vurasi Tiket'}`} />

            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-36">
                
                {/* Header Navbar */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-orange-600 text-white pt-6 pb-12 px-4 sm:px-6 shadow-md">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold transition">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                        <span className="font-extrabold text-lg tracking-tight">VURASI MULTI-PARK PORTAL</span>
                    </div>

                    <div className="max-w-5xl mx-auto mt-6">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs text-white border border-white/20">
                                <MapPin className="w-3.5 h-3.5 text-amber-300" /> {park?.name || 'Pilih Wahana'}
                            </span>
                            {park?.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-500/80 text-[11px] font-bold text-white">
                                    {park.category}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pemesanan Tiket Masuk Resmi</h1>
                        <p className="text-white/80 text-xs sm:text-sm mt-1">
                            Pesan tiket untuk kunjungan hari ini hingga <strong>6 bulan ke depan</strong> dengan jaminan turnstile barcode resmi.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 space-y-6">
                    
                    {/* =========================================================
                        PEMBERITAHUAN KEBIJAKAN TIKET: NON-REFUNDABLE & RESCHEDULE
                    ========================================================= */}
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="text-xs space-y-1">
                            <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                                Kebijakan Penting Pemesanan Tiket:
                            </h3>
                            <p className="text-amber-900 leading-relaxed">
                                • <strong>Tidak Dapat Di-Refund:</strong> Tiket yang sudah dibeli dan dibayar <strong>tidak dapat dibatalkan atau diuangkan kembali (Non-Refundable)</strong> untuk alasan apa pun.
                            </p>
                            <p className="text-amber-900 leading-relaxed">
                                • <strong>Reschedule Gratis:</strong> Anda dapat mengubah tanggal kunjungan (Reschedule) <strong>secara gratis tanpa biaya tambahan</strong> melalui halaman cek e-tiket, <em>dengan syarat kuota tiket pada tanggal tujuan baru masih tersedia</em>. Jika kuota hari tersebut penuh/tutup, reschedule ke hari tersebut tidak dapat dilakukan.
                            </p>
                        </div>
                    </div>

                    {/* =========================================================
                        1. SELEKTOR THEME PARK DENGAN FILTER & SEARCH (SKALABEL 90-100+ PARK)
                    ========================================================= */}
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-indigo-600" /> 1. Pilih Destinasi / Wahana:
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tersedia <strong>{parks.length} destinasi</strong> aktif di platform. Gunakan pencarian atau filter kategori di bawah.
                                </p>
                            </div>

                            {/* Tombol Buka/Tutup Seluruh Pilihan jika banyak */}
                            <button
                                type="button"
                                onClick={() => setIsParkDropdownOpen(!isParkDropdownOpen)}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <span>{isParkDropdownOpen ? 'Kecilkan Pilihan' : 'Ganti Destinasi Lain'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isParkDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-2.5">
                                {/* Input Search */}
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama wahana, galeri, atau kota (contoh: Wonderpark, Bandung)..."
                                        value={parkSearch}
                                        onChange={(e) => {
                                            setParkSearch(e.target.value);
                                            setIsParkDropdownOpen(true);
                                        }}
                                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                                    />
                                    {parkSearch && (
                                        <button 
                                            type="button" 
                                            onClick={() => setParkSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Filter Kategori Tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory('ALL')}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                            selectedCategory === 'ALL'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Semua Kategori
                                    </button>
                                    {allCategories.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                                selectedCategory === cat
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info Destinasi Terpilih Saat Ini */}
                            <div className="p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/40 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                        <img 
                                            src={park?.image_url || 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=200&q=80'} 
                                            alt={park?.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=200&q=80'; }}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Sedang Dipilih</span>
                                            <span className="text-xs font-semibold text-slate-500">{park?.category}</span>
                                        </div>
                                        <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{park?.name}</h3>
                                        <p className="text-[11px] text-slate-500 truncate max-w-md">{park?.location_address}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-600 hidden sm:inline-block">✓ Aktif</span>
                            </div>

                            {/* Grid / List Pencarian jika mode ganti dibuka atau ada ketikan search */}
                            {(isParkDropdownOpen || parkSearch) && (
                                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-72 overflow-y-auto space-y-2">
                                    <div className="text-[11px] font-bold uppercase text-slate-400 px-1">
                                        Hasil Pencarian ({filteredParks.length} tempat):
                                    </div>
                                    {filteredParks.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-slate-400">
                                            Tidak ada destinasi yang cocok dengan pencarian "{parkSearch}".
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {filteredParks.map((p) => {
                                                const isSelected = park?.id === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handleParkSelect(p.id)}
                                                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                                                            isSelected 
                                                                ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20 shadow-xs' 
                                                                : 'border-slate-200 hover:border-indigo-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 mt-0.5">
                                                            <img 
                                                                src={p.image_url || 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=100&q=80'} 
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                                                                {isSelected && <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">Dipilih</span>}
                                                            </div>
                                                            <span className="text-[10px] text-orange-600 font-semibold block">{p.category}</span>
                                                            <p className="text-[11px] text-slate-400 truncate">{p.location_address}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =========================================================
                        2. SELEKTOR TANGGAL KUNJUNGAN: PILIHAN 7 HARI + PICKER 6 BULAN KE DEPAN
                    ========================================================= */}
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-indigo-600" /> 2. Pilih Tanggal Kunjungan:
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih tanggal cepat di bawah atau tentukan tanggal jauh-jauh hari hingga 6 bulan ke depan.
                                </p>
                            </div>

                            {/* Sisa Kuota Realtime */}
                            {capacity && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                                    <span>Kuota Tersedia:</span>
                                    <span className="text-sm font-extrabold text-emerald-700">
                                        {Math.max(0, capacity.max_capacity - capacity.booked_count).toLocaleString()} tiket
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Quick 7-Day Pills */}
                        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5 mb-4">
                            {quickDateOptions.map((opt) => {
                                const isSelected = selectedDate === opt.iso;
                                return (
                                    <button
                                        key={opt.iso}
                                        type="button"
                                        onClick={() => handleDateSelect(opt.iso)}
                                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                                            isSelected 
                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm -translate-y-0.5' 
                                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                            {opt.dayName}
                                        </span>
                                        <span className="text-sm sm:text-base font-extrabold mt-0.5">
                                            {opt.dateFormatted}
                                        </span>
                                        {opt.isWeekend && (
                                            <span className={`text-[9px] uppercase font-bold mt-1 px-1 py-0.2 rounded ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                Weekend
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Input Tanggal Bebas Hingga 6 Bulan ke Depan */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Pesan Jauh-Jauh Hari (Presale / Rencana Liburan)</h4>
                                    <p className="text-[11px] text-slate-500">
                                        Pilih tanggal spesifik mulai hari ini sampai {new Date(maxDateIso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="custom-date-picker" className="text-xs font-bold text-slate-600 shrink-0">
                                    Pilih Tanggal:
                                </label>
                                <input
                                    id="custom-date-picker"
                                    type="date"
                                    min={todayIso}
                                    max={maxDateIso}
                                    value={selectedDate}
                                    onChange={(e) => handleDateSelect(e.target.value)}
                                    className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 bg-white outline-none focus:border-indigo-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* =========================================================
                        3. DAFTAR KATEGORI TIKET & KUOTA HARIAN
                    ========================================================= */}
                    <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Ticket className="w-4 h-4 text-indigo-600" /> 3. Pilih Kategori Tiket ({new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}):
                            </h2>
                            <span className="text-xs text-slate-500 font-medium">Batas maks. 10 tiket / transaksi</span>
                        </div>

                        {inventories.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                                <h3 className="font-bold text-slate-900">Tidak Ada Tiket Tersedia</h3>
                                <p className="text-xs text-slate-500 mt-1">Kuota tiket untuk tanggal ini belum dibuka atau tempat sedang ditutup.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3.5">
                                {inventories.map((inv) => {
                                    const tier = inv.ticket_tier;
                                    const qty = quantities[inv.id] || 0;
                                    const remainingQuota = inv.total_quota - inv.booked_quota;
                                    const isSoldOut = remainingQuota <= 0;

                                    return (
                                        <div 
                                            key={inv.id}
                                            className={`bg-white rounded-2xl p-5 border transition flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                                                qty > 0 ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-600/20' : 'border-slate-200'
                                            }`}
                                        >
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="font-extrabold text-base text-slate-900">{tier.name}</h3>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                        isSoldOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {isSoldOut ? 'HABIS' : `Sisa ${remainingQuota} Tiket`}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">{tier.description || 'Akses masuk gerbang dan seluruh atraksi standar.'}</p>
                                                
                                                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                                                    {tier.min_age && <span>Min. Usia: {tier.min_age} th</span>}
                                                    {tier.max_height_cm && <span>Tinggi: &le; {tier.max_height_cm} cm</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                                                <div className="text-left md:text-right">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Harga</span>
                                                    <span className="text-xl font-black text-indigo-600">
                                                        Rp {new Intl.NumberFormat('id-ID').format(inv.price)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">/orang</span>
                                                </div>

                                                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                                    <button
                                                        type="button"
                                                        disabled={qty === 0 || isSoldOut}
                                                        onClick={() => handleQuantityChange(inv.id, -1)}
                                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold transition"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-extrabold text-sm text-slate-900">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={isSoldOut || qty >= Math.min(10, remainingQuota)}
                                                        onClick={() => handleQuantityChange(inv.id, 1)}
                                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* =========================================================
                        4. KODE PROMO / VOUCHER
                    ========================================================= */}
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-orange-500" /> Gunakan Kode Voucher / Promo:
                        </h2>
                        <div className="flex gap-2.5">
                            <input
                                type="text"
                                placeholder={`Kode voucher diskon untuk ${park?.name}...`}
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="flex-1 uppercase rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-mono font-bold focus:border-indigo-600 outline-none"
                            />
                            <button
                                type="button"
                                disabled={loadingPromo || !promoCode.trim()}
                                onClick={applyPromo}
                                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50"
                            >
                                {loadingPromo ? 'Mengecek...' : 'Terapkan'}
                            </button>
                        </div>
                        {promoApplied && (
                            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Kupon {promoApplied} aktif! Potongan Rp {new Intl.NumberFormat('id-ID').format(promoDiscount)}
                            </p>
                        )}
                        {promoError && (
                            <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {promoError}
                            </p>
                        )}
                    </div>

                </div>

                {/* BOTTOM FIXED CHECKOUT BAR */}
                {totalQuantity > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl z-40">
                        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                            <div>
                                <span className="text-[11px] text-slate-500 block">
                                    Total ({totalQuantity} Tiket) • {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-indigo-600">
                                        Rp {new Intl.NumberFormat('id-ID').format(total)}
                                    </span>
                                    {promoDiscount > 0 && (
                                        <span className="text-xs text-slate-400 line-through">
                                            Rp {new Intl.NumberFormat('id-ID').format(subtotal)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCheckout}
                                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
                            >
                                Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
