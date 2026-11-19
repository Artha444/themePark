/**
 * VURASI — HALAMAN PEMBAYARAN / RINGKASAN PESANAN
 *
 * Tema: galeri gelap zinc-950 + aksen orange-600 (satu rumpun dengan
 * halaman pemesanan tiket). Kartu glass, heading Anton, reveal Framer Motion.
 *
 * LOGIKA BISNIS TIDAK BERUBAH:
 * - handlePayNow → window.snap.pay(snap_token) + POST confirm-success + reload
 * - handleCheckStatus → router.reload()
 * - E-tiket QR (react-qr-code) → /tickets/view/{code}
 * - Gate scanner → /scanner
 */
import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, MotionConfig } from 'framer-motion';
import {
    CheckCircle2, ExternalLink, Clock, AlertTriangle,
    RefreshCw, CreditCard, QrCode, ScanLine, User, Mail, Phone, Calendar,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import SiteNavbar, { NAV_SECTIONS } from '@/Components/SiteNavbar';
import MyTicketsModal from '@/Components/MyTicketsModal';

/* Easing konsisten dengan landing page */
const EASE = [0.22, 1, 0.36, 1];

/* Item navigasi — WAJIB identik dengan landing (satu sumber: NAV_SECTIONS).
   href bawaan menunjuk section landing via '/#id'; override dipakai apa adanya. */
const NAV_LINKS = NAV_SECTIONS.map((s) => ({ label: s.label, href: s.href ?? `/#${s.id}` }));

export default function OrderSummary({ order, midtransClientKey, midtransIsProduction }) {
    const items = order?.items || [];
    const isPaid = order.status === 'PAID';
    const isPending = order.status === 'PENDING';
    const isCancelled = order.status === 'CANCELLED' || order.status === 'EXPIRED';

    /* Skin status: warna aksen hero mengikuti kondisi pesanan */
    const skin = isPaid
        ? { icon: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300', chip: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300', word: 'text-emerald-400' }
        : isPending
            ? { icon: 'border-amber-400/30 bg-amber-500/10 text-amber-300', chip: 'border-amber-400/30 bg-amber-500/10 text-amber-300', word: 'text-amber-400' }
            : { icon: 'border-rose-400/30 bg-rose-500/10 text-rose-300', chip: 'border-rose-400/30 bg-rose-500/10 text-rose-300', word: 'text-rose-400' };

    const [isChecking, setIsChecking] = useState(false);
    const [lookupModalOpen, setLookupModalOpen] = useState(false);

    // Auto-polling status saat pesanan masih PENDING (misal setelah bayar di Simulator Midtrans di tab lain)
    useEffect(() => {
        if (!isPending) return;

        const interval = setInterval(() => {
            router.reload({ preserveScroll: true });
        }, 3500);

        return () => clearInterval(interval);
    }, [isPending]);

    const handlePayNow = () => {
        if (!order.snap_token) {
            alert('Snap token tidak tersedia. Silakan lakukan pemesanan ulang.');
            return;
        }

        if (window.snap) {
            window.snap.pay(order.snap_token, {
                onSuccess: async function (result) {
                    try {
                        await fetch(`/tickets/order/${order.order_code}/confirm-success`, {
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
                    router.reload();
                },
                onPending: async function (result) {
                    // Jika user menyelesaikan pembayaran di popup (atau memilih VA/QRIS lalu popup selesai)
                    if (result && (result.transaction_status === 'settlement' || result.transaction_status === 'capture')) {
                        try {
                            await fetch(`/tickets/order/${order.order_code}/confirm-success`, {
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
                    router.reload();
                },
                onError: function (result) {
                    router.reload();
                },
                onClose: function () {
                    router.reload();
                },
            });
        } else {
            alert('Midtrans Snap SDK sedang dimuat. Silakan refresh halaman.');
        }
    };

    const handleCheckStatus = () => {
        setIsChecking(true);
        router.reload({
            onFinish: () => setIsChecking(false),
        });
    };

    const totalTickets = items.reduce((acc, it) => acc + (it.issued_tickets?.length || 0), 0);

    return (
        <>
            <Head title={`Pesanan #${order.order_code} | Vurasi`} />

            <MotionConfig reducedMotion="user">
                <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-orange-500 selection:text-white">

                    {/* Navbar — komponen bersama, item identik dengan landing */}
                    <SiteNavbar
                        links={NAV_LINKS}
                        onCekPesanan={() => setLookupModalOpen(true)}
                    />

                    {/* =====================================================
                        HERO STATUS — badge ikon + judul Anton + kode pesanan
                    ===================================================== */}
                    <div className="relative overflow-hidden pb-10 pt-32 sm:pt-36">
                        {/* Cahaya status samar di latar */}
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full blur-3xl ${
                                isPaid ? 'bg-emerald-600/10' : isPending ? 'bg-amber-600/10' : 'bg-rose-600/10'
                            }`}
                        />

                        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ duration: 0.5, ease: EASE }}
                                className={`mb-5 grid h-16 w-16 place-items-center rounded-2xl border backdrop-blur-sm sm:h-20 sm:w-20 ${skin.icon}`}
                            >
                                {isPaid && <CheckCircle2 className="h-9 w-9 sm:h-11 sm:w-11" />}
                                {isPending && <Clock className="h-9 w-9 sm:h-11 sm:w-11" />}
                                {isCancelled && <AlertTriangle className="h-9 w-9 sm:h-11 sm:w-11" />}
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
                                className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500"
                            >
                                Vurasi E-Tiket
                            </motion.p>

                            <motion.h1
                                initial={{ opacity: 0, y: 32 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
                                className="mt-2 font-anton text-3xl uppercase leading-[0.95] tracking-[0.02em] sm:text-5xl"
                            >
                                {isPaid && <>E-Tiket <span className={skin.word}>Terbit!</span></>}
                                {isPending && <>Selesaikan <span className={skin.word}>Pembayaran</span></>}
                                {isCancelled && <>Pesanan <span className={skin.word}>Tidak Berlaku</span></>}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
                                className="mt-4 flex flex-wrap items-center justify-center gap-2.5"
                            >
                                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-zinc-200">
                                    {order.order_code}
                                </span>
                                <span className={`rounded-full border px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest ${skin.chip}`}>
                                    {isPaid && 'Lunas'}
                                    {isPending && 'Menunggu Pembayaran'}
                                    {isCancelled && 'Dibatalkan / Kedaluwarsa'}
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-28 sm:px-6">

                        {/* =====================================================
                            § 01 — RINCIAN PEMEGANG TIKET + TOTAL TAGIHAN
                        ===================================================== */}
                        <motion.section
                            initial={{ opacity: 0, y: 32 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.55, ease: EASE }}
                            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
                        >
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">&sect; 01 — Rincian</p>
                            <h2 className="mt-1 font-anton text-xl uppercase tracking-[0.03em] text-white sm:text-2xl">Data Pemegang Tiket</h2>

                            <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
                                <ul className="space-y-2 text-xs">
                                    <li className="flex items-center gap-2.5">
                                        <User className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                                        <span className="font-extrabold text-white">{order.customer_name}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5 text-zinc-400">
                                        <Mail className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                                        {order.customer_email}
                                    </li>
                                    <li className="flex items-center gap-2.5 text-zinc-400">
                                        <Phone className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                                        {order.customer_phone}
                                    </li>
                                </ul>

                                <div className="rounded-2xl border border-orange-500/40 bg-orange-600/10 px-5 py-3 text-right">
                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">Total Tagihan</span>
                                    <span className="font-anton text-2xl tracking-[0.02em] text-orange-400 sm:text-3xl">
                                        Rp {Number(order.total_amount).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </motion.section>

                        {/* =====================================================
                            § 02 — PEMBAYARAN (PENDING)
                        ===================================================== */}
                        {isPending && (
                            <motion.section
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
                                className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-2.5">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500">&sect; 02 — Pembayaran</p>
                                            <h3 className="mt-1 font-anton text-lg uppercase tracking-[0.03em] text-amber-200 sm:text-xl">
                                                Menunggu Konfirmasi Pembayaran
                                            </h3>
                                            <p className="mt-1.5 text-xs leading-relaxed text-amber-200/80">
                                                Silakan selesaikan pembayaran Anda melalui popup Midtrans Snap. Setelah pembayaran
                                                selesai, tiket elektronik QR Code Anda akan otomatis diterbitkan.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3 pt-1">
                                            {order.snap_token && (
                                                <button
                                                    type="button"
                                                    onClick={handlePayNow}
                                                    className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95 cursor-pointer"
                                                >
                                                    <CreditCard className="h-4 w-4" /> Bayar Sekarang via Midtrans
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        await fetch(`/tickets/order/${order.order_code}/confirm-success`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Accept': 'application/json',
                                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                            },
                                                            body: JSON.stringify({ payment_type: 'sandbox_simulation', transaction_status: 'settlement' }),
                                                        });
                                                    } catch (e) {}
                                                    router.reload();
                                                }}
                                                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Konfirmasi Lunas (Sandbox)
                                            </button>
                                            <a
                                                href="https://simulator.sandbox.midtrans.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" /> Simulator Pembayaran Midtrans
                                            </a>
                                            <button
                                                type="button"
                                                onClick={handleCheckStatus}
                                                disabled={isChecking}
                                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                                                {isChecking ? 'Memeriksa...' : 'Cek Status Pembayaran'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {/* =====================================================
                            PESANAN DIBATALKAN / KEDALUWARSA
                        ===================================================== */}
                        {isCancelled && (
                            <motion.section
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
                                className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 sm:p-6"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-300">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-anton text-lg uppercase tracking-[0.03em] text-rose-200 sm:text-xl">
                                            Pesanan Kedaluwarsa / Dibatalkan
                                        </h3>
                                        <p className="mt-1.5 text-xs leading-relaxed text-rose-200/80">
                                            Kuota tiket yang dipesan telah dikembalikan ke sistem. Silakan lakukan pemesanan ulang.
                                        </p>
                                        <Link
                                            href="/tickets"
                                            className="mt-3 inline-flex items-center rounded-full bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 cursor-pointer"
                                        >
                                            Pesan Tiket Baru
                                        </Link>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {/* =====================================================
                            § 03 — E-TIKET TERBIT (PAID) — kartu tiket gelap + QR
                        ===================================================== */}
                        {isPaid && (
                            <motion.section
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{ duration: 0.55, ease: EASE }}
                                className="space-y-3.5"
                            >
                                <div className="flex flex-wrap items-end justify-between gap-2 px-1">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">&sect; 03 — E-Tiket</p>
                                        <h2 className="mt-1 font-anton text-xl uppercase tracking-[0.03em] text-white sm:text-2xl">
                                            Tiket Digital Anda
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
                                        {totalTickets} Tiket Terbit
                                    </span>
                                </div>

                                {items.map((item) => {
                                    const tierName = item.daily_inventory?.ticket_tier?.name || 'Tiket Vurasi';
                                    const tickets = item.issued_tickets || [];

                                    return tickets.map((tkt, tktIdx) => (
                                        <motion.div
                                            key={tkt.id}
                                            initial={{ opacity: 0, y: 24 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                            transition={{ duration: 0.45, delay: tktIdx * 0.06, ease: EASE }}
                                            className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition-colors hover:border-white/20 md:flex-row"
                                        >
                                            {/* Panel QR — gelap dengan pemisah putus-putus + takik tiket */}
                                            <div className="relative flex flex-col items-center border-b border-dashed border-white/15 bg-zinc-900/60 p-5 md:w-56 md:border-b-0 md:border-r">
                                                {/* Takik kiri-kanan pada pemisah (desktop) */}
                                                <span aria-hidden="true" className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-white/10 bg-zinc-950 md:block" />
                                                <span aria-hidden="true" className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-white/10 bg-zinc-950 md:block" />

                                                <div className="rounded-xl bg-white p-2.5 shadow-lg shadow-black/40">
                                                    <QRCode
                                                        value={tkt.qr_token}
                                                        size={112}
                                                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                                        viewBox={`0 0 256 256`}
                                                    />
                                                </div>
                                                <span className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                                    <QrCode className="h-3 w-3" /> Scan di Gerbang
                                                </span>
                                                <span className="mt-1 max-w-full break-all text-center font-mono text-[9px] text-zinc-600">
                                                    {tkt.qr_token}
                                                </span>
                                            </div>

                                            {/* Detail tiket */}
                                            <div className="flex-1 space-y-2.5 p-5">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="rounded-full border border-orange-500/40 bg-orange-600/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-400">
                                                        {tierName}
                                                    </span>
                                                    <span className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
                                                        tkt.status === 'VALID'
                                                            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                                            : 'border-white/15 bg-white/[0.06] text-zinc-400'
                                                    }`}>
                                                        {tkt.status === 'VALID' ? '✓ Siap di-Scan' : tkt.status}
                                                    </span>
                                                </div>

                                                <h3 className="font-anton text-lg uppercase tracking-[0.02em] text-white sm:text-xl">
                                                    {tkt.ticket_code}
                                                </h3>

                                                <p className="flex items-center gap-2 text-xs text-zinc-400">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                                                    Berlaku: <span className="font-bold text-zinc-200">{tkt.valid_date}</span>
                                                </p>

                                                <div className="pt-1.5">
                                                    <Link
                                                        href={`/tickets/view/${tkt.ticket_code}`}
                                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-200 transition hover:border-orange-500/50 hover:text-white cursor-pointer"
                                                    >
                                                        Buka Tampilan Tiket Mandiri <ExternalLink className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ));
                                })}
                            </motion.section>
                        )}

                        {/* =====================================================
                            CTA GATE SCANNER (PAID)
                        ===================================================== */}
                        {isPaid && (
                            <motion.section
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.55, ease: EASE }}
                                className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:p-6"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-300">
                                        <ScanLine className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-anton text-base uppercase tracking-[0.03em] text-white sm:text-lg">
                                            Ingin Mengetes Simulasi Gate Entry?
                                        </h4>
                                        <p className="mt-0.5 text-xs text-zinc-400">
                                            Buka portal Gate Staff Scanner untuk mencoba men-scan QR Token di atas.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/scanner"
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 cursor-pointer"
                                >
                                    Buka Staff Scanner
                                </Link>
                            </motion.section>
                        )}

                    </div>
                </div>
            </MotionConfig>

            {/* Modal Cek Pesanan — dipicu dari tombol navbar bersama */}
            <MyTicketsModal open={lookupModalOpen} onClose={() => setLookupModalOpen(false)} />
        </>
    );
}
