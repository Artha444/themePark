import { Head } from '@inertiajs/react';
import { ShoppingBag, Radio } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminOrders({
    parks = [],
    park,
    adminRole,
    isSuperAdmin = true,
    recentOrders = [],
    liveCheckIns = [],
}) {
    return (
        <>
            <Head title={`Pesanan & Scan | ${park?.name || 'Vurasi'}`} />

            <AdminLayout parks={parks} park={park} isSuperAdmin={isSuperAdmin}>
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Transaksi &amp; Aktivitas Gerbang
                    </div>
                    <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                        Pesanan Masuk &amp; Log Scan Turnstile
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {isSuperAdmin
                            ? 'Menampilkan transaksi seluruh destinasi beserta aktivitas scan pintu masuk terbaru.'
                            : `Menampilkan transaksi dan aktivitas scan pintu masuk khusus ${park?.name}.`}
                    </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
                    {/* PESANAN TERBARU MASUK */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-extrabold text-slate-900">
                                Pesanan Terbaru Masuk {isSuperAdmin ? '(Seluruh Destinasi)' : `(${park?.name})`}
                            </h3>
                            <span className="text-xs text-slate-400">Menampilkan 12 pesanan terakhir</span>
                        </div>
                        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                        <th className="py-3 px-4">Kode Pesanan</th>
                                        <th className="py-3 px-4">Destinasi</th>
                                        <th className="py-3 px-4">Pemesan</th>
                                        <th className="py-3 px-4">Total</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Waktu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-400">
                                                Belum ada transaksi pesanan untuk destinasi ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.order_code}</td>
                                                <td className="py-3 px-4 text-slate-600 font-semibold">{order.park?.name || '-'}</td>
                                                <td className="py-3 px-4">
                                                    <span className="font-semibold block text-slate-800">{order.customer_name}</span>
                                                    <span className="text-[11px] text-slate-400">{order.customer_email}</span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">Rp {Number(order.total_amount).toLocaleString('id-ID')}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>{order.status}</span>
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

                    <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Live Stream Scan Turnstile Gerbang {isSuperAdmin ? '' : `(${park?.name})`}
                                </h3>
                            </div>
                            <span className="text-xs text-slate-400">Log scan real-time</span>
                        </div>
                        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                        <th className="py-3 px-4">Waktu Scan</th>
                                        <th className="py-3 px-4">Kode Tiket</th>
                                        <th className="py-3 px-4">Gerbang (Gate)</th>
                                        <th className="py-3 px-4">Petugas / Scanner</th>
                                        <th className="py-3 px-4">Hasil Scan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {liveCheckIns.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-400">
                                                Belum ada aktivitas scan gerbang turnstile hari ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        liveCheckIns.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-2.5 px-4 font-mono text-slate-600">{new Date(log.scan_time).toLocaleTimeString('id-ID')} WIB</td>
                                                <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{log.ticket?.ticket_code || '-'}</td>
                                                <td className="py-2.5 px-4 text-slate-700 font-semibold">{log.gate?.gate_name || 'Gerbang Masuk'}</td>
                                                <td className="py-2.5 px-4 text-slate-600">{log.staff_user?.full_name || 'Turnstile Scanner'}</td>
                                                <td className="py-2.5 px-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        log.scan_result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>{log.scan_result}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
