import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Ticket, CheckCircle2, ChevronRight, Tag, AlertCircle, ArrowLeft, MapPin } from 'lucide-react';

export default function TicketIndex({ parks = [], park, selectedDate, capacity, inventories = [] }) {
    // Generate dates for next 7 days
    const today = new Date();
    const dateOptions = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const dayName = i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return { iso, dayName, dateFormatted, isWeekend: d.getDay() === 0 || d.getDay() === 6 };
    });

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
                body: JSON.stringify({ code: promoCode, subtotal }),
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
            <Head title={`Pesan Tiket | ${park?.name || 'Vurasi Pameran Seni'}`} />

            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] pb-36">
                
                {/* Header Navbar */}
                <div className="bg-[#4F46E5] text-white pt-6 pb-12 px-6 shadow-md">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition">
                            <ArrowLeft className="w-5 h-5" /> Kembali ke Beranda
                        </Link>
                        <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl tracking-tight">VURASI TICKETING</span>
                    </div>

                    <div className="max-w-5xl mx-auto mt-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs text-white/90 mb-2 border border-white/15">
                            <MapPin className="w-3.5 h-3.5 text-amber-300" /> {park?.name || 'Theme Park'}
                        </span>
                        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold">Pemesanan Tiket Masuk Resmi</h1>
                        <p className="text-white/80 text-sm mt-1">Pilih theme park, tanggal kunjungan, dan jumlah tiket yang Anda inginkan.</p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 -mt-6 space-y-8">
                    
                    {/* 1. SELEKTOR THEME PARK / LOKASI */}
                    {parks.length > 1 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#4F46E5]" /> 1. Pilih Theme Park / Galeri Pameran:
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {parks.map((p) => {
                                    const isSelected = park?.id === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleParkSelect(p.id)}
                                            className={`text-left p-4 rounded-xl border transition-all ${
                                                isSelected 
                                                    ? 'border-[#4F46E5] bg-indigo-50/50 ring-2 ring-[#4F46E5]/20 shadow-xs' 
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-[#0F172A]">{p.name}</h3>
                                                {isSelected && <span className="text-[10px] font-bold text-[#4F46E5] bg-indigo-100 px-2 py-0.5 rounded-full">Aktif</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 truncate">{p.location_address}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. SELEKTOR TANGGAL KUNJUNGAN */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#4F46E5]" /> 2. Pilih Tanggal Kunjungan:
                            </h2>
                            {capacity && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                                    Sisa Kuota Hari Ini: {capacity.max_capacity - capacity.booked_count} tiket
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                            {dateOptions.map((opt) => {
                                const isSelected = selectedDate === opt.iso;
                                return (
                                    <button
                                        key={opt.iso}
                                        type="button"
                                        onClick={() => handleDateSelect(opt.iso)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                            isSelected 
                                                ? 'border-[#4F46E5] bg-[#4F46E5] text-white shadow-md -translate-y-0.5' 
                                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                        }`}
                                    >
                                        <span className={`text-[11px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                            {opt.dayName}
                                        </span>
                                        <span className="text-base font-extrabold mt-0.5">
                                            {opt.dateFormatted}
                                        </span>
                                        {opt.isWeekend && (
                                            <span className={`text-[9px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                Weekend
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. DAFTAR TIKET & KUOTA HARIAN */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-[#4F46E5]" /> 3. Pilih Kategori Tiket ({selectedDate}):
                        </h2>

                        {inventories.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                                <h3 className="font-bold text-[#0F172A]">Tidak Ada Tiket Tersedia</h3>
                                <p className="text-sm text-slate-500 mt-1">Kuota tiket untuk tanggal ini belum dibuka atau sudah habis.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {inventories.map((inv) => {
                                    const tier = inv.ticket_tier;
                                    const qty = quantities[inv.id] || 0;
                                    const remainingQuota = inv.total_quota - inv.booked_quota;
                                    const isSoldOut = remainingQuota <= 0;

                                    return (
                                        <div 
                                            key={inv.id}
                                            className={`bg-white rounded-2xl p-6 border transition flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                                                qty > 0 ? 'border-[#4F46E5] shadow-sm' : 'border-slate-200'
                                            }`}
                                        >
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg text-[#0F172A]">{tier.name}</h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        isSoldOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {isSoldOut ? 'HABIS' : `Sisa ${remainingQuota} Tiket`}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500">{tier.description}</p>
                                                
                                                {tier.perks && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {tier.perks.map((p, idx) => (
                                                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                                ✓ {p}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                                                <div className="text-left md:text-right">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Harga</span>
                                                    <span className="text-xl font-extrabold text-[#4F46E5]">
                                                        Rp {new Intl.NumberFormat('id-ID').format(inv.price)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={qty === 0 || isSoldOut}
                                                        onClick={() => handleQuantityChange(inv.id, -1)}
                                                        className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-base text-[#0F172A]">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={isSoldOut || qty >= Math.min(10, remainingQuota)}
                                                        onClick={() => handleQuantityChange(inv.id, 1)}
                                                        className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
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

                    {/* 4. KODE PROMO */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#F59E0B]" /> Gunakan Kode Voucher / Promo:
                        </h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Masukkan kode (contoh: SERU20)"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="flex-1 uppercase rounded-xl border-slate-200 text-sm focus:border-[#4F46E5] focus:ring-[#4F46E5]"
                            />
                            <button
                                type="button"
                                disabled={loadingPromo || !promoCode.trim()}
                                onClick={applyPromo}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50"
                            >
                                {loadingPromo ? 'Mengecek...' : 'Terapkan'}
                            </button>
                        </div>
                        {promoApplied && (
                            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Kode {promoApplied} berhasil digunakan! Diskon Rp {new Intl.NumberFormat('id-ID').format(promoDiscount)}
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
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-40">
                        <div className="max-w-5xl mx-auto flex items-center justify-between">
                            <div>
                                <span className="text-xs text-slate-500 block">
                                    Total ({totalQuantity} Tiket) • {selectedDate}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-extrabold text-[#4F46E5]">
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
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F43F5E] hover:bg-[#E11D48] active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
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
