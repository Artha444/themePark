import { useState, Fragment, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import AdminLayout from '@/Layouts/AdminLayout';
import LocationPicker from '@/Components/LocationPicker';
import {
    DollarSign, Ticket, Users, ArrowLeft, Plus, Calendar,
    Tag, Wrench, Edit3, Building2, MapPin, Clock, Image as ImageIcon, Sparkles, Trash2,
    Check, ChevronLeft, ChevronRight, AlertCircle, Info, ShieldAlert
} from 'lucide-react';

export default function ManagePark({
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
    nationalHolidays = [],
}) {
    const [activeTab, setActiveTab] = useState('schedule');
    const [updatingId, setUpdatingId] = useState(null);

    // Modal States
    const [attractionModalOpen, setAttractionModalOpen] = useState(false);
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [newParkModalOpen, setNewParkModalOpen] = useState(false);
    const [editParkModalOpen, setEditParkModalOpen] = useState(false);

    // State modal Manajemen Hari Libur Nasional & Kupon Promo
    // (dipakai oleh JSX/handler di halaman ini; wajib dideklarasikan agar tidak ReferenceError)
    const [holidayModalOpen, setHolidayModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [promoModalOpen, setPromoModalOpen] = useState(false);

    // Form Holiday
    const [holidayForm, setHolidayForm] = useState({
        holiday_date: '',
        name: '',
        description: '',
    });

    // Form New Park (Khusus Super Admin)
    const [newParkForm, setNewParkForm] = useState({
        name: '',
        description: '',
        image_url: '',
        location_address: '',
        city: '',
        latitude: null,
        longitude: null,
        maps_place_name: '',
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
        city: park?.city || '',
        latitude: park?.latitude || null,
        longitude: park?.longitude || null,
        maps_place_name: park?.maps_place_name || '',
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
        weekday_price: 100000,
        weekend_price: 120000,
        holiday_price: 135000,
        initial_quota: 2000,
    });

    // Modal Edit Rates Tier
    const [rateModalOpen, setRateModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [rateForm, setRateForm] = useState({
        weekday_price: 0,
        weekend_price: 0,
        holiday_price: 0,
    });

    // Modal Jadwal Khusus
    const [specialScheduleModalOpen, setSpecialScheduleModalOpen] = useState(false);
    const [specialScheduleForm, setSpecialScheduleForm] = useState({
        start_date: today,
        end_date: today,
        override_status: 'SPECIAL_CLOSED', // SPECIAL_CLOSED, SPECIAL_OPEN, REGULAR
        closure_reason: '',
    });

    // Calendar View Month Navigator (Tampilan Pratinjau Kalender Bulanan)
    const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

    // Form New Promotion
    const [promoForm, setPromoForm] = useState({
        code: '',
        scope: isSuperAdmin ? 'global' : 'park',
        park_id: park?.id || '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        min_order_amount: '',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const openEditParkModal = () => {
        if (!park) return;
        setEditParkForm({
            name: park.name,
            description: park.description || '',
            image_url: park.image_url || '',
            location_address: park.location_address,
            city: park.city || '',
            latitude: park.latitude || null,
            longitude: park.longitude || null,
            maps_place_name: park.maps_place_name || '',
            open_time: park.open_time?.substring(0, 5) || '09:00',
            close_time: park.close_time?.substring(0, 5) || '21:00',
            default_daily_capacity: park.default_daily_capacity || 5000,
        });
        setEditParkModalOpen(true);
    };

    // Handlers
    const handleParkSwitch = (parkId) => {
        router.get(`/admin/manage?park_id=${parkId}`, {}, { preserveScroll: true });
    };

    const handleRoleSwitch = (newRole) => {
        router.get(`/admin/manage?as_role=${newRole}`, {}, { preserveScroll: true });
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
        }, { 
            preserveScroll: true,
            only: ['calendarCapacities', 'metrics', 'park'] 
        });
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
        if (!newParkForm.latitude || !newParkForm.longitude) {
            alert('Mohon pilih lokasi yang valid di peta terlebih dahulu!');
            return;
        }
        router.post('/admin/parks', newParkForm, {
            preserveScroll: true,
            onSuccess: () => {
                setNewParkModalOpen(false);
                setNewParkForm({
                    name: '',
                    description: '',
                    image_url: '',
                    location_address: '',
                    city: '',
                    latitude: null,
                    longitude: null,
                    maps_place_name: '',
                    open_time: '09:00',
                    close_time: '21:00',
                    default_daily_capacity: 5000,
                });
            },
        });
    };

    const submitEditPark = (e) => {
        e.preventDefault();
        if (!editParkForm.latitude || !editParkForm.longitude) {
            alert('Mohon pilih lokasi yang valid di peta terlebih dahulu!');
            return;
        }
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
                setTicketForm({
                    name: '',
                    description: '',
                    min_age: '',
                    max_age: '',
                    max_height_cm: '',
                    weekday_price: 100000,
                    weekend_price: 120000,
                    holiday_price: 135000,
                    initial_quota: 2000
                });
            },
        });
    };

    const openEditRateModal = (tier) => {
        setEditingTier(tier);
        setRateForm({
            weekday_price: tier.weekday_price || 100000,
            weekend_price: tier.weekend_price || (tier.weekday_price ? Math.round(tier.weekday_price * 1.2) : 120000),
            holiday_price: tier.holiday_price || (tier.weekend_price ? Math.round(tier.weekend_price * 1.15) : 135000),
        });
        setRateModalOpen(true);
    };

    const submitTierRates = (e) => {
        e.preventDefault();
        if (!editingTier) return;
        router.post(`/admin/tickets/tiers/${editingTier.id}/rates`, rateForm, {
            preserveScroll: true,
            onSuccess: () => setRateModalOpen(false),
        });
    };

    // 1. Handlers Rutin Mingguan
    const regularClosedDays = park?.regular_closed_days || [];
    const handleToggleRegularDay = (dayNum) => {
        const current = [...regularClosedDays];
        const idx = current.indexOf(dayNum);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(dayNum);
        }
        current.sort();
        router.post('/admin/capacity/regular-schedule', {
            park_id: park?.id,
            regular_closed_days: current,
        }, { 
            preserveScroll: true,
            only: ['calendarCapacities', 'park'] 
        });
    };

    const handleSetRegularPreset = (preset) => {
        let days = [];
        if (preset === 'WEEKDAYS') {
            days = [1, 2, 3, 4, 5]; // Senin - Jumat
        } else if (preset === 'MONDAY_ONLY') {
            days = [1]; // Senin saja
        } else if (preset === 'ALL_OPEN') {
            days = []; // Buka setiap hari
        }
        router.post('/admin/capacity/regular-schedule', {
            park_id: park?.id,
            regular_closed_days: days,
        }, { 
            preserveScroll: true,
            only: ['calendarCapacities', 'park'] 
        });
    };

    // 2. Handlers Tanggal Khusus
    const openSpecialScheduleModal = (prefillDate = null) => {
        const d = prefillDate || today;
        setSpecialScheduleForm({
            start_date: d,
            end_date: d,
            override_status: 'SPECIAL_CLOSED',
            closure_reason: '',
        });
        setSpecialScheduleModalOpen(true);
    };

    const submitSpecialSchedule = (e) => {
        e.preventDefault();
        router.post('/admin/capacity/special-schedule', {
            park_id: park?.id,
            ...specialScheduleForm,
        }, {
            preserveScroll: true,
            only: ['calendarCapacities', 'park'],
            onSuccess: () => setSpecialScheduleModalOpen(false),
        });
    };

    const submitPromo = (e) => {
        e.preventDefault();
        const payload = {
            ...promoForm,
            scope: isSuperAdmin ? 'global' : 'park',
            park_id: isSuperAdmin ? null : park?.id,
            discount_value: Number(promoForm.discount_value) || 0,
            min_order_amount: Number(promoForm.min_order_amount) || 0,
        };
        router.post('/admin/promotions', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setPromoModalOpen(false);
                setPromoForm({
                    code: '',
                    scope: isSuperAdmin ? 'global' : 'park',
                    park_id: isSuperAdmin ? '' : (park?.id || ''),
                    discount_type: 'PERCENTAGE',
                    discount_value: '',
                    min_order_amount: '',
                    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });
            },
        });
    };

    const openAddHolidayModal = () => {
        setEditingHoliday(null);
        setHolidayForm({ holiday_date: '', name: '', description: '' });
        setHolidayModalOpen(true);
    };

    const openEditHolidayModal = (h) => {
        setEditingHoliday(h);
        setHolidayForm({
            holiday_date: typeof h.holiday_date === 'string' ? h.holiday_date.substring(0, 10) : new Date(h.holiday_date).toISOString().substring(0, 10),
            name: h.name,
            description: h.description || '',
        });
        setHolidayModalOpen(true);
    };

    const submitHoliday = (e) => {
        e.preventDefault();
        if (editingHoliday) {
            router.post(`/admin/holidays/${editingHoliday.id}/update`, holidayForm, {
                preserveScroll: true,
                onSuccess: () => setHolidayModalOpen(false),
            });
        } else {
            router.post('/admin/holidays', holidayForm, {
                preserveScroll: true,
                onSuccess: () => setHolidayModalOpen(false),
            });
        }
    };

    const deleteHoliday = (id) => {
        if (confirm('Yakin ingin menghapus tanggal libur nasional ini?')) {
            router.delete(`/admin/holidays/${id}`, { preserveScroll: true });
        }
    };

    const capacityPercent = metrics?.max_capacity > 0
        ? Math.min(100, Math.round((metrics.booked_capacity / metrics.max_capacity) * 100))
        : 0;

    return (
        <>
            <Head title={`Admin Pengaturan Park & Tiket | ${park?.name || 'Vurasi'}`} />

            <AdminLayout
                parks={parks}
                park={park}
                isSuperAdmin={isSuperAdmin}
                adminRole={adminRole}
            >
                {/* Tombol Kembali ke Kelola Park Khusus Super Admin */}
                {isSuperAdmin && (
                    <div className="mb-4">
                        <Link
                            href="/admin/manage"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Kelola Semua Park</span>
                        </Link>
                    </div>
                )}
                <div className="space-y-6">
                    
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
                                    {isSuperAdmin && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-100 text-orange-800">
                                            Destinasi Aktif
                                        </span>
                                    )}
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
                                    {park?.latitude && park?.longitude && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${park.latitude},${park.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md"
                                        >
                                            Buka di Google Maps ↗
                                        </a>
                                    )}
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
                        </div>

                        {/* =========================================================
                            TAB 1: ATUR JADWAL RUTIN, TANGGAL KHUSUS & PRATINJAU KALENDER
                        ========================================================= */}
                        {activeTab === 'schedule' && (
                            <div className="space-y-8">
                                
                                {/* -------------------------------------------------------------
                                    SECTION 1: PENGATURAN RUTIN MINGGUAN (HARI TUTUP REGULER)
                                ------------------------------------------------------------- */}
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center">1</span>
                                                <h3 className="text-base font-extrabold text-slate-900">
                                                    Pengaturan Rutin Mingguan (Hari Tutup Reguler)
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Pilih hari-hari di mana {park?.name} tutup secara permanen setiap minggu (misal: perawatan rutin).
                                            </p>
                                        </div>

                                        {/* Shortcut Presets */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => handleSetRegularPreset('MONDAY_ONLY')}
                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                                            >
                                                Tutup Tiap Senin
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSetRegularPreset('WEEKDAYS')}
                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                                            >
                                                Tutup Hari Kerja (Sen-Jum)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSetRegularPreset('ALL_OPEN')}
                                                className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition"
                                            >
                                                ✓ Buka Setiap Hari
                                            </button>
                                        </div>
                                    </div>

                                    {/* Deretan Toggle Hari (Senin s/d Minggu) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
                                        {[
                                            { num: 1, name: 'Senin', label: 'Hari Kerja' },
                                            { num: 2, name: 'Selasa', label: 'Hari Kerja' },
                                            { num: 3, name: 'Rabu', label: 'Hari Kerja' },
                                            { num: 4, name: 'Kamis', label: 'Hari Kerja' },
                                            { num: 5, name: 'Jumat', label: 'Hari Kerja' },
                                            { num: 6, name: 'Sabtu', label: 'Akhir Pekan' },
                                            { num: 7, name: 'Minggu', label: 'Akhir Pekan' },
                                        ].map((day) => {
                                            const isClosed = regularClosedDays.includes(day.num);
                                            return (
                                                <button
                                                    key={day.num}
                                                    type="button"
                                                    onClick={() => handleToggleRegularDay(day.num)}
                                                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                                        isClosed
                                                            ? 'border-rose-400 bg-rose-50/90 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                                                            : 'border-slate-200 bg-white hover:border-emerald-400 text-slate-800'
                                                    }`}
                                                >
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">{day.label}</span>
                                                    <span className="text-sm font-extrabold">{day.name}</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                                                        isClosed ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {isClosed ? 'TUTUP RUTIN' : 'BUKA'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* -------------------------------------------------------------
                                    SECTION 2: PENGATURAN TANGGAL KHUSUS (OVERRIDE / MAINTENANCE)
                                ------------------------------------------------------------- */}
                                <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                            2
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                                                <span>Pengaturan Tanggal Khusus (Override Libur Insidental / Renovasi)</span>
                                            </h3>
                                            <p className="text-xs text-amber-900/80 mt-0.5 max-w-2xl leading-relaxed">
                                                Menimpa jadwal rutin mingguan untuk periode tanggal tertentu. Anda dapat menetapkan <strong>Tutup Khusus</strong> (misal renovasi/cuaca buruk) atau <strong>Buka Khusus</strong> (misal hari libur nasional di hari yang biasanya tutup).
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openSpecialScheduleModal()}
                                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-2 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>+ Tetapkan Tanggal Khusus</span>
                                    </button>
                                </div>

                                {/* -------------------------------------------------------------
                                    SECTION 3: TAMPILAN PRATINJAU KALENDER (CALENDAR VIEW)
                                ------------------------------------------------------------- */}
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
                                                <h3 className="text-base font-extrabold text-slate-900">
                                                    Pratinjau Kalender Bulanan Interaktif ({park?.name})
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Klik langsung pada kotak tanggal untuk mengubah status Buka/Tutup seketika.
                                            </p>
                                        </div>

                                        {/* Legend Indikator Warna */}
                                        <div className="flex items-center gap-3 text-xs font-semibold flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
                                            <span className="flex items-center gap-1.5 text-slate-700">
                                                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Buka
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-700">
                                                <span className="w-3 h-3 rounded-full bg-rose-600" /> Tutup Rutin
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-700">
                                                <span className="w-3 h-3 rounded-full bg-amber-500" /> Tutup Khusus
                                            </span>
                                            <span className="flex items-center gap-1.5 text-slate-700">
                                                <span className="w-3 h-3 rounded-full bg-blue-500" /> Buka Khusus
                                            </span>
                                        </div>
                                    </div>

                                    {/* Monthly Calendar Component */}
                                    {(() => {
                                        // Generate 42 days grid for active month view
                                        const now = new Date();
                                        const targetDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
                                        const year = targetDate.getFullYear();
                                        const month = targetDate.getMonth();
                                        const monthName = targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

                                        const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Senin .. 6=Minggu
                                        const daysInMonth = new Date(year, month + 1, 0).getDate();

                                        const capacityMap = new Map();
                                        calendarCapacities.forEach((c) => capacityMap.set(c.visit_date, c));

                                        const holidayMap = new Map();
                                        nationalHolidays.forEach((h) => {
                                            const dStr = typeof h.holiday_date === 'string' ? h.holiday_date.substring(0, 10) : new Date(h.holiday_date).toISOString().substring(0, 10);
                                            holidayMap.set(dStr, h.name);
                                        });

                                        const daysGrid = [];
                                        for (let i = 0; i < firstDayOfWeek; i++) {
                                            daysGrid.push({ empty: true, key: `empty-${i}` });
                                        }

                                        for (let d = 1; d <= daysInMonth; d++) {
                                            const dayDate = new Date(year, month, d);
                                            const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                            const dayOfWeekIso = dayDate.getDay() === 0 ? 7 : dayDate.getDay(); // 1=Senin .. 7=Minggu
                                            
                                            // 4. PRIORITAS LOGIKA SISTEM:
                                            // 1. Cek Tanggal Khusus (override_status)
                                            // 2. Cek Jadwal Rutin Mingguan
                                            // 3. Default: Buka
                                            const cap = capacityMap.get(isoStr);
                                            const isRegClosed = regularClosedDays.includes(dayOfWeekIso);
                                            const holidayName = holidayMap.get(isoStr);

                                            let statusType = 'OPEN'; // OPEN, REGULAR_CLOSED, SPECIAL_CLOSED, SPECIAL_OPEN
                                            let reason = cap?.closure_reason || '';

                                            if (cap && cap.override_status === 'SPECIAL_CLOSED') {
                                                statusType = 'SPECIAL_CLOSED';
                                            } else if (cap && cap.override_status === 'SPECIAL_OPEN') {
                                                statusType = 'SPECIAL_OPEN';
                                            } else if (isRegClosed || cap?.is_closed) {
                                                statusType = 'REGULAR_CLOSED';
                                                reason = reason || 'Jadwal Libur Rutin Mingguan';
                                            }

                                            daysGrid.push({
                                                empty: false,
                                                key: isoStr,
                                                dateStr: isoStr,
                                                dayNumber: d,
                                                dayName: dayDate.toLocaleDateString('id-ID', { weekday: 'short' }),
                                                statusType,
                                                reason,
                                                holidayName,
                                                capacity: cap,
                                                isPast: isoStr < today,
                                            });
                                        }

                                        return (
                                            <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                                                {/* Month Header Nav */}
                                                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <h4 className="font-extrabold text-base capitalize tracking-wide">
                                                        {monthName}
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Day Names Row */}
                                                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2.5">
                                                    <div>Sen</div>
                                                    <div>Sel</div>
                                                    <div>Rab</div>
                                                    <div>Kam</div>
                                                    <div>Jum</div>
                                                    <div className="text-amber-600">Sab</div>
                                                    <div className="text-rose-600">Min</div>
                                                </div>

                                                {/* Calendar Days Grid */}
                                                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                                                    {daysGrid.map((item) => {
                                                        if (item.empty) {
                                                            return <div key={item.key} className="bg-slate-50/40 min-h-[95px]" />;
                                                        }

                                                        const { dateStr, dayNumber, statusType, reason, holidayName, isPast, capacity: cap } = item;
                                                        
                                                        let bgClass = 'bg-white hover:bg-slate-50';
                                                        let badgeClass = 'bg-emerald-100 text-emerald-800';
                                                        let labelText = 'Buka';

                                                        if (statusType === 'SPECIAL_CLOSED') {
                                                            bgClass = 'bg-amber-50/70 hover:bg-amber-50';
                                                            badgeClass = 'bg-amber-500 text-white font-black';
                                                            labelText = 'Tutup Khusus';
                                                        } else if (statusType === 'REGULAR_CLOSED') {
                                                            bgClass = 'bg-rose-50/70 hover:bg-rose-50';
                                                            badgeClass = 'bg-rose-600 text-white font-black';
                                                            labelText = 'Tutup Rutin';
                                                        } else if (statusType === 'SPECIAL_OPEN') {
                                                            bgClass = 'bg-blue-50/70 hover:bg-blue-50';
                                                            badgeClass = 'bg-blue-600 text-white font-black';
                                                            labelText = 'Buka Khusus';
                                                        }

                                                        return (
                                                            <div
                                                                key={item.key}
                                                                className={`p-2.5 min-h-[95px] flex flex-col justify-between transition-all ${bgClass} ${isPast ? 'opacity-50' : ''}`}
                                                            >
                                                                <div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`text-xs font-extrabold ${dateStr === today ? 'w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-black' : 'text-slate-800'}`}>
                                                                            {dayNumber}
                                                                        </span>
                                                                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${badgeClass}`}>
                                                                            {labelText}
                                                                        </span>
                                                                    </div>

                                                                    {holidayName && (
                                                                        <div className="mt-1 text-[9px] font-extrabold text-rose-700 bg-rose-100/90 px-1 py-0.5 rounded leading-tight truncate" title={holidayName}>
                                                                            🎉 {holidayName}
                                                                        </div>
                                                                    )}

                                                                    {reason && (
                                                                        <p className="mt-1 text-[10px] text-slate-500 leading-tight line-clamp-1 italic" title={reason}>
                                                                            {reason}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Quick Toggle / Override Action */}
                                                                <div className="mt-2 pt-1 border-t border-slate-100/80 flex items-center justify-between">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleClosedDate(dateStr)}
                                                                        className="text-[10px] font-bold text-slate-600 hover:text-orange-600 transition underline cursor-pointer"
                                                                        title="Klik cepat untuk ganti status hari ini"
                                                                    >
                                                                        Ubah Status
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openSpecialScheduleModal(dateStr)}
                                                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                                                                        title="Tetapkan rincian tanggal khusus"
                                                                    >
                                                                        Khusus...
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
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

                                                {/* Daftar Tarif Reguler, Weekend, & Libur Nasional */}
                                                <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 text-xs">
                                                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                        Struktur Tarif Tier:
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500 text-[11px]">Hari Biasa (Weekday):</span>
                                                        <strong className="font-bold text-slate-900">Rp {Number(tier.weekday_price || 0).toLocaleString('id-ID')}</strong>
                                                    </div>
                                                    <div className="flex justify-between items-center text-amber-900">
                                                        <span className="text-amber-700 text-[11px]">Akhir Pekan (Weekend):</span>
                                                        <strong className="font-bold">Rp {Number(tier.weekend_price || 0).toLocaleString('id-ID')}</strong>
                                                    </div>
                                                    <div className="flex justify-between items-center text-rose-900">
                                                        <span className="text-rose-700 text-[11px]">Libur Nasional (Holiday):</span>
                                                        <strong className="font-bold text-rose-600">Rp {Number(tier.holiday_price || 0).toLocaleString('id-ID')}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200 space-y-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditRateModal(tier)}
                                                    className="w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    Atur Tarif (Weekday, Weekend &amp; Libur)
                                                </button>
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
                                    {/* PENCARIAN & VALIDASI LOKASI PETA (GRATIS & TERVERIFIKASI) */}
                                    <LocationPicker
                                        initialAddress={newParkForm.location_address}
                                        initialLat={newParkForm.latitude}
                                        initialLng={newParkForm.longitude}
                                        initialPlaceName={newParkForm.maps_place_name}
                                        initialCity={newParkForm.city}
                                        onChange={({ address, lat, lng, placeName, city }) => {
                                            setNewParkForm((prev) => ({
                                                ...prev,
                                                location_address: address,
                                                latitude: lat,
                                                longitude: lng,
                                                maps_place_name: placeName,
                                                city: city || prev.city,
                                            }));
                                        }}
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kota (untuk tabel Overview Pusat)</label>
                                        <input
                                            type="text"
                                            value={newParkForm.city}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, city: e.target.value })}
                                            placeholder="contoh: Bogor"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Kosongkan untuk mengambil kota dari bagian akhir alamat.</p>
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
                                                min="1"
                                                value={newParkForm.default_daily_capacity}
                                                onChange={(e) => setNewParkForm({ ...newParkForm, default_daily_capacity: e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 0) })}
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
                                    {/* PENCARIAN & VALIDASI LOKASI PETA (GRATIS & TERVERIFIKASI) */}
                                    <LocationPicker
                                        initialAddress={editParkForm.location_address}
                                        initialLat={editParkForm.latitude}
                                        initialLng={editParkForm.longitude}
                                        initialPlaceName={editParkForm.maps_place_name}
                                        initialCity={editParkForm.city}
                                        onChange={({ address, lat, lng, placeName, city }) => {
                                            setEditParkForm((prev) => ({
                                                ...prev,
                                                location_address: address,
                                                latitude: lat,
                                                longitude: lng,
                                                maps_place_name: placeName,
                                                city: city || prev.city,
                                            }));
                                        }}
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kota (untuk tabel Overview Pusat)</label>
                                        <input
                                            type="text"
                                            value={editParkForm.city}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, city: e.target.value })}
                                            placeholder="contoh: Bandung"
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
                                                min="1"
                                                value={editParkForm.default_daily_capacity}
                                                onChange={(e) => setEditParkForm({ ...editParkForm, default_daily_capacity: e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 0) })}
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
                                            min="0"
                                            value={attractionForm.min_height_cm}
                                            onChange={(e) => setAttractionForm({ ...attractionForm, min_height_cm: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
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
                                    <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Weekday (Rp)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={ticketForm.weekday_price}
                                                onChange={(e) => setTicketForm({ ...ticketForm, weekday_price: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-amber-700 mb-1">Weekend (Rp)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={ticketForm.weekend_price}
                                                onChange={(e) => setTicketForm({ ...ticketForm, weekend_price: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-rose-700 mb-1">Libur Nas. (Rp)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={ticketForm.holiday_price}
                                                onChange={(e) => setTicketForm({ ...ticketForm, holiday_price: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-800"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kuota Harian Default</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={ticketForm.initial_quota}
                                            onChange={(e) => setTicketForm({ ...ticketForm, initial_quota: e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 0) })}
                                            className="w-full border rounded-xl px-3 py-2 text-sm"
                                        />
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

                {/* =========================================================
                    MODAL ATUR TARIF TIER (WEEKDAY, WEEKEND, LIBUR NASIONAL)
                ========================================================= */}
                <Transition show={rateModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setRateModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 text-base">
                                            Atur Tarif Tiket: {editingTier?.name}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">Atur harga hari kerja, akhir pekan, dan tanggal merah</p>
                                    </div>
                                </div>
                                <form onSubmit={submitTierRates} className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Harga Hari Biasa (Weekday - Senin s/d Jumat)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={rateForm.weekday_price}
                                                    onChange={(e) => setRateForm({ ...rateForm, weekday_price: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                                            <label className="block text-xs font-bold text-amber-900 mb-1">
                                                Harga Akhir Pekan (Weekend - Sabtu &amp; Minggu)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">Rp</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={rateForm.weekend_price}
                                                    onChange={(e) => setRateForm({ ...rateForm, weekend_price: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                    className="w-full pl-9 pr-3 py-2 border border-amber-300 rounded-lg text-sm font-bold text-amber-950 focus:border-amber-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                                            <label className="block text-xs font-bold text-rose-900 mb-1">
                                                Harga Hari Libur Nasional (National Holidays)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">Rp</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={rateForm.holiday_price}
                                                    onChange={(e) => setRateForm({ ...rateForm, holiday_price: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                                    className="w-full pl-9 pr-3 py-2 border border-rose-300 rounded-lg text-sm font-bold text-rose-950 focus:border-rose-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 leading-relaxed">
                                        💡 Mengubah tarif di sini akan otomatis mensinkronkan harga tiket inventori mendatang yang belum terjual.
                                    </div>

                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs">
                                            Simpan Semua Tarif
                                        </button>
                                        <button type="button" onClick={() => setRateModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

                {/* =========================================================
                    MODAL PENETAPAN TANGGAL KHUSUS (OVERRIDE JADWAL)
                ========================================================= */}
                <Transition show={specialScheduleModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setSpecialScheduleModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 text-base">
                                            Pengaturan Tanggal Khusus
                                        </h3>
                                        <p className="text-[11px] text-slate-400">Menimpa jadwal buka/tutup rutin mingguan</p>
                                    </div>
                                </div>

                                <form onSubmit={submitSpecialSchedule} className="space-y-4">
                                    {/* Rentang Tanggal (Date Range Support) */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai Tanggal</label>
                                            <input
                                                type="date"
                                                required
                                                value={specialScheduleForm.start_date}
                                                onChange={(e) => setSpecialScheduleForm({
                                                    ...specialScheduleForm,
                                                    start_date: e.target.value,
                                                    end_date: e.target.value > specialScheduleForm.end_date ? e.target.value : specialScheduleForm.end_date
                                                })}
                                                className="w-full border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
                                            <input
                                                type="date"
                                                required
                                                min={specialScheduleForm.start_date}
                                                value={specialScheduleForm.end_date}
                                                onChange={(e) => setSpecialScheduleForm({ ...specialScheduleForm, end_date: e.target.value })}
                                                className="w-full border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Pilihan: Tutup Khusus vs Buka Khusus vs Reset */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Pilihan</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSpecialScheduleForm({ ...specialScheduleForm, override_status: 'SPECIAL_CLOSED' })}
                                                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
                                                    specialScheduleForm.override_status === 'SPECIAL_CLOSED'
                                                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                <span>Tutup Khusus</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSpecialScheduleForm({ ...specialScheduleForm, override_status: 'SPECIAL_OPEN' })}
                                                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
                                                    specialScheduleForm.override_status === 'SPECIAL_OPEN'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                                <span>Buka Khusus</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSpecialScheduleForm({ ...specialScheduleForm, override_status: 'REGULAR' })}
                                                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
                                                    specialScheduleForm.override_status === 'REGULAR'
                                                        ? 'border-slate-600 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                                <span>Reset Rutin</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Kolom Keterangan / Alasan */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Alasan / Keterangan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={specialScheduleForm.closure_reason}
                                            onChange={(e) => setSpecialScheduleForm({ ...specialScheduleForm, closure_reason: e.target.value })}
                                            placeholder="contoh: Maintenance tahunan wahana, renovasi lighting..."
                                            className="w-full border rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-amber-500 outline-none"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Keterangan ini akan terlihat sebagai catatan informatif bagi staf dan pengunjung.
                                        </p>
                                    </div>

                                    <div className="pt-2 flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition"
                                        >
                                            Terapkan Jadwal Khusus
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSpecialScheduleModalOpen(false)}
                                            className="px-4 border rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>

                {/* =========================================================
                    MODAL MANAJEMEN HARI LIBUR NASIONAL (TAMBAH & EDIT)
                ========================================================= */}
                {isSuperAdmin && (
                    <Transition show={holidayModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setHolidayModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 text-base">
                                            {editingHoliday ? 'Edit Hari Libur Nasional' : 'Tambah Hari Libur Nasional'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">Atur kalender libur &amp; cuti bersama</p>
                                    </div>
                                </div>
                                <form onSubmit={submitHoliday} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Libur</label>
                                        <input
                                            type="date"
                                            required
                                            value={holidayForm.holiday_date}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:border-rose-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Hari Libur / Hari Raya</label>
                                        <input
                                            type="text"
                                            required
                                            value={holidayForm.name}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                                            placeholder="contoh: Hari Raya Natal, Tahun Baru Masehi"
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:border-rose-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Tambahan (Opsional)</label>
                                        <textarea
                                            rows="2"
                                            value={holidayForm.description}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                                            placeholder="contoh: Libur nasional cuti bersama serentak"
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:border-rose-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 leading-relaxed">
                                        ℹ️ Tiket yang dipesan pada tanggal ini otomatis menerapkan <strong>Tarif Libur Nasional (Holiday Price)</strong>.
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs">
                                            {editingHoliday ? 'Simpan Perubahan' : 'Tambahkan ke Kalender'}
                                        </button>
                                        <button type="button" onClick={() => setHolidayModalOpen(false)} className="px-4 border rounded-xl text-xs font-semibold">
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </div>
                    </Dialog>
                </Transition>
            )}
            </AdminLayout>
        </>
    );
}
