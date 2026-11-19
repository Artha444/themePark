import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

/**
 * Komponen LocationPicker 100% Gratis:
 * - Menggunakan Nominatim OpenStreetMap Search API (bebas biaya, tanpa API Key, tanpa kartu kredit)
 * - Mencegah admin mengetik alamat fiktif: Wajib memilih dari tempat/POI resmi yang terverifikasi di peta dunia
 * - Otomatis mencatat koordinat Latitude, Longitude, Alamat Lengkap, dan Nama Tempat
 * - Menyediakan link preview langsung ke Google Maps resmi berdasarkan koordinat
 */
export default function LocationPicker({
    initialAddress = '',
    initialLat = null,
    initialLng = null,
    initialPlaceName = '',
    initialCity = '',
    onChange, // callback ({ address, lat, lng, city, placeName })
    error = null,
}) {
    const [query, setQuery] = useState(initialPlaceName || initialAddress || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(
        initialLat && initialLng
            ? {
                  lat: parseFloat(initialLat),
                  lng: parseFloat(initialLng),
                  address: initialAddress,
                  placeName: initialPlaceName || initialAddress,
                  city: initialCity,
              }
            : null
    );
    const [searchMessage, setSearchMessage] = useState('');
    const debounceTimer = useRef(null);

    // Sync saat initial props berubah (misal ganti park yang diedit)
    useEffect(() => {
        if (initialLat && initialLng) {
            setSelectedLocation({
                lat: parseFloat(initialLat),
                lng: parseFloat(initialLng),
                address: initialAddress,
                placeName: initialPlaceName || initialAddress,
                city: initialCity,
            });
            setQuery(initialPlaceName || initialAddress);
        }
    }, [initialLat, initialLng, initialAddress, initialPlaceName, initialCity]);

    const handleSearch = (text) => {
        setQuery(text);
        setSearchMessage('');

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (!text || text.trim().length < 3) {
            setResults([]);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Nominatim API: Bebas biaya dan mencakup seluruh dunia termasuk Indonesia
                const encodedQuery = encodeURIComponent(text.trim());
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=5&countrycodes=id`,
                    {
                        headers: {
                            'Accept-Language': 'id,en',
                        },
                    }
                );
                const data = await res.json();
                setResults(data || []);
                if (!data || data.length === 0) {
                    setSearchMessage('Lokasi tidak ditemukan. Pastikan nama tempat/kota/alamat sesuai nama aslinya.');
                }
            } catch (err) {
                console.error('Gagal mengambil data lokasi:', err);
                setSearchMessage('Koneksi pencarian peta bermasalah, silakan coba beberapa saat lagi.');
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const handleSelectLocation = (item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const displayName = item.display_name;
        
        // Ambil nama tempat atau jalan utama
        const placeName = item.name || item.address?.amenity || item.address?.tourism || item.address?.building || item.display_name.split(',')[0];
        
        // Deteksi kota/kabupaten
        const city = item.address?.city || item.address?.county || item.address?.state_district || item.address?.state || '';

        const locationData = {
            address: displayName,
            lat,
            lng,
            placeName,
            city,
        };

        setSelectedLocation(locationData);
        setQuery(placeName);
        setResults([]);
        setSearchMessage('');

        if (onChange) {
            onChange(locationData);
        }
    };

    const handleReset = () => {
        setSelectedLocation(null);
        setQuery('');
        setResults([]);
        if (onChange) {
            onChange({
                address: '',
                lat: null,
                lng: null,
                placeName: '',
                city: '',
            });
        }
    };

    const googleMapsUrl = selectedLocation
        ? `https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`
        : null;

    // OpenStreetMap Embed Tile (100% Gratis dan Legal)
    const osmEmbedUrl = selectedLocation
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.lng - 0.008}%2C${selectedLocation.lat - 0.005}%2C${selectedLocation.lng + 0.008}%2C${selectedLocation.lat + 0.005}&layer=mapnik&marker=${selectedLocation.lat}%2C${selectedLocation.lng}`
        : null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Lokasi Terverifikasi di Peta <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> 100% Gratis & Resmi
                </span>
            </div>

            {/* Input Pencarian Lokasi Resmi */}
            {!selectedLocation ? (
                <div className="relative">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Ketik nama galeri, mall, taman, atau jalan (min. 3 huruf)..."
                            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                        {isLoading && (
                            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                    </div>

                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Admin harus memilih lokasi resmi yang ada di database peta untuk menghindari alamat palsu.
                    </p>

                    {searchMessage && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            {searchMessage}
                        </p>
                    )}

                    {/* Dropdown Hasil Pencarian */}
                    {results.length > 0 && (
                        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl divide-y divide-gray-100 dark:divide-gray-700">
                            {results.map((item, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => handleSelectLocation(item)}
                                    className="p-3 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors flex items-start gap-2.5"
                                >
                                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                                            {item.name || item.display_name.split(',')[0]}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                            {item.display_name}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                /* Card Lokasi Terpilih & Terverifikasi */
                <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        {selectedLocation.placeName || 'Lokasi Terverifikasi'}
                                    </h4>
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                                        Valid di Maps
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                    {selectedLocation.address}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                    <span>Lat: <strong className="text-gray-700 dark:text-gray-300">{selectedLocation.lat?.toFixed(5)}</strong></span>
                                    <span>Lng: <strong className="text-gray-700 dark:text-gray-300">{selectedLocation.lng?.toFixed(5)}</strong></span>
                                    {selectedLocation.city && (
                                        <span>Kota: <strong className="text-gray-700 dark:text-gray-300">{selectedLocation.city}</strong></span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1 shrink-0 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Ganti Lokasi"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Ganti</span>
                        </button>
                    </div>

                    {/* Preview Peta Mini & Link Google Maps */}
                    <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {googleMapsUrl && (
                            <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Buka Langsung di Google Maps
                            </a>
                        )}

                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            Koordinat terkunci dan siap disimpan
                        </span>
                    </div>

                    {/* Embed Peta Mini Gratis */}
                    {osmEmbedUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-36 w-full">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src={osmEmbedUrl}
                                title="Pratinjau Peta"
                                className="w-full h-full"
                            />
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}
