import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    QrCode, MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, 
    ArrowLeft, ShieldCheck, Ticket, RefreshCw, AlertCircle, Info, X
} from 'lucide-react';

export default function TicketShow({ ticket, flash = {} }) {
    const isValid = ticket.status === 'VALID';
    const isUsed = ticket.status === 'USED';
    const tier = ticket.order_item?.daily_inventory?.ticket_tier;
    const park = ticket.park;

    // Hitung min date (hari ini) dan max date (6 bulan ke depan)
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxDateIso = maxDate.toISOString().split('T')[0];

    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        new_date: '',
    });

    const handleRescheduleSubmit = (e) => {
        e.preventDefault();
        post(`/tickets/view/${ticket.ticket_code}/reschedule`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRescheduleOpen(false);
                reset();
            },
        });
    };

    return (
        <>
            <Head title={`Tiket ${ticket.ticket_code} | ${park?.name || 'Vurasi'}`} />

            <div className="min-h-screen bg-slate-950 text-white font-sans py-10 px-4 sm:px-6 flex flex-col items-center justify-center">
                
                {/* Back button */}
                <div className="w-full max-w-lg mb-4 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>
                    <span className="text-xs text-slate-500 font-mono">ID: {ticket.ticket_code}</span>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="w-full max-w-lg mb-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {errors?.reschedule && (
                    <div className="w-full max-w-lg mb-4 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{errors.reschedule}</span>
                    </div>
                )}

                {/* Digital Ticket Card */}
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    
                    {/* Top Accent Gradient Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-orange-600 p-6 text-center">
                        <div className="inline-flex items-center gap-2 text-white font-extrabold text-2xl tracking-tight">
                            <Ticket className="w-7 h-7 text-amber-300" /> VURASI E-TICKET
                        </div>
                        <p className="text-white/90 text-xs mt-1 font-semibold">{park?.name || 'Theme Park Resort'}</p>
                        <p className="text-white/70 text-[11px] truncate max-w-sm mx-auto">{park?.location_address}</p>
                    </div>

                    {/* Status Banner */}
                    <div className={`p-3 text-center text-xs font-extrabold uppercase tracking-wider ${
                        isValid ? 'bg-emerald-500/20 text-emerald-400 border-b border-emerald-500/30' :
                        isUsed ? 'bg-amber-500/20 text-amber-400 border-b border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border-b border-rose-500/30'
                    }`}>
                        {isValid && '✓ TIKET AKTIF & SIAP DI-SCAN'}
                        {isUsed && '⚠ TIKET SUDAH DIGUNAKAN DI GERBANG ENTRY'}
                        {!isValid && !isUsed && `STATUS TIKET: ${ticket.status}`}
                    </div>

                    {/* Ticket Content Body */}
                    <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
                        
                        {/* QR Code Container */}
                        <div className="bg-white p-5 rounded-2xl shadow-xl flex flex-col items-center border-4 border-slate-800">
                            <QrCode className="w-40 h-40 sm:w-44 sm:h-44 text-slate-900" />
                            <span className="mt-2 text-[11px] font-mono font-extrabold text-slate-700 tracking-wider">
                                {ticket.qr_token}
                            </span>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold block mb-1">
                                Kategori Tiket
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-white">
                                {tier?.name || 'General Admission Ticket'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                {tier?.description || 'Akses masuk gerbang dan wahana atraksi reguler.'}
                            </p>
                        </div>

                        {/* Detail Badges */}
                        <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-left">
                            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60">
                                <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Berlaku</span>
                                <span className="font-extrabold text-sm text-amber-400 flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {ticket.valid_date}
                                </span>
                            </div>
                            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60">
                                <span className="text-[10px] text-slate-400 block font-semibold">Kode Tiket</span>
                                <span className="font-mono font-extrabold text-sm text-white mt-0.5 block truncate">
                                    {ticket.ticket_code}
                                </span>
                            </div>
                        </div>

                        {/* RESCHEDULE ACTION BUTTON (JIKA TIKET MASIH VALID) */}
                        {isValid && (
                            <div className="w-full pt-2">
                                {!isRescheduleOpen ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsRescheduleOpen(true)}
                                        className="w-full py-3 px-4 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-indigo-500/40 shadow-sm transition"
                                    >
                                        <RefreshCw className="w-4 h-4 text-amber-300" />
                                        <span>Reschedule Tanggal Kunjungan (Gratis)</span>
                                    </button>
                                ) : (
                                    <form onSubmit={handleRescheduleSubmit} className="bg-slate-800/80 p-4 rounded-2xl border border-indigo-500/40 text-left space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Pilih Tanggal Baru Reschedule:
                                            </h4>
                                            <button 
                                                type="button" 
                                                onClick={() => setIsRescheduleOpen(false)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            Pemindahan tanggal bebas biaya <strong>(Gratis)</strong> selama kuota tiket pada tanggal tujuan masih mencukupi.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="date"
                                                min={todayIso}
                                                max={maxDateIso}
                                                required
                                                value={data.new_date}
                                                onChange={(e) => setData('new_date', e.target.value)}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-indigo-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processing || !data.new_date}
                                                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition"
                                            >
                                                {processing ? 'Menyimpan...' : 'Konfirmasi Tanggal'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* KEBIJAKAN REFUND & RESCHEDULE PENTING */}
                        <div className="w-full bg-amber-500/10 p-4 rounded-2xl text-left border border-amber-500/25 text-xs text-amber-200/90 space-y-1.5">
                            <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" /> Kebijakan Tiket Vurasi:
                            </div>
                            <p className="leading-relaxed">
                                1. <strong>Tidak Dapat Di-Refund:</strong> Tiket yang sudah dibeli bersifat pasti dan tidak dapat diuangkan kembali.
                            </p>
                            <p className="leading-relaxed">
                                2. <strong>Reschedule Gratis:</strong> Pemindahan tanggal kunjungan gratis 100% dengan tetap melihat ketersediaan kuota harian tiket. Jika kuota tanggal tujuan sudah habis, reschedule ke tanggal tersebut tidak dapat diproses.
                            </p>
                        </div>

                        {/* Entry Rules Note */}
                        <div className="w-full bg-slate-800/40 p-4 rounded-2xl text-left border border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Petunjuk Masuk Turnstile Gate:
                            </div>
                            <p>• Arahkan layar ponsel berisi QR Code ini langsung ke optik scanner gerbang masuk.</p>
                            <p>• Setiap tiket hanya dapat di-scan 1 kali untuk 1 orang pengunjung.</p>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
}
