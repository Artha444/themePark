import Dropdown from '@/Components/Dropdown';
import LogoutButton from '@/Components/LogoutButton';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

/* Link nav gelap — pengganti NavLink bawaan (berwarna terang) */
function DarkNavLink({ href, active = false, children }) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex h-16 items-center border-b-2 px-1 text-sm font-semibold uppercase tracking-widest transition-colors ${
                active
                    ? 'border-orange-600 text-white'
                    : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
        >
            {children}
        </Link>
    );
}

/* Link nav mobile — pengganti ResponsiveNavLink bawaan */
function DarkResponsiveNavLink({ href, active = false, children }) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`block rounded-2xl px-4 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors ${
                active
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
        >
            {children}
        </Link>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="vurasi min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
            <nav className="border-b border-white/10 bg-zinc-950/90 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
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
                                        className="h-8 w-auto"
                                    />
                                </Link>
                            </div>

                            <div className="hidden space-x-6 sm:-my-px sm:ms-10 sm:flex">
                                <DarkNavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </DarkNavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-full">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-semibold leading-4 text-zinc-200 transition duration-150 ease-in-out hover:border-white/30 hover:text-white focus:outline-none cursor-pointer"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-black text-white"
                                                >
                                                    {user.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <span className="max-w-[14ch] truncate">
                                                    {user.name}
                                                </span>

                                                <svg
                                                    className="-me-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content
                                        contentClasses="py-1 bg-zinc-900 border border-white/10"
                                    >
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="text-zinc-300 hover:bg-white/5 hover:text-white focus:bg-white/5"
                                        >
                                            Profil
                                        </Dropdown.Link>
                                        <LogoutButton variant="menu" />
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                aria-expanded={showingNavigationDropdown}
                                aria-label={
                                    showingNavigationDropdown
                                        ? 'Tutup menu navigasi'
                                        : 'Buka menu navigasi'
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 transition duration-150 ease-in-out hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white focus:outline-none cursor-pointer"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' border-t border-white/10 bg-zinc-950 sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <DarkResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </DarkResponsiveNavLink>
                    </div>

                    <div className="border-t border-white/10 pb-1 pt-4">
                        <div className="flex items-center gap-3 px-4">
                            <span
                                aria-hidden="true"
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-600 text-base font-black text-white"
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold text-white">
                                    {user.name}
                                </div>
                                <div className="truncate text-sm text-zinc-400">
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <DarkResponsiveNavLink href={route('profile.edit')}>
                                Profil
                            </DarkResponsiveNavLink>
                            <LogoutButton variant="menu" />
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-white/10 bg-zinc-950">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>

            {/* Footer mini bertema galeri */}
            <footer className="border-t border-white/10 py-6">
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-600">
                    Vurasi* — Paviliun Seni &amp; Cahaya
                </p>
            </footer>
        </div>
    );
}
