import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { QrCode, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ArrowLeft, RefreshCw, Zap, Volume2 } from 'lucide-react';

export default function ScannerIndex({ gates, staff, recentLogs }) {
    const [selectedGateId, setSelectedGateId] = useState(gates[0]?.id || '');
    const [qrInput, setQrInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [logs, setLogs] = useState(recentLogs || []);

    const handleScanSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!qrInput.trim() || !selectedGateId) return;

        setScanning(true);
        setScanResult(null);

        try {
            const response = await fetch('/api/scanner/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    qr_token: qrInput.trim(),
                    gate_id: selectedGateId,
                    staff_id: staff?.id || null,
                }),
            });

            const data = await response.json();
            setScanResult(data);

            // Add log entry
            setLogs(prev => [
                {
                    id: Date.now(),
                    scan_time: new Date().toLocaleTimeString('id-ID'),
                    scan_result: data.success ? 'SUCCESS' : data.status,
                    ticket: data.ticket,
                    gate: gates.find(g => g.id === selectedGateId),
                },
                ...prev.slice(0, 15),
            ]);

            setQrInput('');
        } catch (err) {
            setScanResult({
                success: false,
                status: 'ERROR',
                title: 'KONEKSI TERGANGGU',
                message: 'Gagal menghubungkan ke server scanner.',
            });
        } finally {
            setScanning(false);
        }
    };

    return (
        <>
            <Head title="Gate Staff Scanner | Wonderpark PWA" />

            <div className="min-h-screen bg-[#0B0F19] text-white font-['Inter'] selection:bg-[#F43F5E]">
                
                {/* Top Officer Status Header */}
                <div className="border-b border-slate-800 bg-[#0F172A] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] block">
                                PWA GATE SCANNER ONLINE
                            </span>
                            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-white">
                                {staff?.full_name || 'Petugas Gerbang'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Gate Selector */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#F43F5E]" />
                            <select
                                value={selectedGateId}
                                onChange={e => setSelectedGateId(e.target.value)}
                                className="bg-transparent text-xs font-bold text-white border-none focus:outline-none cursor-pointer"
                            >
                                {gates.map(g => (
                                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                                        {g.gate_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Scanner Console Column */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-[#4F46E5]" /> Terminal Check-In
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    READY TO SCAN
                                </span>
                            </div>

                            {/* Simulated Camera Scanner Box */}
                            <div className="relative w-full h-56 bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-500/40 flex flex-col items-center justify-center overflow-hidden mb-6">
                                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-indigo-500/5 animate-pulse"></div>
                                
                                <div className="w-36 h-36 border-2 border-indigo-500 rounded-2xl relative flex items-center justify-center">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                                    <QrCode className="w-16 h-16 text-indigo-400/40 animate-pulse" />
                                </div>
                                <span className="text-[11px] text-slate-400 mt-3 font-semibold">Arahkan QR Code Tiket ke Kamera</span>
                            </div>

                            {/* Manual QR Input Form */}
                            <form onSubmit={handleScanSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Scan / Input QR Token
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={qrInput}
                                            onChange={e => setQrInput(e.target.value)}
                                            placeholder="Contoh: WONDERPARK-QR-..."
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#4F46E5]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={scanning || !qrInput.trim()}
                                            className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-40"
                                        >
                                            {scanning ? 'Verifikasi...' : 'VERIFIKASI'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* RESULT MODAL / DISPLAY CARD */}
                        {scanResult && (
                            <div className={`rounded-3xl p-6 border-2 transition-all shadow-2xl ${
                                scanResult.success 
                                    ? 'bg-emerald-950/80 border-emerald-500 text-white' 
                                    : 'bg-rose-950/80 border-rose-500 text-white'
                            }`}>
                                <div className="flex items-start gap-4">
                                    {scanResult.success ? (
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400 shrink-0 mt-1" />
                                    ) : (
                                        <XCircle className="w-12 h-12 text-rose-400 shrink-0 mt-1" />
                                    )}
                                    <div className="space-y-1 flex-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 inline-block">
                                            RESULT: {scanResult.status}
                                        </span>
                                        <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-xl">
                                            {scanResult.title}
                                        </h3>
                                        <p className="text-sm opacity-90">{scanResult.message}</p>

                                        {scanResult.ticket && (
                                            <div className="mt-3 pt-3 border-t border-white/10 text-xs space-y-1 font-mono">
                                                <p>KODE TIKET: <span className="font-bold">{scanResult.ticket.ticket_code}</span></p>
                                                <p>TIPE: <span className="font-bold">{scanResult.ticket.order_item?.daily_inventory?.ticket_tier?.name}</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Gate Scan Log Stream */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-base flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#F59E0B]" /> Riwayat Scan Real-time
                            </h2>
                            <span className="text-xs text-slate-400 font-bold">{logs.length} Scan</span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px] pr-1">
                            {logs.map((log) => {
                                const isSuccess = log.scan_result === 'SUCCESS';
                                return (
                                    <div key={log.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isSuccess ? (
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                                                    <XCircle className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-mono text-xs font-bold block text-white">
                                                    {log.ticket?.ticket_code || 'TKT-UNKNOWN'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {log.gate?.gate_name || 'Gerbang Main'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                            }`}>
                                                {log.scan_result}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
