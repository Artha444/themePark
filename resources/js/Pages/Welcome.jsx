/**
 * VURASI PAMERAN SENI — SIMPLE GALLERY LANDING
 *
 * Design system: Minimal & clean + hero maskot "poster playfull" (design-model)
 * - Navbar & hero: pill navbar melayang, pill biru muda berisi IMAGE tipografi
 *   "Pesan Tiket Tanpa Ribet" (ukuran besar), maskot kucing besar mengapung +
 *   bayangan elips, PARALLAX MOUSE multi-lapis (blob/tiket/maskot/pill dengan
 *   kecepatan berbeda), angka statistik COUNT-UP, CTA multipark langsung ke
 *   /tickets (tanpa copy pameran spesifik), ticker ribbon oranye miring,
 *   kurva zinc-50 menuju konten — Framer Motion
 * - Section berikutnya: kertas & tinta zinc-50 / zinc-950, aksen brand orange-600
 * - Pesan Cepat: kartu tiket vintage pindah ke halaman pemesanan tiket; search
 *   card hero kini komponen tiket terpisah (HeroSearchTicket) dengan badan form
 *   dan stub rust yang dipisah perforasi — field/query & rute /tickets tetap sama
 * - Layout rapi, grid seimbang, sedikit bayangan
 *
 * Interaksi yang dipertahankan (logika tidak berubah):
 * - Hero: PARALLAX MOUSE multi-lapis (handler cek prefers-reduced-motion secara
 *   manual — mati total utk user reduced-motion), maskot mengapung, stempel &
 *   sunburst berputar, ticker ribbon oranye, angka statistik count-up
 * - Slider galeri: kartu POLAROID (area foto + caption bar + chip nama park) —
 *   autoplay 4.5s, drag, panah stiker, keyboard (←/→), pause saat hover/focus
 * - Pembatas antar section: garis perforasi + asterisk berputar (SectionDivider)
 * - Progress bar sederhana (tanpa animasi ken-burns)
 * - Scroll-spy navbar, status buka/tutup real-time
 * - FAQ accordion, copy kode promo, tombol back-to-top
 * - Modal Cek Pesanan Guest
 *
 * Aksesibilitas: skip-link, target sentuh ≥ 44px, aria-label, prefers-reduced-motion
 *
 * LOGIKA BISNIS TIDAK BERUBAH:
 * - Quick booking → /tickets?park_id=...&date=...&qty=...
 * - Kartu park → /parks/{id}, promo → salin kupon
 * - Modal Cek Pesanan Guest → POST /api/orders/lookup lalu redirect
 */

import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence, MotionConfig, animate, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import SiteNavbar, { NAV_SECTIONS } from '@/Components/SiteNavbar';
import MyTicketsModal from '@/Components/MyTicketsModal';
import HeroSearchTicket from '@/Components/HeroSearchTicket';
import PhotoMarquee from '@/Components/PhotoMarquee';

