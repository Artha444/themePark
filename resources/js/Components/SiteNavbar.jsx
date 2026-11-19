/**
 * VURASI — SITE NAVBAR (komponen bersama)
 *
 * Navbar pill melayang yang dipakai di seluruh halaman publik (landing,
 * pemesanan tiket, dst) — persis satu sumber kebenaran:
 * - Kiri: kapsul logo putih
 * - Tengah: pill navigasi gelap blur (desktop), item aktif highlight putih
 * - Kanan: tombol "Cek Pesanan" (opsional) + chip akun / Masuk + burger (mobile)
 * - Panel menu mobile animatif (saat login: Tiket Saya + Pengaturan Profil)
 *
 * Props:
 * - links: [{ label, href, active }] — href anchor '#id' atau route '/tickets'
 * - onCekPesanan: callback untuk membuka modal Cek Pesanan (tanpa prop,
 *   tombolnya tidak dirender — dipakai halaman yang belum punya modal)
 *
 * Aksesibilitas: aria-current, aria-expanded, target sentuh ≥ 44px
 */
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/* Easing konsisten dengan landing page */
const EASE = [0.22, 1, 0.36, 1];

/*
 * Daftar section — SATU SUMBER KEBENARAN untuk semua navbar.
 * Default: anchor '#id' (landing) / '/#id' (halaman lain menuju landing).
 * 'href' opsional = override route penuh, dipakai saat kontennya pindah
 * halaman (Pesan Cepat kini kartu di halaman pemesanan tiket → /tickets).
 */
export const NAV_SECTIONS = [
    { id: 'quick-booking', label: 'Pesan Cepat', href: '/tickets' },
    { id: 'parks', label: 'Destinasi' },
    { id: 'promo', label: 'Kupon' },
    { id: 'faq', label: 'Bantuan' },
];

/* Ikon gaya Lucide (stroke 2) — sama dengan ikon inline di landing */
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

const IconMenu = (p) => <Icon {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;

export default function SiteNavbar({ links = [], onCekPesanan = null }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const user = usePage().props.auth?.user;

    return (
        <motion.header
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            className="fixed inset-x-0 top-0 z-50"
        >
            {/* Grid 3 kolom: kiri (logo) — tengah (pill) — kanan (aksi) agar pill simetris */}
            <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pt-4 sm:px-6 lg:px-8">
                {/* Kiri: logo Vurasi — putih membulat seperti item navbar lain */}
                <div className="justify-self-start">
                    <Link
                        href="/"
                        aria-label="Vurasi — ke beranda"
                        className="inline-flex items-center rounded-full bg-white px-3 py-2 shadow-lg shadow-black/30 transition-transform duration-300 hover:scale-105"
                    >
                        <img
                            src="/images/vurasi-logo.png"
                            alt="Vurasi"
                            width="1180"
                            height="490"
                            className="h-8 w-auto sm:h-9"
                        />
                    </Link>
                </div>

                {/* Tengah: pill navigasi (desktop) */}
                <nav
                    aria-label="Navigasi utama"
                    className="hidden items-center gap-1 rounded-full border border-white/10 bg-zinc-950/70 p-1.5 shadow-xl shadow-black/40 backdrop-blur-md lg:flex"
                >
                    {links.map((item) => {
                        const isAnchor = item.href.startsWith('#');
                        const Tag = isAnchor ? 'a' : Link;
                        return (
                            <Tag
                                key={item.label}
                                href={item.href}
                                aria-current={item.active ? 'true' : undefined}
                                className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 xl:px-4 ${
                                    item.active
                                        ? 'bg-white/10 text-white'
                                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </Tag>
                        );
                    })}
                </nav>

                {/* Kanan: cek pesanan + akun profil / masuk */}
                <div className="flex items-center justify-end gap-2 sm:gap-3">
                    {onCekPesanan && (
                        <button
                            type="button"
                            onClick={onCekPesanan}
                            className="hidden h-11 items-center rounded-full border border-white/10 bg-zinc-950/70 px-4 text-xs font-bold uppercase tracking-widest text-zinc-200 shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:text-white xl:inline-flex cursor-pointer"
                        >
                            Cek Pesanan
                        </button>
                    )}

                    {user ? (
                        <Link
                            href={route('profile.edit')}
                            aria-label={`Akun ${user.name} — buka pengaturan profil`}
                            className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-600 py-1 pl-1.5 pr-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/40 transition-colors hover:bg-orange-500"
                        >
                            <span
                                aria-hidden="true"
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-black"
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="max-w-[12ch] truncate">{user.name.split(' ')[0]}</span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center rounded-full bg-orange-600 px-5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-600/40 transition-colors hover:bg-orange-500"
                        >
                            Masuk
                        </Link>
                    )}

                    {/* Burger (mobile) */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                        aria-expanded={menuOpen}
                        className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-zinc-950/70 text-white shadow-lg shadow-black/30 backdrop-blur-md cursor-pointer lg:hidden"
                    >
                        {menuOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Panel menu mobile */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.nav
                        aria-label="Navigasi seluler"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="mx-4 mt-2 rounded-3xl border border-white/10 bg-zinc-950/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:mx-6 lg:hidden"
                    >
                        <ul className="space-y-1">
                            {onCekPesanan && (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onCekPesanan();
                                        }}
                                        className="flex min-h-[44px] w-full items-center justify-between rounded-2xl px-4 text-sm font-semibold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                                    >
                                        Cek Pesanan
                                        <IconArrowRight className="h-4 w-4" />
                                    </button>
                                </li>
                            )}
                            {links.map((item) => {
                                const isAnchor = item.href.startsWith('#');
                                const Tag = isAnchor ? 'a' : Link;
                                return (
                                    <li key={item.label}>
                                        <Tag
                                            href={item.href}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex min-h-[44px] items-center justify-between rounded-2xl px-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                                                item.active
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {item.label}
                                            <IconArrowRight className="h-4 w-4" />
                                        </Tag>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                            {user ? (
                                <>
                                    <Link href="/my-orders" className="flex-1 rounded-full bg-orange-600 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white">
                                        Tiket Saya ({user.name.split(' ')[0]})
                                    </Link>
                                    <Link href={route('profile.edit')} className="flex-1 rounded-full border border-white/20 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white">
                                        Pengaturan Profil
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="flex-1 rounded-full border border-white/20 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white">
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="flex-1 rounded-full bg-orange-600 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white">
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
