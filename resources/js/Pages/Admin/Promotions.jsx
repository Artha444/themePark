import { useState, Fragment } from 'react';
import { Head, router } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Tag, Plus } from 'lucide-react';
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
    const [promoForm, setPromoForm] = useState({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        max_discount_amount: '',
        min_order_amount: '',
        usage_limit: 100,
        valid_until: '',
        park_id: isSuperAdmin ? '' : (park?.id || ''),
    });

    const openAddPromoModal = () => {
        setPromoForm({
            code: '',
            discount_type: 'PERCENTAGE',
            discount_value: '',
            max_discount_amount: '',
            min_order_amount: '',
            usage_limit: 100,
            valid_until: '',
            park_id: isSuperAdmin ? '' : (park?.id || ''),
        });
        setPromoModalOpen(true);
    };

    const submitPromotion = (e) => {
        e.preventDefault();
        router.post('/admin/promotions', {
            ...promoForm,
            discount_value: Number(promoForm.discount_value) || 0,
            max_discount_amount: promoForm.max_discount_amount !== '' ? Number(promoForm.max_discount_amount) : null,
            min_order_amount: promoForm.min_order_amount !== '' ? Number(promoForm.min_order_amount) : 0,
            usage_limit: Number(promoForm.usage_limit) || 100,
            park_id: isSuperAdmin ? null : (park?.id || null),
        }, {
            preserveScroll: true,
            onSuccess: () => setPromoModalOpen(false),
        });
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
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-mono text-base font-black px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                                                {promo.code}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => togglePromoStatus(promo.id)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${
                                                    promo.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                }`}
                                            >
                                                {promo.is_active ? 'Aktif' : 'Nonaktif'}
                                            </button>
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

                {/* MODAL TAMBAH KUPON PROMO */}
                <Transition show={promoModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setPromoModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Buat Kupon Promo Baru</h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    {isSuperAdmin
                                        ? 'Sebagai Admin Pusat (Super Admin), kupon akan dibuat secara Global berlaku untuk seluruh destinasi.'
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
                                        <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition">
                                            Terbitkan Kupon
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPromoModalOpen(false)}
                                            className="px-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
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
