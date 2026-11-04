import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { LayoutDashboard, Users, Ticket, DollarSign, Activity, AlertTriangle, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, Wrench, XCircle } from 'lucide-react';

export default function AdminDashboard({ park, metrics, attractions, inventories, recentOrders, liveCheckIns, gates }) {
    const [activeTab, setActiveTab] = useState('attractions');

    const handleAttractionStatusChange = (attractionId, newStatus) => {
        router.post(`/admin/attractions/${attractionId}/status`, {
            status: newStatus,
        }, {
            preserveScroll: true,
        });
    };

    const capacityPercent = Math.min(100, Math.round((metrics.booked_capacity / metrics.max_capacity) * 100));

    return (
        <>
            <Head title="Admin Management | Wonderpark" />

            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] pb-24">
                
                {/* Admin Navbar */}
                <div className="bg-slate-900 text-white px-8 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B]">
                                MANAGEMENT SYSTEM PORTAL
                            </span>
                            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-white">
                                {park?.name || 'Wonderpark Admin'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/scanner" className="px-4 py-2 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-bold text-xs rounded-xl shadow-md transition">
                            Buka Gate Scanner
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                    
                    {/* METRICS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* Revenue Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase">Pendapatan Hari Ini</span>
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#0F172A]">
                                Rp {Number(metrics.revenue_today).toLocaleString('id-ID')}
                            </h3>
                            <span className="text-xs text-emerald-600 font-semibold mt-1 block">Live transaksi masuk</span>
                        </div>

                        {/* Tickets Sold Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase">Tiket Terjual Hari Ini</span>
                                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#F43F5E]">
                                    <Ticket className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#0F172A]">
                                {metrics.tickets_sold_today} Tiket
                            </h3>
                            <span className="text-xs text-slate-500 font-medium mt-1 block">E-Ticket terkonfirmasi</span>
                        </div>

                        {/* Check-ins Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase">Pengunjung Masuk Gate</span>
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#0F172A]">
                                {metrics.checkins_today} Pengunjung
                            </h3>
                            <span className="text-xs text-emerald-600 font-semibold mt-1 block">Telah di-scan di gate</span>
                        </div>

                        {/* Capacity Meter Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Kapasitas Hari Ini</span>
                                <span className="text-xs font-bold text-[#4F46E5]">{capacityPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                                <div className="bg-[#4F46E5] h-full rounded-full" style={{ width: `${capacityPercent}%` }}></div>
                            </div>
                            <h4 className="font-bold text-sm text-[#0F172A]">
                                {metrics.booked_capacity} / {metrics.max_capacity} Kuota
                            </h4>
                        </div>
                    </div>

                    {/* MAIN MANAGEMENT CONTENT */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-100 gap-8 mb-6">
                            <button
                                onClick={() => setActiveTab('attractions')}
                                className={`pb-4 text-sm font-bold transition border-b-2 ${
                                    activeTab === 'attractions'
                                        ? 'border-[#4F46E5] text-[#4F46E5]'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                Status Wahana ({attractions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`pb-4 text-sm font-bold transition border-b-2 ${
                                    activeTab === 'orders'
                                        ? 'border-[#4F46E5] text-[#4F46E5]'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                Pesanan Terbaru ({recentOrders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('checkins')}
                                className={`pb-4 text-sm font-bold transition border-b-2 ${
                                    activeTab === 'checkins'
                                        ? 'border-[#4F46E5] text-[#4F46E5]'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                Log Scan Entry Gate ({liveCheckIns.length})
                            </button>
                        </div>

                        {/* TAB 1: ATTRACTIONS CONTROL */}
                        {activeTab === 'attractions' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {attractions.map((attraction) => (
                                    <div key={attraction.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-[#4F46E5] uppercase bg-indigo-50 px-2 py-0.5 rounded">
                                                    {attraction.zone?.name}
                                                </span>
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                    attraction.status === 'OPERATIONAL' ? 'bg-emerald-100 text-emerald-800' :
                                                    attraction.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {attraction.status}
                                                </span>
                                            </div>
                                            <h4 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-[#0F172A]">
                                                {attraction.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">{attraction.description}</p>
                                        </div>

                                        {/* Status Control Buttons */}
                                        <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleAttractionStatusChange(attraction.id, 'OPERATIONAL')}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                                                    attraction.status === 'OPERATIONAL'
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                Buka
                                            </button>
                                            <button
                                                onClick={() => handleAttractionStatusChange(attraction.id, 'MAINTENANCE')}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                                                    attraction.status === 'MAINTENANCE'
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                Perbaikan
                                            </button>
                                            <button
                                                onClick={() => handleAttractionStatusChange(attraction.id, 'CLOSED')}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                                                    attraction.status === 'CLOSED'
                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB 2: RECENT ORDERS */}
                        {activeTab === 'orders' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                                            <th className="py-3 px-4">Kode Pesanan</th>
                                            <th className="py-3 px-4">Pemesan</th>
                                            <th className="py-3 px-4">Total</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Waktu</th>
                                            <th className="py-3 px-4">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentOrders.map((ord) => (
                                            <tr key={ord.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-[#4F46E5]">{ord.order_code}</td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-[#0F172A] block">{ord.customer_name}</span>
                                                    <span className="text-[10px] text-slate-400">{ord.customer_email}</span>
                                                </td>
                                                <td className="py-3 px-4 font-extrabold text-[#0F172A]">
                                                    Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        {ord.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">{new Date(ord.created_at).toLocaleTimeString('id-ID')}</td>
                                                <td className="py-3 px-4">
                                                    <Link href={`/tickets/order/${ord.order_code}`} className="font-bold text-[#4F46E5] hover:underline">
                                                        Lihat E-Ticket
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB 3: GATE LOGS */}
                        {activeTab === 'checkins' && (
                            <div className="space-y-3">
                                {liveCheckIns.map((log) => (
                                    <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <span className="font-mono font-bold text-sm text-[#0F172A] block">
                                                    {log.ticket?.ticket_code || 'TKT-SCAN'}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Scan di {log.gate?.gate_name} • oleh {log.staff_user?.full_name || 'Petugas'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">
                                            {new Date(log.scan_time).toLocaleTimeString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}
