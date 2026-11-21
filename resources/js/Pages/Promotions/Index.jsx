import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useState, useMemo, Fragment } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import SiteNavbar, { NAV_SECTIONS } from '@/Components/SiteNavbar';
import MyTicketsModal from '@/Components/MyTicketsModal';

const EASE = [0.22, 1, 0.36, 1];
const fmtID = new Intl.NumberFormat('id-ID');
const rupiah = (n) => `Rp ${fmtID.format(n || 0)}`;

const COUPON_DOTS = [
    'bg-[#f7c223] text-zinc-950',
    'bg-[#FF5A36] text-white',
    'bg-[#62C6EA] text-zinc-950',
    'bg-[#58D68D] text-zinc-950',
    'bg-[#9B59B6] text-white',
];

function Icon({ children, className = 'h-4 w-4', stroke = 2 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="m9 12 2 2 4-4" /></Icon>;
const IconCopy = (p) => <Icon {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" /></Icon>;
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 11v2" /><path d="M13 17v2" /></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconTag = (p) => <Icon {...p}><path d="m12 2 3.5 3.5a2.12 2.12 0 0 1 0 3L7.5 16.5a2.12 2.12 0 0 1-3 0L2 14V2Z" /><circle cx="7" cy="7" r="1.5" /></Icon>;
const IconInfo = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Icon>;

/* Nav links untuk halaman Promo */
const NAV_LINKS = NAV_SECTIONS.map((s) => ({
    label: s.label,
    href: s.href ?? `/#${s.id}`,
    active: s.href === '/promotions',
}));

export default function PromotionsIndex({ promotions = [], parks = [] }) {
    const [lookupModalOpen, setLookupModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScope, setSelectedScope] = useState('ALL'); // ALL | GLOBAL | PARK
    const [selectedParkId, setSelectedParkId] = useState('ALL');
    const [copiedCode, setCopiedCode] = useState(null);
    const [detailPromo, setDetailPromo] = useState(null);

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {}
        setCopiedCode(code);
        setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    };

    // Filter promo
    const filteredPromotions = useMemo(() => {
        return promotions.filter((promo) => {
            // Filter query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchCode = promo.code?.toLowerCase().includes(q);
                const matchPark = promo.park?.name?.toLowerCase().includes(q);
                if (!matchCode && !matchPark) return false;
            }

            // Filter scope
            if (selectedScope === 'GLOBAL' && promo.park_id) return false;
            if (selectedScope === 'PARK' && !promo.park_id) return false;

            // Filter specific park
            if (selectedParkId !== 'ALL' && promo.park_id !== selectedParkId) {
                return false;
            }

            return true;
        });
    }, [promotions, searchQuery, selectedScope, selectedParkId]);

    return (
        <MotionConfig reducedMotion="user">
            <div className="vurasi min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
                <Head title="Promo & Event Diskon Tiket — Vurasi" />

                {/* Navbar */}
                <SiteNavbar links={NAV_LINKS} onCekPesanan={() => setLookupModalOpen(true)} />

                <main className="pb-24 pt-28 sm:pt-36">
                    {/* Header Section */}
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white p-6 shadow-[6px_6px_0_#18181b] sm:p-12">
                            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#62C6EA]/20 blur-3xl" />

                            <div className="relative z-10 max-w-3xl">
                                <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#18181b]">
                                    <IconTicket className="h-3.5 w-3.5" />
                                    Katalog Promo &amp; Diskon Resmi
                                </span>
                                <h1 className="mt-4 font-anton text-4xl uppercase leading-[0.95] text-zinc-950 sm:text-6xl">
                                    Hemat Kunjungan ke <span className="stroke-word">Destinasi Impian</span>
                                </h1>
                                <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
                                    Gunakan kupon promo resmi Vurasi saat checkout tiket. Nikmati potongan langsung untuk berbagai wahana, theme park, dan paviliun seni interaktif.
                                </p>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="relative z-10 mt-8 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                                <div className="relative">
                                    <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari kode kupon atau nama destinasi..."
                                        className="h-12 w-full rounded-2xl border-2 border-zinc-900 bg-zinc-50 pl-11 pr-4 text-xs font-semibold placeholder-zinc-400 focus:border-orange-600 focus:bg-white focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        value={selectedScope}
                                        onChange={(e) => {
                                            setSelectedScope(e.target.value);
                                            if (e.target.value === 'GLOBAL') setSelectedParkId('ALL');
                                        }}
                                        className="h-12 rounded-2xl border-2 border-zinc-900 bg-white px-4 text-xs font-bold uppercase tracking-wider text-zinc-900 focus:border-orange-600 focus:outline-none cursor-pointer"
                                    >
                                        <option value="ALL">Semua Kategori</option>
                                        <option value="GLOBAL">Promo Global (Semua Park)</option>
                                        <option value="PARK">Promo Khusus Wahana</option>
                                    </select>

                                    {selectedScope !== 'GLOBAL' && (
                                        <select
                                            value={selectedParkId}
                                            onChange={(e) => setSelectedParkId(e.target.value)}
                                            className="h-12 max-w-[200px] rounded-2xl border-2 border-zinc-900 bg-white px-4 text-xs font-bold text-zinc-900 focus:border-orange-600 focus:outline-none cursor-pointer truncate"
                                        >
                                            <option value="ALL">Semua Destinasi</option>
                                            {parks.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Promo Cards Grid */}
                    <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-6 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                Menampilkan {filteredPromotions.length} Kupon Promo Aktif
                            </span>
                        </div>

                        {filteredPromotions.length === 0 ? (
                            <div className="rounded-3xl border-2 border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
                                <IconTag className="mx-auto h-10 w-10 text-zinc-400" />
                                <h3 className="mt-3 font-anton text-xl uppercase tracking-wide text-zinc-800">
                                    Tidak Ada Promo Ditemukan
                                </h3>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Coba ubah kata kunci pencarian atau reset filter kategori promo.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedScope('ALL');
                                        setSelectedParkId('ALL');
                                    }}
                                    className="mt-4 rounded-full border-2 border-zinc-900 bg-zinc-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-600 transition-colors cursor-pointer"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredPromotions.map((promo, idx) => {
                                    const stub = COUPON_DOTS[idx % COUPON_DOTS.length];
                                    const discountLabel =
                                        promo.discount_type === 'PERCENTAGE'
                                            ? `${promo.discount_value}%`
                                            : `Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`;
                                    const stubLabel =
                                        promo.discount_type === 'PERCENTAGE'
                                            ? `${promo.discount_value}%`
                                            : `${Math.round(promo.discount_value / 1000)}rb`;
                                    const validUntil = promo.valid_until
                                        ? new Date(promo.valid_until).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : null;

                                    return (
                                        <motion.article
                                            key={promo.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: idx * 0.05, ease: EASE }}
                                            className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-zinc-900 bg-white shadow-[5px_5px_0_#18181b]"
                                        >
                                            {/* Banner Gambar Promo Jika Ada */}
                                            {promo.image_url && (
                                                <div className="relative h-28 w-full border-b-2 border-dashed border-zinc-900/20 overflow-hidden bg-zinc-100">
                                                    <img
                                                        src={promo.image_url}
                                                        alt={`Promo ${promo.code}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <span className="absolute bottom-2 right-2 rounded-md bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                                        {promo.code}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bagian Atas Tiket */}
                                            <div className="flex border-b-2 border-dashed border-zinc-900/20">
                                                <div
                                                    className={`flex w-24 sm:w-28 shrink-0 flex-col items-center justify-center gap-1 ${promo.image_url ? '' : 'rounded-tl-[22px]'} border-r-2 border-dashed border-zinc-950/20 p-4 text-center ${stub}`}
                                                >
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">
                                                        {promo.park_id ? 'Khusus' : 'Global'}
                                                    </span>
                                                    <span className="font-anton text-3xl sm:text-4xl leading-none">
                                                        {stubLabel}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">
                                                        Diskon
                                                    </span>
                                                </div>

                                                <div className="flex flex-1 flex-col justify-between p-4">
                                                    <div>
                                                        <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                                            {promo.park?.name || 'Semua Destinasi'}
                                                        </span>
                                                        <h3 className="mt-1 font-bold text-base text-zinc-950">
                                                            Diskon {discountLabel}
                                                        </h3>
                                                        <p className="mt-0.5 text-xs text-zinc-500">
                                                            Min. transaksi {rupiah(promo.min_order_amount)}
                                                        </p>
                                                    </div>

                                                    {validUntil && (
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                                            s.d. {validUntil}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bagian Bawah: Aksi Salin & S&K */}
                                            <div className="p-4 bg-zinc-50/50 rounded-b-[22px] space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(promo.code)}
                                                    className="flex min-h-[44px] w-full items-center justify-between rounded-xl border-2 border-dashed border-zinc-300 bg-white px-3 transition-colors hover:border-orange-500 cursor-pointer"
                                                >
                                                    <span className={`font-mono text-sm font-bold tracking-[0.15em] ${copiedCode === promo.code ? 'text-emerald-600' : 'text-zinc-950'}`}>
                                                        {copiedCode === promo.code ? 'Tersalin!' : promo.code}
                                                    </span>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                                                        {copiedCode === promo.code ? 'OK' : 'Salin Kode'}
                                                    </span>
                                                </button>

                                                <div className="flex items-center justify-between gap-2 pt-1 text-xs font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailPromo(promo)}
                                                        className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                                                    >
                                                        <IconInfo className="h-3.5 w-3.5" />
                                                        Syarat &amp; Ketentuan
                                                    </button>

                                                    <Link
                                                        href={promo.park_id ? `/tickets?park_id=${promo.park_id}` : '/tickets'}
                                                        className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-500 font-bold"
                                                    >
                                                        Gunakan Promo
                                                        <IconArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Lubang sobekan tiket */}
                                            <span aria-hidden="true" className="absolute top-[82px] -left-2.5 h-5 w-5 rounded-full border-2 border-zinc-900 bg-zinc-50" />
                                            <span aria-hidden="true" className="absolute top-[82px] -right-2.5 h-5 w-5 rounded-full border-2 border-zinc-900 bg-zinc-50" />
                                        </motion.article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {/* MODAL SYARAT & KETENTUAN PROMO */}
                <Transition show={!!detailPromo} as={Fragment}>
                    <Dialog className="relative z-50 font-sans" onClose={() => setDetailPromo(null)}>
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                        </TransitionChild>

                        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
                            <div className="flex min-h-full items-center justify-center">
                                <TransitionChild
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <DialogPanel className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-[8px_8px_0_#18181b] sm:p-8">
                                        {detailPromo && (
                                            <>
                                                {detailPromo.image_url && (
                                                    <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-5 border-b-2 border-zinc-900 overflow-hidden">
                                                        <img
                                                            src={detailPromo.image_url}
                                                            alt={detailPromo.code}
                                                            className="h-44 w-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                                                    <div>
                                                        <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                                            {detailPromo.park_id ? `Khusus ${detailPromo.park?.name}` : 'Promo Global'}
                                                        </span>
                                                        <h3 className="mt-2 font-anton text-2xl uppercase tracking-wide text-zinc-950">
                                                            Kupon {detailPromo.code}
                                                        </h3>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailPromo(null)}
                                                        className="grid h-9 w-9 place-items-center rounded-full border-2 border-zinc-900 bg-zinc-100 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <IconX className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="mt-5 space-y-3.5 text-xs leading-relaxed text-zinc-700">
                                                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5">
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-500">Nilai Diskon:</span>
                                                            <span className="font-bold text-zinc-950">
                                                                {detailPromo.discount_type === 'PERCENTAGE'
                                                                    ? `${detailPromo.discount_value}%`
                                                                    : `Rp ${Number(detailPromo.discount_value).toLocaleString('id-ID')}`}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-500">Minimal Belanja:</span>
                                                            <span className="font-bold text-zinc-950">
                                                                {rupiah(detailPromo.min_order_amount)}
                                                            </span>
                                                        </div>
                                                        {detailPromo.max_discount_amount && (
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-500">Maksimal Potongan:</span>
                                                                <span className="font-bold text-zinc-950">
                                                                    {rupiah(detailPromo.max_discount_amount)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-500">Berlaku Hingga:</span>
                                                            <span className="font-bold text-zinc-950">
                                                                {detailPromo.valid_until
                                                                    ? new Date(detailPromo.valid_until).toLocaleDateString('id-ID', {
                                                                          day: 'numeric',
                                                                          month: 'long',
                                                                          year: 'numeric',
                                                                      })
                                                                    : 'Tanpa batas'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <h4 className="font-bold uppercase tracking-wider text-zinc-950 pt-2">
                                                        Ketentuan Penggunaan:
                                                    </h4>
                                                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
                                                        <li>Kupon hanya dapat digunakan 1 kali per transaksi.</li>
                                                        <li>
                                                            {detailPromo.park_id
                                                                ? `Hanya berlaku untuk pembelian tiket di ${detailPromo.park?.name}.`
                                                                : 'Berlaku untuk seluruh destinasi & wahana di platform Vurasi.'}
                                                        </li>
                                                        <li>Kupon tidak dapat digabungkan dengan promosi kode lainnya.</li>
                                                        <li>Masukkan kode kupon pada formulir checkout sebelum melakukan pembayaran.</li>
                                                    </ul>
                                                </div>

                                                <div className="mt-6 flex gap-3 border-t border-zinc-200 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(detailPromo.code)}
                                                        className="flex-1 rounded-xl border-2 border-zinc-900 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                                                    >
                                                        {copiedCode === detailPromo.code ? 'Kode Tersalin!' : 'Salin Kode'}
                                                    </button>
                                                    <Link
                                                        href={detailPromo.park_id ? `/tickets?park_id=${detailPromo.park_id}` : '/tickets'}
                                                        className="flex-1 rounded-xl border-2 border-zinc-900 bg-orange-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-500 transition-colors cursor-pointer"
                                                    >
                                                        Pesan Sekarang
                                                    </Link>
                                                </div>
                                            </>
                                        )}
                                    </DialogPanel>
                                </TransitionChild>
                            </div>
                        </div>
                    </Dialog>
                </Transition>

                {/* Modal Tiket Saya */}
                <MyTicketsModal open={lookupModalOpen} onClose={() => setLookupModalOpen(false)} />
            </div>
        </MotionConfig>
    );
}
