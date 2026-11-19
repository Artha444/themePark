import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    DollarSign, Users, Activity, Globe2, Search, ChevronRight, ChevronLeft,
    Building2, Ticket, DoorOpen, DoorClosed,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';

const formatIDR = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

const compactNumber = (value) => {
    const num = Number(value || 0);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1).replace('.', ',')} M`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace('.', ',')} jt`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)} rb`;
    return String(num);
};

const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    fontSize: 12,
    padding: '10px 12px',
};

const truncateName = (name, max = 18) =>
    name.length > max ? `${name.substring(0, max - 1)}…` : name;

export default function AdminOverview({
    parks = [],
    park,
    today,
    adminRole = 'SUPER_ADMIN',
    isSuperAdmin = true,
    overview,
}) {
    const totals = overview?.totals || {
        revenue_today: 0, tickets_today: 0, checkins_today: 0,
        parks_total: 0, parks_open: 0, parks_closed: 0,
    };
    const parksSummary = overview?.parks_summary || [];
    const topParks = overview?.top_parks || [];
    const bottomParks = overview?.bottom_parks || [];
    const isHolidayToday = overview?.is_holiday_today || false;

    // ===== B. PENCARIAN & QUICK FILTER =====
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | BUKA | TUTUP
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const query = searchQuery.trim().toLowerCase();

    const searchMatches = useMemo(() => {
        if (!query) return [];
        return parksSummary.filter((p) =>
            p.name.toLowerCase().includes(query)
            || (p.city || '').toLowerCase().includes(query)
            || (p.category || '').toLowerCase().includes(query)
        ).slice(0, 6);
    }, [parksSummary, query]);

    const filteredParks = useMemo(() => parksSummary.filter((p) => {
        const matchQuery = !query
            || p.name.toLowerCase().includes(query)
            || (p.city || '').toLowerCase().includes(query)
            || (p.category || '').toLowerCase().includes(query);
        const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchQuery && matchStatus;
    }), [parksSummary, query, statusFilter]);

    const goToPark = (parkId) => {
        router.visit(`/admin/parks/${parkId}`);
    };

    // Pengganti pencarian: Select & Go (dropdown lompat langsung)
    const [jumpTo, setJumpTo] = useState('');

    const handleJumpTo = (event) => {
        const parkId = event.target.value;
        if (parkId) goToPark(parkId);
        setJumpTo('');
    };

    // Paginasi tabel ringkasan
    const totalPages = Math.max(1, Math.ceil(filteredParks.length / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedParks = filteredParks
        .slice((safePage - 1) * perPage, safePage * perPage);

    const openPercent = totals.parks_total > 0
        ? Math.round((totals.parks_open / totals.parks_total) * 100)
        : 0;

    return (
        <>
            <Head title="Overview Pusat | Vurasi Admin" />

            <AdminLayout parks={parks} park={park} isSuperAdmin={isSuperAdmin}>
                {/* HEADER + PENCARIAN */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            <Globe2 className="h-3.5 w-3.5" />
                            Global Overview — Dashboard Pusat
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Ringkasan Seluruh Park
                        </h1>
                        <p className="text-xs text-slate-500">
                            Data makro ({today}) — {isSuperAdmin ? 'seluruh destinasi jaringan' : `satu destinasi (${park?.name})`}
                            {isHolidayToday && (
                                <span className="ml-1.5 font-bold text-rose-600">· Hari Libur Nasional 🎉</span>
                            )}
                        </p>
                    </div>

                    {/* SEARCH BAR + QUICK JUMP */}
                    <div className="flex flex-col sm:flex-row gap-2.5 self-stretch lg:self-end">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                    setCurrentPage(1);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                                placeholder="Cari park… (mis. Bandung)"
                                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                            />

                            {/* SUGGESTION DROPDOWN: lompat langsung ke detail park */}
                            {showSuggestions && searchMatches.length > 0 && (
                                <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                                    <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Lompat ke detail park
                                    </p>
                                    {searchMatches.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onMouseDown={() => goToPark(p.id)}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-orange-50 text-left transition"
                                        >
                                            <span className="min-w-0">
                                                <span className="block text-sm font-bold text-slate-900 truncate">{p.name}</span>
                                                <span className="block text-[11px] text-slate-400">{p.city || '—'} · {p.status}</span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* QUICK JUMP SELECT */}
                        <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-3 text-sm shadow-sm">
                            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                            <select
                                value={jumpTo}
                                onChange={handleJumpTo}
                                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-44"
                            >
                                <option value="">Pilih park untuk detail…</option>
                                {parksSummary.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-white text-slate-900">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                {/* ===== A. KPI CARDS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Pendapatan Seluruh Park</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatIDR(totals.revenue_today)}</h3>
                        <span className="text-[11px] text-slate-400 font-medium">Hari ini · transaksi PAID · {formatNumber(totals.tickets_today)} tiket</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Total Pengunjung</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatNumber(totals.checkins_today)}</h3>
                        <span className="text-[11px] text-blue-600 font-semibold">Check-in gerbang hari ini</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Status Operasional</span>
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-black text-emerald-600">{totals.parks_open}</h3>
                            <span className="text-xs font-bold text-slate-400">buka</span>
                            <h3 className="text-2xl font-black text-rose-500">{totals.parks_closed}</h3>
                            <span className="text-xs font-bold text-slate-400">tutup</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${openPercent}%` }} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Jumlah Park Aktif</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Ticket className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{formatNumber(totals.parks_total)} Park</h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                            {isSuperAdmin ? 'Terdaftar di jaringan' : 'Park di bawah kendali Anda'}
                        </span>
                    </div>
                </div>

                {/* ===== GRAFIK KOMPARASI: 5 TERTINGGI VS 5 TERENDAH ===== */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <DoorOpen className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-extrabold text-slate-900">5 Park Pendapatan Tertinggi</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Omzet transaksi PAID hari ini</p>

                        {topParks.length === 0 ? (
                            <p className="py-12 text-center text-xs text-slate-400">Belum ada data park.</p>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topParks} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            tickFormatter={(v) => compactNumber(v)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={130}
                                            tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                                            tickFormatter={(v) => truncateName(v)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                            contentStyle={tooltipStyle}
                                            formatter={(value, key) => (key === 'revenue_today' ? formatIDR(value) : `${formatNumber(value)} tiket`)}
                                        />
                                        <Bar dataKey="revenue_today" name="Omzet Hari Ini" fill="#10b981" radius={[0, 8, 8, 0]} barSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <DoorClosed className="h-4 w-4 text-rose-500" />
                            <h2 className="text-base font-extrabold text-slate-900">5 Park Pendapatan Terendah</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            {bottomParks.length > 0
                                ? 'Perlu perhatian — omzet terkecil hari ini'
                                : 'Tersedia bila jumlah park lebih dari 5'}
                        </p>

                        {bottomParks.length === 0 ? (
                            <div className="py-12 text-center space-y-2">
                                <p className="text-xs text-slate-400">
                                    {totals.parks_total <= 5
                                        ? `Semua ${totals.parks_total} park sudah tampil di grafik tertinggi.`
                                        : 'Belum ada data park.'}
                                </p>
                            </div>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bottomParks} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            tickFormatter={(v) => compactNumber(v)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={130}
                                            tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                                            tickFormatter={(v) => truncateName(v)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                            contentStyle={tooltipStyle}
                                            formatter={(value, key) => (key === 'revenue_today' ? formatIDR(value) : `${formatNumber(value)} tiket`)}
                                        />
                                        <Bar dataKey="revenue_today" name="Omzet Hari Ini" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={22}>
                                            {bottomParks.map((entry) => (
                                                <Cell
                                                    key={`bottom-${entry.id}`}
                                                    fill={entry.revenue_today > 0 ? '#fb923c' : '#e2e8f0'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== TABEL RINGKASAN HIGH-LEVEL ===== */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">Ringkasan Seluruh Park</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Klik baris park untuk membuka halaman detail (drill-down)
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* QUICK FILTER STATUS */}
                            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                                {[['ALL', 'Semua'], ['BUKA', 'Buka'], ['TUTUP', 'Tutup']].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => { setStatusFilter(value); setCurrentPage(1); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            statusFilter === value
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* PAGINASI PER HALAMAN */}
                            <select
                                value={perPage}
                                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-600 bg-white focus:outline-none"
                            >
                                <option value={10}>10 baris</option>
                                <option value={20}>20 baris</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Nama Park</th>
                                    <th className="py-3 px-4">Kota</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Tiket Terjual Hari Ini</th>
                                    <th className="py-3 px-4 text-right">Omzet Hari Ini</th>
                                    <th className="py-3 px-4 text-right">Kapasitas</th>
                                    <th className="py-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedParks.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-400">
                                            Tidak ada park yang cocok dengan filter &quot;{searchQuery}&quot;.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedParks.map((p) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => goToPark(p.id)}
                                            className="hover:bg-orange-50/50 cursor-pointer transition group"
                                        >
                                            <td className="py-3.5 px-4">
                                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-orange-600 transition">
                                                    {p.name}
                                                </span>
                                                {p.category && (
                                                    <span className="block text-[11px] text-slate-400">{p.category}</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 font-semibold">
                                                {p.city || '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    title={p.closure_reason || 'Park beroperasi normal hari ini'}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                        p.is_closed
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    }`}
                                                >
                                                    {p.is_closed ? <DoorClosed className="h-3 w-3" /> : <DoorOpen className="h-3 w-3" />}
                                                    {p.status}
                                                </span>
                                                {p.is_closed && p.closure_reason && (
                                                    <span className="block text-[10px] text-slate-400 mt-1 truncate max-w-32 mx-auto" title={p.closure_reason}>
                                                        {p.closure_reason}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                                                {formatNumber(p.tickets_today)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                                                {formatIDR(p.revenue_today)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right text-slate-500">
                                                {formatNumber(p.max_capacity)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-orange-600 transition">
                                                    Detail <ChevronRight className="h-3.5 w-3.5" />
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINASI */}
                    {filteredParks.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-slate-400">
                                Menampilkan {((safePage - 1) * perPage) + 1}–{Math.min(safePage * perPage, filteredParks.length)} dari {filteredParks.length} park
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={safePage <= 1}
                                    onClick={() => setCurrentPage(safePage - 1)}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    aria-label="Halaman sebelumnya"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
                                    {safePage} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={safePage >= totalPages}
                                    onClick={() => setCurrentPage(safePage + 1)}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    aria-label="Halaman berikutnya"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </>
    );
}
