import { Head, Link } from '@inertiajs/react';
import { QrCode, MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, Ticket } from 'lucide-react';

export default function TicketShow({ ticket }) {
    const isValid = ticket.status === 'VALID';
    const isUsed = ticket.status === 'USED';
    const tier = ticket.order_item?.daily_inventory?.ticket_tier;
    const park = ticket.park;

    return (
        <>
            <Head title={`Tiket ${ticket.ticket_code} | Wonderpark`} />

            <div className="min-h-screen bg-[#0F172A] text-white font-['Inter'] py-12 px-6 flex flex-col items-center justify-center">
                
                {/* Back button */}
                <div className="w-full max-w-md mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>
                </div>

                {/* Digital Ticket Card */}
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    
                    {/* Top Accent Gradient */}
                    <div className="bg-gradient-to-r from-[#4F46E5] to-[#F43F5E] p-6 text-center">
                        <div className="inline-flex items-center gap-2 text-white font-['Plus_Jakarta_Sans'] font-extrabold text-2xl">
                            <Ticket className="w-7 h-7 text-[#F59E0B]" /> WONDERPARK
                        </div>
                        <p className="text-white/80 text-xs mt-1 font-medium">{park?.name || 'Wonderpark World Resort'}</p>
                    </div>

                    {/* Status Banner */}
                    <div className={`p-3 text-center text-xs font-bold uppercase tracking-wider ${
                        isValid ? 'bg-emerald-500/20 text-emerald-400 border-b border-emerald-500/30' :
                        isUsed ? 'bg-amber-500/20 text-amber-400 border-b border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border-b border-rose-500/30'
                    }`}>
                        {isValid && '✓ TIKET AKTIF & DAPAT DIGUNAKAN'}
                        {isUsed && '⚠ TIKET SUDAH DIGUNAKAN UNTUK ENTRY'}
                        {!isValid && !isUsed && `STATUS TIKET: ${ticket.status}`}
                    </div>

                    {/* Ticket Content Body */}
                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                        
                        {/* QR Code Container */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center border-4 border-slate-800">
                            <QrCode className="w-44 h-44 text-slate-900" />
                            <span className="mt-3 text-[11px] font-mono font-bold text-slate-600 tracking-wider">
                                {ticket.qr_token}
                            </span>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">
                                Tipe Tiket
                            </span>
                            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-white">
                                {tier?.name || 'All Access Ticket'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">{tier?.description}</p>
                        </div>

                        {/* Detail Badges */}
                        <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                            <div className="bg-slate-800/60 p-3 rounded-xl text-left border border-slate-700/50">
                                <span className="text-[10px] text-slate-400 block font-semibold">Berlaku Tanggal</span>
                                <span className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" /> {ticket.valid_date}
                                </span>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-xl text-left border border-slate-700/50">
                                <span className="text-[10px] text-slate-400 block font-semibold">Kode Tiket</span>
                                <span className="font-mono font-bold text-sm text-white mt-0.5 block">
                                    {ticket.ticket_code}
                                </span>
                            </div>
                        </div>

                        {/* Entry Rules Note */}
                        <div className="w-full bg-slate-800/40 p-4 rounded-xl text-left border border-slate-800 text-xs text-slate-400 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Petunjuk Masuk Gate:
                            </div>
                            <p>1. Tunjukkan QR code ini ke scanner di gerbang masuk.</p>
                            <p>2. Tiket hanya dapat di-scan 1 kali untuk 1 pengunjung.</p>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
}
