import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { getNeonAuthClient } from '@/authClient';

export default function NeonCallback() {
    const [error, setError] = useState('');

    useEffect(() => {
        const completeSignIn = async () => {
            try {
                const { data, error: sessionError } = await getNeonAuthClient().getSession();

                if (sessionError) {
                    throw new Error(sessionError.message);
                }

                const token = data?.session?.token;

                if (!token) {
                    throw new Error('Sesi Neon Auth tidak ditemukan setelah login Google.');
                }

                const response = await window.axios.post(
                    route('neon.session.store'),
                    {},
                    {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (!response.data?.redirect) {
                    throw new Error('Laravel tidak mengembalikan tujuan setelah login.');
                }

                window.location.replace(response.data.redirect);
            } catch (exception) {
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'Login Google gagal diselesaikan.',
                );
            }
        };

        void completeSignIn();
    }, []);

    return (
        <>
            <Head title="Menyelesaikan Login Google" />
            <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
                    <h1 className="text-xl font-bold text-slate-900">
                        {error ? 'Login belum selesai' : 'Menyelesaikan login...'}
                    </h1>
                    <p className="mt-3 text-sm text-slate-600" role={error ? 'alert' : undefined}>
                        {error || 'Mohon tunggu, sesi Anda sedang diverifikasi.'}
                    </p>
                    {error && (
                        <a
                            href={route('login')}
                            className="mt-6 inline-flex font-bold text-orange-600 hover:text-orange-700"
                        >
                            Kembali ke halaman login
                        </a>
                    )}
                </div>
            </main>
        </>
    );
}
