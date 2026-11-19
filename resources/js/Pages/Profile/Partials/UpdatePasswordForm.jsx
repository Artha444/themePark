import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

/* Gaya input gelap bertema Vurasi (menimpa style terang TextInput) */
const darkInput =
    '!min-h-[44px] !rounded-xl !border-white/15 !bg-white/[0.06] !text-zinc-100 !shadow-none placeholder:!text-zinc-500 focus:!border-orange-600 focus:!ring-orange-600';

/* Gaya tombol utama oranye (menimpa style terang PrimaryButton) */
const darkPrimary =
    '!min-h-[44px] !rounded-full !bg-orange-600 !px-6 !py-3 !text-xs !font-bold !uppercase !tracking-widest !text-white !shadow-lg !shadow-orange-600/40 hover:!bg-orange-500 focus:!ring-orange-600 focus:!ring-offset-zinc-950';

const darkLabel =
    '!text-[11px] !font-bold !uppercase !tracking-widest !text-zinc-400';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <p className="text-sm leading-relaxed text-zinc-400">
                Pastikan akun memakai kata sandi yang panjang dan acak agar
                tetap aman.
            </p>

            <form onSubmit={updatePassword} className="mt-5 space-y-5">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Kata Sandi Saat Ini"
                        className={darkLabel}
                    />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className={`mt-2 block w-full ${darkInput}`}
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password"
                        value="Kata Sandi Baru"
                        className={darkLabel}
                    />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className={`mt-2 block w-full ${darkInput}`}
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Konfirmasi Kata Sandi"
                        className={darkLabel}
                    />

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className={`mt-2 block w-full ${darkInput}`}
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4 pt-1">
                    <PrimaryButton disabled={processing} className={darkPrimary}>
                        Simpan Sandi
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-semibold text-emerald-300">
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
