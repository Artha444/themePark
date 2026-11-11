import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { Ticket, ArrowLeft, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk Akun Pengunjung | Vurasi" />

            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
                
                {/* Back to Home */}
                <div className="w-full max-w-md mb-6 flex justify-between items-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 text-xs font-bold transition">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>
                    <Link href="/admin/login" className="text-xs font-bold text-slate-500 hover:text-slate-800">
                        Login Admin / Staf &rarr;
                    </Link>
                </div>

                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 to-amber-500" />

                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-xs">
                            <Ticket className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk Akun Pengunjung</h1>
                        <p className="text-xs text-slate-500 mt-1.5">
                            Akses riwayat e-tiket barcode Anda, lakukan reschedule, dan lanjutkan checkout.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Alamat Email
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@email.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white outline-none"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-rose-600 font-semibold mt-1.5">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Kata Sandi
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                                    >
                                        Lupa sandi?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white outline-none"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-600 font-semibold mt-1.5">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span>Ingat saya di perangkat ini</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-3 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span>{processing ? 'Memproses...' : 'Masuk Sekarang'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
                        Belum punya akun pengunjung?{' '}
                        <Link href={route('register')} className="font-extrabold text-orange-600 hover:text-orange-700">
                            Daftar Gratis di Sini
                        </Link>
                    </div>
                </div>

                {/* Footer Portal Link */}
                <div className="mt-6 text-center space-y-1 text-xs text-slate-400">
                    <p>Petugas operasional atau pengelola wahana?{' '}
                        <Link href="/admin/login" className="font-bold text-slate-700 hover:text-orange-600 underline">
                            Login Portal Konsol Staf
                        </Link>
                    </p>
                </div>

            </div>
        </>
    );
}