/* =========================================================================
   IKON (SVG inline, gaya Lucide — stroke 2, konsisten di seluruh halaman)
========================================================================= */
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
const IconChevronL = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevronR = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const IconMapPin = (p) => <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>;
const IconCard = (p) => <Icon {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></Icon>;
const IconCopy = (p) => <Icon {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" /></Icon>;
const IconArrowUp = (p) => <Icon {...p}><path d="m18 15-6-6-6 6" /></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>;
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 11v2" /><path d="M13 17v2" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>;
const IconInfo = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Icon>;
const IconSparkles = (p) => <Icon {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></Icon>;
const IconChevronDown = (p) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>;
const IconGift = (p) => <Icon {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /><path d="M12 8H7.5a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8Z" /><path d="M12 8h4.5a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8Z" /></Icon>;
const IconPlay = (p) => <Icon {...p}><polygon points="6 3 20 12 6 21 6 3" /></Icon>;
const IconPause = (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></Icon>;
const IconCamera = (p) => <Icon {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></Icon>;

/* =========================================================================
   TIKET DEKORATIF — warna rust, bertabur statis di sekitar hero latar putih
   (tipografi "Pesan Tiket Tanpa Ribet" memakai image dari design-model)
========================================================================= */
function TicketDeco({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
            <path
                fill="#AC4A2E"
                d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
            />
            <path d="M13 5v2M13 11v2M13 17v2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" />
        </svg>
    );
}

/* Sinar poster komik — berputar pelan di belakang maskot */
function SunburstRays({ className = '' }) {
    return (
        <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" className={className}>
            {Array.from({ length: 16 }).map((_, i) => (
                <path
                    key={i}
                    d="M100 104 L94 4 L106 4 Z"
                    fill="currentColor"
                    transform={`rotate(${(360 / 16) * i} 100 100)`}
                />
            ))}
        </svg>
    );
}

/* Kilau bintang empat titik — diberi animasi twinkle dari pemanggil */
function Sparkle({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
            <path d="M12 2c.8 5 4.2 8.4 9.2 9.2-5 .8-8.4 4.2-9.2 9.2-.8-5-4.2-8.4-9.2-9.2 5-.8 8.4-4.2 9.2-9.2Z" />
        </svg>
    );
}

/* Stempel melingkar — teks berputar pelan, dipasang menimpa sudut pill biru */
function StampBadge({ className = '' }) {
    return (
        <div
            className={`relative grid h-full w-full place-items-center rounded-full border-2 border-dashed border-orange-500/50 bg-white text-orange-600 shadow-lg shadow-zinc-900/10 ${className}`}
        >
            <svg viewBox="0 0 120 120" aria-hidden="true" className="absolute inset-0 h-full w-full">
                <defs>
                    <path id="vurasi-stamp-ring" d="M60 60 m -43 0 a 43 43 0 1 1 86 0 a 43 43 0 1 1 -86 0" fill="none" />
                </defs>
                <text fill="currentColor" fontSize="12.5" fontWeight="800" letterSpacing="1.5">
                    <textPath href="#vurasi-stamp-ring" textLength="268" lengthAdjust="spacingAndGlyphs">
                        TIKET RESMI MULTIPARK ★ VURASI ★
                    </textPath>
                </text>
            </svg>
            <span aria-hidden="true" className="font-anton text-xl leading-none">
                ★
            </span>
        </div>
    );
}

/* =========================================================================
   UTIL
========================================================================= */
const fmtID = new Intl.NumberFormat('id-ID');
const rupiah = (n) => `Rp ${fmtID.format(n || 0)}`;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Kurva ease eksponensial untuk reveal Framer Motion (soft out-expo). */
const EASE = [0.22, 1, 0.36, 1];

/* Warna stub kupon — tiap tiket kupon berganti warna mengikuti urutan (section Kupon) */
const COUPON_DOTS = [
    'bg-amber-400 text-zinc-950',
    'bg-zinc-950 text-white',
    'bg-[#16777d] text-white',
    'bg-rose-600 text-white',
];

/* Tema warna kartu voucher — tiap promo berbeda agar tidak monoton */
const PROMO_THEMES = [
    { band: 'from-sky-500 to-blue-600', soft: 'bg-sky-50 text-sky-700', glow: 'bg-sky-400' },
    { band: 'from-fuchsia-500 to-purple-600', soft: 'bg-fuchsia-50 text-fuchsia-700', glow: 'bg-fuchsia-400' },
    { band: 'from-rose-500 to-orange-500', soft: 'bg-rose-50 text-rose-700', glow: 'bg-rose-400' },
    { band: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50 text-emerald-700', glow: 'bg-emerald-400' },
];

/* Status buka/tutup per park — dihitung dari jam lokal pengunjung. */
function parkStatus(park, now = new Date()) {
    const toMin = (t) => {
        if (!t) return null;
        const [h, m] = String(t).split(':');
        const hh = Number(h);
        const mm = Number(m) || 0;
        if (Number.isNaN(hh)) return null;
        return hh * 60 + mm;
    };
    const open = toMin(park.open_time);
    const close = toMin(park.close_time);
    if (open == null || close == null) return { isOpen: true, label: 'Buka setiap hari' };

    const cur = now.getHours() * 60 + now.getMinutes();
    const bt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}.${String(t % 60).padStart(2, '0')}`;
    if (cur >= open && cur < close) {
        return { isOpen: true, label: `Buka sekarang · tutup ${bt(close)} WIB` };
    }
    return { isOpen: false, label: `Tutup · buka ${bt(open)} WIB` };
}

/* =========================================================================
   HOOK & KOMPONEN INTERAKSI
========================================================================= */

/* Scroll-spy: highlight link navbar yang section-nya sedang terlihat. */
function useScrollSpy(ids = []) {
    const [active, setActive] = useState('');
    const key = ids.join('|');

    useEffect(() => {
        if (!key) return undefined;
        const sections = key.split('|').map((id) => document.getElementById(id)).filter(Boolean);
        if (!sections.length) return undefined;

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: '-40% 0px -55% 0px' }
        );
        sections.forEach((s) => obs.observe(s));
        return () => obs.disconnect();
    }, [key]);

    return active;
}

/* Posisi scroll: dipakai untuk garis navbar & tombol kembali ke atas. */
function useScrolled(threshold = 24) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);
    return scrolled;
}

/* =========================================================================
   GALERI — slider sorotan pameran: 3D COVERFLOW (fisika persis contoh.tsx)
   - zIndex, x, y, scale, rotateY, rotateZ, opacity, filter, shadow SEMUA di
     dalam animate={} (framer menerapkan zIndex instan per state)
   - Spring 270/26/0.85, kartu samping miring rotateY ±20° + brightness turun
   - Kartu tengah: drag/swipe (threshold 45px / velocity 280), hover pop
   - Autoplay 4.5s pause saat hover, keyboard ←/→, klik kartu samping fokus
   Logika bisnis tetap: CTA kartu tengah → /tickets?park_id=...
========================================================================= */
function GallerySlider({ parks = [] }) {
    const slides = [
        {
            tag: 'Sekarang tayang',
            title: 'Instalasi Cahaya Kristal',
            desc: 'Galeri pameran seni rupa modern & kubah proyeksi 360°.',
            image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80',
            parkId: parks[1]?.id || parks[0]?.id || '',
        },
        {
            tag: 'Taman seru',
            title: 'Wahana Tematik Turnstile Resmi',
            desc: 'Kuota gerbang dicek real-time — tiket QR terbit instan.',
            image: '/images/rollercoaster.png',
            parkId: parks[0]?.id || '',
        },
        {
            tag: 'Ruang putih',
            title: 'Galeri Seni Rupa Terkurasi',
            desc: 'Karya kontemporer lintas medium dalam ruang pamer terbuka.',
            image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1600&q=80',
            parkId: parks[1]?.id || parks[0]?.id || '',
        },
    ];

    const total = slides.length;
    const [currentIndex, setCurrentIndex] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const [userHold, setUserHold] = useState(false);
    const [reducedMotion] = useState(prefersReducedMotion);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 680);

    /* Responsif: recompute offset saat resize (pola contoh.tsx) */
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 680);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + total) % total);
    }, [total]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
    }, [total]);

    /* Hold autoplay: matikan sementara saat pengguna berinteraksi (klik, drag,
       keyboard, dots) — hidup kembali sendiri setelah 5 detik tanpa aktivitas */
    const holdTimerRef = useRef(null);

    const holdAutoplay = useCallback(() => {
        setUserHold(true);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        holdTimerRef.current = setTimeout(() => setUserHold(false), 5000);
    }, []);

    /* Bersihkan timer hold saat komponen unmount */
    useEffect(() => () => clearTimeout(holdTimerRef.current), []);

    /* Autoplay 4.5s — pause saat hover/focus ATAU saat pengguna baru saja
       berinteraksi; hormati reduced-motion */
    useEffect(() => {
        if (isPaused || userHold || reducedMotion || total <= 1) return undefined;
        const timer = setInterval(handleNext, 4500);
        return () => clearInterval(timer);
    }, [isPaused, userHold, reducedMotion, total, handleNext]);

    /* Keyboard navigation (window-level, pola contoh.tsx) */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                holdAutoplay();
                handlePrev();
            }
            if (e.key === 'ArrowRight') {
                holdAutoplay();
                handleNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrev, handleNext, holdAutoplay]);

    /* Offset kartu terhadap kartu tengah: -1 kiri, 0 tengah, 1 kanan */
    const getCardOffset = (index) => {
        if (total === 0) return 0;
        let diff = (index - currentIndex) % total;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;
        return diff;
    };

    const handleCardClick = (diff) => {
        holdAutoplay();
        if (diff === -1) handlePrev();
        else if (diff === 1) handleNext();
    };

    /* Nama park untuk chip caption — fallback ke brand Vurasi */
    const parkName = (slide) => parks.find((p) => String(p.id) === String(slide.parkId))?.name || 'Vurasi ★';

    /* Koordinat dinamis + "pencahayaan" 3D — kartu portrait polaroid:
       area foto besar + caption bar di bawah, ukuran lebih tinggi */
    const cardW = isMobile ? 300 : 540;
    const cardH = isMobile ? 330 : 460;
    const getMotionAnimation = (diff) => {
        const offsetDistance = isMobile ? 210 : 360;

        if (diff === 0) {
            return {
                x: 0,
                y: 0,
                scale: 1.06,
                rotateY: 0,
                rotateZ: 0,
                zIndex: 30,
                opacity: 1,
                filter: 'brightness(1) blur(0px)',
                boxShadow: '0 26px 55px -18px rgba(24, 24, 27, 0.4)',
            };
        }

        if (diff === -1) {
            return {
                x: -offsetDistance,
                y: 4,
                scale: 0.84,
                rotateY: isMobile ? 14 : 20,
                rotateZ: -1.5,
                zIndex: 15,
                opacity: 0.82,
                filter: 'brightness(0.78) blur(0.4px)',
                boxShadow: '0 14px 30px -12px rgba(24, 24, 27, 0.3)',
            };
        }

        return {
            x: offsetDistance,
            y: 4,
            scale: 0.84,
            rotateY: isMobile ? -14 : -20,
            rotateZ: 1.5,
            zIndex: 15,
            opacity: 0.82,
            filter: 'brightness(0.78) blur(0.4px)',
            boxShadow: '0 14px 34px -8px rgba(0, 0, 0, 0.35)',
        };
    };

    return (
        <section id="galeri" aria-label="Sorotan pameran" className="relative scroll-mt-24 overflow-hidden pb-16 pt-6 sm:pb-24">
            {/* Latar dekoratif: dot grid + blob lembut — serasi hero maskot */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="dots-bg-light absolute inset-0" />
                <div className="absolute -left-28 top-24 h-[24rem] w-[24rem] rounded-full bg-[#62C6EA]/15 blur-3xl" />
                <div className="absolute -right-32 bottom-8 h-[22rem] w-[22rem] rounded-full bg-orange-300/15 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6">
                {/* Kepala section — badge stiker + judul Anton + coretan squiggle */}
                <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#18181b]">
                            <IconTicket className="h-3.5 w-3.5" />
                            &sect; 00 — Sorotan
                        </span>
                        <h2 className="mt-4 font-anton text-4xl uppercase leading-[0.95] text-zinc-950 sm:text-6xl">
                            <span className="stroke-word">Dalam</span> Bingkai
                        </h2>
                        <motion.svg viewBox="0 0 220 22" aria-hidden="true" className="mt-3 h-5 w-44 text-orange-600" fill="none">
                            <motion.path
                                d="M3 14C27 3 50 3 74 12c24 9 48 9 72 0s48-9 71 0"
                                stroke="currentColor"
                                strokeWidth="5"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 1, ease: EASE, delay: 0.2 }}
                            />
                        </motion.svg>
                    </div>
                </div>
            </div>

            {/* Panggung coverflow — satu perspective induk, zIndex antar kartu valid */}
            <div
                aria-roledescription="carousel"
                aria-label="Slider sorotan destinasi"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                className="relative w-full overflow-hidden"
                style={{
                    height: isMobile ? 410 : 560,
                    perspective: 1200,
                }}
            >
                {slides.map((s, index) => {
                    const diff = getCardOffset(index);
                    const isCenter = diff === 0;
                    const anim = getMotionAnimation(diff);

                    return (
                        <motion.article
                            key={s.title}
                            initial={false}
                            animate={anim}
                            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 270, damping: 26, mass: 0.85 }}
                            whileHover={
                                isCenter
                                    ? { scale: 1.11, y: -6, transition: { duration: 0.25 } }
                                    : { scale: 0.88, filter: 'brightness(0.95)', transition: { duration: 0.25 } }
                            }
                            whileTap={{ scale: isCenter ? 1.04 : 0.8 }}
                            drag={isCenter && !reducedMotion ? 'x' : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.22}
                            onDragEnd={(_, { offset, velocity }) => {
                                holdAutoplay();
                                if (offset.x < -45 || velocity.x < -280) handleNext();
                                else if (offset.x > 45 || velocity.x > 280) handlePrev();
                            }}
                            onClick={() => handleCardClick(diff)}
                            role="button"
                            tabIndex={isCenter ? 0 : -1}
                            aria-label={s.title + (isCenter ? ' — Sedang Dipilih' : ' — Klik untuk memilih')}
                            className={'absolute flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-zinc-900 bg-white p-2.5 select-none ' + (isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer')}
                            style={{
                                left: '50%',
                                top: '50%',
                                width: cardW,
                                height: cardH,
                                marginLeft: -cardW / 2,
                                marginTop: -cardH / 2,
                            }}
                        >
                            {/* Area foto polaroid — zoom lembut saat hover */}
                            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-[1.1rem] bg-zinc-100">
                                <img
                                    src={s.image}
                                    alt={isCenter ? 'Sorotan: ' + s.title : ''}
                                    width="1600"
                                    height="1200"
                                    draggable="false"
                                    className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                                />

                                {/* Badge "Sedang Tayang" — stiker, hanya kartu tengah */}
                                {isCenter && (
                                    <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-[2px_2px_0_#18181b] sm:left-4 sm:top-4 sm:px-3.5 sm:py-1.5 sm:text-[11px]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                                        {s.tag}
                                    </span>
                                )}
                            </div>

                            {/* Caption polaroid — judul + chip park + deskripsi/CTA */}
                            <div className="shrink-0 px-2.5 pb-1.5 pt-3.5">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className={'truncate font-anton uppercase leading-none text-zinc-950 ' + (isCenter ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg')}>
                                        {s.title}
                                    </h3>
                                    <span className="shrink-0 rounded-full bg-zinc-950 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white sm:text-[10px]">
                                        {parkName(s)}
                                    </span>
                                </div>
                                {isCenter ? (
                                    <>
                                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 sm:text-sm">{s.desc}</p>
                                        <Link
                                            href={'/tickets?park_id=' + s.parkId}
                                            className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#18181b] transition-all hover:scale-[1.04] hover:bg-orange-500 active:scale-95 cursor-pointer"
                                        >
                                            Lihat &amp; Pesan
                                            <IconArrowRight className="h-4 w-4" />
                                        </Link>
                                    </>
                                ) : (
                                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 italic">
                                        {s.tag}
                                    </p>
                                )}
                            </div>
                        </motion.article>
                    );
                })}
            </div>

            {/* Kontrol: tombol bundar spring (pola contoh.tsx) + dots */}
            <div className="mt-6 flex items-center justify-center gap-5">
                <motion.button
                    type="button"
                    onClick={() => {
                        holdAutoplay();
                        handlePrev();
                    }}
                    whileHover={{ scale: 1.12, backgroundColor: '#EA580C', color: '#ffffff' }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    aria-label="Slide sebelumnya"
                    className="grid h-11 w-11 place-items-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-[3px_3px_0_#18181b] cursor-pointer"
                >
                    <IconChevronL className="h-5 w-5" />
                </motion.button>
                <div className="flex items-center gap-1.5">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                holdAutoplay();
                                setCurrentIndex(i);
                            }}
                            aria-label={'Tampilkan slide ' + (i + 1)}
                            aria-current={i === currentIndex}
                            className={'h-2.5 cursor-pointer rounded-full transition-all duration-300 ' + (i === currentIndex ? 'w-8 bg-orange-600' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400')}
                        />
                    ))}
                </div>
                <motion.button
                    type="button"
                    onClick={() => {
                        holdAutoplay();
                        handleNext();
                    }}
                    whileHover={{ scale: 1.12, backgroundColor: '#EA580C', color: '#ffffff' }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    aria-label="Slide berikutnya"
                    className="grid h-11 w-11 place-items-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-[3px_3px_0_#18181b] cursor-pointer"
                >
                    <IconChevronR className="h-5 w-5" />
                </motion.button>
            </div>
        </section>
    );
}






/* =========================================================================
   PEMBATAS SECTION — perforasi tiket: garis putus-putus + asterisk berputar
========================================================================= */
function SectionDivider({ label = 'Vurasi*' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-hidden="true"
            className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-8 sm:gap-4 sm:px-5 sm:py-10 lg:px-6"
        >
            <span className="h-px flex-1 border-t-2 border-dashed border-zinc-300" />
            <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-zinc-900 bg-zinc-50 text-base leading-none text-orange-600"
            >
                &#10035;
            </motion.span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-400 sm:block">
                {label}
            </span>
            <span className="h-px flex-1 border-t-2 border-dashed border-zinc-300" />
        </motion.div>
    );
}

/* =========================================================================
   ANGKA STATISTIK — count-up memakai animate() dari framer-motion.
   Catatan: MotionConfig reducedMotion="user" hanya mematikan animasi
   transform, sedangkan animate() JS tetap berjalan — makanya
   reduced-motion dicek manual dan nilainya langsung ditampilkan penuh.
========================================================================= */
function StatNumber({ value }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const target = Number.isFinite(value) ? value : 0;

        if (prefersReducedMotion()) {
            el.textContent = fmtID.format(target);
            return undefined;
        }

        const controls = animate(0, target, {
            duration: 1.5,
            ease: EASE,
            delay: 0.9,
            onUpdate: (v) => {
                el.textContent = fmtID.format(Math.round(v));
            },
        });
        return () => controls.stop();
    }, [value]);

    return <dd ref={ref} className="text-2xl font-black leading-none text-[#B8340E] sm:text-4xl">0</dd>;
}

/* =========================================================================
   KOMPONEN UTAMA
========================================================================= */
export default function Welcome({ parks = [], promotions = [], today, auth = {} }) {
    const [lookupModalOpen, setLookupModalOpen] = useState(false);
    const [allPromoModalOpen, setAllPromoModalOpen] = useState(false);
    const [detailPromo, setDetailPromo] = useState(null);
    const [marqueePaused, setMarqueePaused] = useState(false);
    const [failedPromoImages, setFailedPromoImages] = useState([]);

    // Filter promo: kupon global (park_id null / tanpa batasan park tertentu)
    const globalPromotions = promotions.filter((p) => !p.park_id);
    // Promo spesial = hanya global. Diskon & Kupon Eksklusif = hanya yang terikat park.
    const parkPromotions = promotions.filter((p) => p.park_id);

    // Foto suasana untuk marquee: HANYA dari destinasi park dan detail wahananya saja (tanpa foto dummy/statis)
    const vibePhotos = useMemo(() => {
        const parkPhotos = parks
            .filter((p) => p.image_url)
            .map((p) => ({
                caption: p.name,
                image: p.image_url,
                subCaption: p.city || 'Destinasi',
            }));

        const attractionPhotos = parks.flatMap((p) =>
            (p.attractions || [])
                .filter((a) => a.image_url)
                .map((a) => ({
                    caption: `${a.name} — ${p.name}`,
                    image: a.image_url,
                    subCaption: p.name,
                }))
        );

        return [...parkPhotos, ...attractionPhotos];
    }, [parks]);
    const marqueeRowA = vibePhotos;

    // Interaktivitas global
    const scrolled = useScrolled(16);
    const user = auth?.user;
    // Navbar: satu sumber kebenaran — sama persis dengan halaman lain
    const navItems = NAV_SECTIONS;
    const activeSection = useScrollSpy(navItems.map((n) => n.id));

    // Copy kode promo
    const [copiedCode, setCopiedCode] = useState(null);
    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            /* clipboard opsional — feedback tetap ditampilkan */
        }
        setCopiedCode(code);
        setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    };

    // Progress scroll pada hero + lajur kartu destinasi
    const heroRef = useRef(null);
    const { scrollYProgress: heroProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    const trackRef = useRef(null);

    const scrollCards = (dir) => {
        const el = trackRef.current;
        if (!el) return;
        const firstCard = el.querySelector('article');
        const step = firstCard ? firstCard.offsetWidth + 24 : 400;
        el.scrollBy({ left: dir * step, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };

    /* Lajur mini banner promo — sekali geser menampilkan 3 kartu (desktop),
       2 di tablet, 1 di ponsel. Pola sama seperti "Jelajahi Galeri". */
    const promoTrackRef = useRef(null);

    const scrollPromos = (dir) => {
        const el = promoTrackRef.current;
        if (!el) return;
        const card = el.querySelector('[data-promo-card]');
        if (!card) return;
        const perView = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
        const step = (card.offsetWidth + 24) * perView; // gap-6 = 24px
        el.scrollBy({ left: dir * step, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };

    // Agregat utk baris statistik hero
    const totalZones = parks.reduce((a, p) => a + (p.total_zones || 0), 0);
    const totalAttractions = parks.reduce((a, p) => a + (p.total_attractions || 0), 0);
    const startFrom = Math.min(...[...parks.map((p) => p.min_price || 75000), 75000]);

    const marqueeItems = [
        'E-Tiket QR Code terbit instan, tanpa cetak fisik',
        'Kuota gerbang dicek real-time saat pemesanan',
        'Refund & reschedule hingga H-1 kunjungan',
        'Pembayaran QRIS, Virtual Account, dan e-wallet',
        'Semua park & galeri dalam satu akun',
    ];

    /* ===== Parallax mouse multi-lapis untuk hero =====
       Posisi kursor dinormalisasi ke [-1, 1], lalu di-spring dan diubah menjadi
       4 pasang translat berbeda kecepatan — lapisan jauh bergerak serempak
       kursor, lapisan tengah/maskot/pill bergerak berlawanan dengan intensitas
       berbeda sehingga tercipta kedalaman. Reduced-motion: handler return early,
       jadi nilai tetap 0 dan tidak ada gerakan sama sekali. */
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springX = useSpring(pointerX, { stiffness: 55, damping: 16, mass: 0.7 });
    const springY = useSpring(pointerY, { stiffness: 55, damping: 16, mass: 0.7 });

    const farX = useTransform(springX, [-1, 1], [-24, 24]);
    const farY = useTransform(springY, [-1, 1], [-16, 16]);
    const midX = useTransform(springX, [-1, 1], [12, -12]);
    const midY = useTransform(springY, [-1, 1], [8, -8]);
    const mascotX = useTransform(springX, [-1, 1], [-18, 18]);
    const mascotY = useTransform(springY, [-1, 1], [-12, 12]);
    const pillX = useTransform(springX, [-1, 1], [9, -9]);
    const pillY = useTransform(springY, [-1, 1], [6, -6]);

    const handleHeroPointer = (e) => {
        if (prefersReducedMotion()) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
        pointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const resetHeroPointer = () => {
        pointerX.set(0);
        pointerY.set(0);
    };

    return (
        <MotionConfig reducedMotion="user">
        <div className="vurasi min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
            <Head title="Vurasi Pameran Seni — Paviliun Seni & Cahaya" />

            {/* Skip link (aksesibilitas) */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
            >
                Lewati ke konten utama
            </a>

            {/* ================= 1. HEADER — pill navbar melayang (SiteNavbar) ================= */}
            <SiteNavbar
                links={navItems.map((item) => ({
                    label: item.label,
                    href: item.anchor ?? item.href ?? `#${item.id}`,
                    active: Boolean(item.anchor || !item.href) && activeSection === item.id,
                }))}
                onCekPesanan={() => setLookupModalOpen(true)}
            />

            <main id="main">
                {/* ================= 2. HERO — full layar: judul, maskot, pencarian ================= */}
                <section
                    ref={heroRef}
                    aria-label="Pengantar Vurasi"
                    onMouseMove={handleHeroPointer}
                    onMouseLeave={resetHeroPointer}
                    className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#fffaf2] pt-20 text-zinc-900 sm:pt-24"
                >
                    {/* Latar: dot pattern, blob hangat, tiket & kilau melayang */}
                    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
                        <div className="dots-bg-light absolute inset-0 opacity-40" />
                        <div className="absolute -right-20 top-10 h-[30rem] w-[30rem] rounded-full bg-orange-200/25 blur-3xl" />
                    </div>
                    <motion.div style={{ x: midX, y: midY }} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
                        <motion.div
                            animate={{ y: [0, -12, 0], rotate: -14 }}
                            transition={{ duration: 4.6, ease: 'easeInOut', repeat: Infinity }}
                            className="absolute left-[5%] top-[18%] hidden sm:block"
                        >
                            <TicketDeco className="h-12 w-12" />
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 10, 0], rotate: 18 }}
                            transition={{ duration: 5.2, ease: 'easeInOut', repeat: Infinity, delay: 0.8 }}
                            className="absolute right-[6%] top-[20%] hidden lg:block"
                        >
                            <TicketDeco className="h-10 w-10" />
                        </motion.div>
                        <motion.span
                            animate={{ scale: [0.7, 1, 0.7], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                            className="absolute left-[42%] top-[16%] text-orange-500"
                        >
                            <Sparkle className="h-6 w-6" />
                        </motion.span>
                    </motion.div>

                    <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-3 sm:px-5 lg:px-6">
                        {/* Baris utama: judul + maskot */}
                        <div className="grid items-center gap-4 py-4 sm:gap-8 sm:py-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4">
                            {/* Kiri: judul besar hitam + oranye */}
                            <div className="text-center lg:text-left">
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
                                    className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-700"
                                >
                                    Satu Tempat, Banyak Keseruan
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 26 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
                                    className="mt-6 font-anton text-6xl uppercase leading-[0.92] tracking-[0.01em] text-[rgb(140,71,24)] sm:text-7xl lg:text-7xl xl:text-8xl"
                                >
                                    Mau main<br />
                                    <span className="text-[#B8340E]">ke mana hari ini?</span>
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, ease: EASE, delay: 0.38 }}
                                    className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 sm:text-xl lg:mx-0"
                                >
                                    Temukan berbagai park seru, pilih destinasi favoritmu, dan beli tiketnya dalam satu tempat.
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, ease: EASE, delay: 0.48 }}
                                    className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-zinc-500 lg:mx-0"
                                >
                                    Dari rencana spontan sampai liburan keluarga.
                                </motion.p>
                            </div>

                            {/* Kanan: maskot Vurasi — elemen utama */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
                                style={{ x: mascotX, y: mascotY }}
                                className="relative mx-auto w-56 sm:w-80 lg:w-full lg:max-w-[35rem]"
                            >
                                {/* Blob oranye brand di belakang maskot */}
                                <div className="mascot-blob absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-[46%] bg-[#EA580C]/50" aria-hidden="true" />
                                <div className="mascot-blob mascot-blob-slow absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-[46%] border-2 border-[#EA580C]/45 bg-orange-100/30" aria-hidden="true" />
                                {/* Maskot & bayangannya bergerak sinkron supaya tidak terlihat melayang */}
                                <motion.img
                                    src="/images/maskot-vurasi.png"
                                    alt="Maskot Vurasi — kucing oranye berseragam melambai tangan"
                                    width="1024"
                                    height="1024"
                                    draggable="false"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
                                    className="relative z-10 w-full select-none drop-shadow-[0_12px_18px_rgba(15,23,42,0.14)]"
                                />
                                <motion.div
                                    aria-hidden="true"
                                    animate={{ y: [0, -3, 0], scaleX: [1, 0.9, 1] }}
                                    transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
                                    className="relative z-0 mx-auto -mt-12 h-3.5 w-2/3 rounded-[50%] bg-zinc-900/25 blur-[4px]"
                                />
                            </motion.div>
                        </div>



                        <HeroSearchTicket parks={parks} today={today} />

                    </div>

                    {/* Progress mengikuti scroll pada hero */}
                    <motion.div
                        aria-hidden="true"
                        style={{ scaleX: heroProgress }}
                        className="absolute inset-x-0 bottom-0 z-20 h-1 origin-left bg-gradient-to-r from-[#B8340E] to-orange-400"
                    />

                    {/* Petunjuk scroll ke bawah */}
                    <motion.a
                        href="#promo-mini"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2, ease: EASE }}
                        className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-[#B8340E] sm:flex"
                    >
                        Lihat promo
                        <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                            <IconChevronDown className="h-4 w-4" />
                        </motion.span>
                    </motion.a>
                </section>
               
                {/* ================= 3. MINI BANNER PROMO — khusus promo global, 3 per baris ================= */}
                {globalPromotions.length > 0 && (
                    <section id="promo-mini" aria-label="Promo spesial" className="relative scroll-mt-24 overflow-hidden bg-white py-14 sm:py-20">
                        {/* Latar dekoratif: dot grid + blob lembut — serasi hero */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="dots-bg-light absolute inset-0 opacity-70" />
                            <div className="absolute -left-28 top-8 h-[22rem] w-[22rem] rounded-full bg-[#62C6EA]/15 blur-3xl" />
                            <div className="absolute -right-28 bottom-0 h-[20rem] w-[20rem] rounded-full bg-orange-300/15 blur-3xl" />
                        </div>

                        <div className="relative mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6">
                            {/* Kepala section — badge stiker + judul Anton + coretan squiggle */}
                            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-lg shadow-rose-500/30">
                                        <IconGift className="h-4 w-4" />
                                        Promo Pilihan
                                    </span>
                                    <h2 className="mt-4 font-anton text-5xl uppercase leading-[0.95] text-zinc-950 sm:text-6xl">
                                        Promo <span className="stroke-word">Spesial</span>
                                    </h2>
                                    <motion.svg viewBox="0 0 220 22" aria-hidden="true" className="mt-3 h-5 w-44 text-orange-600" fill="none">
                                        <motion.path
                                            d="M3 14C27 3 50 3 74 12c24 9 48 9 72 0s48-9 71 0"
                                            stroke="currentColor"
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            viewport={{ once: true, margin: '-60px' }}
                                            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
                                        />
                                    </motion.svg>
                                    <p className="mt-3 max-w-lg text-sm text-zinc-500">
                                        Kupon pilihan untuk hemat lebih banyak — geser lajur untuk melihat promo lainnya.
                                    </p>
                                </div>

                                {/* Kontrol geser ‹ › */}
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={() => scrollPromos(-1)}
                                        whileHover={{ scale: 1.12, backgroundColor: '#EA580C', color: '#ffffff' }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        aria-label="Geser promo ke kiri"
                                        className="grid h-11 w-11 place-items-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-[3px_3px_0_#18181b] cursor-pointer"
                                    >
                                        <IconChevronL className="h-5 w-5" />
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        onClick={() => scrollPromos(1)}
                                        whileHover={{ scale: 1.12, backgroundColor: '#EA580C', color: '#ffffff' }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        aria-label="Geser promo ke kanan"
                                        className="grid h-11 w-11 place-items-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-[3px_3px_0_#18181b] cursor-pointer"
                                    >
                                        <IconChevronR className="h-5 w-5" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Lajur mini banner — 3 promo per baris di desktop, bergeser per 3 kartu */}
                            <div ref={promoTrackRef} className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3">
                                {globalPromotions.map((promo, idx) => {
                                    const discountLabel =
                                        promo.discount_type === 'PERCENTAGE'
                                            ? `${promo.discount_value}%`
                                            : `Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`;
                                    const validUntil = promo.valid_until
                                        ? new Date(promo.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : null;
                                    const theme = PROMO_THEMES[idx % PROMO_THEMES.length];
                                    const hasImage = Boolean(promo.image_url) && !failedPromoImages.includes(promo.id);
                                    const promoHref = promo.park_id ? `/tickets?park_id=${promo.park_id}` : '/tickets';

                                    // Kartu bergambar: header teks promo + diskon, foto di bawahnya dipotong (tidak tampil utuh).
                                    if (hasImage) {
                                        return (
                                            <motion.article
                                                key={promo.id}
                                                data-promo-card
                                                initial={{ opacity: 0, y: 24 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, amount: 0.2 }}
                                                transition={{ duration: 0.45, delay: (idx % 3) * 0.08, ease: EASE }}
                                                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                                className="group w-full shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.4)] ring-1 ring-zinc-900/10 sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                                            >
                                                <Link href={promoHref} aria-label={`Lihat promo ${promo.code}`} className="block">
                                                    <div className="h-[200px] overflow-hidden bg-zinc-100 sm:h-[212px]">
                                                        <img
                                                            src={promo.image_url}
                                                            alt={`Promo ${promo.code}`}
                                                            width="1200"
                                                            height="900"
                                                            loading="lazy"
                                                            className="h-full w-full scale-110 object-cover object-center transition-transform duration-500 group-hover:scale-125"
                                                            onError={() => setFailedPromoImages((ids) => [...new Set([...ids, promo.id])])}
                                                        />
                                                    </div>
                                                </Link>

                                                <div className="p-5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className="text-lg font-extrabold leading-tight text-zinc-900">
                                                                {promo.discount_type === 'PERCENTAGE' ? 'Potongan harga spesial' : 'Potongan langsung'}
                                                            </h3>
                                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${theme.soft}`}>
                                                                Hot Deal
                                                            </span>
                                                        </div>
                                                        <p className="mt-1.5 text-sm text-zinc-500">
                                                            Min. transaksi <span className="font-bold text-zinc-700">{rupiah(promo.min_order_amount)}</span>
                                                        </p>

                                                        <div className="mt-5 flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => copyCode(promo.code)}
                                                                aria-label={`Salin kode promo ${promo.code}`}
                                                                className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 px-3 transition-colors hover:border-sky-500 cursor-pointer"
                                                            >
                                                                <span className={`truncate font-mono text-xs font-bold tracking-[0.15em] ${copiedCode === promo.code ? 'text-emerald-600' : 'text-zinc-900'}`}>
                                                                    {copiedCode === promo.code ? 'Tersalin!' : promo.code}
                                                                </span>
                                                                <IconCopy className={`h-4 w-4 shrink-0 ${copiedCode === promo.code ? 'text-emerald-600' : 'text-sky-600'}`} />
                                                            </button>
                                                            <Link
                                                                href={promoHref}
                                                                className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-sky-600/25 transition-colors hover:bg-sky-700 cursor-pointer"
                                                            >
                                                                Pakai
                                                                <IconArrowRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </div>
                                                </div>
                                            </motion.article>
                                        );
                                    }

                                    return (
                                        <motion.article
                                            key={promo.id}
                                            data-promo-card
                                            initial={{ opacity: 0, y: 24 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                            transition={{ duration: 0.45, delay: (idx % 3) * 0.08, ease: EASE }}
                                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                            className="group relative flex w-full shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.4)] ring-1 ring-zinc-900/10 sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                                        >
                                            {/* Header gradasi / Banner promo — voucher diskon */}
                                            <div className={`relative h-[200px] overflow-hidden bg-gradient-to-br ${theme.band} p-5 pb-8 text-white sm:h-[212px]`}>
                                                <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border-[16px] border-white/10" aria-hidden="true" />
                                                <div
                                                    className="absolute inset-0 opacity-[0.13]"
                                                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 10px)' }}
                                                    aria-hidden="true"
                                                />
                                                <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-xl" aria-hidden="true" />

                                                <div className="relative flex items-start justify-between gap-3">
                                                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-sm">
                                                        {promo.park_id ? promo.park?.name || 'Promo Park' : 'Promo Global'}
                                                    </span>
                                                    <motion.div
                                                        aria-hidden="true"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
                                                        className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-dashed border-white/60 bg-white/10 text-xl"
                                                    >
                                                        &#10035;
                                                    </motion.div>
                                                </div>

                                                <div className="relative mt-5 flex items-end gap-2">
                                                    <span className="font-anton text-5xl leading-none drop-shadow-sm sm:text-6xl">
                                                        {discountLabel}
                                                    </span>
                                                    <span className="pb-1 text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">
                                                        Diskon
                                                    </span>
                                                </div>
                                                {validUntil && (
                                                    <p className="relative mt-2 text-xs font-semibold text-white/80">Berlaku s.d. {validUntil}</p>
                                                )}
                                            </div>

                                            {/* Pemisah perforasi tiket */}
                                            <div className="relative mx-4">
                                                <div className="border-t-2 border-dashed border-zinc-200" />
                                                <span className="absolute -left-6 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white ring-1 ring-zinc-200" aria-hidden="true" />
                                                <span className="absolute -right-6 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white ring-1 ring-zinc-200" aria-hidden="true" />
                                            </div>

                                            {/* Badan voucher */}
                                            <div className="flex flex-1 flex-col p-5 pt-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-lg font-extrabold leading-tight text-zinc-900">
                                                        {promo.discount_type === 'PERCENTAGE' ? 'Potongan harga spesial' : 'Potongan langsung'}
                                                    </h3>
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${theme.soft}`}>
                                                        Hot Deal
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-sm text-zinc-500">
                                                    Min. transaksi <span className="font-bold text-zinc-700">{rupiah(promo.min_order_amount)}</span>
                                                </p>

                                                <div className="mt-5 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(promo.code)}
                                                        aria-label={`Salin kode promo ${promo.code}`}
                                                        className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 px-3 transition-colors hover:border-sky-500 cursor-pointer"
                                                    >
                                                        <span className={`truncate font-mono text-xs font-bold tracking-[0.15em] ${copiedCode === promo.code ? 'text-emerald-600' : 'text-zinc-900'}`}>
                                                            {copiedCode === promo.code ? 'Tersalin!' : promo.code}
                                                        </span>
                                                        <IconCopy className={`h-4 w-4 shrink-0 ${copiedCode === promo.code ? 'text-emerald-600' : 'text-sky-600'}`} />
                                                    </button>
                                                    <Link
                                                        href={promo.park_id ? `/tickets?park_id=${promo.park_id}` : '/tickets'}
                                                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-sky-600/25 transition-colors hover:bg-sky-700 cursor-pointer"
                                                    >
                                                        Pakai
                                                        <IconArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
 {/* ================= 4b. MARQUEE FOTO — pita suasana setelah hero ================= */}
                {vibePhotos.length > 0 && (
                    <section id="suasana" aria-label="Suasana dan keseruan nyata" className="relative scroll-mt-24 overflow-hidden border-y-2 border-zinc-950 bg-[#fffbf2] pb-12 pt-16 text-zinc-900 sm:pb-16 sm:pt-20">
                        {/* Latar dekoratif: dot grid + blob hangat */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="dots-bg-light absolute inset-0 opacity-45" />
                            <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
                            <div className="absolute -right-20 top-1/2 h-72 w-72 rounded-full bg-[#62C6EA]/20 blur-3xl" />
                        </div>

                        {/* Kepala Section */}
                        <div className="relative mx-auto mb-8 flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-3 sm:px-5 lg:px-6">
                            {/* Kiri: badge + judul Anton + deskripsi */}
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#18181b]">
                                    <IconCamera className="h-3.5 w-3.5" />
                                    Potret Park &amp; Wahana Resmi
                                </span>
                                <h2 className="mt-3 font-anton text-4xl uppercase tracking-[0.02em] text-zinc-950 sm:text-5xl lg:text-6xl">
                                    Momen Nyata, <span className="text-orange-600">Seru</span> Dari Dekat
                                </h2>
                                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                                    Intip suasana asli dari tiap destinasi park dan detail wahana resmi yang siap kamu jelajahi.
                                </p>
                            </div>

                            {/* Kanan: status jumlah potret asli + kontrol jeda */}
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-900 shadow-[3px_3px_0_#18181b]">
                                    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    </span>
                                    <span>{vibePhotos.length} Potret Wahana &amp; Park</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setMarqueePaused((prev) => !prev)}
                                    aria-label={marqueePaused ? 'Lanjutkan putaran foto' : 'Jeda putaran foto'}
                                    className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-900 shadow-[3px_3px_0_#18181b] transition-all hover:bg-orange-600 hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#18181b] cursor-pointer"
                                >
                                    {marqueePaused ? (
                                        <>
                                            <IconPlay className="h-3.5 w-3.5 fill-current" />
                                            <span>Lanjutkan</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconPause className="h-3.5 w-3.5 fill-current" />
                                            <span>Jeda</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Pita Marquee dengan masker gradasi halus di tepi */}
                        <div className="relative overflow-hidden">
                            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#fffbf2] to-transparent sm:w-28" aria-hidden="true" />
                            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#fffbf2] to-transparent sm:w-28" aria-hidden="true" />

                            <PhotoMarquee items={marqueeRowA} paused={marqueePaused} label="Foto suasana destinasi dan wahana" />
                        </div>

                        {/* Petunjuk interaksi halus di bawah pita */}
                        <div className="mt-4 flex items-center justify-center gap-1.5 px-4 text-center">
                            <IconSparkles className="h-3.5 w-3.5 text-orange-600" />
                            <span className="text-xs font-medium text-zinc-500">
                                Sentuh atau arahkan kursor ke foto untuk melihat lebih dekat (otomatis menjeda)
                            </span>
                        </div>
                    </section>
                )}
                {/* ================= 4. DESTINASI — band cream galeri ================= */}
                <section id="parks" className="scroll-mt-20 bg-[#f5efda] py-16 text-zinc-950 sm:py-24">
                    <div className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6">
                        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">&sect; 01 — Pilihan Kawasan</p>
                                <h2 className="mt-2 font-anton text-4xl uppercase tracking-[0.02em] sm:text-6xl">
                                    Jelajahi <span className="stroke-word">Galeri</span>
                                </h2>
                                <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-600">
                                    Tentukan destinasi favorit Anda — pameran cahaya, seni rupa, atau wahana tematik — dan dapatkan tiket terverifikasi turnstile.
                                </p>
                            </div>
                            <span className="flex items-center gap-2 rounded-full border border-zinc-900/20 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-600">
                                <IconMapPin className="h-4 w-4 text-orange-600" />
                                {parks.length} Destinasi Aktif
                            </span>
                        </div>

                    </div>

                    {/* Lajur kartu destinasi — berbatas pinggir dalam container, geser manual */}
                    <div className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6">
                        {/* Band berbingkai — batas kiri & kanan lajur terlihat jelas */}
                        <div className="rounded-2xl border border-zinc-900/10 bg-white/50 p-4 sm:p-5">
                            <div
                                ref={trackRef}
                                className="no-scrollbar flex gap-5 overflow-x-auto pb-1"
                            >
                                {parks.map((park) => {
                                    const status = parkStatus(park);
                                    return (
                                        <Link
                                            key={park.id}
                                            href={`/parks/${park.id}`}
                                            className="group block w-[260px] shrink-0 overflow-hidden rounded-xl border border-zinc-900/10 bg-white transition-colors duration-300 hover:border-orange-500/60 sm:w-[300px]"
                                        >
                                            {/* Gambar + status buka/tutup */}
                                            <div className="relative overflow-hidden">
                                                <img
                                                    src={park.image_url}
                                                    alt={`Suasana ${park.name}`}
                                                    width="1200"
                                                    height="900"
                                                    loading="lazy"
                                                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                                />
                                                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />
                                                <span
                                                    title={status.label}
                                                    className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-normal uppercase tracking-widest ${
                                                        status.isOpen
                                                            ? 'bg-emerald-600/90 text-emerald-50'
                                                            : 'bg-zinc-950/80 text-zinc-300'
                                                    }`}
                                                >
                                                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? 'bg-emerald-300' : 'bg-zinc-400'}`} />
                                                    {status.isOpen ? 'Buka' : 'Tutup'}
                                                </span>
                                            </div>

                                            {/* Judul + harga — teks normal (tanpa tebal) */}
                                            <div className="flex items-center justify-between gap-3 p-4 pb-2">
                                                <h3 className="min-w-0 truncate text-base text-zinc-950 transition-colors duration-300 group-hover:text-orange-600">
                                                    {park.name}
                                                </h3>
                                                <div className="shrink-0 text-right">
                                                    <span className="block text-[9px] uppercase tracking-[0.2em] text-zinc-400">Mulai dari</span>
                                                    <p className="text-sm text-zinc-950 sm:text-base">{rupiah(park.min_price || 75000)}</p>
                                                </div>
                                            </div>

                                            {/* Jam buka-tutup — label real-time dari parkStatus */}
                                            <p className="flex items-center gap-1.5 px-4 pb-4 text-xs text-zinc-500">
                                                <IconClock className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                                                {status.label}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Kontrol ‹ › */}
                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => scrollCards(-1)}
                                aria-label="Geser kartu ke kiri"
                                className="grid h-11 w-11 place-items-center rounded-full border border-zinc-900/20 bg-white text-zinc-700 transition-colors hover:bg-orange-600 hover:text-white cursor-pointer"
                            >
                                <IconChevronL className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollCards(1)}
                                aria-label="Geser kartu ke kanan"
                                className="grid h-11 w-11 place-items-center rounded-full border border-zinc-900/20 bg-white text-zinc-700 transition-colors hover:bg-orange-600 hover:text-white cursor-pointer"
                            >
                                <IconChevronR className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                </section>
                {/* ================= 5. KUPON & PENAWARAN SPESIAL (TITIK EMAS 2: DI BAWAH KATALOG PARK) ================= */}
                {parkPromotions.length > 0 && (
                    <section id="promo" className="relative scroll-mt-20 overflow-hidden bg-white py-16 sm:py-24">
                        {/* Latar dekoratif: dot grid + blob lembut */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="dots-bg-light absolute inset-0" />
                            <div className="absolute -right-28 top-16 h-[22rem] w-[22rem] rounded-full bg-[#62C6EA]/15 blur-3xl" />
                            <div className="absolute -left-28 bottom-8 h-[20rem] w-[20rem] rounded-full bg-orange-300/15 blur-3xl" />
                        </div>

                        <div className="relative mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-6">
                            {/* Kepala section */}
                            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#18181b]">
                                        <IconTicket className="h-3.5 w-3.5" />
                                        &sect; 03 — Promo &amp; Penawaran Spesial
                                    </span>
                                    <h2 className="mt-4 font-anton text-4xl uppercase leading-[0.95] text-zinc-950 sm:text-6xl">
                                        Diskon &amp; <span className="stroke-word">Kupon Eksklusif</span>
                                    </h2>
                                    <p className="mt-3 max-w-lg text-sm text-zinc-500">
                                        Pilih promo favorit Anda, salin kodenya, atau lihat syarat &amp; ketentuan sebelum melakukan pemesanan.
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-zinc-300" aria-hidden="true">
                                        <span className="text-lg leading-none">&#9986;</span>
                                        <span className="h-px w-44 border-t-2 border-dashed" />
                                    </div>
                                </div>

                                <Link
                                    href="/promotions"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 shadow-[3px_3px_0_#18181b] hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
                                >
                                    <span>Buka Katalog Promo Lengkap</span>
                                    <IconArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Grid Kupon Promo */}
                            <div className="relative">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {parkPromotions.map((promo, idx) => {
                                        const stub = COUPON_DOTS[idx % COUPON_DOTS.length];
                                        const discountLabel =
                                            promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`;
                                        const stubLabel =
                                            promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `${Math.round(promo.discount_value / 1000)}rb`;
                                        const validUntil = promo.valid_until
                                            ? new Date(promo.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : null;

                                        return (
                                            <motion.article
                                                key={promo.id}
                                                data-coupon-card
                                                initial={{ opacity: 0, y: 24 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, amount: 0.2 }}
                                                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                                transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE }}
                                                className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-zinc-900 bg-white shadow-[5px_5px_0_#18181b]"
                                            >
                                                {promo.image_url && (
                                                    <div className="relative h-28 w-full overflow-hidden border-b-2 border-zinc-900 bg-zinc-100">
                                                        <img
                                                            src={promo.image_url}
                                                            alt={promo.code}
                                                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                        <span className="absolute bottom-2 left-3 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                                                            {promo.park_id ? promo.park?.name || 'Khusus Park' : 'Promo Global'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Atas tiket */}
                                                <div className="flex border-b-2 border-dashed border-zinc-900/20">
                                                    <div className={`flex w-24 shrink-0 flex-col items-center justify-center gap-1 ${promo.image_url ? '' : 'rounded-tl-[22px]'} border-r-2 border-dashed border-zinc-950/20 p-3.5 text-center ${stub}`}>
                                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">
                                                            {promo.park_id ? 'Khusus' : 'Global'}
                                                        </span>
                                                        <span className="font-anton text-3xl leading-none">{stubLabel}</span>
                                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">Diskon</span>
                                                    </div>

                                                    <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                                                        <div>
                                                            <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 truncate max-w-full">
                                                                {promo.park?.name || 'Semua Destinasi'}
                                                            </span>
                                                            <h3 className="mt-1 font-bold text-base text-zinc-950">
                                                                Diskon {discountLabel}
                                                            </h3>
                                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                                Min. {rupiah(promo.min_order_amount)}
                                                            </p>
                                                        </div>

                                                        {validUntil && (
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                                                s.d. {validUntil}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bawah tiket */}
                                                <div className="p-4 bg-zinc-50/50 rounded-b-[22px] space-y-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(promo.code)}
                                                        className="flex min-h-[42px] w-full items-center justify-between rounded-xl border-2 border-dashed border-zinc-300 bg-white px-3 transition-colors hover:border-orange-500 cursor-pointer"
                                                    >
                                                        <span className={`font-mono text-xs font-bold tracking-[0.15em] ${copiedCode === promo.code ? 'text-emerald-600' : 'text-zinc-950'}`}>
                                                            {copiedCode === promo.code ? 'Tersalin!' : promo.code}
                                                        </span>
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                                                            {copiedCode === promo.code ? 'OK' : 'Klaim'}
                                                        </span>
                                                    </button>

                                                    <div className="flex items-center justify-between text-xs font-semibold pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDetailPromo(promo)}
                                                            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                                                        >
                                                            <IconInfo className="h-3.5 w-3.5" />
                                                            S&amp;K
                                                        </button>

                                                        <Link
                                                            href={promo.park_id ? `/tickets?park_id=${promo.park_id}` : '/tickets'}
                                                            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-500 font-bold"
                                                        >
                                                            Gunakan
                                                            <IconArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Lubang sobekan di batas border putus-putus */}
                                                <span aria-hidden="true" className="absolute top-[80px] -left-2.5 h-5 w-5 rounded-full border-2 border-zinc-900 bg-white" />
                                                <span aria-hidden="true" className="absolute top-[80px] -right-2.5 h-5 w-5 rounded-full border-2 border-zinc-900 bg-white" />
                                            </motion.article>
                                        );
                                    })}
                                </div>

                                {/* Tombol Aksi Bawah */}
                                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                    <Link
                                        href="/promotions"
                                        className="group inline-flex items-center gap-3 rounded-full border-2 border-zinc-950 bg-orange-600 px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_#18181b] transition-all hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-[6px_6px_0_#18181b] cursor-pointer"
                                    >
                                        <IconTicket className="h-4 w-4" />
                                        <span>Lihat Semua Promo Lengkap ({promotions.length})</span>
                                        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ================= 6. FAQ — band gelap galeri ================= */}
                <section id="faq" className="scroll-mt-20 bg-[#f5efda] py-16 text-zinc-950 sm:py-24">
                    <div className="mx-auto max-w-4xl px-3 sm:px-5 lg:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.55, ease: EASE }}
                            className="mb-10"
                        >
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">&sect; 04 — Bantuan</p>
                            <h2 className="mt-2 font-anton text-4xl uppercase tracking-[0.02em] sm:text-6xl">
                                Pertanyaan <span className="stroke-word">Umum</span>
                            </h2>
                            <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-600">Hal yang sering ditanyakan seputar pemesanan tiket multi-park.</p>
                        </motion.div>

                        <div>
                            {[
                                {
                                    q: 'Apakah satu tiket berlaku untuk semua park?',
                                    a: 'Tidak. Setiap tiket diterbitkan spesifik untuk Theme Park atau Galeri yang Anda pilih saat pemesanan.',
                                },
                                {
                                    q: 'Bagaimana cara mengecek e-tiket yang sudah saya beli?',
                                    a: 'Cukup klik tombol "Cek Pesanan" di bagian atas halaman. Daftar e-tiket milik akun Anda langsung tampil — tanpa perlu memasukkan kode pesanan atau email. Dari sana Anda bisa membuka QR Code tiap tiket.',
                                },
                                {
                                    q: 'Apakah tiket harus dicetak dalam bentuk kertas?',
                                    a: 'Tidak perlu. Cukup tunjukkan E-Tiket berformat Barcode / QR Code langsung dari layar smartphone kepada petugas gerbang turnstile.',
                                },
                                {
                                    q: 'Apakah saya bisa mengajukan refund?',
                                    a: 'Pengembalian dana (refund) dapat diajukan maksimal H-1 sebelum tanggal kedatangan tiket melalui layanan customer care.',
                                },
                            ].map((faq, idx) => (
                                <FaqItem key={idx} faq={faq} idx={idx} defaultOpen={idx === 0} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pembatas: perforasi + asterisk */}
                <SectionDivider label="Sampai Jumpa" />

                {/* ================= FOOTER ================= */}
                <footer id="tentang" className="scroll-mt-20 bg-zinc-950 text-zinc-400">
                    <div className="mx-auto max-w-[1440px] px-3 pb-10 pt-14 sm:px-5 lg:px-6">
                        <img
                            src="/images/vurasi-logo.png"
                            alt=""
                            aria-hidden="true"
                            width="1180"
                            height="490"
                            className="h-14 w-auto select-none opacity-20 sm:h-20"
                        />

                        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white">Tentang Kami</h4>
                                <div className="mt-3 flex items-center gap-2">
                                    <img
                                        src="/images/vurasi-logo.png"
                                        alt="Vurasi"
                                        width="1180"
                                        height="490"
                                        className="h-7 w-auto"
                                    />
                                    <span className="text-sm italic leading-none text-orange-500">paviliun seni</span>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                                    Platform resmi pemesanan tiket multi-park, theme park &amp; galeri pameran seni interaktif Indonesia.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-white">Destinasi</h4>
                                <ul className="mt-3 space-y-2 text-xs">
                                    {parks.map((p) => (
                                        <li key={p.id}>
                                            <Link href={`/tickets?park_id=${p.id}`} className="hover:text-white cursor-pointer">
                                                {p.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-white">Bantuan &amp; Akses</h4>
                                <ul className="mt-3 space-y-2 text-xs">
                                    <li>
                                        <button type="button" onClick={() => setLookupModalOpen(true)} className="hover:text-white cursor-pointer">
                                            Cek E-Tiket Saya
                                        </button>
                                    </li>
                                    <li>
                                        <a href="#faq" className="hover:text-white">
                                            Kebijakan Refund
                                        </a>
                                    </li>
                                    <li>
                                        <Link href="/scanner" className="hover:text-white">
                                            Gate Scanner Petugas
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/login" className="hover:text-white font-semibold text-orange-400">
                                            Login Akun / Admin
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-white">Keamanan</h4>
                                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                                    Token QR unik anti-duplikasi, pembayaran QRIS nasional, dan kuota gerbang terverifikasi real-time.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-widest text-zinc-600">
                            <span>&copy; {new Date().getFullYear()} Vurasi MultiPark Ticketing System</span>
                            <span className="normal-case italic">"ruang terbuka untuk seni yang bercahaya"</span>
                        </div>
                    </div>
                </footer>
            </main>

            {/* ================= TOMBOL KEMBALI KE ATAS ================= */}
            {scrolled && (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
                    aria-label="Kembali ke bagian atas"
                    className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center border border-zinc-900 bg-zinc-900 text-white hover:bg-transparent hover:text-zinc-900 cursor-pointer"
                >
                    <IconArrowUp className="h-5 w-5" />
                </button>
            )}

            {/* Modal Tiket Saya (Cek Pesanan) */}
            <MyTicketsModal open={lookupModalOpen} onClose={() => setLookupModalOpen(false)} />

            {/* ================= MODAL SYARAT & KETENTUAN PROMO ================= */}
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

            {/* ================= MODAL LIHAT SEMUA PROMO (KHUSUS GLOBAL) ================= */}
            <Transition show={allPromoModalOpen} as={Fragment}>
                <Dialog className="relative z-50 font-sans" onClose={() => setAllPromoModalOpen(false)}>
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

                    <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="flex min-h-full items-center justify-center">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95 translate-y-4"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 translate-y-4"
                            >
                                <DialogPanel className="relative w-full max-w-3xl overflow-hidden rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-[8px_8px_0_#18181b] sm:p-8">
                                    {/* Header Modal */}
                                    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-5">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                                <IconTicket className="h-3 w-3" />
                                                Promo Global
                                            </span>
                                            <h3 className="mt-2 font-anton text-2xl uppercase tracking-wide text-zinc-950 sm:text-3xl">
                                                Semua Kupon Promo Global
                                            </h3>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                Kupon resmi yang berlaku di seluruh pameran &amp; destinasi tanpa terikat park tertentu.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setAllPromoModalOpen(false)}
                                            className="grid h-10 w-10 place-items-center rounded-full border-2 border-zinc-900 bg-zinc-100 text-zinc-700 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                                            aria-label="Tutup modal"
                                        >
                                            <IconX className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Daftar Kupon Global */}
                                    <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                                        {globalPromotions.length === 0 ? (
                                            <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                                                Saat ini belum ada kupon promo global yang aktif.
                                            </div>
                                        ) : (
                                            globalPromotions.map((promo, idx) => {
                                                const stub = COUPON_DOTS[idx % COUPON_DOTS.length];
                                                const discountLabel =
                                                    promo.discount_type === 'PERCENTAGE'
                                                        ? `${promo.discount_value}%`
                                                        : `Rp ${promo.discount_value.toLocaleString('id-ID')}`;
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
                                                    <div
                                                        key={promo.id}
                                                        className="relative flex flex-col sm:flex-row rounded-2xl border-2 border-zinc-900 bg-white shadow-[4px_4px_0_#18181b]"
                                                    >
                                                        {/* Stub Kiri */}
                                                        <div
                                                            className={`flex w-full sm:w-32 shrink-0 items-center justify-between sm:justify-center sm:flex-col gap-1 rounded-t-[14px] sm:rounded-t-none sm:rounded-l-[14px] border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-zinc-950/25 p-3.5 text-center ${stub}`}
                                                        >
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-75">
                                                                Global
                                                            </span>
                                                            <span className="font-anton text-2xl sm:text-3xl leading-none">
                                                                {stubLabel}
                                                            </span>
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-75">
                                                                Diskon
                                                            </span>
                                                        </div>

                                                        {/* Info & Aksi Salin */}
                                                        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-base font-bold text-zinc-950">
                                                                        Potongan {discountLabel}
                                                                    </p>
                                                                    <p className="text-xs text-zinc-500">
                                                                        Min. transaksi {rupiah(promo.min_order_amount)}
                                                                        {promo.max_discount_amount && (
                                                                            <span> &bull; Maks. {rupiah(promo.max_discount_amount)}</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                {validUntil && (
                                                                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                                                        s.d. {validUntil}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-between gap-3 pt-1">
                                                                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                                                                    Berlaku di Semua Destinasi
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyCode(promo.code)}
                                                                    aria-label={`Salin kode promo ${promo.code}`}
                                                                    className="inline-flex items-center gap-2 rounded-xl border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-orange-600 hover:border-orange-600 cursor-pointer"
                                                                >
                                                                    <span className="font-mono text-sm tracking-wider">
                                                                        {promo.code}
                                                                    </span>
                                                                    <span>
                                                                        {copiedCode === promo.code ? 'Tersalin!' : 'Salin'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Footer Modal */}
                                    <div className="mt-6 border-t border-zinc-200 pt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setAllPromoModalOpen(false)}
                                            className="rounded-full border-2 border-zinc-900 bg-zinc-100 px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
        </MotionConfig>
    );
}

/* =========================================================================
   FAQ ITEM — accordion gelap dengan animasi Framer Motion
========================================================================= */
function FaqItem({ faq, idx, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE }}
            className="border-t border-zinc-900/15 last:border-b"
        >
            <h3>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left cursor-pointer"
                >
                    <span className="flex items-baseline gap-4">
                        <span aria-hidden="true" className="font-anton text-sm tracking-widest text-orange-600">
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                            className={`text-base font-bold transition-colors duration-300 sm:text-lg ${
                                open ? 'text-orange-600' : 'text-zinc-950 group-hover:text-orange-600'
                            }`}
                        >
                            {faq.q}
                        </span>
                    </span>
                    <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center border transition-colors duration-300 ${
                            open ? 'border-orange-500 bg-orange-600 text-white' : 'border-zinc-900/20 bg-white text-zinc-700 group-hover:border-orange-500/50'
                        }`}
                    >
                        <IconPlus className="h-4 w-4" />
                    </motion.span>
                </button>
            </h3>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="jawaban"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                    >
                        <p className="mb-5 max-w-2xl pb-1 pl-10 pr-10 text-sm leading-relaxed text-zinc-600">{faq.a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
