import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, QrCode, Ticket, Download, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

export default function OrderSummary({ order }) {
    const items = order?.items || [];
    const payment = order?.payment;

    return (
        <>
            <Head title={`E-Ticket #${order.order_code} | Wonderpark`} />

            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] pb-24">
                
                {/* Header Badge */}
                <div className="bg-[#10B981] text-white pt-10 pb-16 px-6 text-center">
                    <div className="max-w-2xl mx-auto flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Pembayaran Berhasil & Lunas</span>
                        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold mt-1">E-Ticket Terbit!</h1>
                        <p className="text-white/80 text-sm mt-1">Kode Pesanan: <span className="font-mono font-bold text-white">{order.order_code}</span></p>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 -mt-8">
                    
                    {/* Customer Info Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="text-xs text-slate-400 block font-semibold uppercase">Pemegang Tiket</span>
                            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#0F172A]">{order.customer_name}</h2>
                            <p className="text-xs text-slate-500">{order.customer_email} • {order.customer_phone}</p>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-right">
                            <span className="text-[10px] text-[#4F46E5] font-bold block uppercase">Total Dibayar</span>
                            <span className="font-extrabold text-lg text-[#4F46E5]">Rp {Number(order.total_amount).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Issued Tickets List */}
                    <div className="space-y-6">
                        <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl text-[#0F172A] flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-[#4F46E5]" /> Daftar Tiket Fisik Digital ({items.reduce((acc, it) => acc + (it.issued_tickets?.length || 0), 0)} Tiket)
                        </h3>

                        {items.map((item) => {
                            const tierName = item.daily_inventory?.ticket_tier?.name || 'Tiket Wonderpark';
                            const tickets = item.issued_tickets || [];

                            return tickets.map((tkt, tidx) => (
                                <div key={tkt.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                                    <div className="w-full md:w-48 bg-slate-900 text-white rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <QrCode className="w-28 h-28 text-white mb-2" />
                                        <span className="text-[10px] font-mono text-slate-400 break-all">{tkt.qr_token}</span>
                                    </div>

                                    <div className="flex-1 space-y-2 w-full">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                                {tierName}
                                            </span>
                                            <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                                                tkt.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {tkt.status === 'VALID' ? '✓ SIAP DI-SCAN' : tkt.status}
                                            </span>
                                        </div>

                                        <h4 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-[#0F172A]">
                                            Kode Tiket: {tkt.ticket_code}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Berlaku Pada Tanggal: <span className="font-bold text-[#0F172A]">{tkt.valid_date}</span>
                                        </p>

                                        <div className="pt-2 flex items-center gap-3">
                                            <Link 
                                                href={`/tickets/view/${tkt.ticket_code}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline"
                                            >
                                                Buka Tampilan Tiket Mandiri <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ));
                        })}
                    </div>

                    {/* Quick Link to Test Gate Scanner */}
                    <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-lg">Ingin Mengetes Simulasi Gate Entry?</h4>
                            <p className="text-xs text-slate-400">Buka portal Gate Staff Scanner untuk mencoba men-scan QR Token di atas.</p>
                        </div>
                        <Link 
                            href="/scanner" 
                            className="px-6 py-3 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
                        >
                            Buka Gate Scanner PWA
                        </Link>
                    </div>

                </div>
            </div>
        </>
    );
}
