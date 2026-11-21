/**
 * VURASI — SITE NAVBAR (komponen bersama)
 *
 * Pill navbar melayang untuk seluruh halaman publik.
 * - Kiri: kapsul logo putih
 * - Tengah: 3 menu utama (Katalog Tiket, Promo, Bantuan & FAQ), active pill bergeser
 * - Kanan: Cek E-Tiket + akun/Masuk + burger (mobile)
 * - Panel mobile: backdrop, daftar berurutan (stagger), Escape untuk menutup
 *
 * Props:
 * - links: [{ label, href, active }] — href '#id' atau route penuh
 * - onCekPesanan: callback modal cek pesanan; tanpa prop tombol tidak dirender
 *
 * Satu sumber kebenaran menu ada di NAV_SECTIONS di bawah.
 */
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.22, 1, 0.36, 1];

/* Menu utama. `anchor` dipakai halaman landing agar tetap scroll halus (#faq),
 * sementara `href` dipakai halaman lain (/ #faq). */
export const NAV_SECTIONS = [
    { id: 'tickets', label: 'Katalog Tiket', href: '/tickets' },
    { id: 'promo', label: 'Promo', href: '/promotions' },
    { id: 'faq', label: 'Bantuan & FAQ', href: '/#faq', anchor: '#faq' },
];

const isAnchorLink = (item) => Boolean(item.anchor) || String(item.href || '').startsWith('#');
const linkHref = (item) => (isAnchorLink(item) ? item.anchor || item.href : item.href);

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
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 11v2M13 17v2" /></Icon>;

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950';

