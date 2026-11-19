import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import LogoutButton from '@/Components/LogoutButton';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

/* Ikon kartu identitas — gaya Lucide */
function IconUser({ className = 'h-4 w-4' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
        </svg>
    );
}

/* Kartu section gelap bertema galeri: nomor § + judul Anton + isi */
function ProfileCard({ num, title, danger = false, children }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/30">
            <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:px-7">
                <span
                    className={`font-mono text-xs font-bold tracking-widest ${
                        danger ? 'text-rose-400' : 'text-orange-500'
                    }`}
                >
                    &sect; {num}
                </span>
                <h2 className="font-anton text-lg uppercase tracking-[0.04em] text-white sm:text-xl">
                    {title}
                </h2>
            </header>
            <div className="px-5 py-6 sm:px-7">{children}</div>
        </section>
    );
}

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const initial = user.name.charAt(0).toUpperCase();
    const emailVerified = user.email_verified_at !== null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">
                            &sect; Akun Saya
                        </p>
                        <h2 className="mt-1 font-anton text-2xl uppercase tracking-[0.02em] text-white sm:text-3xl">
                            Profil
                        </h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                        <IconUser className="h-3.5 w-3.5 text-orange-400" />
                        Member Area
                    </span>
                </div>
            }
        >
            <Head title="Profil — Vurasi" />

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                {/* ============ Kartu identitas + tombol keluar ============ */}
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
                    {/* Aksen cahaya oranye di pojok */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl"
                    />

                    <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                        {/* Identitas */}
                        <div className="flex items-center gap-4 sm:gap-5">
                            <span
                                aria-hidden="true"
                                className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-orange-600 font-anton text-3xl text-white shadow-lg shadow-orange-600/40 ring-2 ring-orange-400/50 sm:h-20 sm:w-20 sm:text-4xl"
                            >
                                {initial}
                            </span>
                            <div className="min-w-0">
                                <h3 className="truncate font-anton text-2xl uppercase tracking-[0.02em] text-white sm:text-3xl">
                                    {user.name}
                                </h3>
                                <p className="mt-1 truncate text-sm text-zinc-400">
                                    {user.email}
                                </p>
                                <span
                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                        emailVerified
                                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                            : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            emailVerified
                                                ? 'bg-emerald-400'
                                                : 'bg-amber-400'
                                        }`}
                                    />
                                    {emailVerified
                                        ? 'Email terverifikasi'
                                        : 'Email belum verifikasi'}
                                </span>
                            </div>
                        </div>

                        {/* Tombol keluar — terlihat jelas, dengan konfirmasi */}
                        <div className="shrink-0">
                            <LogoutButton label="Log Out" />
                        </div>
                    </div>
                </section>

                {/* ============ Kartu-kartu pengaturan ============ */}
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <ProfileCard num="01" title="Informasi Profil">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </ProfileCard>

                        <ProfileCard num="02" title="Keamanan">
                            <UpdatePasswordForm />
                        </ProfileCard>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <ProfileCard num="03" title="Sesi">
                            <p className="text-sm leading-relaxed text-zinc-400">
                                Masih memesan tiket? Sesi Anda tetap aman di
                                perangkat ini. Ingin berpindah akun atau
                                meninggalkan perangkat publik? Akhiri sesi
                                dengan aman.
                            </p>
                            <div className="mt-5">
                                <LogoutButton label="Log Out dari akun ini" />
                            </div>
                        </ProfileCard>

                        <ProfileCard num="04" title="Hapus Akun" danger>
                            <DeleteUserForm />
                        </ProfileCard>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
