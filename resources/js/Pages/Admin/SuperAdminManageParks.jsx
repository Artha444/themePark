import { useState, Fragment, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import AdminLayout from '@/Layouts/AdminLayout';
import LocationPicker from '@/Components/LocationPicker';
import {
    Building2, Plus, Search, MapPin, Clock, Users, Edit3, Trash2,
    ExternalLink, Power, Eye, Sparkles, AlertCircle, ChevronLeft, ChevronRight,
    Layers, Ticket, ShieldCheck, CheckCircle2, SlidersHorizontal, UserCog,
} from 'lucide-react';

export default function SuperAdminManageParks({
    parks = [],
    park,
    parksPaginated,
    filters = {},
    summary = {},
    categories = [],
    adminRole = 'SUPER_ADMIN',
    isSuperAdmin = true,
}) {
    const { errors = {} } = usePage().props;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'ALL');

    // Modals
    const [newParkModalOpen, setNewParkModalOpen] = useState(false);
    const [editParkModalOpen, setEditParkModalOpen] = useState(false);
    const [editingPark, setEditingPark] = useState(null);

    // Modal pengelolaan akun Admin Park (satu park = satu admin)
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [adminPark, setAdminPark] = useState(null);
    const [adminForm, setAdminForm] = useState({
        admin_name: '',
        admin_email: '',
        admin_password: '',
    });

    // Form Tambah Park
    const [newParkForm, setNewParkForm] = useState({
        name: '',
        category: 'Theme Park & Wahana',
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
        admin_name: '',
        admin_email: '',
        admin_password: '',
    });

    // Form Edit Park
    const [editParkForm, setEditParkForm] = useState({
        name: '',
        category: '',
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

    // Handle Pencarian
    const handleFilterChange = (newSearch, newCat) => {
        router.get(
            '/admin/manage',
            {
                search: newSearch,
                category: newCat === 'ALL' ? '' : newCat,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange(searchQuery, selectedCategory);
    };

    // Buka Modal Edit
    const handleOpenEdit = (targetPark) => {
        setEditingPark(targetPark);
        setEditParkForm({
            name: targetPark.name,
            category: targetPark.category || 'Theme Park & Wahana',
            description: targetPark.description || '',
            image_url: targetPark.image_url || '',
            location_address: targetPark.location_address || '',
            city: targetPark.city || '',
            latitude: targetPark.latitude || null,
            longitude: targetPark.longitude || null,
            maps_place_name: targetPark.maps_place_name || '',
            open_time: targetPark.open_time?.substring(0, 5) || '09:00',
            close_time: targetPark.close_time?.substring(0, 5) || '21:00',
            default_daily_capacity: targetPark.default_daily_capacity || 5000,
        });
        setEditParkModalOpen(true);
    };

    // Submit Tambah Park
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
                    category: 'Theme Park & Wahana',
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
                    admin_name: '',
                    admin_email: '',
                    admin_password: '',
                });
            },
        });
    };

    // Submit Edit Park
    const submitEditPark = (e) => {
        e.preventDefault();
        if (!editParkForm.latitude || !editParkForm.longitude) {
            alert('Mohon pilih lokasi yang valid di peta terlebih dahulu!');
            return;
        }

        router.post(`/admin/parks/${editingPark.id}/update`, editParkForm, {
            preserveScroll: true,
            onSuccess: () => setEditParkModalOpen(false),
        });
    };

    // Buka modal atur Admin Park (satu park = satu admin)
    const handleOpenAdmin = (targetPark) => {
        setAdminPark(targetPark);
        setAdminForm({
            admin_name: targetPark.admin?.name || '',
            admin_email: targetPark.admin?.email || '',
            admin_password: '',
        });
        setAdminModalOpen(true);
    };

    // Simpan / perbarui akun Admin Park
    const submitAdmin = (e) => {
        e.preventDefault();
        router.post(`/admin/parks/${adminPark.id}/admin`, adminForm, {
            preserveScroll: true,
            onSuccess: () => {
                setAdminModalOpen(false);
                setAdminForm({ admin_name: '', admin_email: '', admin_password: '' });
            },
        });
    };

    // Toggle Aktif / Nonaktif
    const handleToggleStatus = (targetPark) => {
        const action = targetPark.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} destinasi "${targetPark.name}"?`)) {
            router.post(`/admin/parks/${targetPark.id}/toggle-status`, {}, {
                preserveScroll: true,
            });
        }
    };

    // Hapus Park
    const handleDeletePark = (targetPark) => {
        if (confirm(`PENTING: Apakah Anda yakin ingin menghapus destinasi "${targetPark.name}"? Jika sudah ada pesanan tiket, destinasi akan diarsipkan secara aman.`)) {
            router.delete(`/admin/parks/${targetPark.id}`, {
                preserveScroll: true,
            });
        }
    };

    const parkList = parksPaginated?.data || [];

    return (
        <AdminLayout
            parks={parks}
            park={park}
            isSuperAdmin={isSuperAdmin}
            adminRole={adminRole}
        >
            <Head title="Kelola Semua Destinasi & Park | Admin Pusat" />

            <div className="space-y-8 font-sans">
                {/* HEADER UTAMA */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-extrabold text-xs uppercase tracking-wider mb-2">
                            <Building2 className="w-3.5 h-3.5" /> Otoritas Admin Pusat
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Kelola Semua Destinasi (Multi-Park)
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                            Manajemen terpusat seluruh taman hiburan, galeri pameran seni, dan destinasi wisata di sistem Vurasi. Didesain untuk menangani puluhan hingga ratusan cabang destinasi secara instan.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setNewParkModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Tambah Destinasi Baru</span>
                    </button>
                </div>

                {/* STATISTIK RINGKAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Destinasi</span>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{summary.total_parks || 0}</h3>
                            <span className="text-[11px] text-slate-500">Terdaftar di ekosistem</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                            <Building2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Destinasi Aktif</span>
                            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{summary.active_parks || 0}</h3>
                            <span className="text-[11px] text-slate-500">Dapat dipesan pengunjung</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diarsipkan / Nonaktif</span>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-700 mt-1">{summary.inactive_parks || 0}</h3>
                            <span className="text-[11px] text-slate-500">Disembunyikan dari publik</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                            <Power className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* FILTER & PENCARIAN CEPAT (Dirancang untuk 100+ Park) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama destinasi, kota, atau alamat..."
                            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 outline-none"
                        />
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-orange-600 text-white font-bold text-[11px] rounded-lg hover:bg-orange-700 transition"
                        >
                            Cari
                        </button>
                    </form>

                    {/* Filter Kategori */}
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Kategori:
                        </span>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                handleFilterChange(searchQuery, e.target.value);
                            }}
                            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:border-orange-500 outline-none"
                        >
                            <option value="ALL">Semua Kategori</option>
                            <option value="Theme Park & Wahana">Theme Park & Wahana</option>
                            <option value="Art & Light Exhibition">Art & Light Exhibition</option>
                            {categories.map((c, i) => (
                                c !== 'Theme Park & Wahana' && c !== 'Art & Light Exhibition' && (
                                    <option key={i} value={c}>{c}</option>
                                )
                            ))}
                        </select>
                    </div>
                </div>

                {/* DAFTAR CARD DESTINASI (GRID 100+ PARK) */}
                {parkList.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-800">Tidak ada destinasi ditemukan</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Coba ubah kata kunci pencarian Anda atau tambahkan destinasi baru dengan tombol di atas.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parkList.map((item) => {
                            const isArt = item.category?.toLowerCase().includes('art') || item.name.toLowerCase().includes('art');
                            const fallbackImage = isArt
                                ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80'
                                : 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=800&q=80';
                            const displayImage = item.image_url || fallbackImage;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                                        item.is_active ? 'border-slate-200' : 'border-red-200 bg-red-50/20 opacity-80'
                                    }`}
                                >
                                    <div>
                                        {/* Cover Image & Badges */}
                                        <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                                            <img
                                                src={displayImage}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                                onError={(e) => { e.target.src = fallbackImage; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                                                    item.is_active
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs">
                                                    {item.category || 'Theme Park'}
                                                </span>
                                            </div>

                                            {/* Link Google Maps jika koordinat tersedia */}
                                            {item.latitude && item.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Lihat titik presisi di Google Maps"
                                                    className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-xl backdrop-blur-xs transition"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}

                                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                                <p className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    {item.city || 'Kota belum diatur'}
                                                </p>
                                                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate mt-0.5">
                                                    {item.name}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Info Body */}
                                        <div className="p-5 space-y-3.5">
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {item.description || 'Tidak ada deskripsi rinci untuk destinasi ini.'}
                                            </p>

                                            {/* Alamat Lengkap & Maps Status */}
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                                                <p className="line-clamp-2 leading-normal font-medium">
                                                    {item.location_address}
                                                </p>
                                                {item.latitude && item.longitude ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Lokasi terverifikasi di Google Maps
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Koordinat peta belum diatur
                                                    </span>
                                                )}
                                            </div>

                                            {/* Admin Park (satu destinasi = satu admin) */}
                                            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="min-w-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                        Admin Park
                                                    </span>
                                                    {item.admin ? (
                                                        <>
                                                            <span className="block truncate text-xs font-black text-slate-800">
                                                                {item.admin.name}
                                                            </span>
                                                            <span className="block truncate text-[11px] text-slate-500">
                                                                {item.admin.email}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="block text-[11px] font-bold text-amber-600">
                                                            Belum ada admin
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAdmin(item)}
                                                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 hover:border-orange-300 hover:text-orange-600 transition"
                                                >
                                                    <UserCog className="w-3.5 h-3.5" />
                                                    {item.admin ? 'Kelola' : 'Tambah'}
                                                </button>
                                            </div>

                                            {/* Info Ringkas Operasional */}
                                            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                                                <div className="p-2 rounded-xl bg-slate-50">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Jam</span>
                                                    <span className="text-xs font-black text-slate-800">
                                                        {item.open_time?.substring(0, 5)} - {item.close_time?.substring(0, 5)}
                                                    </span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-slate-50">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kuota/Hari</span>
                                                    <span className="text-xs font-black text-slate-800">
                                                        {item.default_daily_capacity?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-slate-50">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Zona / Wahana</span>
                                                    <span className="text-xs font-black text-orange-600">
                                                        {item.zones_count || 0} Area
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                                        {/* Edit Park Info */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(item)}
                                            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Edit Profil</span>
                                        </button>

                                        {/* Masuk ke Operasional Park */}
                                        <Link
                                            href={`/admin/manage?park_id=${item.id}&from=superadmin`}
                                            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                                            title="Atur Tiket, Harga, Kuota Harian & Wahana destinasi ini"
                                        >
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                                            <span>Atur Tiket</span>
                                        </Link>

                                        {/* Toggle Status Aktif */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(item)}
                                            className={`p-2 rounded-xl border transition ${
                                                item.is_active
                                                    ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                    : 'border-slate-300 text-slate-400 hover:bg-slate-100'
                                            }`}
                                            title={item.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>

                                        {/* Hapus / Arsipkan */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePark(item)}
                                            className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                                            title="Hapus / Arsipkan Destinasi"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* PAGINATION (Penting untuk menangani 100+ Park) */}
                {parksPaginated?.links && parksPaginated.links.length > 3 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-xs">
                        <div className="flex flex-1 justify-between sm:hidden">
                            {parksPaginated.prev_page_url ? (
                                <Link
                                    href={parksPaginated.prev_page_url}
                                    className="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Sebelumnya
                                </Link>
                            ) : <div />}
                            {parksPaginated.next_page_url && (
                                <Link
                                    href={parksPaginated.next_page_url}
                                    className="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Berikutnya
                                </Link>
                            )}
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-slate-700">
                                    Menampilkan <span className="font-bold">{parksPaginated.from || 0}</span> sampai{' '}
                                    <span className="font-bold">{parksPaginated.to || 0}</span> dari{' '}
                                    <span className="font-bold">{parksPaginated.total || 0}</span> destinasi
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-xl shadow-xs gap-1">
                                    {parksPaginated.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`relative inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                                                link.active
                                                    ? 'z-10 bg-orange-600 text-white'
                                                    : link.url
                                                    ? 'text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200'
                                                    : 'text-slate-300 pointer-events-none'
                                            }`}
                                        />
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================
                MODAL TAMBAH DESTINASI BARU
            ========================================================= */}
            <Transition show={newParkModalOpen} as={Fragment}>
                <Dialog className="relative z-50 font-sans" onClose={() => setNewParkModalOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                    <Plus className="w-5 h-5 stroke-[3]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Tambah Destinasi Baru</h3>
                                    <p className="text-xs text-slate-500">Mendaftarkan cabang wahana / galeri seni baru ke Vurasi</p>
                                </div>
                            </div>

                            <form onSubmit={submitNewPark} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Nama Destinasi / Park <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newParkForm.name}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, name: e.target.value })}
                                            placeholder="Contoh: Safari Wild Waterpark"
                                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Kategori Destinasi
                                        </label>
                                        <select
                                            value={newParkForm.category}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, category: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-semibold"
                                        >
                                            <option value="Theme Park & Wahana">Theme Park & Wahana</option>
                                            <option value="Art & Light Exhibition">Art & Light Exhibition</option>
                                            <option value="Waterpark & Rekreasi Air">Waterpark & Rekreasi Air</option>
                                            <option value="Museum & Edukasi">Museum & Edukasi</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi Kawasan</label>
                                    <textarea
                                        value={newParkForm.description}
                                        onChange={(e) => setNewParkForm({ ...newParkForm, description: e.target.value })}
                                        rows="2"
                                        placeholder="Pengalaman wahana dan rekreasi keluarga terlengkap..."
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">URL Foto Sampul (Cover Image)</label>
                                    <input
                                        type="url"
                                        value={newParkForm.image_url}
                                        onChange={(e) => setNewParkForm({ ...newParkForm, image_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/... atau URL gambar"
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none"
                                    />
                                </div>

                                {/* LOCATION PICKER GOOGLE MAPS 100% GRATIS */}
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

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Jam Buka</label>
                                        <input
                                            type="time"
                                            required
                                            value={newParkForm.open_time}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, open_time: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Jam Tutup</label>
                                        <input
                                            type="time"
                                            required
                                            value={newParkForm.close_time}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, close_time: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Kapasitas/Hari</label>
                                        <input
                                            type="number"
                                            required
                                            min="100"
                                            value={newParkForm.default_daily_capacity}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, default_daily_capacity: Math.max(100, parseInt(e.target.value, 10) || 0) })}
                                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50 font-bold"
                                        />
                                    </div>
                                </div>

                                {/* AKUN ADMIN PARK — satu destinasi satu admin */}
                                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-orange-600" />
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Akun Admin Park</h4>
                                            <p className="text-[11px] text-slate-500">Satu destinasi hanya memiliki satu Admin Park.</p>
                                        </div>
                                    </div>

                                    {(errors.admin_name || errors.admin_email || errors.admin_password) && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600 space-y-0.5">
                                            {errors.admin_name && <p>{errors.admin_name}</p>}
                                            {errors.admin_email && <p>{errors.admin_email}</p>}
                                            {errors.admin_password && <p>{errors.admin_password}</p>}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Admin <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={newParkForm.admin_name}
                                                onChange={(e) => setNewParkForm({ ...newParkForm, admin_name: e.target.value })}
                                                placeholder="Nama pengelola destinasi"
                                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white focus:border-orange-500 outline-none font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Login <span className="text-red-500">*</span></label>
                                            <input
                                                type="email"
                                                required
                                                value={newParkForm.admin_email}
                                                onChange={(e) => setNewParkForm({ ...newParkForm, admin_email: e.target.value })}
                                                placeholder="admin@destinasi.com"
                                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white focus:border-orange-500 outline-none font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Password Awal <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            value={newParkForm.admin_password}
                                            onChange={(e) => setNewParkForm({ ...newParkForm, admin_password: e.target.value })}
                                            placeholder="Minimal 8 karakter"
                                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white focus:border-orange-500 outline-none font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition"
                                    >
                                        Simpan Destinasi Baru
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewParkModalOpen(false)}
                                        className="px-5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition"
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
                MODAL EDIT DETAIL DESTINASI
            ========================================================= */}
            <Transition show={editParkModalOpen} as={Fragment}>
                <Dialog className="relative z-50 font-sans" onClose={() => setEditParkModalOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Edit Profil &amp; Informasi Tempat</h3>
                                    <p className="text-xs text-slate-500">Perbarui nama, lokasi maps, jam operasional, dan kapasitas</p>
                                </div>
                            </div>

                            <form onSubmit={submitEditPark} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Nama Destinasi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editParkForm.name}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, name: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-bold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Kategori Destinasi
                                        </label>
                                        <select
                                            value={editParkForm.category}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, category: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-semibold"
                                        >
                                            <option value="Theme Park & Wahana">Theme Park & Wahana</option>
                                            <option value="Art & Light Exhibition">Art & Light Exhibition</option>
                                            <option value="Waterpark & Rekreasi Air">Waterpark & Rekreasi Air</option>
                                            <option value="Museum & Edukasi">Museum & Edukasi</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi Kawasan</label>
                                    <textarea
                                        value={editParkForm.description}
                                        onChange={(e) => setEditParkForm({ ...editParkForm, description: e.target.value })}
                                        rows="2"
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">URL Foto Sampul (Cover Image)</label>
                                    <input
                                        type="url"
                                        value={editParkForm.image_url}
                                        onChange={(e) => setEditParkForm({ ...editParkForm, image_url: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none"
                                    />
                                </div>

                                {/* LOCATION PICKER */}
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

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Jam Buka</label>
                                        <input
                                            type="time"
                                            required
                                            value={editParkForm.open_time}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, open_time: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Jam Tutup</label>
                                        <input
                                            type="time"
                                            required
                                            value={editParkForm.close_time}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, close_time: e.target.value })}
                                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Kapasitas/Hari</label>
                                        <input
                                            type="number"
                                            required
                                            min="100"
                                            value={editParkForm.default_daily_capacity}
                                            onChange={(e) => setEditParkForm({ ...editParkForm, default_daily_capacity: Math.max(100, parseInt(e.target.value, 10) || 0) })}
                                            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition"
                                    >
                                        Simpan Perubahan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditParkModalOpen(false)}
                                        className="px-5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition"
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
                MODAL ATUR ADMIN PARK (SATU PARK = SATU ADMIN)
            ========================================================= */}
            <Transition show={adminModalOpen} as={Fragment}>
                <Dialog className="relative z-50 font-sans" onClose={() => setAdminModalOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                        <DialogPanel className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                    <UserCog className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Atur Admin Park</h3>
                                    <p className="text-xs text-slate-500">
                                        {adminPark?.admin ? 'Perbarui akun pengelola destinasi ini' : 'Buat akun pengelola untuk destinasi ini'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Destinasi</span>
                                <span className="block text-sm font-black text-slate-800">{adminPark?.name}</span>
                                <span className="block text-[11px] text-slate-500">Satu destinasi hanya boleh memiliki satu Admin Park.</span>
                            </div>

                            {(errors.admin_name || errors.admin_email || errors.admin_password) && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600 space-y-0.5">
                                    {errors.admin_name && <p>{errors.admin_name}</p>}
                                    {errors.admin_email && <p>{errors.admin_email}</p>}
                                    {errors.admin_password && <p>{errors.admin_password}</p>}
                                </div>
                            )}

                            <form onSubmit={submitAdmin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Nama Admin <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={adminForm.admin_name}
                                        onChange={(e) => setAdminForm({ ...adminForm, admin_name: e.target.value })}
                                        placeholder="Nama pengelola destinasi"
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Email Login <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={adminForm.admin_email}
                                        onChange={(e) => setAdminForm({ ...adminForm, admin_email: e.target.value })}
                                        placeholder="admin@destinasi.com"
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Password {adminPark?.admin ? '(kosongkan jika tidak diubah)' : <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        autoComplete="new-password"
                                        required={!adminPark?.admin}
                                        minLength={8}
                                        value={adminForm.admin_password}
                                        onChange={(e) => setAdminForm({ ...adminForm, admin_password: e.target.value })}
                                        placeholder={adminPark?.admin ? '••••••••' : 'Minimal 8 karakter'}
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-orange-500 outline-none font-semibold"
                                    />
                                </div>

                                <div className="pt-3 flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition"
                                    >
                                        {adminPark?.admin ? 'Simpan Perubahan' : 'Buat Akun Admin'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdminModalOpen(false)}
                                        className="px-5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </Dialog>
            </Transition>
        </AdminLayout>
    );
}
