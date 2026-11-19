import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign, Ticket, Users, MapPin, Clock, Building2,
    ChevronRight, ScanLine, Gauge, Wallet, Save, ArrowLeft, Lock, Unlock, ShoppingCart,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

const formatIDR = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

// Format Rupiah input helper
const formatNumberDisplay = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = String(val).replace(/[^0-9]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('id-ID');
};

export default function AdminParkDetail({
    parks = [],
    park,
    today,
    adminRole,
    isSuperAdmin = true,
    detail,
    recentOrders = [],
}) {
    // Inventaris hari ini
    const [inventories, setInventories] = useState(detail?.inventories || []);
    const [savingId, setSavingId] = useState(null);

    const updateLocalInventory = (id, patch) => {
        setInventories((current) => current.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)));
    };

    const parseRawNumber = (displayVal) => {
        const cleaned = String(displayVal).replace(/[^0-9]/g, '');
        return cleaned === '' ? '' : Number(cleaned);
    };

    const saveInventory = (inv) => {
        setSavingId(inv.id);
        router.post('/admin/inventory/update', {
            inventory_id: inv.id,
            price: Number(inv.price) || 0,
            total_quota: Number(inv.total_quota) || 0,
            is_open: Boolean(inv.is_open),
        }, {
            preserveScroll: true,
            onFinish: () => setSavingId(null),
        });
    };

    const toggleInventoryOpen = (inv) => {
        const next = { ...inv, is_open: !inv.is_open };
        updateLocalInventory(inv.id, { is_open: next.is_open });
        saveInventory(next);
    };

    const status = detail?.status || { is_closed: false, reason: null };
    const capacity = detail?.capacity || { booked: 0, max: 0 };
    const metrics = detail?.metrics || { revenue_today: 0, tickets_today: 0, checkins_today: 0 };
    const finance = detail?.finance || {
        revenue_today: 0, revenue_7_days: 0, revenue_30_days: 0,
        discount_30_days: 0, paid_orders_30_days: 0, avg_order_value_30_days: 0,
        pending_orders_today: 0, pending_amount_today: 0,
    };
    const gates = detail?.gates || [];
    const gateLogs = detail?.gate_logs || [];

    const capacityPercent = capacity.max > 0
        ? Math.min(100, Math.round((capacity.booked / capacity.max) * 100))
        : 0;

    return (
        <>
            <Head title={`Detail ${park?.name} | Vurasi Admin`} />

            <AdminLayout parks={parks} park={park} isSuperAdmin={isSuperAdmin}>
                {/* BREADCRUMB */}
                <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-4" aria-label="Breadcrumb">
                    <Link href="/admin" className="inline-flex items-center gap-1 hover:text-orange-600 transition">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Overview Pusat
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-700">{park?.name}</span>
                </nav>

                {/* HERO PARK + STATUS HARI INI */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 mb-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="relative w-full lg:w-56 h-40 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group">
                            <img
                                src={park?.image_url || 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=600&q=80'}
                                alt={park?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=600&q=80';
                                }}
                            />
                            <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                status.is_closed ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                            }`}>
                                {status.is_closed ? 'Tutup Hari Ini' : 'Buka Hari Ini'}
                            </span>
                        </div>

                        <div className="flex-1 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                {isSuperAdmin && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-100 text-orange-800">
                                        Destinasi Aktif
                                    </span>
                                )}
                                {park?.city && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                        <MapPin className="h-3 w-3" /> {park.city}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{park?.name}</h1>
                            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">{park?.description || ''}</p>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-1">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-orange-600" /> {park?.location_address}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-orange-600" /> {park?.open_time?.substring(0, 5)}–{park?.close_time?.substring(0, 5)} WIB
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-orange-600" /> Kuota {formatNumber(capacity.max)}/hari
                                </span>
                                {status.is_closed && status.reason && (
                                    <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                                        Alasan: {status.reason}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="shrink-0 flex flex-col gap-3 lg:w-48">
                            <Link
                                href={`/admin/manage?park_id=${park?.id || ''}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                            >
                                Kelola Park &amp; Tiket <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                href={`/admin/sales?park_id=${park?.id || ''}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                            >
                                Grafik Penjualan
                            </Link>
                        </div>
                    </div>
                </div>

                {/* KPI PARK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Omzet Hari Ini</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatIDR(metrics.revenue_today)}</h3>
                        <span className="text-[11px] text-emerald-600 font-semibold">Transaksi PAID</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Tiket Terjual</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Ticket className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatNumber(metrics.tickets_today)}</h3>
                        <span className="text-[11px] text-blue-600 font-semibold">Diterbitkan hari ini</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Check-In Gerbang</span>
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatNumber(metrics.checkins_today)}</h3>
                        <span className="text-[11px] text-orange-600 font-semibold">Kunjungan berhasil scan</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Utilisasi Kapasitas</span>
                            <Gauge className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${capacityPercent}%` }} />
                        </div>
                        <h4 className="font-bold text-xs text-slate-700">
                            {formatNumber(capacity.booked)} / {formatNumber(capacity.max)} Kuota ({capacityPercent}%)
                        </h4>
                    </div>
                </div>

                {/* LAPORAN KEUANGAN PARSIAL */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-lg font-extrabold text-slate-900">Laporan Keuangan Parsial Cabang</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-5">Ringkasan omzet pesanan berstatus PAID untuk {park?.name}</p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Omzet Hari Ini</span>
                            <span className="block text-xl font-black text-slate-900 mt-1">{formatIDR(finance.revenue_today)}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Omzet 7 Hari</span>
                            <span className="block text-xl font-black text-slate-900 mt-1">{formatIDR(finance.revenue_7_days)}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Omzet 30 Hari</span>
                            <span className="block text-xl font-black text-emerald-700 mt-1">{formatIDR(finance.revenue_30_days)}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Pesanan</span>
                            <span className="block text-xl font-black text-slate-900 mt-1">{formatIDR(finance.avg_order_value_30_days)}</span>
                            <span className="block text-[11px] text-slate-400 mt-0.5">{formatNumber(finance.paid_orders_30_days)} pesanan lunas / 30 hari</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-orange-500">Diskon Diberikan (30 Hari)</span>
                            <span className="block text-lg font-black text-orange-700 mt-1">{formatIDR(finance.discount_30_days)}</span>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-500">Menunggu Pembayaran (Hari Ini)</span>
                            <span className="block text-lg font-black text-amber-700 mt-1">
                                {formatNumber(finance.pending_orders_today)} pesanan · {formatIDR(finance.pending_amount_today)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MANAJEMEN INVENTARIS HARIAN */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">Manajemen Inventaris Harian</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Kuota &amp; harga tiket untuk kunjungan {today} — perubahan langsung tersimpan</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{inventories.length} tier aktif</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Tier Tiket</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Harga (Rp)</th>
                                    <th className="py-3 px-4 text-right">Kuota</th>
                                    <th className="py-3 px-4 text-right">Terjual</th>
                                    <th className="py-3 px-4 text-right">Sisa</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventories.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-400">
                                            Belum ada inventaris tiket untuk hari ini. Atur tier tiket di halaman Pengaturan Park.
                                        </td>
                                    </tr>
                                ) : (
                                    inventories.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4">
                                                <span className="font-extrabold text-slate-900 text-sm block">{inv.tier_name}</span>
                                                {inv.tier_code && <span className="text-[10px] text-slate-400 font-mono">{inv.tier_code}</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleInventoryOpen(inv)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${
                                                        inv.is_open
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                    }`}
                                                >
                                                    {inv.is_open ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                    {inv.is_open ? 'Dijual' : 'Ditutup'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <input
                                                    type="text"
                                                    value={formatNumberDisplay(inv.price)}
                                                    onChange={(e) => updateLocalInventory(inv.id, { price: parseRawNumber(e.target.value) })}
                                                    className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1.5 font-bold focus:border-orange-400 focus:ring-1 focus:ring-orange-100 outline-none"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <input
                                                    type="text"
                                                    value={formatNumberDisplay(inv.total_quota)}
                                                    onChange={(e) => updateLocalInventory(inv.id, { total_quota: parseRawNumber(e.target.value) })}
                                                    className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1.5 font-bold focus:border-orange-400 focus:ring-1 focus:ring-orange-100 outline-none"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-blue-700">{formatNumber(inv.booked_quota)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-700">{formatNumber(inv.remaining_quota)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    type="button"
                                                    disabled={savingId === inv.id}
                                                    onClick={() => saveInventory(inv)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] rounded-lg transition disabled:opacity-50"
                                                >
                                                    <Save className="h-3 w-3" />
                                                    {savingId === inv.id ? 'Menyimpan…' : 'Simpan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* LOG AKSES GERBANG */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                <ScanLine className="h-4 w-4 text-emerald-600" />
                                Log Akses Gerbang
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Aktivitas scan turnstile terkini di {park?.name}</p>
                        </div>
                    </div>

                    {/* Gate badges */}
                    <div className="flex flex-wrap gap-2.5 mb-5">
                        {gates.map((gate) => (
                            <div
                                key={gate.id}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs ${
                                    gate.is_active
                                        ? 'bg-slate-50 border-slate-200'
                                        : 'bg-slate-100 border-slate-200 opacity-60'
                                }`}
                            >
                                <span className="font-bold text-slate-800">{gate.gate_name}</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
                                    {formatNumber(gate.checkins_today)} check-in
                                </span>
                            </div>
                        ))}
                        {gates.length === 0 && (
                            <p className="text-xs text-slate-400">Belum ada gerbang terdaftar untuk park ini.</p>
                        )}
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Waktu Scan</th>
                                    <th className="py-3 px-4">Kode Tiket</th>
                                    <th className="py-3 px-4">Gerbang</th>
                                    <th className="py-3 px-4">Petugas / Scanner</th>
                                    <th className="py-3 px-4">Hasil</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gateLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            Belum ada aktivitas scan gerbang hari ini.
                                        </td>
                                    </tr>
                                ) : (
                                    gateLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-2.5 px-4 font-mono text-slate-600">
                                                {new Date(log.scan_time).toLocaleTimeString('id-ID')} WIB
                                            </td>
                                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{log.ticket_code || '-'}</td>
                                            <td className="py-2.5 px-4 text-slate-700 font-semibold">{log.gate_name}</td>
                                            <td className="py-2.5 px-4 text-slate-600">{log.staff_name}</td>
                                            <td className="py-2.5 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                    log.scan_result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {log.scan_result}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PESANAN TERBARU PARK INI */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-orange-600" />
                            Pesanan Terbaru
                        </h2>
                        <Link
                            href={`/admin/orders?park_id=${park?.id || ''}`}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                        >
                            Lihat semua <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Kode Pesanan</th>
                                    <th className="py-3 px-4">Pemesan</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">Belum ada pesanan untuk park ini.</td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.order_code}</td>
                                            <td className="py-3 px-4">
                                                <span className="font-semibold block text-slate-800">{order.customer_name}</span>
                                                <span className="text-[11px] text-slate-400">{order.customer_email}</span>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-900">{formatIDR(order.total_amount)}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                    order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">
                                                {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
