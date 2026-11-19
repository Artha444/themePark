import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    QrCode, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
    ArrowLeft, RefreshCw, Zap, Volume2, Camera, CameraOff 
} from 'lucide-react';

export default function ScannerIndex({ gates, staff, recentLogs }) {
    const [selectedGateId, setSelectedGateId] = useState(gates[0]?.id || '');
    const [qrInput, setQrInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [logs, setLogs] = useState(recentLogs || []);
    
    // Live camera scanning state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraSupported, setCameraSupported] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const isProcessingScanRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            setCameraSupported(true);
            try {
                detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
            } catch (e) {
                console.warn('BarcodeDetector initialization fallback', e);
            }
        }
    }, []);

    const executeCheckIn = async (tokenToScan) => {
        if (!tokenToScan || !selectedGateId || isProcessingScanRef.current) return;

        isProcessingScanRef.current = true;
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
                    qr_token: tokenToScan.trim(),
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
            // Cooldown so camera doesn't repeatedly scan the exact same frame in milliseconds
            setTimeout(() => {
                isProcessingScanRef.current = false;
            }, 2000);
        }
    };

    const handleScanSubmit = (e) => {
        if (e) e.preventDefault();
        executeCheckIn(qrInput);
    };

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCameraActive(true);

            // Start detection loop if BarcodeDetector is available
            if (detectorRef.current) {
                scanIntervalRef.current = setInterval(async () => {
                    if (!videoRef.current || isProcessingScanRef.current || videoRef.current.readyState < 2) return;
                    try {
                        const barcodes = await detectorRef.current.detect(videoRef.current);
                        if (barcodes && barcodes.length > 0) {
                            const rawValue = barcodes[0].rawValue;
                            if (rawValue) {
                                executeCheckIn(rawValue);
                            }
                        }
                    } catch (err) {
                        // ignore detector frame errors
                    }
                }, 400);
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setCameraError('Izin akses kamera ditolak atau kamera tidak ditemukan.');
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

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

                            {/* Live Video / Simulated Camera Scanner Box */}
                            <div className="relative w-full h-64 bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-500/40 flex flex-col items-center justify-center overflow-hidden mb-6">
                                {isCameraActive ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 border-4 border-indigo-500/30 pointer-events-none flex items-center justify-center">
                                            <div className="w-44 h-44 border-2 border-indigo-400 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-3 right-3 z-10">
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-xs"
                                            >
                                                <CameraOff className="w-3.5 h-3.5" /> Matikan Kamera
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-indigo-500/5 animate-pulse"></div>
                                        <div className="w-36 h-36 border-2 border-indigo-500 rounded-2xl relative flex items-center justify-center">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                                            <QrCode className="w-16 h-16 text-indigo-400/40 animate-pulse" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition"
                                        >
                                            <Camera className="w-4 h-4" /> Buka Kamera Scanner
                                        </button>
                                        {cameraError && (
                                            <p className="text-[11px] text-rose-400 mt-2 font-medium px-4 text-center">
                                                {cameraError}
                                            </p>
                                        )}
                                    </>
                                )}
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
