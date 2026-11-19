/**
 * VURASI — MY TICKETS MODAL (komponen bersama)
 *
 * Modal "Cek Pesanan": memuat semua e-tiket milik pengunjung via
 * GET /api/orders/mine (401 → tampilan guest: ajakan masuk/daftar).
 * Dipakai dari tombol "Cek Pesanan" di SiteNavbar.
 *
 * LOGIKA TIDAK BERUBAH: fetch /api/orders/mine, status order & tiket,
 * link QR → /tickets/view/{code}.
 */
import { Link } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Fragment, useState, useEffect } from 'react';

/* Ikon gaya Lucide (stroke 2) */
function Icon({ children, className = 'h-4 w-4' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

const IconX = (p) => <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 11v2" /><path d="M13 17v2" /></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;

export default function MyTicketsModal({ open, onClose }) {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [isGuest, setIsGuest] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;

        setLoading(true);
        setErrorMessage('');
        setOrders([]);
        setIsGuest(false);

        fetch('/api/orders/mine', { headers: { Accept: 'application/json' } })
            .then(async (res) => {
                if (cancelled) return undefined;
                if (res.status === 401) {
                    setIsGuest(true);
                    return undefined;
                }
                const data = await res.json();
                if (res.ok && data.success) {
                    setOrders(data.orders || []);
                } else {
                    setErrorMessage(data.message || 'Gagal memuat tiket Anda.');
                }
                return undefined;
            })
            .catch(() => {
                if (!cancelled) setErrorMessage('Terjadi gangguan jaringan. Silakan coba kembali.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open]);

    const orderStatusCls = (status) =>
        status === 'PAID'
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
            : 'border-amber-400/30 bg-amber-400/10 text-amber-300';
    const orderStatusLabel = (status) =>
        status === 'PAID' ? 'Lunas' : status === 'PENDING' ? 'Menunggu bayar' : status;

    const ticketStatusCls = (status) =>
        status === 'VALID'
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
            : status === 'USED'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                : 'border-rose-400/30 bg-rose-400/10 text-rose-300';
    const ticketStatusLabel = (status) =>
        status === 'VALID' ? 'Siap pakai' : status === 'USED' ? 'Sudah dipakai' : status;

    return (
        <Transition show={open} as={Fragment}>
            <Dialog className="relative z-50 font-sans" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-250"
                            enterFrom="opacity-0 translate-y-6 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-6 scale-95"
                        >
                            <DialogPanel className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl shadow-black/60 sm:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">Vurasi E-Tiket</p>
                                        <h3 className="mt-1.5 font-anton text-2xl uppercase leading-none tracking-[0.02em] sm:text-3xl">
                                            Tiket Saya
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                                            Semua e-tiket yang sudah Anda beli, langsung tampil — tanpa perlu memasukkan kode pesanan.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Tutup dialog"
                                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                                    >
                                        <IconX className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Isi */}
                                <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1">
                                    {errorMessage && (
                                        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-xs text-rose-300">
                                            {errorMessage}
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="space-y-3" aria-hidden="true">
                                            {[0, 1].map((i) => (
                                                <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-11 w-11 rounded-xl bg-white/10" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-3 w-1/2 rounded bg-white/10" />
                                                            <div className="h-2.5 w-1/3 rounded bg-white/10" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 h-9 rounded-xl bg-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!loading && isGuest && (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-600/20 text-orange-400">
                                                <IconTicket className="h-6 w-6" />
                                            </div>
                                            <p className="mt-3 text-sm font-bold">Masuk untuk melihat tiket Anda</p>
                                            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-zinc-400">
                                                E-tiket terkait akun Anda akan langsung tampil di sini begitu Anda masuk.
                                            </p>
                                            <div className="mt-4 flex justify-center gap-2">
                                                <Link
                                                    href="/login"
                                                    className="inline-flex min-h-[44px] items-center rounded-full bg-orange-600 px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-500"
                                                >
                                                    Masuk
                                                </Link>
                                                <Link
                                                    href="/register"
                                                    className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                                                >
                                                    Daftar
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {!loading && !isGuest && !errorMessage && orders.length === 0 && (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10 text-zinc-300">
                                                <IconTicket className="h-6 w-6" />
                                            </div>
                                            <p className="mt-3 text-sm font-bold">Belum ada tiket</p>
                                            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-zinc-400">
                                                Anda belum memiliki e-tiket. Jelajahi destinasi dan pesan tiket pertama Anda.
                                            </p>
                                            <Link
                                                href="/tickets"
                                                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-orange-600 px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-500"
                                            >
                                                Beli Tiket
                                                <IconArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    )}

                                    {!loading && orders.length > 0 && (
                                        <ul className="space-y-4">
                                            {orders.map((order, orderIdx) => (
                                                <motion.li
                                                    key={order.order_code}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.45, ease: 'easeOut', delay: orderIdx * 0.08 }}
                                                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                                                >
                                                    {/* Header pesanan */}
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={order.park?.image_url || 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=200&q=80'}
                                                            alt={order.park?.name || 'Destinasi'}
                                                            className="h-11 w-11 shrink-0 rounded-xl object-cover"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-bold">{order.park?.name || 'Destinasi'}</p>
                                                            <p className="truncate text-[11px] text-zinc-500">
                                                                {order.park?.location || order.park?.category}
                                                            </p>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${orderStatusCls(order.status)}`}>
                                                            {orderStatusLabel(order.status)}
                                                        </span>
                                                    </div>

                                                    {/* Daftar e-tiket */}
                                                    <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
                                                        {order.tickets.map((tkt) => (
                                                            <li
                                                                key={tkt.ticket_code}
                                                                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-zinc-900/60 px-3 py-2.5"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="font-mono text-xs font-bold tracking-wide text-white">
                                                                        {tkt.ticket_code}
                                                                    </p>
                                                                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                                                                        {tkt.tier || 'Tiket masuk'} · Berlaku {tkt.valid_date || '-'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${ticketStatusCls(tkt.status)}`}>
                                                                        {ticketStatusLabel(tkt.status)}
                                                                    </span>
                                                                    <Link
                                                                        href={`/tickets/view/${tkt.ticket_code}`}
                                                                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-orange-600 px-3.5 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-500"
                                                                    >
                                                                        QR
                                                                        <IconArrowRight className="h-3 w-3" />
                                                                    </Link>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-600">
                                                        {order.order_code} · Total Rp {new Intl.NumberFormat('id-ID').format(order.total_amount || 0)}
                                                    </p>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
