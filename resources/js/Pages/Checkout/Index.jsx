import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldCheck, ArrowLeft, CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function Checkout({
    visitDate,
    items,
    subtotal,
    discount,
    total,
    promoCode,
    currentUser,
    midtransClientKey,
}) {
    const [customerName, setCustomerName] = useState(currentUser?.name || '');
    const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('MIDTRANS');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handlePay = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        try {
            // Send request to checkout API
            const response = await fetch('/tickets/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    visit_date: visitDate,
                    items: items.map(i => ({ inventory_id: i.inventory_id, quantity: i.quantity })),
                    payment_method: selectedPayment,
                    promo_code: promoCode || '',
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal memproses pesanan. Silakan coba lagi.');
            }

            const { snap_token, order_code } = result;

            // Gunakan Snap Popup bawaan Midtrans di web
            if (window.snap && snap_token) {
                window.snap.pay(snap_token, {
                    onSuccess: async function (snapResult) {
                        try {
                            await fetch(`/tickets/order/${order_code}/confirm-success`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                },
                                body: JSON.stringify(snapResult || {}),
                            });
                        } catch (e) {
                            console.error('Error confirming payment:', e);
                        }
                        window.location.href = `/tickets/order/${order_code}`;
                    },
                    onPending: async function (result) {
                        if (result && (result.transaction_status === 'settlement' || result.transaction_status === 'capture')) {
                            try {
                                await fetch(`/tickets/order/${order_code}/confirm-success`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                    },
                                    body: JSON.stringify(result || {}),
                                });
                            } catch (e) {
                                console.error('Error confirming payment:', e);
                            }
                        }
                        window.location.href = `/tickets/order/${order_code}`;
                    },
                    onError: function (result) {
                        setErrorMessage('Pembayaran gagal atau dibatalkan oleh sistem Midtrans.');
                        setIsSubmitting(false);
                        window.location.href = `/tickets/order/${order_code}`;
                    },
                    onClose: function () {
                        // User closed the popup without finishing the payment
                        setIsSubmitting(false);
                        window.location.href = `/tickets/order/${order_code}`;
                    },
                });
            } else {
                // Fallback direct visit if snap js not available
                window.location.href = `/tickets/order/${order_code}`;
            }
        } catch (err) {
            setErrorMessage(err.message || 'Terjadi kesalahan saat memproses checkout.');
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Konfirmasi & Pembayaran Midtrans | Wonderpark" />

            <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] pb-24">
                
                {/* Header */}
                <div className="bg-[#4F46E5] text-white pt-8 pb-12 px-6">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <Link href="/tickets" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold">
                            <ArrowLeft className="w-5 h-5" /> Ubah Tiket
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl">WONDERPARK</span>
                            <span className="bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                Midtrans Sandbox
                            </span>
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto mt-6">
                        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold">Checkout & Pembayaran</h1>
                        <p className="text-white/80 text-sm mt-1">Selesaikan pesanan dengan aman melalui payment gateway Midtrans.</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 -mt-6">
                    {errorMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handlePay} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
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
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            required
                                            placeholder="Contoh: John Doe"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#4F46E5]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email (Kirim Tiket)</label>
                                            <input
                                                type="email"
                                                value={customerEmail}
                                                onChange={e => setCustomerEmail(e.target.value)}
                                                required
                                                placeholder="email@domain.com"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#4F46E5]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. WhatsApp / HP</label>
                                            <input
                                                type="tel"
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value)}
                                                required
                                                placeholder="081234567890"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#4F46E5]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Midtrans Gateway Option */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold">Metode Pembayaran Online</h2>
                                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                        <Lock className="w-3.5 h-3.5" /> Aman & Terenkripsi
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl border-2 border-[#4F46E5] bg-indigo-50/40">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-[#4F46E5]" /> Midtrans Snap Gateway
                                            </span>
                                            <p className="text-xs text-slate-600">
                                                Tersedia berbagai pilihan: QRIS (GoPay, OVO, ShopeePay), Virtual Account (BCA, Mandiri, BNI, BRI), Kartu Kredit, dan Gerai Retail.
                                            </p>
                                        </div>
                                        <span className="text-xs bg-[#4F46E5] text-white px-2 py-0.5 rounded font-bold">
                                            Aktif
                                        </span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-indigo-100/60 flex flex-wrap gap-2 text-[11px] text-slate-500 font-semibold">
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">QRIS</span>
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">BCA VA</span>
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">Mandiri VA</span>
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">BNI VA</span>
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">BRI VA</span>
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">GoPay</span>
                                        <span className="bg-white px-2 py-1 rounded border border-slate-200">ShopeePay</span>
                                    </div>
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
                                    disabled={isSubmitting}
                                    className="w-full mt-6 py-4 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-bold rounded-xl shadow-[0_8px_16px_rgba(244,63,94,0.3)] transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Membuka Midtrans Snap...</span>
                                        </>
                                    ) : (
                                        <span>Bayar via Midtrans</span>
                                    )}
                                </button>
                                
                                <p className="text-[11px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" /> Transaksi Sandbox Mode Aman
                                </p>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}
