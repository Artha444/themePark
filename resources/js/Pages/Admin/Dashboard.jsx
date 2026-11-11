import { useState, Fragment } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import {
    DollarSign, Ticket, Users, ArrowLeft, Plus, Calendar,
    Tag, Wrench, Edit3, Building2, MapPin, Clock, Image as ImageIcon
} from 'lucide-react';

export default function AdminDashboard({
    parks = [],
    park,
    today,
    adminRole = 'SUPER_ADMIN', // 'SUPER_ADMIN' atau 'PARK_ADMIN'
    isSuperAdmin = true,
    canManageParks = true,
    metrics,
    calendarCapacities = [],
    ticketTiers = [],
    dailyInventories = [],
    attractions = [],
    zones = [],
    promotions = [],
    recentOrders = [],
    liveCheckIns = [],
}) {
    const [activeTab, setActiveTab] = useState('schedule');
    const [updatingId, setUpdatingId] = useState(null);

    // Modal States
    const [attractionModalOpen, setAttractionModalOpen] = useState(false);
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [newParkModalOpen, setNewParkModalOpen] = useState(false);
    const [editParkModalOpen, setEditParkModalOpen] = useState(false);

    // Form New Park (Khusus Super Admin)
    const [newParkForm, setNewParkForm] = useState({
        name: '',
        description: '',
        image_url: '',
        location_address: '',
        open_time: '09:00',
        close_time: '21:00',
        default_daily_capacity: 5000,
    });

    // Form Edit Current Park (Bisa untuk Super Admin & Park Admin)
    const [editParkForm, setEditParkForm] = useState({
        name: park?.name || '',
        description: park?.description || '',
        image_url: park?.image_url || '',
        location_address: park?.location_address || '',
        open_time: park?.open_time?.substring(0, 5) || '09:00',
        close_time: park?.close_time?.substring(0, 5) || '21:00',
        default_daily_capacity: park?.default_daily_capacity || 5000,
    });

    // Form New Attraction
    const [attractionForm, setAttractionForm] = useState({
        zone_id: zones[0]?.id || '',
        name: '',
        description: '',
        image_url: '',
        min_height_cm: 0,
        status: 'OPERATIONAL',
    });

    // Form New Ticket Tier
    const [ticketForm, setTicketForm] = useState({
        name: '',
        description: '',
        min_age: '',
        max_age: '',
        max_height_cm: '',
        initial_price: 100000,
        initial_quota: 2000,
    });

    // Form New Promotion
    const [promoForm, setPromoForm] = useState({
        code: '',
        scope: 'park',          // 'park' = hanya park ini | 'global' = semua park
        park_id: park?.id || '',
        discount_type: 'PERCENTAGE',
        discount_value: 20,
        min_order_amount: 150000,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const openEditParkModal = () => {
        if (!park) return;
        setEditParkForm({
            name: park.name,
            description: park.description || '',
            image_url: park.image_url || '',
            location_address: park.location_address,
            open_time: park.open_time?.substring(0, 5) || '09:00',
            close_time: park.close_time?.substring(0, 5) || '21:00',
            default_daily_capacity: park.default_daily_capacity || 5000,
        });
        setEditParkModalOpen(true);
    };

    // Handlers
    const handleParkSwitch = (parkId) => {
        router.get(`/admin?park_id=${parkId}`, {}, { preserveScroll: true });
    };

    const handleRoleSwitch = (newRole) => {
        router.get(`/admin?as_role=${newRole}`, {}, { preserveScroll: true });
    };

    const handleAttractionStatusChange = (attractionId, newStatus) => {
        setUpdatingId(attractionId);
        router.post(`/admin/attractions/${attractionId}/status`, { status: newStatus }, {
            preserveScroll: true,
            onFinish: () => setUpdatingId(null),
        });
    };

    const handleToggleClosedDate = (date) => {
        router.post('/admin/capacity/toggle-closed', {
            park_id: park?.id,
            visit_date: date,
        }, { preserveScroll: true });
    };

    const handleCapacityChange = (date, newMax) => {
        const val = parseInt(newMax, 10);
        if (!val || val < 10) return;
        router.post('/admin/capacity', {
            park_id: park?.id,
            visit_date: date,
            max_capacity: val,
        }, { preserveScroll: true });
    };

    const handleToggleTicketTier = (tierId) => {
        router.post(`/admin/tickets/tiers/${tierId}/toggle`, {}, { preserveScroll: true });
    };

    const handleUpdateInventory = (invId, price, quota, isOpen) => {
        router.post('/admin/inventory/update', {
            inventory_id: invId,
            price: Number(price),
            total_quota: Number(quota),
            is_open: Boolean(isOpen),
        }, { preserveScroll: true });
    };

    const handleTogglePromo = (promoId) => {
        router.post(`/admin/promotions/${promoId}/toggle`, {}, { preserveScroll: true });
    };

    // Submits
    const submitNewPark = (e) => {
        e.preventDefault();
        router.post('/admin/parks', newParkForm, {
            preserveScroll: true,
            onSuccess: () => {
                setNewParkModalOpen(false);
                setNewParkForm({ name: '', description: '', location_address: '', open_time: '09:00', close_time: '21:00', default_daily_capacity: 5000 });
            },
        });
    };

    const submitEditPark = (e) => {
        e.preventDefault();
        router.post(`/admin/parks/${park?.id}/update`, editParkForm, {
            preserveScroll: true,
            onSuccess: () => setEditParkModalOpen(false),
        });
    };

    const submitAttraction = (e) => {
        e.preventDefault();
        router.post('/admin/attractions', {
            ...attractionForm,
            zone_id: attractionForm.zone_id || zones[0]?.id,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setAttractionModalOpen(false);
                setAttractionForm({ zone_id: zones[0]?.id || '', name: '', description: '', min_height_cm: 0, status: 'OPERATIONAL' });
            },
        });
    };

    const submitTicketTier = (e) => {
        e.preventDefault();
        router.post('/admin/tickets/tiers', {
            ...ticketForm,
            park_id: park?.id,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTicketModalOpen(false);
                setTicketForm({ name: '', description: '', min_age: '', max_age: '', max_height_cm: '', initial_price: 100000, initial_quota: 2000 });
            },
        });
    };

    const submitPromo = (e) => {
        e.preventDefault();
        // Jika Park Admin, selalu scope ke park ini
        const payload = {
            ...promoForm,
            park_id: promoForm.scope === 'park' ? park?.id : null,
        };
        router.post('/admin/promotions', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setPromoModalOpen(false);
                setPromoForm({ code: '', scope: 'park', park_id: park?.id || '', discount_type: 'PERCENTAGE', discount_value: 20, min_order_amount: 150000, valid_until: '' });
            },
        });
    };

    const capacityPercent = metrics?.max_capacity > 0
        ? Math.min(100, Math.round((metrics.booked_capacity / metrics.max_capacity) * 100))
        : 0;

    return (
        <>
            <Head title={`Admin Dashboard | ${park?.name || 'Vurasi'}`} />

            <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-24">
                
                {/* TOP BAR SIMULASI ROLE (SUPER ADMIN VS PARK ADMIN) */}
                <div className="bg-slate-950 text-slate-300 px-6 sm:px-8 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400">Status Akses:</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                            isSuperAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                            {isSuperAdmin ? '👑 Admin Pusat (Super Admin)' : `🏢 Park Admin (${park?.name?.split(' ')[0]})`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Simulasikan Role:</span>
                        <button
                            onClick={() => handleRoleSwitch('SUPER_ADMIN')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isSuperAdmin ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            👑 Mode Super Admin
                        </button>
                        <button
                            onClick={() => handleRoleSwitch('PARK_ADMIN')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                !isSuperAdmin ? 'bg-blue-500 text-white font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            🏢 Mode Park Admin
                        </button>
                    </div>
                </div>

                {/* NAVBAR ADMIN UTAMA */}
                <header className="bg-slate-900 text-white px-6 sm:px-8 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                                {isSuperAdmin ? 'MANAGEMENT SYSTEM — ADMIN PUSAT' : 'MANAGEMENT SYSTEM — PARK ADMIN'}
                            </span>
                            <h1 className="font-extrabold text-lg text-white">
                                {park?.name || 'Vurasi Admin'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Selector Park (Untuk Super Admin) */}
                        {isSuperAdmin && parks.length > 1 && (
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
                                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Pilih Destinasi:</span>
                                <select
                                    value={park?.id || ''}
                                    onChange={(e) => handleParkSwitch(e.target.value)}
                                    className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                                >
                                    {parks.map((p) => (
                                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* TOMBOL EDIT NAMA TEMPAT (BISA UNTUK SUPER ADMIN & PARK ADMIN) */}
                        <button
                            onClick={openEditParkModal}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Nama Tempat</span>
                        </button>

                        {/* Tombol Tambah Tempat Baru (Khusus Admin Pusat / Super Admin) */}
                        {isSuperAdmin && (
                            <button
                                onClick={() => setNewParkModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ Tambah Tempat Baru</span>
                            </button>
                        )}

                        <Link href="/scanner" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition">
                            Gate Scanner
                        </Link>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    
                    {/* HERO CARD INFORMASI TEMPAT & TOMBOL EDIT */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            {/* Preview Foto Park */}
                            <div className="relative w-full sm:w-36 h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group shadow-xs">
                                <img
                                    src={park?.image_url || 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=600&q=80'}
                                    alt={park?.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=600&q=80';
                                    }}
                                />
                                <button
                                    onClick={openEditParkModal}
                                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Ganti Foto</span>
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-100 text-orange-800">
                                        Destinasi Aktif
                                    </span>
                                    <span className="text-xs text-slate-400">ID: {park?.id?.substring(0, 8)}...</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    {park?.name}
                                </h2>

                                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                                    {park?.description || 'Taman hiburan dan galeri pameran seni.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-orange-600" />
                                        {park?.location_address}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-orange-600" />
                                        Buka: {park?.open_time?.substring(0, 5)} - {park?.close_time?.substring(0, 5)} WIB
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-orange-600" />
                                        Kapasitas: {park?.default_daily_capacity?.toLocaleString()} / hari
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Besar Edit Profil Tempat */}
                        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={openEditParkModal}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition hover:shadow-orange-600/30"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit Nama, Foto &amp; Info</span>
                            </button>
                        </div>
                    </div>

                    {/* METRIK HARI INI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Omzet Masuk Hari Ini</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">
                                Rp {Number(metrics?.revenue_today || 0).toLocaleString('id-ID')}
                            </h3>
                            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Live transaksi PAID</span>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Tiket Terjual Hari Ini</span>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Ticket className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">
                                {metrics?.tickets_sold_today || 0} Tiket
                            </h3>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">E-Ticket {park?.name}</span>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Check-In Turnstile</span>
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">
                                {metrics?.checkins_today || 0} Pengunjung
                            </h3>
                            <span className="text-[11px] text-orange-600 font-semibold mt-1 block">Telah di-scan pintu masuk</span>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">Kapasitas Hari Ini</span>
                                <span className="text-xs font-bold text-orange-600">{capacityPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                                <div className="bg-orange-600 h-full rounded-full transition-all" style={{ width: `${capacityPercent}%` }} />
                            </div>
                            <h4 className="font-bold text-xs text-slate-700">
                                {metrics?.booked_capacity || 0} / {metrics?.max_capacity || 0} Kuota
                            </h4>
                        </div>
                    </div>

                    {/* MAIN MANAGEMENT CARD DENGAN TAB LENGKAP */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-200 gap-6 sm:gap-8 mb-6 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'schedule'
                                        ? 'border-orange-600 text-orange-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Atur Hari Tutup &amp; Kuota (14 Hari)
                            </button>
                            <button
                                onClick={() => setActiveTab('tickets')}
                                className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'tickets'
                                        ? 'border-orange-600 text-orange-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <Ticket className="w-4 h-4" />
                                Atur Tiket &amp; Harga ({ticketTiers.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('attractions')}
                                className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'attractions'
                                        ? 'border-orange-600 text-orange-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <Wrench className="w-4 h-4" />
                                Atur Wahana &amp; Atraksi ({attractions.length})
                            </button>
                            
                            {/* Tab Promo Kini Dapat Diakses Super Admin & Park Admin */}
                            <button
                                onClick={() => setActiveTab('promos')}
                                className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'promos'
                                        ? 'border-orange-600 text-orange-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <Tag className="w-4 h-4" />
                                Atur Kupon Promo ({promotions.length})
                            </button>

                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`pb-4 text-sm font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === 'orders'
                                        ? 'border-orange-600 text-orange-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                Pesanan &amp; Log Scan ({recentOrders.length})
                            </button>
                        </div>

                        {/* =========================================================
                            TAB 1: ATUR HARI TUTUP & KUOTA HARIAN (14 HARI)
                        ========================================================= */}
                        {activeTab === 'schedule' && (
                            <div>
                                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Pengaturan Jadwal Operasional &amp; Hari Tutup ({park?.name})
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Tutup hari tertentu jika ada pemeliharaan atau atur batas maksimal kuota pengunjung.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Buka</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Tutup Operasional</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {calendarCapacities.map((c) => {
                                        const isClosed = c.is_closed;
                                        return (
                                            <div
                                                key={c.id || c.visit_date}
                                                className={`rounded-2xl p-4 border transition-all ${
                                                    isClosed
                                                        ? 'bg-rose-50/60 border-rose-300'
                                                        : 'bg-white border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-extrabold uppercase text-slate-500">
                                                        {new Date(c.visit_date).toLocaleDateString('id-ID', { weekday: 'long' })}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                                        isClosed ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {isClosed ? 'TUTUP' : 'BUKA'}
                                                    </span>
                                                </div>

                                                <h4 className="font-mono text-xl font-black text-slate-900">
                                                    {c.visit_date}
                                                </h4>

                                                {/* Edit Kuota Maksimal */}
                                                <div className="mt-3 py-2 border-y border-slate-100 flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Batas Kuota:</span>
                                                    <input
                                                        type="number"
                                                        defaultValue={c.max_capacity}
                                                        onBlur={(e) => handleCapacityChange(c.visit_date, e.target.value)}
                                                        className="w-24 text-right font-bold text-slate-800 border rounded-lg px-2 py-1 text-xs focus:border-orange-500 outline-none"
                                                    />
                                                </div>

                                                <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                                                    <span>Terpesan: <strong>{c.booked_count}</strong></span>
                                                    <span>Sisa: <strong>{Math.max(0, c.max_capacity - c.booked_count)}</strong></span>
                                                </div>

                                                <div className="mt-4 pt-2">
                                                    <button
                                                        onClick={() => handleToggleClosedDate(c.visit_date)}
                                                        className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                                            isClosed
                                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                                                : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                                                        }`}
                                                    >
                                                        {isClosed ? '✓ Buka Kembali Hari Ini' : '✕ Tutup Tempat Hari Ini'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            TAB 2: ATUR TIKET & INVENTORI HARGA
                        ========================================================= */}
                        {activeTab === 'tickets' && (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Daftar Kategori &amp; Tier Tiket ({park?.name})
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Tambah kategori tiket baru, aktifkan/nonaktifkan tier, dan atur harga &amp; kuota harian.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setTicketModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Kategori Tiket
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {ticketTiers.map((tier) => (
                                        <div key={tier.id} className="rounded-2xl border border-slate-200 p-5 bg-slate-50/60 flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border">
                                                        {tier.code}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                        tier.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                        {tier.is_active ? 'AKTIF DIJUAL' : 'NONAKTIF'}
                                                    </span>
                                                </div>
                                                <h4 className="font-extrabold text-lg text-slate-900">{tier.name}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{tier.description || 'Akses masuk kawasan.'}</p>
                                                
                                                <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                                                    <div>Usia: <strong>{tier.min_age || tier.max_age ? `${tier.min_age || 0} - ${tier.max_age || 'Dewasa'} tahun` : 'Semua Usia'}</strong></div>
                                                    <div>Maks. Tinggi: <strong>{tier.max_height_cm ? `${tier.max_height_cm} cm` : 'Bebas'}</strong></div>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200">
                                                <button
                                                    onClick={() => handleToggleTicketTier(tier.id)}
                                                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                                        tier.is_active
                                                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    }`}
                                                >
                                                    {tier.is_active ? 'Nonaktifkan Tiket' : 'Aktifkan Tiket'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Tabel Edit Harga Tiket Hari Ini */}
                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <h4 className="font-extrabold text-base text-slate-900 mb-2">
                                        Atur Harga &amp; Kuota Tiket (Hari Ini: {today})
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                                                    <th className="py-3 px-3">Nama Tier Tiket</th>
                                                    <th className="py-3 px-3">Harga Tiket (Rp)</th>
                                                    <th className="py-3 px-3">Kuota Tersedia</th>
                                                    <th className="py-3 px-3">Terjual</th>
                                                    <th className="py-3 px-3">Status Jual</th>
                                                    <th className="py-3 px-3">Simpan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {dailyInventories.map((inv) => (
                                                    <tr key={inv.id}>
                                                        <td className="py-3 px-3 font-bold text-slate-800">
                                                            {inv.ticket_tier?.name}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="number"
                                                                id={`price-${inv.id}`}
                                                                defaultValue={inv.price}
                                                                className="w-28 px-2 py-1 text-xs border rounded-lg font-bold text-slate-800"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="number"
                                                                id={`quota-${inv.id}`}
                                                                defaultValue={inv.total_quota}
                                                                className="w-24 px-2 py-1 text-xs border rounded-lg font-bold text-slate-800"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3 font-semibold text-slate-600">
                                                            {inv.booked_quota}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <select
                                                                id={`open-${inv.id}`}
                                                                defaultValue={inv.is_open ? '1' : '0'}
                                                                className="text-xs border rounded-lg px-2 py-1 font-semibold"
                                                            >
                                                                <option value="1">Buka (Dijual)</option>
                                                                <option value="0">Tutup (Disetop)</option>
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <button
                                                                onClick={() => {
                                                                    const p = document.getElementById(`price-${inv.id}`).value;
                                                                    const q = document.getElementById(`quota-${inv.id}`).value;
                                                                    const o = document.getElementById(`open-${inv.id}`).value === '1';
                                                                    handleUpdateInventory(inv.id, p, q, o);
                                                                }}
                                                                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition"
                                                            >
                                                                Simpan
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            TAB 3: ATUR WAHANA & ATRAKSI
                        ========================================================= */}
                        {activeTab === 'attractions' && (
                            <div>
                                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Pengaturan Wahana &amp; Atraksi ({park?.name})
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Admin dapat menambah wahana baru atau mengubah status operasional wahana (Buka, Perbaikan, Tutup).
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setAttractionModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Wahana Baru
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {attractions.map((attraction) => {
                                        const isUpdating = updatingId === attraction.id;
                                        return (
                                            <div
                                                key={attraction.id}
                                                className={`rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                                                    attraction.status === 'OPERATIONAL'
                                                        ? 'bg-slate-50 border-slate-200'
                                                        : attraction.status === 'MAINTENANCE'
                                                        ? 'bg-amber-50/50 border-amber-200'
                                                        : 'bg-rose-50/50 border-rose-200'
                                                }`}
                                            >
                                                {attraction.image_url && (
                                                    <div className="h-32 w-full overflow-hidden bg-slate-200">
                                                        <img
                                                            src={attraction.image_url}
                                                            alt={attraction.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                                                                {attraction.zone?.name || 'Zona Utama'}
                                                            </span>
                                                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                                                attraction.status === 'OPERATIONAL' ? 'bg-emerald-100 text-emerald-800' :
                                                                attraction.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {attraction.status === 'OPERATIONAL' ? '✓ BUKA' :
                                                                 attraction.status === 'MAINTENANCE' ? '⚠ PERBAIKAN' : '✕ TUTUP'}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-extrabold text-base text-slate-900">
                                                            {attraction.name}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                            {attraction.description}
                                                        </p>
                                                        <div className="mt-2 text-[11px] text-slate-400">
                                                            Min. Tinggi: <strong>{attraction.min_height_cm > 0 ? `${attraction.min_height_cm} cm` : 'Semua Tinggi'}</strong>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-200/80">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                                            Ubah Status Wahana:
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleAttractionStatusChange(attraction.id, 'OPERATIONAL')}
                                                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                                                                    attraction.status === 'OPERATIONAL'
                                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                Buka
                                                            </button>
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleAttractionStatusChange(attraction.id, 'MAINTENANCE')}
                                                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                                                                    attraction.status === 'MAINTENANCE'
                                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                Perbaikan
                                                            </button>
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleAttractionStatusChange(attraction.id, 'CLOSED')}
                                                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                                                                    attraction.status === 'CLOSED'
                                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                Tutup
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            TAB 4: ATUR KUPON PROMO (SUPER ADMIN & PARK ADMIN)
                        ========================================================= */}
                        {activeTab === 'promos' && (
                            <div>
                                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">
                                            Manajemen Kupon Promo ({park?.name})
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Terbitkan voucher kode promo baru atau aktifkan/nonaktifkan promo yang sedang berjalan.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setPromoModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Terbitkan Kupon Promo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {promotions.map((promo) => (
                                        <div key={promo.id} className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800">
                                                        {promo.discount_type === 'PERCENTAGE' ? `Diskon ${promo.discount_value}%` : `Potongan Rp ${promo.discount_value.toLocaleString()}`}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                        promo.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                        {promo.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                    </span>
                                                </div>
                                                <h4 className="font-mono text-2xl font-black text-slate-900">{promo.code}</h4>

                                                {/* Badge Ruang Lingkup Promo */}
                                                <div className="mt-2">
                                                    {promo.park_id ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            🏟 Khusus: {promo.park?.name || 'Park Ini'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                            🌐 Global — Berlaku di Semua Park
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-slate-500 mt-2">
                                                    Min. order: Rp {new Intl.NumberFormat('id-ID').format(promo.min_order_amount || 0)}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Berlaku s/d: {new Date(promo.valid_until).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                                <button
                                                    onClick={() => handleTogglePromo(promo.id)}
                                                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                                        promo.is_active
                                                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    }`}
                                                >
                                                    {promo.is_active ? 'Nonaktifkan Kupon' : 'Aktifkan Kupon'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* =========================================================
                            TAB 5: PESANAN & LOG SCAN
                        ========================================================= */}
                        {activeTab === 'orders' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 mb-3">Pesanan Terbaru Masuk</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                                                    <th className="py-3 px-3">Kode Pesanan</th>
                                                    <th className="py-3 px-3">Pemesan</th>
                                                    <th className="py-3 px-3">Total</th>
                                                    <th className="py-3 px-3">Status</th>
                                                    <th className="py-3 px-3">Waktu</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {recentOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/80">
                                                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{order.order_code}</td>
                                                        <td className="py-3 px-3">
                                                            <span className="font-semibold block text-slate-800">{order.customer_name}</span>
                                                            <span className="text-[11px] text-slate-400">{order.customer_email}</span>
                                                        </td>
                                                        <td className="py-3 px-3 font-bold text-slate-900">Rp {Number(order.total_amount).toLocaleString('id-ID')}</td>
                                                        <td className="py-3 px-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                                order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>{order.status}</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-slate-500">
                                                            {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-200">
                                    <h3 className="text-base font-extrabold text-slate-900 mb-3">Live Stream Scan Turnstile Gerbang</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                                                    <th className="py-3 px-3">Waktu Scan</th>
                                                    <th className="py-3 px-3">Kode Tiket</th>
                                                    <th className="py-3 px-3">Gate</th>
                                                    <th className="py-3 px-3">Petugas</th>
                                                    <th className="py-3 px-3">Hasil</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {liveCheckIns.map((log) => (
                                                    <tr key={log.id}>
                                                        <td className="py-2.5 px-3 font-mono text-slate-600">{new Date(log.scan_time).toLocaleTimeString('id-ID')} WIB</td>
                                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{log.ticket?.ticket_code || '-'}</td>
                                                        <td className="py-2.5 px-3 text-slate-700">{log.gate?.gate_name || 'Gerbang'}</td>
                                                        <td className="py-2.5 px-3 text-slate-600">{log.staff_user?.full_name || 'Petugas'}</td>
                                                        <td className="py-2.5 px-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                                log.scan_result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                            }`}>{log.scan_result}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* =========================================================
                    MODAL KHUSUS ADMIN PUSAT: TAMBAH TEMPAT BARU
                ========================================================= */}
                <Transition show={newParkModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setNewParkModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                    <span className="text-xl">👑</span>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Tambah Destinasi / Tempat Baru</h3>
                                        <p className="text-xs text-slate-500">Khusus otoritas Admin Pusat (Super Admin)</p>
                                    </div>
                                </div>

                                <form onSubmit={submitNewPark} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tempat / Kawasan</label>
                                        <input
                                            type="text"
                                            required
                                            value={newParkForm.name}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, name: e.target.value })}
                                            placeholder="Contoh: Safari Jungle Eco Park"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                                        <textarea
                                            value={newParkForm.description}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, description: e.target.value })}
                                            rows="2"
                                            placeholder="Pengalaman wisata alam dan wahana konservasi..."
                                            className="w-full border rounded-xl px-3.5 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Sampul (Cover Image)</label>
                                        <input
                                            type="url"
                                            value={newParkForm.image_url}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/... atau URL gambar lainnya"
                                            className="w-full border rounded-xl px-3.5 py-2 text-sm focus:border-emerald-500 outline-none"
                                        />
                                        {newParkForm.image_url && (
                                            <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                <img src={newParkForm.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap / Kota</label>
                                        <input
                                            type="text"
                                            required
                                            value={newParkForm.location_address}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, location_address: e.target.value })}
                                            placeholder="Jl. Raya Puncak Km. 80, Bogor"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Buka</label>
                                            <input
                                                type="time"
                                                required
                                                value={newParkForm.open_time}
                                                onChange={(e) => setNewParkForm({ ...newParkForm, open_time: e.target.value })}
                                                className="w-full border rounded-xl px-2.5 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Tutup</label>
                                            <input
                                                type="time"
                                                required
                                                value={newParkForm.close_time}
                                                onChange={(e) => setNewParkForm({ ...newParkForm, close_time: e.target.value })}
                                                className="w-full border rounded-xl px-2.5 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Harian</label>
                                            <input
                                                type="number"
                                                required
                                                value={newParkForm.default_daily_capacity}
                                                onChange={(e) => setNewParkForm({ ...newParkForm, default_daily_capacity: Number(e.target.value) })}
                                                className="w-full border rounded-xl px-2.5 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-3 flex gap-2">
                                        <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm">
                                            Simpan Destinasi Baru
                                        </button>
                                        <button type="button" onClick={() => setNewParkModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

                {/* =========================================================
                    MODAL EDIT DETAIL TEMPAT (SUPER ADMIN & PARK ADMIN)
                ========================================================= */}
                <Transition show={editParkModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setEditParkModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Edit Nama &amp; Informasi Tempat</h3>
                                        <p className="text-xs text-slate-500">Ubah nama taman, alamat, jam buka, dan kapasitas</p>
                                    </div>
                                </div>

                                <form onSubmit={submitEditPark} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tempat / Kawasan</label>
                                        <input
                                            type="text"
                                            required
                                            value={editParkForm.name}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, name: e.target.value })}
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Kawasan</label>
                                        <textarea
                                            value={editParkForm.description}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, description: e.target.value })}
                                            rows="2"
                                            className="w-full border rounded-xl px-3.5 py-2 text-sm focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Sampul (Cover Image)</label>
                                        <input
                                            type="url"
                                            value={editParkForm.image_url}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/... atau URL gambar lainnya"
                                            className="w-full border rounded-xl px-3.5 py-2 text-sm focus:border-orange-500 outline-none"
                                        />
                                        {editParkForm.image_url && (
                                            <div className="mt-2 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                <img src={editParkForm.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={editParkForm.location_address}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, location_address: e.target.value })}
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Buka</label>
                                            <input
                                                type="time"
                                                required
                                                value={editParkForm.open_time}
                                                onChange={(e) => setEditParkForm({ ...editParkForm, open_time: e.target.value })}
                                                className="w-full border rounded-xl px-2.5 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Tutup</label>
                                            <input
                                                type="time"
                                                required
                                                value={editParkForm.close_time}
                                                onChange={(e) => setEditParkForm({ ...editParkForm, close_time: e.target.value })}
                                                className="w-full border rounded-xl px-2.5 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Harian</label>
                                            <input
                                                type="number"
                                                required
                                                value={editParkForm.default_daily_capacity}
                                                onChange={(e) => setEditParkForm({ ...editParkForm, default_daily_capacity: Number(e.target.value) })}
                                                className="w-full border rounded-xl px-2.5 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-3 flex gap-2">
                                        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm">
                                            Simpan Perubahan Tempat
                                        </button>
                                        <button type="button" onClick={() => setEditParkModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

                {/* ================= MODAL TAMBAH WAHANA ================= */}
                <Transition show={attractionModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setAttractionModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Wahana / Atraksi ({park?.name})</h3>
                                <form onSubmit={submitAttraction} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Zona</label>
                                        <select
                                            value={attractionForm.zone_id}
                                            onChange={(e) => setAttractionForm({ ...attractionForm, zone_id: e.target.value })}
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        >
                                            {zones.map((z) => (
                                                <option key={z.id} value={z.id}>{z.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Wahana</label>
                                        <input
                                            type="text"
                                            required
                                            value={attractionForm.name}
                                            onChange={(e) => setAttractionForm({ ...attractionForm, name: e.target.value })}
                                            placeholder="Contoh: Gravity Storm Coaster"
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
                                        <textarea
                                            value={attractionForm.description}
                                            onChange={(e) => setAttractionForm({ ...attractionForm, description: e.target.value })}
                                            rows="2"
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Wahana (Opsional)</label>
                                        <input
                                            type="url"
                                            value={attractionForm.image_url}
                                            onChange={(e) => setAttractionForm({ ...attractionForm, image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/... atau URL foto"
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:border-orange-500 outline-none"
                                        />
                                        {attractionForm.image_url && (
                                            <div className="mt-2 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                <img src={attractionForm.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Tinggi Badan (cm)</label>
                                        <input
                                            type="number"
                                            value={attractionForm.min_height_cm}
                                            onChange={(e) => setAttractionForm({ ...attractionForm, min_height_cm: Number(e.target.value) })}
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs">Simpan Wahana</button>
                                        <button type="button" onClick={() => setAttractionModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">Batal</button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

                {/* ================= MODAL TAMBAH TIKET TIER ================= */}
                <Transition show={ticketModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setTicketModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Kategori Tiket ({park?.name})</h3>
                                <form onSubmit={submitTicketTier} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kategori Tiket</label>
                                        <input
                                            type="text"
                                            required
                                            value={ticketForm.name}
                                            onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                                            placeholder="Contoh: Tiket Terusan Pelajar & Anak"
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Fasilitas</label>
                                        <textarea
                                            value={ticketForm.description}
                                            onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                                            rows="2"
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Tiket (Rp)</label>
                                            <input
                                                type="number"
                                                required
                                                value={ticketForm.initial_price}
                                                onChange={(e) => setTicketForm({ ...ticketForm, initial_price: Number(e.target.value) })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Kuota Harian</label>
                                            <input
                                                type="number"
                                                required
                                                value={ticketForm.initial_quota}
                                                onChange={(e) => setTicketForm({ ...ticketForm, initial_quota: Number(e.target.value) })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs">Simpan Kategori Tiket</button>
                                        <button type="button" onClick={() => setTicketModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">Batal</button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

                <Transition show={promoModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setPromoModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Terbitkan Kupon Promo</h3>
                                <p className="text-xs text-slate-500 mb-4">Atur ruang lingkup, kode, diskon, dan masa berlaku kupon.</p>
                                <form onSubmit={submitPromo} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Kupon (Huruf Kapital)</label>
                                        <input
                                            type="text"
                                            required
                                            value={promoForm.code}
                                            onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                                            placeholder="Contoh: LIBURANSERU"
                                            className="w-full border rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                        />
                                    </div>

                                    {/* Ruang Lingkup Promo — hanya Super Admin bisa buat global */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ruang Lingkup Promo</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPromoForm({ ...promoForm, scope: 'park', park_id: park?.id })}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition ${
                                                    promoForm.scope === 'park'
                                                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="text-base">🏟</span>
                                                <span>Khusus Park Ini</span>
                                                <span className="text-[10px] font-normal text-slate-500 normal-case">{park?.name}</span>
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!isSuperAdmin}
                                                onClick={() => setPromoForm({ ...promoForm, scope: 'global', park_id: null })}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition ${
                                                    promoForm.scope === 'global'
                                                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                            >
                                                <span className="text-base">🌐</span>
                                                <span>Global Semua Park</span>
                                                <span className="text-[10px] font-normal text-slate-500 normal-case">
                                                    {isSuperAdmin ? 'Bisa dipakai di mana saja' : 'Hanya Super Admin'}
                                                </span>
                                            </button>
                                        </div>
                                        {promoForm.scope === 'park' && (
                                            <p className="mt-1.5 text-[11px] text-blue-700 bg-blue-50 rounded-lg px-2.5 py-1.5">
                                                ✅ Promo ini <strong>hanya bisa dipakai</strong> untuk tiket di <strong>{park?.name}</strong>. Jika digunakan di park lain, akan otomatis ditolak.
                                            </p>
                                        )}
                                        {promoForm.scope === 'global' && (
                                            <p className="mt-1.5 text-[11px] text-purple-700 bg-purple-50 rounded-lg px-2.5 py-1.5">
                                                🌐 Promo ini berlaku di <strong>semua park</strong> tanpa batasan lokasi.
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Diskon</label>
                                            <select
                                                value={promoForm.discount_type}
                                                onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            >
                                                <option value="PERCENTAGE">Persentase (%)</option>
                                                <option value="FIXED">Potongan Tetap (Rp)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nilai Diskon</label>
                                            <input
                                                type="number"
                                                required
                                                value={promoForm.discount_value}
                                                onChange={(e) => setPromoForm({ ...promoForm, discount_value: Number(e.target.value) })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Minimal Transaksi (Rp)</label>
                                        <input
                                            type="number"
                                            value={promoForm.min_order_amount}
                                            onChange={(e) => setPromoForm({ ...promoForm, min_order_amount: Number(e.target.value) })}
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Berlaku Sampai Tanggal</label>
                                        <input
                                            type="date"
                                            required
                                            value={promoForm.valid_until}
                                            onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs">Terbitkan Kupon</button>
                                        <button type="button" onClick={() => setPromoModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">Batal</button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

            </div>
        </>
    );
}
