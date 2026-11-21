import { useState, Fragment } from 'react';
import { Head, router } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Tag, Plus, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

// Format Rupiah Input Helper
const formatNumberDisplay = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = String(val).replace(/[^0-9]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('id-ID');
};

const parseRawNumber = (displayVal) => {
    const cleaned = String(displayVal).replace(/[^0-9]/g, '');
    return cleaned === '' ? '' : Number(cleaned);
};

export default function AdminPromotions({
    parks = [],
    park,
    adminRole,
    isSuperAdmin = true,
    promotions = [],
}) {
    // Modal Promo
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [promoForm, setPromoForm] = useState({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        max_discount_amount: '',
        min_order_amount: '',
        usage_limit: 100,
        valid_until: '',
        image_url: '',
        park_id: isSuperAdmin ? '' : (park?.id || ''),
    });

    const openAddPromoModal = () => {
        setEditingPromo(null);
        setPromoForm({
            code: '',
            discount_type: 'PERCENTAGE',
            discount_value: '',
            max_discount_amount: '',
            min_order_amount: '',
            usage_limit: 100,
            valid_until: '',
            image_url: '',
            park_id: isSuperAdmin ? '' : (park?.id || ''),
        });
        setPromoModalOpen(true);
    };

    const openEditPromoModal = (promo) => {
        setEditingPromo(promo);
        setPromoForm({
            code: promo.code || '',
            discount_type: promo.discount_type || 'PERCENTAGE',
            discount_value: promo.discount_value || '',
            max_discount_amount: promo.max_discount_amount || '',
            min_order_amount: promo.min_order_amount || '',
            usage_limit: promo.max_redemptions || 100,
            valid_until: promo.valid_until ? promo.valid_until.substring(0, 10) : '',
            image_url: promo.image_url || '',
            park_id: promo.park_id || '',
        });
        setPromoModalOpen(true);
    };

    const handleDeletePromo = (promo) => {
        if (confirm(`Apakah Anda yakin ingin menghapus kupon "${promo.code}"?`)) {
            router.delete(`/admin/promotions/${promo.id}`, {
                preserveScroll: true,
            });
        }
    };

    const submitPromotion = (e) => {
        e.preventDefault();
        const payload = {
            ...promoForm,
            discount_value: Number(promoForm.discount_value) || 0,
            max_discount_amount: promoForm.max_discount_amount !== '' ? Number(promoForm.max_discount_amount) : null,
            min_order_amount: promoForm.min_order_amount !== '' ? Number(promoForm.min_order_amount) : 0,
            usage_limit: Number(promoForm.usage_limit) || 100,
            image_url: promoForm.image_url || null,
            park_id: isSuperAdmin ? (promoForm.park_id || null) : (park?.id || null),
        };

        if (editingPromo) {
            router.post(`/admin/promotions/${editingPromo.id}/update`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setPromoModalOpen(false);
                    setEditingPromo(null);
                },
            });
        } else {
            router.post('/admin/promotions', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setPromoModalOpen(false);
                    setEditingPromo(null);
                },
            });
        }
    };

    const togglePromoStatus = (id) => {
        router.post(`/admin/promotions/${id}/toggle`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Kupon Promo | ${park?.name || 'Vurasi'}`} />

            <AdminLayout parks={parks} park={park} isSuperAdmin={isSuperAdmin}>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                <Tag className="h-3.5 w-3.5" />
                                Manajemen Kupon
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kupon &amp; Kode Promo</h1>
                            <p className="text-xs text-slate-500 max-w-xl">
                                {isSuperAdmin
                                    ? 'Sebagai Admin Pusat (Super Admin), Anda dapat membuat dan mengatur kupon promo Global yang berlaku di semua destinasi.'
                                    : `Sebagai Park Admin, Anda hanya dapat membuat dan mengatur kupon promo khusus untuk destinasi Anda (${park?.name}).`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openAddPromoModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Buat Kupon Baru
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {promotions.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                Belum ada kupon promo yang terdaftar. Klik "Buat Kupon Baru" untuk menambahkan.
                            </div>
                        ) : (
                            promotions.map((promo) => (
                                <div
                                    key={promo.id}
                                    className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                                        promo.is_active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div>
                                        {promo.image_url && (
                                            <div className="h-28 -mx-5 -mt-5 mb-4 overflow-hidden bg-slate-100 border-b border-slate-200 relative">
                                                <img
                                                    src={promo.image_url}
                                                    alt={promo.code}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                                <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" />
                                                    Banner Promo
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-mono text-base font-black px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                                                {promo.code}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePromoStatus(promo.id)}
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition cursor-pointer ${
                                                        promo.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                    }`}
                                                >
                                                    {promo.is_active ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditPromoModal(promo)}
                                                    className="p-1 rounded-md text-slate-500 hover:text-orange-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                                                    title="Edit Kupon Promo"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePromo(promo)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                                                    title="Hapus Kupon Promo"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1 mb-4">
                                            <div className="text-xl font-black text-slate-900">
                                                {promo.discount_type === 'PERCENTAGE'
                                                    ? `Diskon ${Number(promo.discount_value)}%`
                                                    : `Potongan Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {promo.park_id ? (
                                                    <span className="text-blue-600 font-semibold">Khusus {promo.park?.name || 'Park Terpilih'}</span>
                                                ) : (
                                                    <span className="text-purple-600 font-semibold">Berlaku Global (Semua Park)</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-slate-500 space-y-1 pt-3 border-t border-slate-100">
                                            {promo.min_order_amount > 0 && (
                                                <div>Min. Belanja: Rp {Number(promo.min_order_amount).toLocaleString('id-ID')}</div>
                                            )}
                                            {promo.max_discount_amount && (
                                                <div>Maks. Diskon: Rp {Number(promo.max_discount_amount).toLocaleString('id-ID')}</div>
                                            )}
                                            <div>Terpakai: {promo.used_count || 0} / {promo.usage_limit || '∞'} kali</div>
                                            {promo.valid_until && (
                                                <div>Berlaku hingga: {new Date(promo.valid_until).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL TAMBAH / EDIT KUPON PROMO */}
                <Transition show={promoModalOpen} as={Fragment}>
                    <Dialog
                        className="relative z-50 font-sans"
                        onClose={() => {
                            setPromoModalOpen(false);
                            setEditingPromo(null);
                        }}
                    >
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <div className="flex items-center justify-between pb-2 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {editingPromo ? `Edit Kupon: ${editingPromo.code}` : 'Buat Kupon Promo Baru'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPromoModalOpen(false);
                                            setEditingPromo(null);
                                        }}
                                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">
                                    {isSuperAdmin
                                        ? 'Sebagai Admin Pusat (Super Admin), kupon akan dibuat secara Global berlaku untuk seluruh destinasi (atau dapat diarahkan ke destinasi tertentu).'
                                        : `Kupon ini khusus berlaku untuk destinasi ${park?.name}.`}
                                </p>

                                <form onSubmit={submitPromotion} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Voucher / Kupon</label>
                                        <input
                                            type="text"
                                            required
                                            value={promoForm.code}
                                            onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                                            placeholder="Contoh: MERDEKA50, WEEKENDSERU"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm uppercase font-mono font-bold"
                                        />
                                    </div>

                                    {isSuperAdmin && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Cakupan Destinasi (Scope)</label>
                                            <select
                                                value={promoForm.park_id}
                                                onChange={(e) => setPromoForm({ ...promoForm, park_id: e.target.value })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            >
                                                <option value="">🌐 Berlaku Global (Semua Park)</option>
                                                {parks.map((p) => (
                                                    <option key={p.id} value={p.id}>📍 Khusus {p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* URL Gambar Banner Promo */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            URL Gambar / Banner Promo (Opsional)
                                        </label>
                                        <input
                                            type="url"
                                            value={promoForm.image_url}
                                            onChange={(e) => setPromoForm({ ...promoForm, image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/... atau link gambar promo"
                                            className="w-full border rounded-xl px-3 py-2 text-sm focus:border-orange-500 outline-none"
                                        />
                                        {promoForm.image_url && (
                                            <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative">
                                                <img
                                                    src={promoForm.image_url}
                                                    alt="Preview Banner"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Diskon</label>
                                            <select
                                                value={promoForm.discount_type}
                                                onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            >
                                                <option value="PERCENTAGE">Persentase (%)</option>
                                                <option value="FIXED">Nominal Tetap (Rp)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                {promoForm.discount_type === 'PERCENTAGE' ? 'Nilai Diskon (%)' : 'Potongan Harga (Rp)'}
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formatNumberDisplay(promoForm.discount_value)}
                                                onChange={(e) => setPromoForm({ ...promoForm, discount_value: parseRawNumber(e.target.value) })}
                                                placeholder={promoForm.discount_type === 'PERCENTAGE' ? '20' : '25.000'}
                                                className="w-full border rounded-xl px-3 py-2 text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Maks. Diskon (Rp)</label>
                                            <input
                                                type="text"
                                                value={formatNumberDisplay(promoForm.max_discount_amount)}
                                                onChange={(e) => setPromoForm({ ...promoForm, max_discount_amount: parseRawNumber(e.target.value) })}
                                                placeholder="Kosongkan jika bebas"
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Belanja (Rp)</label>
                                            <input
                                                type="text"
                                                value={formatNumberDisplay(promoForm.min_order_amount)}
                                                onChange={(e) => setPromoForm({ ...promoForm, min_order_amount: parseRawNumber(e.target.value) })}
                                                placeholder="Contoh: 100.000"
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Kuota Pemakaian</label>
                                            <input
                                                type="text"
                                                value={formatNumberDisplay(promoForm.usage_limit)}
                                                onChange={(e) => setPromoForm({ ...promoForm, usage_limit: parseRawNumber(e.target.value) })}
                                                placeholder="100"
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Berlaku Hingga</label>
                                            <input
                                                type="date"
                                                required
                                                value={promoForm.valid_until}
                                                onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                                                className="w-full border rounded-xl px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">
                                            {editingPromo ? 'Simpan Perubahan' : 'Terbitkan Kupon'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPromoModalOpen(false);
                                                setEditingPromo(null);
                                            }}
                                            className="px-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
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
        </>
    );
}
