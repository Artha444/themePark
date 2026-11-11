import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Ticket, Calendar, Clock, MapPin, CheckCircle2, ChevronRight, 
    ArrowLeft, RefreshCw, QrCode, AlertCircle, ShoppingBag, ShieldCheck, X
} from 'lucide-react';

export default function OrderHistory({ orders = [] }) {
    // State untuk Reschedule modal
    const [reschedulingTicket, setReschedulingTicket] = useState(null);

    // Hitung tanggal min (hari ini) dan max (6 bulan ke depan)
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxDateIso = maxDate.toISOString().split('T')[0];

    const { data, setData, post, processing, errors, reset } = useForm({
        new_date: '',
    });

    const openRescheduleModal = (ticket) => {
        setReschedulingTicket(ticket);
        setData('new_date', '');
    };

    const handleRescheduleSubmit = (e) => {
        e.preventDefault();
        if (!reschedulingTicket) return;

        post(`/tickets/view/${reschedulingTicket.ticket_code}/reschedule`, {
            preserveScroll: true,
            onSuccess: () => {
                setReschedulingTicket(null);
                reset();
            },
        });
    };

    return (
        <>
            <Head title="Riwayat Pesanan & E-Tiket Saya | Vurasi" />

            <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
                
                {/* Navbar Header */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-orange-600 text-white pt-6 pb-12 px-4 sm:px-6 shadow-md">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                        <Link href="/tickets" className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20">
                            + Beli Tiket Baru
                        </Link>
                    </div>

                    <div className="max-w-5xl mx-auto mt-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs text-white border border-white/20 mb-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-300" /> Akun Pengunjung
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Riwayat Pesanan &amp; E-Tiket Saya</h1>
                        <p className="text-white/80 text-xs sm:text-sm mt-1">
                            Akses e-tiket resmi Anda kapan saja, tunjukkan barcode di pintu masuk, atau jadwalkan ulang (reschedule) secara gratis.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 space-y-6">
                    
                    {/* Flash Error Reschedule */}
                    {errors?.reschedule && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shadow-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Gagal Reschedule: {errors.reschedule}</span>
                        </div>
                    )}

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                                <Ticket className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-900">Belum Ada Pesanan Tiket</h2>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                Anda belum memiliki riwayat pemesanan tiket. Jelajahi pilihan wahana dan beli tiket Anda sekarang!
                            </p>
                            <Link
                                href="/tickets"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
                            >
                                Cari &amp; Pesan Tiket
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <div 
                                    key={order.id}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition hover:shadow-md"
                                >
                                    {/* Order Header */}
                                    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                <Ticket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-extrabold text-sm text-slate-900">{order.order_code}</span>
                                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {order.status === 'PAID' ? '✓ LUNAS & TERKONFIRMASI' : order.status}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-400">
                                                    Dipesan pada {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pembayaran</span>
                                            <span className="text-lg font-black text-indigo-600">
                                                Rp {new Intl.NumberFormat('id-ID').format(order.total_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Content */}
                                    <div className="p-6 space-y-5">
                                        {/* Info Destinasi */}
                                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                                <img 
                                                    src={order.park?.image_url || 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=200&q=80'} 
                                                    alt={order.park?.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=200&q=80'; }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-extrabold uppercase text-orange-600 tracking-wider">
                                                    {order.park?.category || 'Destinasi Wahana'}
                                                </span>
                                                <h3 className="font-extrabold text-sm text-slate-900 truncate">{order.park?.name}</h3>
                                                <p className="text-[11px] text-slate-500 truncate">{order.park?.location_address}</p>
                                            </div>
                                        </div>

                                        {/* List E-Tiket per Item */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                Daftar E-Tiket Masuk ({order.items?.reduce((acc, it) => acc + (it.issued_tickets?.length || 0), 0)} Tiket):
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {order.items?.map((item) => (
                                                    item.issued_tickets?.map((tkt) => (
                                                        <div 
                                                            key={tkt.id}
                                                            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition flex flex-col justify-between gap-3 shadow-2xs"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-xs font-extrabold text-slate-900">{tkt.ticket_code}</span>
                                                                        <span className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full ${
                                                                            tkt.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' :
                                                                            tkt.status === 'USED' ? 'bg-amber-100 text-amber-800' :
                                                                            'bg-rose-100 text-rose-800'
                                                                        }`}>
                                                                            {tkt.status === 'VALID' ? 'SIAP PAKAI' : tkt.status === 'USED' ? 'SUDAH DI-SCAN' : tkt.status}
                                                                        </span>
                                                                    </div>
                                                                    <h5 className="font-bold text-xs text-slate-700 mt-1">{item.daily_inventory?.ticket_tier?.name}</h5>
                                                                    <span className="text-[11px] font-semibold text-orange-600 flex items-center gap-1 mt-0.5">
                                                                        <Calendar className="w-3.5 h-3.5" /> Berlaku: {tkt.valid_date}
                                                                    </span>
                                                                </div>

                                                                <Link
                                                                    href={`/tickets/view/${tkt.ticket_code}`}
                                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
                                                                    title="Tampilkan QR Code"
                                                                >
                                                                    <QrCode className="w-5 h-5" />
                                                                </Link>
                                                            </div>

                                                            {/* Action Buttons: Lihat Barcode / Reschedule */}
                                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                                <Link
                                                                    href={`/tickets/view/${tkt.ticket_code}`}
                                                                    className="flex-1 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] text-center transition flex items-center justify-center gap-1"
                                                                >
                                                                    <QrCode className="w-3.5 h-3.5" /> Buka QR Tiket
                                                                </Link>

                                                                {tkt.status === 'VALID' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openRescheduleModal(tkt)}
                                                                        className="py-1.5 px-3 rounded-lg border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-600 font-bold text-[11px] transition flex items-center gap-1"
                                                                    >
                                                                        <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {/* =========================================================
                    MODAL RESCHEDULE TIKET
                ========================================================= */}
                {reschedulingTicket && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm text-slate-900">Reschedule Tanggal Tiket</h3>
                                        <span className="text-[11px] text-slate-400 font-mono">{reschedulingTicket.ticket_code}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReschedulingTicket(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                                <span className="font-bold flex items-center gap-1 text-amber-950">
                                    <ShieldCheck className="w-4 h-4 text-amber-600" /> Ketentuan Reschedule Gratis:
                                </span>
                                <p>• Tanggal tiket saat ini: <strong>{reschedulingTicket.valid_date}</strong></p>
                                <p>• Bebas biaya 100%, kuota tanggal baru harus tersedia.</p>
                            </div>

                            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Pilih Tanggal Kunjungan Baru:
                                    </label>
                                    <input
                                        type="date"
                                        min={todayIso}
                                        max={maxDateIso}
                                        required
                                        value={data.new_date}
                                        onChange={(e) => setData('new_date', e.target.value)}
                                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                        Bisa memilih hingga 6 bulan ke depan (sampai {new Date(maxDateIso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.new_date}
                                        className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs transition shadow-sm"
                                    >
                                        {processing ? 'Menyimpan...' : 'Konfirmasi Reschedule'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReschedulingTicket(null)}
                                        className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}

