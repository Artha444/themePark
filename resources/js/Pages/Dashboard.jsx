import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500">
                        &sect; Member Area
                    </p>
                    <h2 className="mt-1 font-anton text-2xl uppercase tracking-[0.02em] text-white sm:text-3xl">
                        Dashboard
                    </h2>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/30">
                        <div className="p-6 text-sm font-semibold uppercase tracking-widest text-zinc-300">
                            Anda sudah masuk!
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
