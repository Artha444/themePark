/**
 * PLUMY — bakery & coffee bar
 * Landing page "picnic-cloth editorial": garis taplak biru-krem, sticker
 * cut-out ber-outline putih, doodle marun, bintang 4-sudut sebagai motif.
 *
 * Semua warna/font terdaftar di tailwind.config.js (prefix `plumy*`),
 * CSS kustom (sticker, stripes, blob, leader, rule-input) di app.css.
 * Modal reservasi memakai Headless UI Dialog untuk aksesibilitas.
 */

import { Head } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useRef, useState } from 'react';

/* ---------- SVG symbol defs (motif bintang + ilustrasi handmade) ---------- */
function PlumySymbols() {
    return (
        <svg className="hidden" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <defs>
                {/* 4-point star, brand motif */}
                <symbol id="s-star" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 0c1.1 6.9 5.1 10.9 12 12-6.9 1.1-10.9 5.1-12 12-1.1-6.9-5.1-10.9-12-12C6.9 10.9 10.9 6.1 12 0Z" />
                </symbol>

                {/* sweet butter croissant */}
                <symbol id="s-croissant" viewBox="0 0 220 170">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#F4E6D6" d="M38 124C18 114 10 84 26 66c10-11 30-9 36 5 6 14 4 30-4 42-5 8-13 13-20 11Z" />
                        <path fill="#F4E6D6" d="M182 124c20-10 28-40 12-58-10-11-30-9-36 5-6 14-4 30 4 42 5 8 13 13 20 11Z" />
                        <path fill="#FBF1E4" d="M58 118C48 86 68 44 110 44s62 42 52 74c-8 24-96 24-104 0Z" />
                        <path fill="none" d="M78 52c-7 24-7 48 2 72" />
                        <path fill="none" d="M142 52c7 24 7 48-2 72" />
                    </g>
                </symbol>

                {/* pain au chocolat */}
                <symbol id="s-pain" viewBox="0 0 220 150">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#FBF1E4" d="M34 44h152c8 0 14 8 14 18v26c0 10-6 18-14 18H34c-8 0-14-8-14-18V62c0-10 6-18 14-18Z" />
                        <path fill="#8B0A14" stroke="none" opacity=".9" d="M28 78h22v18l-22 6Zm164 0h-22v18l22 6Z" />
                        <path fill="none" d="M62 62v26m32-26v26m32-26v26m31-26v26" />
                    </g>
                </symbol>

                {/* cinnamon roll */}
                <symbol id="s-cinnamon" viewBox="0 0 200 180">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#F4E6D6" d="M100 34c40 0 70 24 70 54s-30 56-70 56-70-26-70-56 30-54 70-54Z" />
                        <path fill="none" d="M100 52c26 0 46 16 46 36s-20 38-46 38-44-17-44-36 17-32 38-32c17 0 28 11 28 24s-10 24-24 24" />
                        <path fill="#fff" d="M52 56c16 10 32 12 48 12s34-3 48-12c4 8 4 16-2 22-14 10-30 14-46 14S64 88 50 78c-5-6-5-14 2-22Z" />
                    </g>
                </symbol>

                {/* sourdough boule + slices */}
                <symbol id="s-sourdough" viewBox="0 0 220 180">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="none" d="M78 32c4-8 12-10 16-4m20-6c4-8 12-10 16-4" />
                        <ellipse fill="#F4E6D6" cx="78" cy="140" rx="34" ry="10" />
                        <ellipse fill="#FBF1E4" cx="78" cy="136" rx="34" ry="10" />
                        <path fill="#F4E6D6" d="M110 130c-6-42 14-84 48-84s46 40 44 78c-2 26-22 38-48 38s-40-10-44-32Z" />
                        <path fill="none" d="M118 66l22 12m4-26l22 12m8-22l18 10" />
                    </g>
                </symbol>

                {/* banana bread slice */}
                <symbol id="s-banana" viewBox="0 0 200 180">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="none" d="M58 26c28-14 56-14 84 0" />
                        <path fill="#FBF1E4" d="M40 40h120l-10 116c0 8-10 14-24 14H74c-14 0-24-6-24-14L40 40Z" />
                        <path fill="none" d="M58 40l-2 118m86-118l2 118M40 40h120" />
                        <g fill="#8B0A14" stroke="none">
                            <circle cx="88" cy="78" r="5" /><circle cx="120" cy="98" r="5" />
                            <circle cx="80" cy="122" r="5" /><circle cx="118" cy="140" r="5" />
                        </g>
                    </g>
                </symbol>

                {/* café latte with foam star art */}
                <symbol id="s-latte" viewBox="0 0 170 200">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="none" d="M60 26c-2-10 8-14 10-6m22 6c-2-10 8-14 10-6" />
                        <path fill="#F4E6D6" d="M48 46h74l-8 122a14 14 0 0 1-14 13H70a14 14 0 0 1-14-13L48 46Z" />
                        <path fill="#fff" d="M50 46h70l-1 14H51l-1-14Z" />
                        <path fill="#8B0A14" opacity=".28" d="M50 120h70l-2 22H52l-2-22Z" />
                        <path fill="none" d="M42 46h86" />
                        <path fill="#fff" transform="translate(-1 -2)" d="M85 82c2-9 9-11 13-7l1 1c1-5 9-6 11-1 3 6-2 12-12 18-10-6-14-11-13-11Z" />
                    </g>
                </symbol>

                {/* iced coffee */}
                <symbol id="s-iced" viewBox="0 0 170 200">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#F4E6D6" d="M46 36h78l-7 138c0 9-13 16-32 16s-32-7-32-16L46 36Z" />
                        <path fill="#8B0A14" opacity=".3" d="M49 78h72l-3 52H52l-3-52Z" />
                        <g fill="#fff">
                            <rect x="56" y="88" width="22" height="22" rx="5" transform="rotate(-12 67 99)" />
                            <rect x="90" y="104" width="22" height="22" rx="5" transform="rotate(10 101 115)" />
                        </g>
                        <path fill="none" d="M42 36h86M110 12 96 74" />
                    </g>
                </symbol>

                {/* takeaway cup */}
                <symbol id="s-cup" viewBox="0 0 160 200">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="none" d="M66 22c-2-10 8-14 10-6m18 4c-2-10 8-14 10-6" />
                        <path fill="#F4E6D6" d="M30 56h100l-2 16H32l-2-16Z" />
                        <path fill="#FBF1E4" d="M40 74h80l-9 104c0 8-14 14-31 14s-31-6-31-14L40 74Z" />
                        <path fill="none" d="M46 118h68" />
                        <path fill="#8B0A14" stroke="none" d="M80 132c1.1-6.9 5.1-10.9 12-12-6.9-1.1-10.9-5.1-12-12-1.1 6.9-5.1 10.9-12 12 6.9 1.1 10.9 5.1 12 12Z" />
                    </g>
                </symbol>

                {/* retro toaster with dripping syrup */}
                <symbol id="s-toaster" viewBox="0 0 300 230">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <path fill="#FBF1E4" d="M118 52c-16 0-24-14-18-26 5-10 16-14 24-10 6 3 10 3 16 0 8-4 19 0 24 10 6 12-2 26-18 26h-28Z" />
                        <path fill="#FBF1E4" d="M158 64c-16 0-24-14-18-26 5-10 16-14 24-10 6 3 10 3 16 0 8-4 19 0 24 10 6 12-2 26-18 26h-28Z" />
                        <rect x="40" y="92" width="220" height="92" rx="26" fill="#79B1DC" />
                        <rect x="112" y="80" width="34" height="24" rx="6" fill="#8B0A14" stroke="none" />
                        <rect x="156" y="80" width="34" height="24" rx="6" fill="#8B0A14" stroke="none" />
                        <path fill="none" d="M254 84h18M263 60v24" />
                        <circle cx="263" cy="60" r="9" fill="#FBF1E4" />
                        <g fill="#FBF1E4" stroke="none">
                            <circle cx="72" cy="128" r="5" /><circle cx="92" cy="140" r="4" /><circle cx="84" cy="112" r="4" />
                        </g>
                        <path fill="none" d="M60 184v18m180-18v18" />
                        <path fill="none" strokeWidth="5" d="M128 132c2 10 8 14 8 24s-6 10-10 8m42-26c2 10 8 14 8 24s-6 10-10 8m14-46c2 8 6 12 6 20" />
                    </g>
                </symbol>

                {/* breakfast plate: toast with jam + butter */}
                <symbol id="s-toast" viewBox="0 0 220 170">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="110" cy="120" rx="94" ry="40" fill="#fff" />
                        <path fill="#FBF1E4" d="M56 118c-10-24 4-56 26-62 4-8 14-12 22-8 8-6 20-2 24 8 18 8 28 40 16 62-20 12-68 12-88 0Z" />
                        <path fill="none" d="M70 62c-2 22-2 40 2 56m78-56c2 22 2 40-2 56" />
                        <rect x="88" y="70" width="22" height="18" rx="3" fill="#fff" />
                        <path fill="#8B0A14" d="M118 84a12 12 0 0 1 22 8c0 10-12 14-20 10s-4-14-2-18Z" />
                        <path fill="none" d="M96 36c4-8 12-10 16-4m20-4c4-8 12-10 16-4" />
                    </g>
                </symbol>

                {/* breakfast plate: pancake stack */}
                <symbol id="s-pancake" viewBox="0 0 220 170">
                    <g stroke="#8B0A14" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="110" cy="126" rx="94" ry="34" fill="#fff" />
                        <ellipse cx="110" cy="104" rx="66" ry="18" fill="#F4E6D6" />
                        <ellipse cx="110" cy="86" rx="66" ry="18" fill="#FBF1E4" />
                        <ellipse cx="110" cy="68" rx="66" ry="18" fill="#F4E6D6" />
                        <rect x="96" y="44" width="28" height="14" rx="3" fill="#fff" />
                        <path fill="none" strokeWidth="5" d="M58 60c2 14 8 20 8 32s-4 14-4 14m124-46c-2 14-8 20-8 32s4 14 4 14" />
                        <g fill="#8B0A14" stroke="none"><circle cx="74" cy="92" r="6" /><circle cx="146" cy="88" r="6" /></g>
                    </g>
                </symbol>

                {/* hand-drawn arrow doodle */}
                <symbol id="s-arrow" viewBox="0 0 110 70">
                    <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 62C22 20 62 8 98 24" />
                        <path d="M84 14l16 9-4 17" />
                    </g>
                </symbol>
            </defs>
        </svg>
    );
}

