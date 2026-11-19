import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3, Ticket, DollarSign, ShoppingBag, Users, TrendingUp, CalendarRange, Sparkles,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    LineChart, Line, Legend, Cell,
} from 'recharts';

const PARK_COLORS = ['#ea580c', '#0ea5e9', '#8b5cf6', '#10b981', '#f43f5e', '#eab308', '#6366f1', '#14b8a6'];

const PERIOD_OPTIONS = [
    { days: 7, label: '7 Hari' },
    { days: 14, label: '14 Hari' },
    { days: 30, label: '30 Hari' },
];

const formatIDR = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

const compactNumber = (value) => {
    const num = Number(value || 0);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1).replace('.', ',')} M`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace('.', ',')} jt`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)} rb`;
    return String(num);
};

const formatDate = (iso) => new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
});

const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    fontSize: 12,
    padding: '10px 12px',
};

export default function AdminSales({
    parks = [],
    park,
    today,
    adminRole = 'SUPER_ADMIN',
    isSuperAdmin = true,
    sales,
}) {
    const [metric, setMetric] = useState('tickets');

    const periodDays = sales?.period_days || 14;
    const totals = sales?.totals || { tickets: 0, revenue: 0, orders: 0, checkins: 0 };
    const perPark = sales?.per_park || [];
    const bestDay = sales?.best_day || null;
    const hasAnySales = totals.tickets > 0 || totals.revenue > 0;

    const switchPeriod = (days) => {
        const params = { days };
        if (isSuperAdmin && park?.id) params.park_id = park.id;
        router.get('/admin/sales', params, { preserveState: false });
    };

    const chartData = perPark.map((p, index) => ({
        ...p,
        full_name: p.name,
        name: p.name.length > 16 ? `${p.name.substring(0, 14)}…` : p.name,
        color: PARK_COLORS[index % PARK_COLORS.length],
    }));

    // Baris tren harian: dataKey dibuat aman (berbasis park_id) agar nama park
    // yang mengandung titik/karakter khusus tetap terbaca recharts dengan benar.
    const dailyData = (sales?.daily || []).map((row) => {
        const mapped = { date: row.date, label: row.label, total: row.total };
        perPark.forEach((p) => {
            mapped[`park_${p.park_id}`] = row[p.name] || 0;
        });
        return mapped;
    });

    const metricConfig = metric === 'tickets'
        ? { dataKey: 'tickets', label: 'Tiket Terjual', color: '#ea580c' }
        : { dataKey: 'revenue', label: 'Omzet (PAID)', color: '#0ea5e9' };

    const maxTickets = Math.max(...perPark.map((p) => p.tickets), 1);
    const isMetricCurrency = metric === 'revenue';

    return (
        <>
            <Head title={`Penjualan Tiket per Park | ${park?.name || 'Vurasi'}`} />

            <AdminLayout parks={parks} park={park} adminRole={adminRole} isSuperAdmin={isSuperAdmin}>
                {/* HEADER HALAMAN + FILTER PERIODE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Laporan Penjualan
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Diagram Penjualan Tiket per Park
                        </h1>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                            Periode {formatDate(sales?.start_date || today)} — {formatDate(sales?.end_date || today)}
                            {isSuperAdmin ? ' (seluruh destinasi)' : ` (${park?.name})`}
                        </p>
                    </div>

                    {/* Filter periode */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm self-start">
                        {PERIOD_OPTIONS.map((option) => (
                            <button
                                key={option.days}
                                type="button"
                                onClick={() => switchPeriod(option.days)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                                    periodDays === option.days
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RINGKASAN PERIODE */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tiket Terjual</span>
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Ticket className="h-4 w-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatNumber(totals.tickets)}</h3>
                        <span className="text-[11px] text-slate-400">Total tiket terbit</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Omzet (PAID)</span>
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatIDR(totals.revenue)}</h3>
                        <span className="text-[11px] text-slate-400">{formatNumber(totals.orders)} pesanan lunas</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Check-In</span>
                            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatNumber(totals.checkins)}</h3>
                        <span className="text-[11px] text-slate-400">Kunjungan gerbang</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Hari Terbaik</span>
                            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                        {bestDay ? (
                            <>
                                <h3 className="text-2xl font-black text-slate-900">{formatNumber(bestDay.tickets)}</h3>
                                <span className="text-[11px] text-slate-400">{bestDay.label} — tiket terbanyak</span>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-black text-slate-300">—</h3>
                                <span className="text-[11px] text-slate-400">Belum ada penjualan</span>
                            </>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hidden lg:flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata / Hari</span>
                            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">
                            {formatNumber(Math.round(totals.tickets / periodDays))}
                        </h3>
                        <span className="text-[11px] text-slate-400">tiket per hari</span>
                    </div>
                </div>

                {/* GRAFIK 1: PERBANDINGAN ANTAR PARK */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">Perbandingan Penjualan per Park</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Total {isMetricCurrency ? 'omzet pesanan lunas' : 'tiket terjual'} dalam {periodDays} hari terakhir
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 self-start">
                            <button
                                type="button"
                                onClick={() => setMetric('tickets')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                    metric === 'tickets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                🎟️ Tiket
                            </button>
                            <button
                                type="button"
                                onClick={() => setMetric('revenue')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                    metric === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                💰 Omzet
                            </button>
                        </div>
                    </div>

                    {!hasAnySales && (
                        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
                            Belum ada penjualan pada periode ini. Grafik akan terisi otomatis setelah ada transaksi tiket masuk.
                        </div>
                    )}

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(v) => (isMetricCurrency ? compactNumber(v) : formatNumber(v))}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={130}
                                    tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                    contentStyle={tooltipStyle}
                                    formatter={(value) => (isMetricCurrency ? formatIDR(value) : `${formatNumber(value)} tiket`)}
                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.full_name || label}
                                />
                                <Bar
                                    dataKey={metricConfig.dataKey}
                                    name={metricConfig.label}
                                    radius={[0, 8, 8, 0]}
                                    barSize={26}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${entry.park_id}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRAFIK 2: TREN HARIAN PER PARK */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
                    <h2 className="text-lg font-extrabold text-slate-900">Tren Harian Penjualan Tiket</h2>
                    <p className="text-xs text-slate-500 mt-0.5 mb-6">
                        Jumlah tiket terjual setiap hari, dipisahkan per park
                    </p>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={24}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(v) => formatNumber(v)}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${formatNumber(value)} tiket`} />
                                {perPark.length > 1 && (
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                    />
                                )}
                                {perPark.map((p, index) => (
                                    <Line
                                        key={`line-${p.park_id}`}
                                        type="monotone"
                                        dataKey={`park_${p.park_id}`}
                                        name={p.name}
                                        stroke={PARK_COLORS[index % PARK_COLORS.length]}
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TABEL RINCIAN PER PARK */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <h2 className="text-lg font-extrabold text-slate-900 mb-1">Rincian per Park</h2>
                    <p className="text-xs text-slate-500 mb-5">Detail angka penjualan setiap destinasi dalam periode terpilih</p>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Park / Destinasi</th>
                                    <th className="py-3 px-4 text-right">Tiket</th>
                                    <th className="py-3 px-4 text-right">Pesanan</th>
                                    <th className="py-3 px-4 text-right">Omzet (PAID)</th>
                                    <th className="py-3 px-4 text-right">Check-In</th>
                                    <th className="py-3 px-4 text-right">Avg / Hari</th>
                                    <th className="py-3 px-4" style={{ minWidth: 160 }}>Porsi Tiket</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {perPark.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-400">
                                            Belum ada destinasi park terdaftar.
                                        </td>
                                    </tr>
                                ) : (
                                    perPark.map((p, index) => (
                                        <tr key={p.park_id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3.5 px-4">
                                                <span className="flex items-center gap-2.5">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: PARK_COLORS[index % PARK_COLORS.length] }}
                                                    />
                                                    <span className="font-bold text-slate-900">{p.name}</span>
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatNumber(p.tickets)}</td>
                                            <td className="py-3.5 px-4 text-right text-slate-600">{formatNumber(p.orders)}</td>
                                            <td className="py-3.5 px-4 text-right font-bold text-emerald-700">{formatIDR(p.revenue)}</td>
                                            <td className="py-3.5 px-4 text-right text-slate-600">{formatNumber(p.checkins)}</td>
                                            <td className="py-3.5 px-4 text-right text-slate-600">
                                                {formatNumber(Math.round(p.tickets / periodDays))}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${Math.round((p.tickets / maxTickets) * 100)}%`,
                                                                backgroundColor: PARK_COLORS[index % PARK_COLORS.length],
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500 w-11 text-right">
                                                        {totals.tickets > 0 ? Math.round((p.tickets / totals.tickets) * 100) : 0}%
                                                    </span>
                                                </div>
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