export default function SiteNavbar({ links = [], onCekPesanan = null }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const reduce = useReducedMotion();
    const user = usePage().props.auth?.user;

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <motion.header
            initial={reduce ? false : { y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.55, ease: EASE, delay: reduce ? 0 : 0.1 }}
            className="fixed inset-x-0 top-0 z-50"
        >
            <AnimatePresence>
                {menuOpen && (
                    <motion.button
                        type="button"
                        aria-label="Tutup menu navigasi"
                        onClick={closeMenu}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.2 }}
                        className="fixed inset-0 z-40 bg-zinc-950/55 backdrop-blur-sm lg:hidden cursor-pointer"
                    />
                )}
            </AnimatePresence>

            {/* Grid 3 kolom: logo — menu — aksi */}
            <div className="relative z-50 mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pt-4 sm:px-6 lg:px-8">
                <div className="justify-self-start">
                    <Link
                        href="/"
                        aria-label="Vurasi — ke beranda"
                        className={`inline-flex items-center rounded-full bg-white px-3 py-2 shadow-lg shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5 ${FOCUS}`}
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

                {/* Desktop: pill dengan active indicator yang bergeser */}
                <nav
                    aria-label="Navigasi utama"
                    className="hidden items-center gap-1 rounded-full border border-white/10 bg-zinc-950/80 p-1.5 shadow-xl shadow-black/30 backdrop-blur-lg lg:flex"
                >
                    {links.map((item) => {
                        const Tag = isAnchorLink(item) ? 'a' : Link;
                        return (
                            <Tag
                                key={item.label}
                                href={linkHref(item)}
                                aria-current={item.active ? 'page' : undefined}
                                className={`relative inline-flex min-h-[44px] items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-200 xl:px-4 ${FOCUS} ${
                                    item.active ? 'text-white' : 'text-zinc-300 hover:text-white'
                                }`}
                            >
                                {item.active && (
                                    <motion.span
                                        layoutId="nav-active-pill"
                                        className="absolute inset-0 rounded-full bg-white/15"
                                        transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                                    />
                                )}
                                <span className="relative whitespace-nowrap">{item.label}</span>
                            </Tag>
                        );
                    })}
                </nav>

                {/* Kanan: Cek E-Tiket + akun / masuk + burger */}
                <div className="flex items-center justify-end gap-2 sm:gap-3">
                    {onCekPesanan && (
                        <button
                            type="button"
                            onClick={onCekPesanan}
                            className={`hidden h-11 items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 px-4 text-xs font-bold text-zinc-200 shadow-lg shadow-black/25 backdrop-blur-lg transition-colors hover:text-white lg:inline-flex ${FOCUS} cursor-pointer`}
                        >
                            <IconTicket className="h-4 w-4" />
                            Cek E-Tiket
                        </button>
                    )}

                    {user ? (
                        <Link
                            href={route('profile.edit')}
                            aria-label={`Akun ${user.name} — buka pengaturan profil`}
                            className={`inline-flex h-11 items-center gap-2 rounded-full bg-orange-600 py-1 pl-1.5 pr-4 text-xs font-bold text-white shadow-lg shadow-orange-600/30 transition-colors hover:bg-orange-500 ${FOCUS}`}
                        >
                            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-black">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="max-w-[12ch] truncate">{user.name.split(' ')[0]}</span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className={`inline-flex h-11 items-center rounded-full bg-orange-600 px-5 text-xs font-bold text-white shadow-lg shadow-orange-600/30 transition-colors hover:bg-orange-500 ${FOCUS}`}
                        >
                            Masuk
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                        aria-expanded={menuOpen}
                        className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-zinc-950/80 text-white shadow-lg shadow-black/25 backdrop-blur-lg lg:hidden ${FOCUS} cursor-pointer`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={menuOpen ? 'close' : 'menu'}
                                initial={reduce ? false : { opacity: 0, rotate: -25 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={reduce ? undefined : { opacity: 0, rotate: 25 }}
                                transition={{ duration: reduce ? 0 : 0.15 }}
                            >
                                {menuOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
                            </motion.span>
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Panel mobile */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.nav
                        aria-label="Navigasi seluler"
                        initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
                        className="relative z-50 mx-4 mt-2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:mx-6 lg:hidden"
                    >
                        <ul className="space-y-1">
                            {links.map((item, index) => {
                                const Tag = isAnchorLink(item) ? 'a' : Link;
                                return (
                                    <motion.li
                                        key={item.label}
                                        initial={reduce ? false : { opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : index * 0.045 }}
                                    >
                                        <Tag
                                            href={linkHref(item)}
                                            onClick={closeMenu}
                                            aria-current={item.active ? 'page' : undefined}
                                            className={`flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-sm font-semibold transition-colors ${FOCUS} ${
                                                item.active ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {item.label}
                                            <IconArrowRight className="h-4 w-4 shrink-0" />
                                        </Tag>
                                    </motion.li>
                                );
                            })}

                            {onCekPesanan && (
                                <motion.li
                                    initial={reduce ? false : { opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : links.length * 0.045 }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeMenu();
                                            onCekPesanan();
                                        }}
                                        className={`flex min-h-[48px] w-full items-center justify-between rounded-2xl bg-white/5 px-4 text-sm font-semibold text-orange-300 transition-colors hover:bg-white/10 ${FOCUS} cursor-pointer`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <IconTicket className="h-4 w-4" />
                                            Cek E-Tiket
                                        </span>
                                        <IconArrowRight className="h-4 w-4" />
                                    </button>
                                </motion.li>
                            )}
                        </ul>

                        <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                            {user ? (
                                <>
                                    <Link href="/my-orders" className={`flex-1 rounded-full bg-orange-600 py-3 text-center text-xs font-bold text-white ${FOCUS}`}>
                                        Pesanan Saya
                                    </Link>
                                    <Link href={route('profile.edit')} className={`flex-1 rounded-full border border-white/20 py-3 text-center text-xs font-bold text-white ${FOCUS}`}>
                                        Profil
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className={`flex-1 rounded-full border border-white/20 py-3 text-center text-xs font-bold text-white ${FOCUS}`}>
                                        Masuk
                                    </Link>
                                    <Link href="/register" className={`flex-1 rounded-full bg-orange-600 py-3 text-center text-xs font-bold text-white ${FOCUS}`}>
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
