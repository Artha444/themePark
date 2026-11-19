import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, BarChart3, ShoppingBag, Tag, Sparkles, Settings,
    Menu, X, ArrowLeft, ScanLine, Building2, Crown,
} from 'lucide-react';

function SidebarNav({ currentPath, withParkQuery, isSuperAdmin, onNavigate }) {
    const navItems = [
        { label: 'Overview Pusat', href: '/admin', icon: LayoutDashboard, exact: true, superAdminOnly: true },
        // Halaman kelola park Admin Pusat bersifat global (multi-park), jadi jangan
        // diberi park_id agar backend merender SuperAdminManageParks.
        { label: isSuperAdmin ? 'Kelola Park' : 'Pengaturan Park', href: '/admin/manage', icon: isSuperAdmin ? Building2 : Settings, skipParkQuery: true },
        { label: 'Penjualan Tiket', href: '/admin/sales', icon: BarChart3 },
        { label: 'Pesanan & Scan', href: '/admin/orders', icon: ShoppingBag },
        { label: 'Kupon Promo', href: '/admin/promotions', icon: Tag },
        { label: 'Libur Nasional', href: '/admin/holidays', icon: Sparkles, superAdminOnly: true },
    ];

    return (
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Menu Admin
            </p>
            {navItems
                .filter((item) => !item.superAdminOnly || isSuperAdmin)
                .map((item) => {
                    const isActive = item.exact
                        ? currentPath === item.href
                        : currentPath.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.skipParkQuery ? item.href : withParkQuery(item.href)}
                            onClick={onNavigate}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                                isActive
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                isActive ? 'bg-white/15 text-white' : 'bg-slate-800/80 text-orange-400'
                            }`}>
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1">{item.label}</span>
                        </Link>
                    );
                })}
        </nav>
    );
}

function SidebarFooter({ handleRoleSwitch, isSuperAdmin }) {
    return (
        <div className="border-t border-slate-800 px-3 py-4 space-y-3">
            {/* Simulasi Role */}
            <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Simulasi Role
                    </span>
                    {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                            <Crown className="h-3 w-3" /> Admin Pusat
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300">
                            <Building2 className="h-3 w-3" /> Admin Park
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => handleRoleSwitch('SUPER_ADMIN')}
                        className={`rounded-lg px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                            isSuperAdmin ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        👑 Pusat
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRoleSwitch('PARK_ADMIN')}
                        className={`rounded-lg px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                            !isSuperAdmin ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        🏢 Park
                    </button>
                </div>
            </div>

            <Link
                href="/scanner"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
                <ScanLine className="h-4 w-4 text-slate-400" />
                Gate Scanner PWA
            </Link>
            <Link
                href="/"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
                <ArrowLeft className="h-4 w-4 text-slate-400" />
                Kembali ke Beranda
            </Link>
        </div>
    );
}

export default function AdminLayout({ children, parks = [], park, isSuperAdmin = true, adminRole = 'SUPER_ADMIN' }) {
    const { url } = usePage();
    const currentPath = url.split('?')[0];
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const withParkQuery = (href) => {
        if (!isSuperAdmin || !park?.id) return href;
        const separator = href.includes('?') ? '&' : '?';
        return `${href}${separator}park_id=${park.id}`;
    };

    const handleRoleSwitch = (newRole) => {
        const params = { as_role: newRole };
        if (park?.id) params.park_id = park.id;
        router.get(currentPath, params, { preserveState: false });
    };

    const handleParkSwitch = (newParkId) => {
        router.get(currentPath, { as_role: adminRole, park_id: newParkId }, { preserveState: false });
    };

    const sidebarInner = (onNavigate) => (
        <>
            {/* Brand */}
            <Link
                href={withParkQuery('/admin')}
                onClick={onNavigate}
                className="flex items-center gap-3 border-b border-slate-800 px-5 py-5"
            >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-lg font-black text-white shadow-lg shadow-orange-600/30">
                    V
                </span>
                <span>
                    <span className="block text-sm font-black tracking-widest text-white">VURASI</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">
                        Admin Panel
                    </span>
                </span>
            </Link>

            <SidebarNav
                currentPath={currentPath}
                withParkQuery={withParkQuery}
                isSuperAdmin={isSuperAdmin}
                onNavigate={onNavigate}
            />

            <SidebarFooter handleRoleSwitch={handleRoleSwitch} isSuperAdmin={isSuperAdmin} />
        </>
    );

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
            {/* ============ SIDEBAR DESKTOP ============ */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:bg-slate-950 lg:border-r lg:border-slate-800">
                {sidebarInner()}
            </aside>

            {/* ============ TOP BAR + DRAWER MOBILE ============ */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 bg-slate-950 border-b border-slate-800 px-4 py-3.5 text-white">
                <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Buka menu admin"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">
                        Vurasi Admin Panel
                    </span>
                    <span className="block truncate text-sm font-bold">{park?.name || 'Vurasi Admin'}</span>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-black">
                    V
                </span>
            </div>

            {mobileNavOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-950 border-r border-slate-800">
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(false)}
                            aria-label="Tutup menu admin"
                            className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {sidebarInner(() => setMobileNavOpen(false))}
                    </aside>
                </div>
            )}

            {/* ============ KONTEN HALAMAN ============ */}
            <main className="lg:pl-72">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 pb-24">{children}</div>
            </main>
        </div>
    );
}
