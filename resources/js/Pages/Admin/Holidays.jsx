import { useState, Fragment } from 'react';
import { Head, router } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Plus, Edit3, Trash2, Sparkles } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminHolidays({
    parks = [],
    park,
    adminRole,
    isSuperAdmin = true,
    nationalHolidays = [],
}) {
    // Modal Hari Libur
    const [holidayModalOpen, setHolidayModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [holidayForm, setHolidayForm] = useState({
        holiday_date: '',
        name: '',
        description: '',
    });

    const openAddHolidayModal = () => {
        setEditingHoliday(null);
        setHolidayForm({ holiday_date: '', name: '', description: '' });
        setHolidayModalOpen(true);
    };

    const openEditHolidayModal = (h) => {
        setEditingHoliday(h);
        const dateStr = typeof h.holiday_date === 'string'
            ? h.holiday_date.substring(0, 10)
            : new Date(h.holiday_date).toISOString().substring(0, 10);
        setHolidayForm({
            holiday_date: dateStr,
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

    return (
        <>
            <Head title={`Libur Nasional | ${park?.name || 'Vurasi'}`} />

            <AdminLayout parks={parks} park={park} isSuperAdmin={isSuperAdmin}>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Kalender Nasional
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-2 max-w-xl">
                                Tanggal yang tercatat di sini otomatis memberlakukan tarif khusus{' '}
                                <strong>Libur Nasional (Holiday Price)</strong> pada sistem tiket seluruh destinasi.
                                Halaman ini hanya dapat diakses oleh Admin Pusat (Super Admin).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openAddHolidayModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Hari Libur
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Tanggal Libur</th>
                                    <th className="py-3.5 px-4">Nama Hari Libur / Perayaan</th>
                                    <th className="py-3.5 px-4">Keterangan Tambahan</th>
                                    <th className="py-3.5 px-4 text-center">Status Tarif</th>
                                    <th className="py-3.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {nationalHolidays.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            Belum ada tanggal libur nasional yang ditambahkan.
                                        </td>
                                    </tr>
                                ) : (
                                    nationalHolidays.map((h) => {
                                        const dateStr = typeof h.holiday_date === 'string'
                                            ? h.holiday_date.substring(0, 10)
                                            : new Date(h.holiday_date).toISOString().substring(0, 10);
                                        const formattedDate = new Date(dateStr).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        });

                                        return (
                                            <tr key={h.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-bold text-slate-900 block">{dateStr}</span>
                                                    <span className="text-[11px] text-slate-400">{formattedDate}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-extrabold text-slate-900 text-sm block">{h.name}</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                                                    {h.description || '-'}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                                        <Sparkles className="w-3 h-3 text-rose-600" />
                                                        Tarif Libur Nasional
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditHolidayModal(h)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                                            title="Edit Libur"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteHoliday(h.id)}
                                                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                                                            title="Hapus Libur"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL TAMBAH / EDIT HARI LIBUR */}
                <Transition show={holidayModalOpen} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setHolidayModalOpen(false)}>
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        </TransitionChild>
                        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    {editingHoliday ? 'Edit Hari Libur Nasional' : 'Tambah Hari Libur Nasional'}
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Pada tanggal ini, sistem otomatis menerapkan tarif khusus libur nasional untuk semua tier tiket.
                                </p>

                                <form onSubmit={submitHoliday} className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Libur</label>
                                        <input
                                            type="date"
                                            required
                                            value={holidayForm.holiday_date}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Hari Libur / Perayaan</label>
                                        <input
                                            type="text"
                                            required
                                            value={holidayForm.name}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                                            placeholder="contoh: Hari Raya Natal, Tahun Baru Masehi"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Tambahan (Opsional)</label>
                                        <textarea
                                            rows="2"
                                            value={holidayForm.description}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                                            placeholder="contoh: Libur nasional cuti bersama serentak"
                                            className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                                        />
                                    </div>
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 leading-relaxed">
                                        🎟️ Tiket yang dipesan pada tanggal ini otomatis menerapkan <strong>Tarif Libur Nasional (Holiday Price)</strong>.
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition">
                                            {editingHoliday ? 'Simpan Perubahan' : 'Tambahkan ke Kalender'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHolidayModalOpen(false)}
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
