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
 * - Pesan Cepat: kartu tiket vintag kini pindah ke halaman pemesanan tiket;
 *   tab kurva "Pesan Cepat" di bawah hero mengarah ke /tickets
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
import { motion, AnimatePresence, MotionConfig, animate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import SiteNavbar, { NAV_SECTIONS } from '@/Components/SiteNavbar';
import MyTicketsModal from '@/Components/MyTicketsModal';

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
const IconChevronL = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevronR = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const IconMapPin = (p) => <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>;
const IconCard = (p) => <Icon {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="m9 12 2 2 4-4" /></Icon>;
const IconCopy = (p) => <Icon {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" /></Icon>;
const IconArrowUp = (p) => <Icon {...p}><path d="m18 15-6-6-6 6" /></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>;
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 11v2" /><path d="M13 17v2" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>;

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
            image: 'https://images.unsplash.com/photo-1594737625785-c028ace3b8f4?w=1600&q=80',
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

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-8 sm:gap-4 sm:px-6 sm:py-10 lg:px-8"
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

    return <dd ref={ref} className="text-2xl font-black leading-none text-orange-600 sm:text-4xl">0</dd>;
}

/* =========================================================================
   KOMPONEN UTAMA
========================================================================= */
export default function Welcome({ parks = [], promotions = [], today, auth = {} }) {
    const [lookupModalOpen, setLookupModalOpen] = useState(false);

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

    // Deret kupon — geser horizontal via tombol bulat melayang
    const couponRowRef = useRef(null);

    /* Posisi tepi scroll deret kupon: tombol ‹ hilang saat mentok kiri,
       tombol › hilang saat mentok kanan (atau saat semua kupon muat tanpa
       scroll). Dicek ulang setiap scroll, resize, dan saat promo berubah. */
    const [couponEdge, setCouponEdge] = useState({ start: true, end: false });

    const syncCouponEdge = useCallback(() => {
        const el = couponRowRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setCouponEdge({
            start: el.scrollLeft <= 2,
            end: el.scrollLeft >= max - 2,
        });
    }, []);

    useEffect(() => {
        syncCouponEdge();
        const el = couponRowRef.current;
        if (!el) return undefined;
        el.addEventListener('scroll', syncCouponEdge, { passive: true });
        window.addEventListener('resize', syncCouponEdge);
        return () => {
            el.removeEventListener('scroll', syncCouponEdge);
            window.removeEventListener('resize', syncCouponEdge);
        };
    }, [syncCouponEdge, promotions]);

    const scrollCoupons = (dir) => {
        const el = couponRowRef.current;
        if (!el) return;
        const card = el.querySelector('[data-coupon-card]');
        const gap = parseFloat(getComputedStyle(el).columnGap) || 24;
        const step = card ? card.offsetWidth + gap : 320;
        el.scrollBy({ left: dir * step, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };

    // Carousel kartu destinasi — geser manual via tombol ‹ › / swipe
    const trackRef = useRef(null);

    const scrollCards = (dir) => {
        const el = trackRef.current;
        if (!el) return;
        const firstCard = el.querySelector('article');
        const step = firstCard ? firstCard.offsetWidth + 24 : 400;
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
                    href: item.href ?? `#${item.id}`,
                    active: activeSection === item.id,
                }))}
                onCekPesanan={() => setLookupModalOpen(true)}
            />

            <main id="main">
                {/* ================= 2. HERO — poster maskot: pill biru + judul oranye ================= */}
                <section
                    aria-label="Pengantar Vurasi"
                    onMouseMove={handleHeroPointer}
                    onMouseLeave={resetHeroPointer}
                    className="relative flex min-h-[100svh] flex-col overflow-hidden bg-white pb-16 text-zinc-950"
                >
                    {/* Latar dekoratif dua lapis parallax: jauh (pola titik + blob)
                        bergerak serempak kursor, tengah (tiket + kilau) berlawanan */}
                    <div className="pointer-events-none absolute -inset-8" aria-hidden="true">
                        <motion.div style={{ x: farX, y: farY }} className="absolute inset-0">
                            <div className="dots-bg-light absolute inset-0" />
                            <div className="absolute -right-28 -top-28 h-[30rem] w-[30rem] rounded-full bg-[#62C6EA]/20 blur-3xl" />
                            <div className="absolute -left-36 bottom-16 h-[26rem] w-[26rem] rounded-full bg-orange-300/20 blur-3xl" />
                        </motion.div>

                        <motion.div style={{ x: midX, y: midY }} className="absolute inset-0">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4.2, ease: 'easeInOut', repeat: Infinity }}
                                className="absolute left-[5%] top-[13%]"
                            >
                                <TicketDeco className="h-10 w-10 -rotate-[24deg] sm:h-14 sm:w-14" />
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 0.8 }}
                                className="absolute bottom-[26%] left-[38%] hidden lg:block"
                            >
                                <TicketDeco className="h-9 w-9 rotate-[16deg]" />
                            </motion.div>
                            <motion.div
                                animate={{ y: [0, -9, 0] }}
                                transition={{ duration: 4.6, ease: 'easeInOut', repeat: Infinity, delay: 0.4 }}
                                className="absolute bottom-[11%] right-[6%]"
                            >
                                <TicketDeco className="h-14 w-14 -rotate-[14deg] sm:h-20 sm:w-20" />
                            </motion.div>

                            <motion.span
                                animate={{ scale: [0.7, 1, 0.7], opacity: [0.35, 1, 0.35] }}
                                transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
                                className="absolute left-[30%] top-[16%] text-orange-500"
                            >
                                <Sparkle className="h-6 w-6" />
                            </motion.span>
                            <motion.span
                                animate={{ scale: [1, 0.7, 1], opacity: [0.9, 0.3, 0.9] }}
                                transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 1.1 }}
                                className="absolute right-[30%] top-[22%] text-[#62C6EA]"
                            >
                                <Sparkle className="h-8 w-8" />
                            </motion.span>
                        </motion.div>
                    </div>

                    {/* Konten */}
                    <div className="relative z-10 mx-auto flex max-w-7xl flex-1 flex-col justify-center px-4 pb-10 pt-28 sm:px-6 sm:pt-32 lg:px-8">
                        {/* Judul besar — pill biru ala design-model + maskot melambai */}
                        <div className="relative z-10 mt-2 grid items-center gap-8 sm:mt-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-0">
                            {/* Pill biru muda — tipografi "Pesan Tiket Tanpa Ribet" dari design-model,
                                dibungkus wrapper parallax agar bergeser melawan kursor */}
                            <motion.div style={{ x: pillX, y: pillY }} className="relative w-fit">
                                <motion.div
                                    initial={{ opacity: 0, x: -48 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
                                    className="relative inline-block w-fit rounded-[2.75rem] border-4 border-white bg-[#62C6EA] px-7 py-8 shadow-[0_24px_50px_-24px_rgba(98,198,234,0.8)] sm:rounded-[3.5rem] sm:px-12 sm:py-10 lg:rounded-[999px] lg:px-16 lg:py-12 lg:-rotate-1"
                                >
                                    <h1 className="m-0">
                                        <span className="block overflow-hidden">
                                            <motion.span
                                                className="block"
                                                initial={{ y: '110%' }}
                                                animate={{ y: '0%' }}
                                                transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
                                            >
                                                <img
                                                    src="/images/pesan-tiket-tanpa-ribet.png"
                                                    alt="Pesan Tiket Tanpa Ribet"
                                                    width="2752"
                                                    height="1536"
                                                    draggable="false"
                                                    className="w-[min(88vw,32rem)] select-none sm:w-[36rem] lg:w-[34rem] xl:w-[42rem]"
                                                />
                                            </motion.span>
                                        </span>
                                    </h1>

                                    {/* Stempel "Tiket Resmi Multipark" — berputar pelan di sudut pill */}
                                    <motion.div
                                        aria-hidden="true"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
                                        className="absolute -top-10 right-2 z-20 hidden h-28 w-28 sm:block lg:-right-10"
                                    >
                                        <StampBadge />
                                    </motion.div>
                                </motion.div>

                                {/* Subheadline — deskripsi singkat di bawah pill biru */}
                                <motion.p
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
                                    className="mt-5 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base lg:pl-4"
                                >
                                    Platform tiket resmi pameran seni, galeri cahaya, dan taman rekreasi multi-park — E-Tiket QR instan, langsung masuk tanpa antre.
                                </motion.p>
                            </motion.div>

                            {/* Maskot Vurasi — parallax kursor, pop saat di-hover */}
                            <motion.div style={{ x: mascotX, y: mascotY }} className="relative z-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 48 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.04, rotate: 2 }}
                                    transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
                                    className="relative z-10 mx-auto w-64 sm:w-80 lg:-ml-14 lg:w-[28rem] xl:w-[32rem]"
                                >
                                    {/* Sunburst berputar pelan di belakang maskot */}
                                    <motion.div
                                        aria-hidden="true"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
                                        className="absolute -left-[18%] -top-[12%] w-[136%]"
                                    >
                                        <SunburstRays className="w-full text-[#62C6EA]/35" />
                                    </motion.div>
                                    <motion.img
                                        src="/images/maskot-vurasi.png"
                                        alt="Maskot Vurasi — kucing oranye berseragam melambai tangan"
                                        width="1024"
                                        height="1024"
                                        draggable="false"
                                        animate={{ y: [0, -12, 0] }}
                                        transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
                                        className="relative w-full select-none"
                                    />
                                    <motion.div
                                        aria-hidden="true"
                                        animate={{ scaleX: [1, 0.93, 1] }}
                                        transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
                                        className="mx-auto -mt-1 h-4 w-2/3 rounded-[50%] bg-zinc-500/40 blur-[3px] sm:h-5"
                                    />
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Statistik kartu tinta + deskripsi sorotan */}
                        <div className="relative z-10 mt-10 flex flex-wrap items-end gap-x-8 gap-y-6 sm:mt-12 lg:mt-14">
                            <motion.dl
                                initial="hidden"
                                animate="show"
                                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.8 } } }}
                                className="flex divide-x divide-zinc-900/10 overflow-hidden rounded-3xl border border-zinc-900/10 bg-white/90 shadow-xl shadow-zinc-900/10 backdrop-blur-md"
                            >
                                {[
                                    { k: 'Destinasi', v: parks.length },
                                    { k: 'Zona Tematik', v: totalZones },
                                    { k: 'Atraksi', v: totalAttractions },
                                ].map((s) => (
                                    <motion.div
                                        key={s.k}
                                        variants={{
                                            hidden: { opacity: 0, y: 26 },
                                            show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                                        }}
                                        className="px-4 py-3.5 sm:px-7 sm:py-5"
                                    >
                                        <StatNumber value={s.v} />
                                        <dt className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 sm:text-[11px]">
                                            {s.k}
                                        </dt>
                                    </motion.div>
                                ))}
                            </motion.dl>

                            {/* CTA multipark — langsung ke halaman pemesanan tiket */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                <Link
                                    href="/tickets"
                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/40 transition-all hover:scale-[1.04] hover:bg-orange-500 active:scale-95 cursor-pointer"
                                >
                                    <IconTicket className="h-4 w-4" />
                                    Pesan Tiket Sekarang
                                    <IconArrowRight className="h-4 w-4" />
                                </Link>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                                    Mulai {rupiah(startFrom)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pintasan cepat sisi kanan (desktop) */}
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 1.2 } } }}
                        className="absolute bottom-36 right-5 z-10 hidden flex-col gap-2 lg:flex"
                    >
                        {[
                            { href: '#parks', label: 'Lihat destinasi', icon: <IconMapPin className="h-4 w-4" /> },
                            { href: '#promo', label: 'Lihat kupon', icon: <IconCard className="h-4 w-4" /> },
                        ].map((item) => (
                            <motion.a
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                variants={{
                                    hidden: { opacity: 0, x: 30 },
                                    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
                                }}
                                className="grid h-11 w-11 place-items-center rounded-full border border-zinc-900/15 bg-white/90 text-zinc-700 shadow-lg shadow-zinc-900/10 backdrop-blur-md transition-colors hover:bg-orange-600 hover:text-white"
                            >
                                {item.icon}
                            </motion.a>
                        ))}
                    </motion.div>
                </section>

                {/* ================= 5. KUPON — kupon pengguna baru (deret kartu putih) ================= */}
                {promotions.length > 0 && (
                    <section id="promo" className="relative scroll-mt-20 overflow-hidden bg-white py-16 sm:py-20">
                        {/* Latar dekoratif: dot grid + blob lembut — serasi hero & galeri */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="dots-bg-light absolute inset-0" />
                            <div className="absolute -right-28 top-16 h-[22rem] w-[22rem] rounded-full bg-[#62C6EA]/15 blur-3xl" />
                            <div className="absolute -left-28 bottom-8 h-[20rem] w-[20rem] rounded-full bg-orange-300/15 blur-3xl" />
                        </div>

                        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {/* Kepala section — badge stiker + judul Anton + garis potong gunting */}
                            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-950 bg-orange-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_#18181b]">
                                        <IconTicket className="h-3.5 w-3.5" />
                                        &sect; 02 — Penawaran Terbatas
                                    </span>
                                    <h2 className="mt-4 font-anton text-4xl uppercase leading-[0.95] text-zinc-950 sm:text-6xl">
                                        <span className="stroke-word">Kupon</span> Pengguna Baru
                                    </h2>
                                    <p className="mt-3 max-w-lg text-sm text-zinc-500">
                                        Salin kode di halaman pemesanan untuk potongan instan — kuota terbatas sesuai masa berlaku.
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-zinc-300" aria-hidden="true">
                                        <span className="text-lg leading-none">&#9986;</span>
                                        <span className="h-px w-44 border-t-2 border-dashed" />
                                    </div>
                                </div>
                            </div>

                            {/* Deret kupon: tiket sobekan digeser horizontal + tombol stiker */}
                            <div className="relative">
                                {/* Tombol gulir — otomatis hilang (fade) saat mentok kiri/kanan */}
                                <AnimatePresence initial={false}>
                                    {!couponEdge.start && (
                                        <motion.button
                                            key="gulir-kiri"
                                            type="button"
                                            onClick={() => scrollCoupons(-1)}
                                            aria-label="Gulir kupon ke kiri"
                                            whileHover={{ scale: 1.12, backgroundColor: '#EA580C', color: '#ffffff' }}
                                            whileTap={{ scale: 0.9 }}
                                            exit={{ opacity: 0, scale: 0.5, x: -12 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            className="absolute -left-3 top-[calc(50%-22px)] z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-[3px_3px_0_#18181b] cursor-pointer sm:-left-5"
                                        >
                                            <IconChevronL className="h-5 w-5" />
                                        </motion.button>
                                    )}
                                    {!couponEdge.end && (
                                        <motion.button
                                            key="gulir-kanan"
                                            type="button"
                                            onClick={() => scrollCoupons(1)}
                                            aria-label="Gulir kupon ke kanan"
                                            whileHover={{ scale: 1.12, backgroundColor: '#EA580C', color: '#ffffff' }}
                                            whileTap={{ scale: 0.9 }}
                                            exit={{ opacity: 0, scale: 0.5, x: 12 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            className="absolute -right-3 top-[calc(50%-22px)] z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 shadow-[3px_3px_0_#18181b] cursor-pointer sm:-right-5"
                                        >
                                            <IconChevronR className="h-5 w-5" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                <div
                                    ref={couponRowRef}
                                    className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
                                >
                                    {promotions.map((promo, idx) => {
                                        const stub = COUPON_DOTS[idx % COUPON_DOTS.length];
                                        const baseTilt = idx % 2 === 0 ? -1.2 : 1.2;
                                        const discountLabel =
                                            promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `Rp ${promo.discount_value.toLocaleString('id-ID')}`;
                                        const stubLabel =
                                            promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `${Math.round(promo.discount_value / 1000)}rb`;
                                        const validUntil = promo.valid_until
                                            ? new Date(promo.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : null;
                                        return (
                                            <motion.article
                                                key={promo.id}
                                                data-coupon-card
                                                initial={{ opacity: 0, y: 28, rotate: baseTilt }}
                                                whileInView={{ opacity: 1, y: 0, rotate: baseTilt }}
                                                viewport={{ once: true, amount: 0.3 }}
                                                whileHover={{ rotate: 0, y: -8, transition: { duration: 0.25 } }}
                                                transition={{ duration: 0.5, delay: idx * 0.08, ease: EASE }}
                                                className="relative flex w-[300px] shrink-0 snap-start rounded-2xl border-2 border-zinc-900 bg-white shadow-[4px_4px_0_#18181b] sm:w-[340px]"
                                            >
                                                {/* Stub kiri berwarna — nilai potongan ala tiket sobekan */}
                                                <div className={`flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-l-[14px] border-r-2 border-dashed border-zinc-950/25 p-3 text-center ${stub}`}>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] opacity-75">Kupon Baru</span>
                                                    <span className="font-anton text-3xl leading-none sm:text-4xl">{stubLabel}</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] opacity-75">Potongan</span>
                                                </div>

                                                {/* Badan tiket — detail + tombol salin + chip park */}
                                                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5 p-4">
                                                    <div>
                                                        <p className="text-sm font-bold leading-snug text-zinc-950">Diskon {discountLabel}</p>
                                                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                                                            Min. transaksi {rupiah(promo.min_order_amount)}
                                                        </p>
                                                    </div>

                                                    {/* Salin kode — kotak kode putus-putus ala kupon fisik */}
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(promo.code)}
                                                        aria-label={`Salin kode promo ${promo.code}`}
                                                        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-3 transition-colors hover:border-orange-500 cursor-pointer"
                                                    >
                                                        <span className={`font-mono text-sm font-bold tracking-[0.15em] ${copiedCode === promo.code ? 'text-emerald-600' : 'text-zinc-950'}`}>
                                                            {copiedCode === promo.code ? 'Tersalin!' : promo.code}
                                                        </span>
                                                        <AnimatePresence mode="wait" initial={false}>
                                                            <motion.span
                                                                key={copiedCode === promo.code ? 'ok' : 'copy'}
                                                                initial={{ scale: 0.4, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0.4, opacity: 0 }}
                                                                transition={{ duration: 0.15, ease: EASE }}
                                                                className={`grid place-items-center ${copiedCode === promo.code ? 'text-emerald-600' : 'text-zinc-400'}`}
                                                            >
                                                                {copiedCode === promo.code ? <IconCheck className="h-5 w-5" /> : <IconCopy className="h-5 w-5" />}
                                                            </motion.span>
                                                        </AnimatePresence>
                                                    </button>

                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
                                                            {promo.park?.name || 'Semua Destinasi'}
                                                        </span>
                                                        {validUntil && (
                                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                                s.d. {validUntil}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Lubang sobekan di sepanjang garis perfaktur */}
                                                <span aria-hidden="true" className="absolute -top-2.5 left-[102px] h-5 w-5 rounded-full border-2 border-zinc-900 bg-white" />
                                                <span aria-hidden="true" className="absolute -bottom-2.5 left-[102px] h-5 w-5 rounded-full border-2 border-zinc-900 bg-white" />
                                            </motion.article>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                )}


                {/* ================= 4. DESTINASI — band cream galeri ================= */}
                <section id="parks" className="scroll-mt-20 bg-[#f5efda] py-16 text-zinc-950 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

                {/* ================= 6. FAQ — band gelap galeri ================= */}
                <section id="faq" className="scroll-mt-20 bg-[#f5efda] py-16 text-zinc-950 sm:py-24">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.55, ease: EASE }}
                            className="mb-10"
                        >
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">&sect; 03 — Bantuan</p>
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
                <footer className="bg-zinc-950 text-zinc-400">
                    <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
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
                                <div className="flex items-center gap-2">
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
