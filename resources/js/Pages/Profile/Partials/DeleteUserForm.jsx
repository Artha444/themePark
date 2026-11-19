import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

/* Gaya input gelap bertema Vurasi */
const darkInput =
    '!min-h-[44px] !rounded-xl !border-white/15 !bg-white/[0.06] !text-zinc-100 !shadow-none placeholder:!text-zinc-500 focus:!border-rose-600 focus:!ring-rose-600';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-5 ${className}`}>
            <p className="text-sm leading-relaxed text-zinc-400">
                Setelah akun dihapus, seluruh data dan tiket Anda akan
                dihapus permanen. Unduh dulu data yang ingin disimpan.
            </p>

            <DangerButton
                onClick={confirmUserDeletion}
                className="!min-h-[44px] !rounded-full !px-5 !py-2.5 !text-xs !font-bold !uppercase !tracking-widest !shadow-lg !shadow-rose-600/30 hover:!bg-rose-500 focus:!ring-rose-600 focus:!ring-offset-zinc-950 cursor-pointer"
            >
                Hapus Akun
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 sm:p-8">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </div>

                    <h2 className="mt-3 text-center font-anton text-xl uppercase tracking-[0.02em] text-white sm:text-2xl">
                        Hapus akun secara permanen?
                    </h2>

                    <p className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
                        Seluruh data akan dihapus permanen. Masukkan kata sandi
                        untuk mengonfirmasi.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Kata Sandi"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className={`mt-1 block w-full ${darkInput}`}
                            isFocused
                            placeholder="Kata sandi Anda"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                        <DangerButton
                            disabled={processing}
                            className="!min-h-[44px] flex-1 !rounded-full !px-6 !py-2.5 !text-xs !font-bold !uppercase !tracking-widest hover:!bg-rose-500 focus:!ring-rose-600 focus:!ring-offset-zinc-950 cursor-pointer"
                        >
                            {processing ? 'Memproses…' : 'Hapus Akun'}
                        </DangerButton>

                        <SecondaryButton
                            onClick={closeModal}
                            className="!min-h-[44px] flex-1 !rounded-full !border !border-white/20 !bg-transparent !px-6 !py-2.5 !text-xs !font-bold !uppercase !tracking-widest !text-zinc-200 hover:!bg-white/10 focus:!ring-white/40 focus:!ring-offset-zinc-950 cursor-pointer"
                        >
                            Batal
                        </SecondaryButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