/* ---------- kecil: bintang 4-sudut ---------- */
function Star({ className = 'h-3 w-3 text-plumymaroon' }) {
    return <svg className={className} aria-hidden="true"><use href="#s-star" /></svg>;
}

/* ---------- ticker item lendut ---------- */
function TickerGroup() {
    const items = ['Kopi modern', 'Resep sederhana', 'Bahan alami', 'Dipanggang tiap pagi', 'Dibuat pelan-pelan', 'Tanpa penyedap'];
    return (
        <span className="flex shrink-0 items-center gap-6 pr-6 text-[13px] font-semibold uppercase tracking-[0.22em] text-plumyink">
            {items.map((item) => (
                <Fragment key={item}>
                    {item}
                    <Star className="h-2.5 w-2.5 shrink-0 text-plumymaroon" />
                </Fragment>
            ))}
        </span>
    );
}

/* ---------- kartu produk ---------- */
function ProductCard({ title, desc, price, symbol, ariaLabel, badge }) {
    return (
        <article className="h-full rounded-[22px] border border-[#e7d3b6] bg-plumybeige p-4 transition-transform duration-300 hover:-translate-y-1">
            <div className="relative mb-4 grid place-items-center overflow-hidden rounded-[16px] bg-plumycream p-6">
                {badge && (
                    <span
                        className={`absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-plumymaroon px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-plumycream ${badge.rotate}`}
                    >
                        <Star className="h-2.5 w-2.5" />
                        {badge.label}
                    </span>
                )}
                <svg className="h-36 w-full" role="img" aria-label={ariaLabel}><use href={symbol} /></svg>
            </div>
            <h3 className="text-[15px] font-semibold uppercase tracking-[0.08em] text-plumyink">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-plumyink/70">{desc}</p>
            <p className="mt-3 font-semibold text-plumymaroon">{price}</p>
        </article>
    );
}

