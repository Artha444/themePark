import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { getNeonAuthClient } from '@/authClient';

/* Ikon keluar — gaya Lucide (stroke 2) */
function IconLogout({ className = 'h-4 w-4' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        </svg>
    );
}

/**
 * Tombol keluar dengan dialog konfirmasi.
 * Sesi Neon Auth (jika ada) diakhiri dulu sebelum logout Laravel —
 * logika sama dengan yang ada di AuthenticatedLayout.
 *
 * variant:
 * - "default" — tombol pill terlihat jelas (untuk halaman profil)
 * - "menu"    — item menu polos (dropdown / menu responsive)
 */
export default function LogoutButton({
    variant = 'default',
    label = 'Keluar',
    className = '',
}) {
    const { isNeonAuthUser } = usePage().props;
    const [confirming, setConfirming] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogout = async () => {
        setLoggingOut(true);
        setErrorMessage('');

        try {
            if (isNeonAuthUser) {
                const result = await getNeonAuthClient().signOut();

                if (result.error) {
                    throw new Error(result.error.message);
                }
            }

            router.post(route('logout'));
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Logout gagal dilakukan.',
            );
            setLoggingOut(false);
        }
    };

    const buttonCls =
        variant === 'menu'
            ? `flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50 ${className}`
            : `inline-flex min-h-[44px] items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-300 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50 ${className}`;

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setErrorMessage('');
                    setConfirming(true);
                }}
                disabled={loggingOut}
                className={buttonCls}
            >
                <IconLogout className="h-4 w-4" />
                {loggingOut ? 'Memproses…' : label}
            </button>

            {/* Dialog konfirmasi logout */}
            <Transition show={confirming} as={Fragment}>
                <Dialog
                    className="relative z-50"
                    onClose={() => {
                        if (!loggingOut) setConfirming(false);
                    }}
                >
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div
                            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
                            aria-hidden="true"
                        />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-200"
                                enterFrom="opacity-0 translate-y-6 scale-95"
                                enterTo="opacity-100 translate-y-0 scale-100"
                                leave="ease-in duration-150"
                                leaveFrom="opacity-100 translate-y-0 scale-100"
                                leaveTo="opacity-0 translate-y-6 scale-95"
                            >
                                <DialogPanel className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl shadow-black/60 sm:p-8">
                                    {/* Ikon peringatan */}
                                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-400">
                                        <IconLogout className="h-6 w-6" />
                                    </div>

                                    <h3 className="mt-4 text-center font-anton text-2xl uppercase tracking-[0.02em]">
                                        Keluar dari akun?
                                    </h3>
                                    <p className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
                                        Sesi Anda akan diakhiri dan Anda perlu
                                        masuk kembali untuk memesan tiket.
                                    </p>

                                    {errorMessage && (
                                        <div
                                            role="alert"
                                            className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-xs text-rose-300"
                                        >
                                            {errorMessage}
                                        </div>
                                    )}

                                    {/* Aksi */}
                                    <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            disabled={loggingOut}
                                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-rose-500 disabled:opacity-60 cursor-pointer"
                                        >
                                            {loggingOut ? 'Memproses…' : 'Ya, Keluar'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirming(false)}
                                            disabled={loggingOut}
                                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:bg-white/10 disabled:opacity-60 cursor-pointer"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
