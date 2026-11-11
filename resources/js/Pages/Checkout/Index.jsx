import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, QrCode, CreditCard, Wallet, ArrowLeft, Clock, Ticket } from 'lucide-react';

export default function Checkout({ visitDate, items, subtotal, discount, total, promoCode, currentUser }) {
    const [selectedPayment, setSelectedPayment] = useState('QRIS');

    const { data, setData, post, processing, errors } = useForm({
        customer_name: currentUser?.name || '',
        customer_email: currentUser?.email || '',
        customer_phone: '',
        visit_date: visitDate,
        items: items.map(i => ({ inventory_id: i.inventory_id, quantity: i.quantity })),
        payment_method: selectedPayment,
        promo_code: promoCode || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        data.payment_method = selectedPayment;
        post('/tickets/checkout');
    };

    return (
        <>
            <Head title="Konfirmasi & Pembayaran | Wonderpark" />

            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] pb-24">
                
                {/* Header */}
                <div className="bg-[#4F46E5] text-white pt-8 pb-12 px-6">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <Link href="/tickets" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold">
                            <ArrowLeft className="w-5 h-5" /> Ubah Tiket
                        </Link>
                        <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl">WONDERPARK</span>
                    </div>
                    <div className="max-w-4xl mx-auto mt-6">
                        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold">Checkout & Pembayaran</h1>
                        <p className="text-white/80 text-sm mt-1">Isi data pemesan untuk pengiriman E-Ticket QR Code.</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 -mt-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Left Column: Customer Form & Payment Methods */}
                        <div className="md:col-span-2 space-y-6">
                            
                            {/* Customer Information */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#4F46E5]" /> Data Pemesan (Untuk E-Ticket)
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            value={data.customer_name}
                                            onChange={e => setData('customer_name', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#4F46E5]"
                                        />
                                        {errors.customer_name && <p className="text-xs text-rose-500 mt-1">{errors.customer_name}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email (Kirim Tiket)</label>
                                            <input
                                                type="email"
                                                value={data.customer_email}
                                                onChange={e => setData('customer_email', e.target.value)}
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#4F46E5]"
                                            />
                                            {errors.customer_email && <p className="text-xs text-rose-500 mt-1">{errors.customer_email}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. WhatsApp / HP</label>
                                            <input
                                                type="text"
                                                value={data.customer_phone}
                                                onChange={e => setData('customer_phone', e.target.value)}
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#4F46E5]"
                                            />
                                            {errors.customer_phone && <p className="text-xs text-rose-500 mt-1">{errors.customer_phone}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold mb-4">Metode Pembayaran</h2>

                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment('QRIS')}
                                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                                            selectedPayment === 'QRIS'
                                                ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] shadow-sm'
                                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <QrCode className="w-6 h-6 text-[#4F46E5]" />
                                        <div>
                                            <span className="font-extrabold text-sm block">QRIS</span>
                                            <span className="text-[10px] text-slate-500">Scan Bebas Bank</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment('VA_BCA')}
                                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                                            selectedPayment === 'VA_BCA'
                                                ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] shadow-sm'
                                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <CreditCard className="w-6 h-6 text-[#4F46E5]" />
                                        <div>
                                            <span className="font-extrabold text-sm block">Virtual Account</span>
                                            <span className="text-[10px] text-slate-500">BCA / Mandiri / BNI</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment('EWALLET')}
                                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                                            selectedPayment === 'EWALLET'
                                                ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] shadow-sm'
                                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Wallet className="w-6 h-6 text-[#4F46E5]" />
                                        <div>
                                            <span className="font-extrabold text-sm block">E-Wallet</span>
                                            <span className="text-[10px] text-slate-500">GoPay / OVO</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-6">
                                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#0F172A] border-b border-slate-100 pb-3 mb-4">
                                    Ringkasan Pesanan
                                </h3>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Tanggal Kunjungan</span>
                                        <span className="font-bold text-[#0F172A]">{visitDate}</span>
                                    </div>

                                    {items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                                            <div>
                                                <span className="font-bold text-[#0F172A]">{it.tier_name}</span>
                                                <span className="text-slate-400 block">{it.quantity} x Rp {it.unit_price.toLocaleString('id-ID')}</span>
                                            </div>
                                            <span className="font-bold text-[#0F172A]">
                                                Rp {it.subtotal.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-semibold">
                                            <span>Diskon Promo</span>
                                            <span>- Rp {discount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-extrabold text-[#0F172A] pt-2 border-t border-slate-100">
                                        <span>Total Bayar</span>
                                        <span className="text-[#4F46E5]">Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full mt-6 py-4 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-bold rounded-xl shadow-[0_8px_16px_rgba(244,63,94,0.3)] transition disabled:opacity-50"
                                >
                                    {processing ? 'Memproses Pesanan...' : 'Bayar Sekarang & Terbitkan Tiket'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}