/* ---------- modal reservasi ---------- */
const HOURS = ['08.00', '09.00', '10.00', '14.00', '16.00', '19.00'];

function ReserveModal({ open, onClose }) {
    const guestsMin = 1, guestsMax = 10;
    const [guests, setGuests] = useState(2);
    const [hour, setHour] = useState(HOURS[0]);
    const [submitted, setSubmitted] = useState(false);
    const [name, setName] = useState('');
    const nameInputRef = useRef(null);

    const close = () => {
        onClose();
        // reset untuk pembukaan berikutnya
        window.setTimeout(() => {
            setSubmitted(false);
            setGuests(2);
            setHour(HOURS[0]);
            setName('');
        }, 250);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // validasi HTML (required, pattern) sudah berjalan sejak form tanpa `novalidate`
        setSubmitted(true);
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog className="relative z-50" onClose={close} initialFocus={nameInputRef} aria-label="Modal reservasi meja">
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-plumyink/50" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-3 sm:items-center sm:p-6">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel className="relative w-full max-w-lg rounded-[24px] border-2 border-plumymaroon/40 bg-plumycream shadow-xl">
                                {/* tampilan form */}
                                <form className="p-7 sm:p-9" onSubmit={handleSubmit}>
                                    <button
                                        type="button"
                                        onClick={close}
                                        aria-label="Tutup modal reservasi"
                                        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-plumymaroon/40 text-plumymaroon transition-colors hover:bg-plumybeige"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                            <path d="M6 6l12 12M18 6L6 18" />
                                        </svg>
                                    </button>

                                    <p className="font-script text-[30px] font-bold leading-none text-plumymaroon">plumy</p>
                                    <h2 id="reserve-title" className="mt-1 text-[30px] font-semibold uppercase leading-tight tracking-[0.04em] text-plumyink">
                                        Reservasi Meja
                                    </h2>
                                    <p className="mt-2 text-[13px] leading-[1.6] text-plumyink/70">
                                        Isi bentuk singkat ini — meja kami tahan 20 menit setelah jam pilih.
                                    </p>

                                    <div className="mt-7 space-y-6">
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <label htmlFor="res-name" className="block">
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plumymaroon">Nama</span>
                                                <input
                                                    id="res-name"
                                                    ref={nameInputRef}
                                                    name="name"
                                                    type="text"
                                                    required
                                                    autoComplete="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="rule-input mt-1"
                                                    placeholder="Namamu, siapa lagi?"
                                                />
                                            </label>
                                            <label htmlFor="res-phone" className="block">
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plumymaroon">No. HP</span>
                                                <input
                                                    id="res-phone"
                                                    name="phone"
                                                    type="tel"
                                                    required
                                                    autoComplete="tel"
                                                    pattern="[0-9+ -]{8,}"
                                                    className="rule-input mt-1"
                                                    placeholder="08xx xxx xxx"
                                                />
                                            </label>
                                        </div>

                                        <fieldset>
                                            <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plumymaroon">Jam datang</legend>
                                            <div className="mt-2.5 flex flex-wrap gap-2.5">
                                                {HOURS.map((h) => (
                                                    <label key={h}>
                                                        <input
                                                            type="radio"
                                                            name="hour"
                                                            value={h}
                                                            checked={hour === h}
                                                            onChange={() => setHour(h)}
                                                            className="peer sr-only"
                                                        />
                                                        <span className="inline-block cursor-pointer rounded-full border border-plumymaroon/40 px-4 py-2 text-[13px] font-semibold text-plumyink transition-colors duration-200 hover:bg-plumybeige peer-checked:border-plumymaroon peer-checked:bg-plumymaroon peer-checked:text-plumycream">
                                                            {h}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>

                                        <div>
                                            <span id="guest-label" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plumymaroon">Jumlah tamu</span>
                                            <div className="mt-2 flex items-center gap-5">
                                                <button
                                                    type="button"
                                                    aria-label="Kurangi jumlah tamu"
                                                    onClick={() => setGuests((g) => Math.max(guestsMin, g - 1))}
                                                    className="grid h-10 w-10 place-items-center rounded-full border border-plumymaroon text-plumymaroon transition-colors hover:bg-plumybeige"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                                                </button>
                                                <span aria-labelledby="guest-label" aria-live="polite" className="min-w-16 text-center text-[20px] font-semibold text-plumyink">
                                                    {guests} tamu
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-label="Tambah jumlah tamu"
                                                    onClick={() => setGuests((g) => Math.min(guestsMax, g + 1))}
                                                    className="grid h-10 w-10 place-items-center rounded-full border border-plumymaroon text-plumymaroon transition-colors hover:bg-plumybeige"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        <label className="flex items-start gap-3">
                                            <input type="checkbox" required className="mt-0.5 h-4 w-4 cursor-pointer accent-[#8B0A14]" />
                                            <span className="text-[12px] leading-[1.55] text-plumyink/75">
                                                Saya setuju data pribadiku hanya dipakai untuk memproses reservasi ini,
                                                dan akan dihapus setelah kunjungan.{' '}
                                                <a href="#" className="text-plumymaroon underline decoration-plumymaroon/40 underline-offset-2">Kebijakan privasi</a>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <button
                                            type="submit"
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-plumymaroon px-7 py-3.5 text-[14px] font-semibold text-plumycream transition-colors duration-200 hover:bg-[#6e080f]"
                                        >
                                            Kirim Reservasi
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={close}
                                            className="rounded-full border border-plumymaroon px-7 py-3.5 text-[14px] font-semibold text-plumymaroon transition-colors hover:bg-plumybeige"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>

                                {/* tampilan sukses (setelah kirim) */}
                                {submitted && (
                                    <div className="p-10 text-center">
                                        <div className="mx-auto grid place-items-center gap-3">
                                            <Star className="h-9 w-9 text-plumymaroon" />
                                            <h2 className="text-[30px] font-semibold uppercase tracking-[0.04em] text-plumyink">Meja dipesan!</h2>
                                        </div>
                                        <p className="mx-auto mt-4 max-w-sm text-[14px] leading-[1.65] text-plumyink/75">
                                            Terima kasih. <strong className="font-semibold text-plumyink">Kak {name.trim()}</strong>,
                                            meja untuk <strong className="font-semibold text-plumyink">{guests} tamu</strong> sudah kami tahan
                                            pukul <strong className="font-semibold text-plumymaroon">{hour}</strong>. Sampai ketemu di PLUMY!
                                        </p>
                                        <p className="mt-3 font-script text-2xl text-plumymaroon">kopi hangat menantimu</p>
                                        <button
                                            type="button"
                                            onClick={close}
                                            autoFocus
                                            className="mt-7 rounded-full bg-plumymaroon px-8 py-3 text-[14px] font-semibold text-plumycream transition-colors hover:bg-[#6e080f]"
                                        >
                                            Selesai
                                        </button>
                                    </div>
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

/* ============================ HALAMAN ============================ */
export default function Plumy() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [reserveOpen, setReserveOpen] = useState(false);

    const navLink = 'text-[13px] font-semibold uppercase tracking-[0.12em] text-plumyink hover:text-plumymaroon';
    const solidBtn = 'rounded-full bg-plumymaroon font-semibold text-plumycream transition-colors duration-200 hover:bg-[#6e080f]';

    return (
        <div className="plumy min-h-screen bg-plumycream font-plumy text-plumyink">
            <PlumySymbols />
            <Head title="PLUMY — bakery & coffee bar" />

            {/* ================= NAVBAR ================= */}
            <header className="sticky top-0 z-40 bg-plumysky">
                <div className="relative mx-auto flex max-w-content items-center justify-center gap-1 px-4 py-2.5 sm:gap-2 sm:px-6">
                    {/* burger (mobile) */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        aria-label="Buka menu navigasi"
                        className="absolute left-4 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full lg:hidden"
                    >
                        <span className="block h-0.5 w-5 rounded bg-plumyink" />
                        <span className="block h-0.5 w-5 rounded bg-plumyink" />
                        <span className="block h-0.5 w-5 rounded bg-plumyink" />
                    </button>

                    {/* menu kiri */}
                    <nav aria-label="Navigasi utama kiri" className="hidden flex-1 items-center justify-end gap-4 pr-5 lg:flex">
                        <a href="#beranda" className={navLink}>Beranda</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#menu" className={navLink}>Menu</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#cerita" className={navLink}>Cerita</a>
                    </nav>

                    {/* logo tengah */}
                    <a href="#beranda" className="shrink-0 px-2 text-center" aria-label="PLUMY — bakery & coffee bar, ke beranda">
                        <span className="block font-script text-[34px] font-bold lowercase leading-none tracking-wide text-plumymaroon sm:text-[40px]">plumy</span>
                        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.28em] text-plumyink/80">bakery &amp; coffee bar</span>
                    </a>

                    {/* menu kanan */}
                    <nav aria-label="Navigasi utama kanan" className="hidden flex-1 items-center justify-start gap-4 pl-5 lg:flex">
                        <a href="#sarapan" className={navLink}>Sarapan</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <a href="#kontak" className={navLink}>Kontak</a>
                        <Star className="h-2.5 w-2.5 text-plumymaroon" />
                        <button type="button" onClick={() => setReserveOpen(true)} className={`${solidBtn} px-5 py-2 text-[13px] uppercase tracking-[0.12em]`}>
                            Reservasi Meja
                        </button>
                    </nav>

                    {/* quick reserve (mobile) */}
                    <button
                        type="button"
                        onClick={() => setReserveOpen(true)}
                        className="absolute right-4 rounded-full bg-plumymaroon px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-plumycream lg:hidden"
                    >
                        Reservasi
                    </button>
                </div>

                {/* panel mobile */}
                <nav id="mobile-menu" aria-label="Navigasi seluler" className={`border-t border-plumyink/15 bg-plumysky px-6 pb-6 pt-4 lg:hidden ${menuOpen ? 'block' : 'hidden'}`}>
                    <ul className="space-y-3">
                        {[
                            ['#menu', 'Menu'],
                            ['#cerita', 'Cerita'],
                            ['#sarapan', 'Sarapan'],
                            ['#kontak', 'Kontak'],
                        ].map(([href, label]) => (
                            <li key={href}>
                                <a href={href} onClick={() => setMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-widest text-plumyink">
                                    {label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main>
                {/* ================= HERO ================= */}
                <section id="beranda" aria-labelledby="hero-title" className="grid lg:min-h-[560px] lg:grid-cols-2">
                    {/* kiri: garis taplak + sticker + blob logo */}
                    <div className="stripes-v relative overflow-hidden px-6 py-14 sm:px-10 lg:py-20">
                        <div className="pointer-events-none absolute left-6 top-6 text-plumymaroon/70" aria-hidden="true">
                            <Star className="h-5 w-5 rotate-12" />
                        </div>
                        <div className="pointer-events-none absolute bottom-10 right-8 text-plumymaroon/70" aria-hidden="true">
                            <Star className="h-7 w-7 -rotate-12" />
                        </div>
                        <div className="pointer-events-none absolute right-16 top-1/3 text-plumymaroon/50" aria-hidden="true">
                            <Star className="h-3.5 w-3.5 rotate-45" />
                        </div>

                        <div className="relative mx-auto flex h-full max-w-md items-center justify-center lg:max-w-lg">
                            {/* blob krem berisi logo */}
                            <div className="blob bg-plumycream px-10 py-10 text-center sm:px-14 sm:py-14">
                                <p className="font-script text-5xl font-bold lowercase leading-none text-plumymaroon sm:text-6xl">plumy</p>
                                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-plumyink/80">bakery &amp; coffee<br />bar</p>
                                <div className="mt-3 flex items-center justify-center gap-2 text-plumymaroon" aria-hidden="true">
                                    <Star className="h-2.5 w-2.5" />
                                    <Star className="h-3.5 w-3.5" />
                                    <Star className="h-2.5 w-2.5" />
                                </div>
                            </div>

                            {/* sticker: croissant */}
                            <div className="sticker absolute -left-1 top-2 bg-plumycream p-3 rotate-[-7deg] sm:-left-4 sm:top-6" aria-hidden="true">
                                <svg className="h-20 w-20 sm:h-24 sm:w-24"><use href="#s-croissant" /></svg>
                            </div>
                            {/* sticker: takeaway cup */}
                            <div className="sticker absolute -bottom-3 right-0 bg-plumybeige p-3 rotate-[8deg] sm:bottom-4 sm:right-2" aria-hidden="true">
                                <svg className="h-20 w-16 sm:h-24 sm:w-20"><use href="#s-cup" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* kanan: headline */}
                    <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-14 lg:py-24">
                        <p className="mb-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.25em] text-plumymaroon">
                            <Star className="h-3 w-3" />
                            Bakery &amp; coffee bar — buka tiap hari
                        </p>
                        <h1 id="hero-title" className="max-w-[12ch] text-[52px] font-semibold uppercase leading-[0.98] tracking-[0.03em] text-plumyink sm:text-[64px] lg:text-[78px]">
                            Dasar hari Anda
                        </h1>
                        <p className="mt-6 max-w-md text-[15px] leading-[1.65] text-plumyink/75">
                            Roti keluar oven tiap pukul enam pagi, biji kopi digiling di tempat.
                            Datang, nikmati aroma hangatnya, dan mulai harimu dengan piring yang penuh.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center gap-5">
                            <a
                                href="#kontak"
                                className="inline-flex items-center gap-3 rounded-full bg-plumymaroon px-8 py-4 text-[15px] font-semibold text-plumycream transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#6e080f]"
                            >
                                Kunjungi PLUMY
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12h14m-6-6 6 6-6 6" />
                                </svg>
                            </a>
                            <button
                                type="button"
                                onClick={() => setReserveOpen(true)}
                                className="text-sm font-semibold uppercase tracking-[0.12em] text-plumymaroon underline decoration-plumymaroon/30 decoration-2 underline-offset-4 transition-colors hover:decoration-plumymaroon"
                            >
                                atau reservasi meja
                            </button>
                        </div>
                    </div>
                </section>

                {/* ================= TICKER ================= */}
                <div className="overflow-hidden border-y-2 border-plumymaroon/20 bg-plumysky py-3" aria-hidden="true">
                    <div className="flex w-max animate-plumy-marquee">
                        <TickerGroup />
                        <TickerGroup />
                    </div>
                </div>

                {/* ================= CERITA BRAND ================= */}
                <section id="cerita" aria-labelledby="cerita-title" className="scroll-mt-24 bg-plumybeige px-4 py-24 sm:px-8 lg:py-28 xl:py-32">
                    <div className="relative mx-auto max-w-content rounded-[56px] border border-plumymaroon/40 px-6 py-12 sm:px-12 lg:px-16 lg:py-16">
                        {/* bintang sudut menutup kurva */}
                        <Star className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-plumybeige p-0.5 text-plumymaroon" />
                        <Star className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-plumybeige p-0.5 text-plumymaroon" />
                        <Star className="absolute -bottom-2 -left-2 h-6 w-6 rounded-full bg-plumybeige p-0.5 text-plumymaroon" />
                        <Star className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-plumybeige p-0.5 text-plumymaroon" />

                        <p className="mb-5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.25em] text-plumymaroon">
                            <Star className="h-3 w-3" />
                            Cerita PLUMY
                        </p>

                        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
                            <div>
                                <h2 id="cerita-title" className="max-w-[14ch] text-[40px] font-semibold uppercase leading-[1.02] tracking-[0.03em] text-plumyink sm:text-[48px] lg:text-[52px]">
                                    Dari loyang kecil di sudut jalan
                                </h2>
                                <p className="mx-0 mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-script text-[26px] leading-tight text-plumysky sm:text-[30px]">
                                    <span>Koki roti kami hanya berdua</span>
                                    <span className="sticker inline-block bg-plumycream p-1 rotate-[-6deg]" aria-hidden="true">
                                        <svg className="h-8 w-9"><use href="#s-toast" /></svg>
                                    </span>
                                    <span>— dan itu memang tandanya</span>
                                </p>
                                <div className="mt-6 space-y-4 text-[15px] leading-[1.65] text-plumyink/75">
                                    <p>
                                        PLUMY mulai dari satu loyang di dapur rumah tahun 2019. Kini kami masih
                                        memanggang dengan resep yang sama: mentega dikupas tangan, adonan
                                        didinginkan semalaman, dan tidak ada jalan pintas.
                                    </p>
                                    <p>
                                        Kopi kami modern tapi sederhana — satu mesin, dua biji favorit,
                                        dan menu yang ditulis ulang setiap musim sesuai hasil panen.
                                    </p>
                                </div>
                                <div className="mt-8 flex items-end gap-3 text-plumymaroon">
                                    <svg className="h-10 w-14" aria-hidden="true"><use href="#s-arrow" /></svg>
                                    <span className="pb-3 font-script text-[24px] leading-none">masih hangat saat sampai!</span>
                                </div>
                            </div>

                            {/* visual toaster */}
                            <div className="relative mx-auto w-full max-w-md">
                                <div className="rounded-[28px] bg-plumysky px-8 pb-10 pt-10">
                                    <svg className="mx-auto h-56 w-full" role="img" aria-label="Ilustrasi pemanggang roti biru retro dengan sirup menetes"><use href="#s-toaster" /></svg>
                                </div>
                                <div className="sticker absolute -left-3 top-6 w-fit bg-plumycream px-4 py-2 rotate-[-8deg]">
                                    <span className="font-script text-2xl leading-none text-plumymaroon">fresh!</span>
                                </div>
                                <div className="absolute -bottom-4 right-6 rotate-12 text-plumymaroon" aria-hidden="true">
                                    <Star className="h-7 w-7" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= PRODUK ================= */}
                <section id="menu" aria-labelledby="menu-title" className="scroll-mt-24 px-4 py-24 sm:px-8 lg:py-28 xl:py-32">
                    <div className="mx-auto max-w-content">
                        {/* baris kategori dipisah bintang */}
                        <div className="mb-14 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center" role="presentation">
                            <span className="text-[28px] font-semibold uppercase tracking-[0.06em] text-plumyink/45 sm:text-[40px] lg:text-[48px]">Pastry</span>
                            <Star className="h-6 w-6 shrink-0 text-plumymaroon sm:h-8 sm:w-8" />
                            <span className="text-[28px] font-semibold uppercase tracking-[0.06em] text-plumyink sm:text-[40px] lg:text-[48px]">Roti</span>
                            <Star className="h-6 w-6 shrink-0 text-plumymaroon sm:h-8 sm:w-8" />
                            <span className="text-[28px] font-semibold uppercase tracking-[0.06em] text-plumyink sm:text-[40px] lg:text-[48px]">Kopi</span>
                            <Star className="h-6 w-6 shrink-0 text-plumymaroon sm:h-8 sm:w-8" />
                            <span className="text-[28px] font-semibold uppercase tracking-[0.06em] text-plumyink/45 sm:text-[40px] lg:text-[48px]">Manis</span>
                        </div>

                        <h2 id="menu-title" className="sr-only">Menu PLUMY</h2>

                        {/* grid produk 4 x 2 */}
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <li>
                                <ProductCard
                                    title="Croissant Mentega"
                                    desc="27 lapis mentega Prancis, dipanggang perlahan sampai kulitnya rapuh."
                                    price="26K"
                                    symbol="#s-croissant"
                                    ariaLabel="Croissant mentega lapis"
                                    badge={{ label: 'Baru', rotate: 'rotate-[-4deg]' }}
                                />
                            </li>
                            <li>
                                <ProductCard
                                    title="Pain au Chocolat"
                                    desc="Adonan sama seperti croissant, digulung dengan dua batang cokelat gelap."
                                    price="28K"
                                    symbol="#s-pain"
                                    ariaLabel="Pain au chocolat dengan cokelat di ujung"
                                />
                            </li>
                            <li>
                                <ProductCard
                                    title="Cinnamon Roll"
                                    desc="Kulit tebal, kayu manis perasan segar, glasir keju krim mengalir."
                                    price="30K"
                                    symbol="#s-cinnamon"
                                    ariaLabel="Cinnamon roll dilapisi glasir putih"
                                />
                            </li>
                            <li>
                                <ProductCard
                                    title="Roti Sourdough"
                                    desc="Starter 5 tahun, fermentasi 18 jam, kulit rapuh dan seratnya elastis."
                                    price="65K"
                                    symbol="#s-sourdough"
                                    ariaLabel="Roti sourdough dengan potongan di sampingnya"
                                    badge={{ label: 'Favorit', rotate: 'rotate-[3deg]' }}
                                />
                            </li>
                            <li>
                                <ProductCard
                                    title="Banana Bread"
                                    desc="Pisang matang dihaluskan lewat, kacang kenari panggang, tanpa pemanis tambahan."
                                    price="24K"
                                    symbol="#s-banana"
                                    ariaLabel="Sepotong roti pisang dengan butiran kacang kenari"
                                />
                            </li>
                            <li>
                                <ProductCard
                                    title="Café Latte"
                                    desc="Espresso dua shot, susu dikukus lembut, bentuk bintang empat khas."
                                    price="24K"
                                    symbol="#s-latte"
                                    ariaLabel="Café latte dengan gambar bintang di busa"
                                    badge={{ label: 'Favorit', rotate: 'rotate-[-3deg]' }}
                                />
                            </li>
                            <li>
                                <ProductCard
                                    title="Es Kopi Susu"
                                    desc="Espresso, susu segar, gula aren cair. Disaring dua kali, manisnya pas."
                                    price="22K"
                                    symbol="#s-iced"
                                    ariaLabel="Es kopi susu dengan es dan sedotan"
                                />
                            </li>

                            {/* kartu biru CTA */}
                            <li>
                                <article className="flex h-full flex-col items-center justify-center rounded-[22px] bg-plumysky p-6 text-center">
                                    <svg className="my-2 h-24 w-32" viewBox="0 0 220 170" role="img" aria-hidden="true">
                                        <g fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M40 130c-18-10-26-38-12-54 10-11 28-9 34 4 6 13 4 28-3 39-5 8-12 13-19 11Z" />
                                            <path d="M180 130c18-10 26-38 12-54-10-11-28-9-34 4-6 13-4 28 3 39 5 8 12 13 19 11Z" />
                                            <path d="M60 122c-10-30 10-70 50-70s60 40 50 70c-8 22-92 22-100 0Z" />
                                            <path d="M92 52c-6 22-6 44 2 64m54-64c6 22 6 44-2 64" />
                                            <path d="M104 22c-4-8 2-12 6-8m18 8c-4-8 2-12 6-8" />
                                        </g>
                                        <path fill="#fff" d="M40 18c1.1-6.9 5.1-10.9 12-12-6.9-1.1-10.9-5.1-12-12-1.1 6.9-5.1 10.9-12 12 6.9 1.1 10.9 5.1 12 12Zm138 30c.8-5 3.7-8 8.7-8.7-5-.8-7.9-3.7-8.7-8.7-.8 5-3.7 8-8.7 8.7 5 .8 7.9 3.7 8.7 8.7Z" />
                                    </svg>
                                    <p className="mt-3 max-w-[24ch] font-script text-[26px] leading-tight text-plumycream">masih banyak menu lain, kok</p>
                                    <a
                                        href="#sarapan"
                                        className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-plumycream px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-plumycream transition-colors duration-200 hover:bg-plumycream hover:text-plumysky"
                                    >
                                        Lihat Menu Penuh
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M5 12h14m-6-6 6 6-6 6" />
                                        </svg>
                                    </a>
                                </article>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* ================= SARAPAN SPESIAL ================= */}
                <section id="sarapan" aria-labelledby="sarapan-title" className="scroll-mt-24 bg-plumybeige px-4 py-24 sm:px-8 lg:py-28 xl:py-32">
                    <div className="mx-auto max-w-content">
                        <div className="mb-14 text-center">
                            <p className="mb-4 flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.25em] text-plumymaroon">
                                <Star className="h-3 w-3" />
                                Sarapan spesial
                                <Star className="h-3 w-3" />
                            </p>
                            <h2 id="sarapan-title" className="text-[40px] font-semibold uppercase leading-[1.02] tracking-[0.03em] text-plumyink sm:text-[48px] lg:text-[56px]">
                                Berangkat kerja atau kondangan? Sini duduk.
                            </h2>
                            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.6] text-plumyink/75">
                                Dua set sarapan yang ditata pelan — tersedia tiap hari pukul 07.30–11.00 WIB.
                            </p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Kartu A: visual kiri */}
                            <article className="grid overflow-hidden rounded-[26px] border border-plumymaroon/70 bg-plumycream sm:grid-cols-[2fr_3fr]">
                                <div className="grid place-items-center bg-plumybeige p-8">
                                    <svg className="h-40 w-full max-w-[220px]" role="img" aria-label="Set Sarapan Ringan — dua roti panggang dengan mentega dan selai"><use href="#s-toast" /></svg>
                                </div>
                                <div className="border-t border-plumymaroon/70 p-7 sm:border-l sm:border-t-0">
                                    <h3 className="text-[19px] font-semibold uppercase tracking-[0.1em] text-plumyink">Sarapan Ringan</h3>
                                    <ul className="mt-5 space-y-4">
                                        {[
                                            ['Roti Panggang Mentega & Selai', '18K'],
                                            ['Croissant + Americano', '29K'],
                                            ['Granola, Yogurt & Madu', '22K'],
                                        ].map(([item, price]) => (
                                            <li key={item} className="flex items-end gap-2 text-[14px] text-plumyink/80">
                                                <Star className="mt-1 h-3 w-3 shrink-0" />
                                                <span>{item}</span>
                                                <span className="leader" aria-hidden="true" />
                                                <span className="shrink-0 font-semibold text-plumymaroon">{price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-6 flex items-end justify-between">
                                        <button type="button" onClick={() => setReserveOpen(true)} className={`${solidBtn} inline-flex items-center gap-2 px-6 py-3 text-[13px]`}>
                                            Pesan Meja
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                                        </button>
                                        <span className="flex items-center gap-2 text-plumymaroon" aria-hidden="true">
                                            <svg className="h-8 w-11 scale-x-[-1]"><use href="#s-arrow" /></svg>
                                            <span className="pb-2 font-script text-xl leading-none">tinggal 3 meja!</span>
                                        </span>
                                    </div>
                                </div>
                            </article>

                            {/* Kartu B: visual kanan */}
                            <article className="grid overflow-hidden rounded-[26px] border border-plumymaroon/70 bg-plumycream sm:grid-cols-[3fr_2fr]">
                                <div className="order-2 border-t border-plumymaroon/70 p-7 sm:order-1 sm:border-r sm:border-t-0">
                                    <h3 className="text-[19px] font-semibold uppercase tracking-[0.1em] text-plumyink">Sarapan Kenyang</h3>
                                    <ul className="mt-5 space-y-4">
                                        {[
                                            ['Roti Panggang Telur & Keju', '32K'],
                                            ['French Toast Gula Aren', '34K'],
                                            ['Set Kenyang: Telur, Roti Asam Gandum + Latte', '45K'],
                                        ].map(([item, price]) => (
                                            <li key={item} className="flex items-end gap-2 text-[14px] text-plumyink/80">
                                                <Star className="mt-1 h-3 w-3 shrink-0" />
                                                <span>{item}</span>
                                                <span className="leader" aria-hidden="true" />
                                                <span className="shrink-0 font-semibold text-plumymaroon">{price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-6 flex items-end justify-between">
                                        <button type="button" onClick={() => setReserveOpen(true)} className={`${solidBtn} inline-flex items-center gap-2 px-6 py-3 text-[13px]`}>
                                            Pesan Meja
                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                                        </button>
                                        <span className="flex items-center gap-2 text-plumymaroon" aria-hidden="true">
                                            <svg className="h-8 w-11 scale-x-[-1]"><use href="#s-arrow" /></svg>
                                            <span className="pb-2 font-script text-xl leading-none">kenyang sampai siang!</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="order-1 grid place-items-center bg-plumybeige p-8 sm:order-2">
                                    <svg className="h-40 w-full max-w-[220px]" role="img" aria-label="Set Sarapan Kenyang — tumpukan pancake dengan mentega dan sirap"><use href="#s-pancake" /></svg>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                {/* ================= FOOTER ================= */}
                <footer id="kontak" className="stripes-v-warm border-t-2 border-plumymaroon/30 px-4 pb-10 pt-20 sm:px-8">
                    <div className="mx-auto max-w-content">
                        <div className="blob mx-auto w-fit bg-plumycream px-12 py-8 text-center">
                            <p className="font-script text-5xl font-bold lowercase leading-none text-plumymaroon">plumy</p>
                            <div className="mt-2 flex items-center justify-center gap-2 text-plumymaroon" aria-hidden="true">
                                <Star className="h-2.5 w-2.5" />
                                <Star className="h-3.5 w-3.5" />
                                <Star className="h-2.5 w-2.5" />
                            </div>
                        </div>

                        <div className="mt-14 grid gap-10 text-center sm:grid-cols-3 sm:text-left">
                            <div>
                                <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-plumymaroon">Kunjungi Kami</h2>
                                <address className="mt-4 not-italic text-[14px] leading-[1.7] text-plumyink/80">
                                    Jl. Kenanga No. 21,<br />
                                    Cempaka Putih, Jakarta Pusat<br />
                                    10101
                                </address>
                            </div>
                            <div className="sm:border-x sm:border-plumymaroon/25 sm:px-8">
                                <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-plumymaroon">Jam Buka</h2>
                                <p className="mt-4 text-[14px] leading-[1.7] text-plumyink/80">
                                    Senin–Jumat: 07.30–21.00 WIB<br />
                                    Sabtu–Minggu: 08.00–22.00 WIB<br />
                                    Roti keluar oven: 06.00 &amp; 15.00
                                </p>
                            </div>
                            <div>
                                <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-plumymaroon">Ikuti Kami</h2>
                                <ul className="mt-4 space-y-2 text-[14px]">
                                    <li>
                                        <a href="https://instagram.com" className="inline-flex items-center gap-2 font-semibold text-plumyink underline decoration-plumymaroon/30 decoration-2 underline-offset-4 hover:text-plumymaroon">
                                            Instagram @plumy.bakery
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://wa.me" className="inline-flex items-center gap-2 font-semibold text-plumyink underline decoration-plumymaroon/30 decoration-2 underline-offset-4 hover:text-plumymaroon">
                                            WhatsApp 0812-2100-210
                                        </a>
                                    </li>
                                    <li>
                                        <a href="mailto:halo@plumy.id" className="inline-flex items-center gap-2 font-semibold text-plumyink underline decoration-plumymaroon/30 decoration-2 underline-offset-4 hover:text-plumymaroon">
                                            halo@plumy.id
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-16 flex flex-col items-center gap-3 border-t border-plumymaroon/25 pt-6 text-[12px] text-plumyink/60 sm:flex-row sm:justify-between">
                            <p>© {new Date().getFullYear()} PLUMY bakery &amp; coffee bar — dibuat dengan gandum dan sayang.</p>
                            <p className="flex items-center gap-2" aria-hidden="true">
                                <Star className="h-2.5 w-2.5" />
                                <Star className="h-2 w-2" />
                                <Star className="h-2.5 w-2.5" />
                            </p>
                        </div>
                    </div>
                </footer>
            </main>

            {/* ================= MODAL RESERVASI ================= */}
            <ReserveModal open={reserveOpen} onClose={() => setReserveOpen(false)} />
        </div>
    );
}
