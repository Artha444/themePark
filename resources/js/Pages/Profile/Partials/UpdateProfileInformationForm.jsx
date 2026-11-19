import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

/* Gaya input gelap bertema Vurasi (menimpa style terang TextInput) */
const darkInput =
    '!min-h-[44px] !rounded-xl !border-white/15 !bg-white/[0.06] !text-zinc-100 !shadow-none placeholder:!text-zinc-500 focus:!border-orange-600 focus:!ring-orange-600';

/* Gaya tombol utama oranye (menimpa style terang PrimaryButton) */
const darkPrimary =
    '!min-h-[44px] !rounded-full !bg-orange-600 !px-6 !py-3 !text-xs !font-bold !uppercase !tracking-widest !text-white !shadow-lg !shadow-orange-600/40 hover:!bg-orange-500 focus:!ring-orange-600 focus:!ring-offset-zinc-950';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel
                        htmlFor="name"
                        value="Nama"
                        className="!text-[11px] !font-bold !uppercase !tracking-widest !text-zinc-400"
                    />

                    <TextInput
                        id="name"
                        className={`mt-2 block w-full ${darkInput}`}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Email"
                        className="!text-[11px] !font-bold !uppercase !tracking-widest !text-zinc-400"
                    />

                    <TextInput
                        id="email"
                        type="email"
                        className={`mt-2 block w-full ${darkInput}`}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-xs text-amber-300">
                        Alamat email Anda belum terverifikasi.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="font-bold underline hover:text-amber-200"
                        >
                            Kirim ulang email verifikasi.
                        </Link>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-semibold text-emerald-300">
                                Tautan verifikasi baru telah dikirim ke email
                                Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                    <PrimaryButton disabled={processing} className={darkPrimary}>
                        Simpan
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
