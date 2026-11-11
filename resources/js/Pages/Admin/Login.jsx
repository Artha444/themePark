import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';

export default function AdminLogin({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login Portal Administrator & Staff | Vurasi" />

            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
                
                {/* Back to Home */}
                <div className="w-full max-w-md mb-6 flex justify-between items-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Portal Tiket
                    </Link>
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        SECURE CONSOLE
                    </span>
                </div>

                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Top Glow Decor */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-indigo-600 to-amber-500" />

                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 text-orange-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Portal Manajemen &amp; Staf</h1>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            Khusus untuk Administrator Pusat, Admin Wahana Destinasi, dan Petugas Gate Scanner.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Email Resmi / Akun Staf
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@vurasi.com atau staff.gate@..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-rose-400 font-semibold mt-1.5">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-400 font-semibold mt-1.5">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-0"
                                />
                                <span>Ingat saya</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-3 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span>{processing ? 'Memverifikasi...' : 'Masuk ke Konsol Manajemen'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Quick Demo Credentials Box */}
                    <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
                        <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                            Akun Uji Coba Tersedia:
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                            <p>• Super Admin: <span className="text-orange-400">superadmin@vurasi.com</span></p>
                            <p>• Admin Park: <span className="text-indigo-400">admin.wonderpark@vurasi.com</span></p>
                            <p>• Staff Gerbang: <span className="text-emerald-400">staff.gate@wonderpark.com</span></p>
                            <p className="text-slate-500">Password: <span className="text-white">password123</span></p>
                        </div>
                    </div>
                </div>

                {/* Visitor Login Link */}
                <p className="mt-6 text-center text-xs text-slate-500">
                    Bukan administrator?{' '}
                    <Link href="/login" className="font-bold text-orange-500 hover:text-orange-400 underline">
                        Login sebagai Pengunjung di sini
                    </Link>
                </p>

            </div>
        </>
    );
}

