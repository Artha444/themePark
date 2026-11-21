import { Link, router } from '@inertiajs/react';
import { useId, useRef, useState } from 'react';

/**
 * Die-cut booking slip for the hero. The form stays the source of truth for
 * park_id and date; the page around it owns nothing but the data it passes in.
 * `status`, `error`, `notice` and `disabled` let a caller (or the state preview)
 * drive the eight states. `error` is either a string (form-level) or
 * `{ field: 'park_id' | 'date', message }` so only the failing control is
 * marked invalid. Nothing here prints a success on its own.
 */
export default function HeroSearchTicket({
    parks = [],
    today = '',
    initialParkId = '',
    initialDate = today,
    error = '',
    notice = '',
    status = 'idle',
    disabled = false,
}) {
    const uid = useId().replace(/:/g, '');
    const parkIdField = `vst-park-${uid}`;
    const dateField = `vst-date-${uid}`;
    const noticeId = `vst-notice-${uid}`;

    const [parkId, setParkId] = useState(initialParkId);
    const [date, setDate] = useState(initialDate || '');
    const [pending, setPending] = useState(false);
    const [localError, setLocalError] = useState(null);
    const dateRef = useRef(null);

    const propError = typeof error === 'string'
        ? { field: 'form', message: error }
        : error && typeof error === 'object'
            ? { field: error.field || 'form', message: error.message || '' }
            : null;
    const errorInfo = localError || propError;

    const isLoading = pending || status === 'loading';
    const isError = Boolean(errorInfo?.message) || status === 'error';
    const isSuccess = status === 'success' && Boolean(notice);
    const parkInvalid = errorInfo?.field === 'park_id';
    const dateInvalid = errorInfo?.field === 'date';

    const parksByCity = parks.reduce((groups, park) => {
        const city = park.city || 'Lainnya';
        if (!groups[city]) groups[city] = [];
        groups[city].push(park);
        return groups;
    }, {});

    const handleSubmit = (event) => {
        event.preventDefault();
        if (isLoading || disabled) return;

        if (date && today && date < today) {
            setLocalError({ field: 'date', message: 'Pilih tanggal kunjungan yang belum lewat.' });
            dateRef.current?.focus();
            return;
        }
        setLocalError(null);

        const params = new URLSearchParams();
        if (parkId) params.set('park_id', parkId);
        if (date) params.set('date', date);
        const query = params.toString();

        setPending(true);
        router.get(query ? `/tickets?${query}` : '/tickets', {}, {
            onFinish: () => setPending(false),
        });
    };

    return (
        <form className="vst" lang="id" onSubmit={handleSubmit} aria-busy={isLoading} noValidate>
            <div className="vst__card">
                <div className="vst__body">
                    <div className="vst__head">
                        <span className="vst__head-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                <path d="M13 5v2M13 11v2M13 17v2" />
                            </svg>
                        </span>
                        <h2 className="vst__title">Cari tiket masuk</h2>
                    </div>

                    <div className="vst__fields">
                        <div className="vst__field">
                            <label className="vst__label vst__label--strong" htmlFor={parkIdField}>Destinasi</label>
                            <span className="vst__control-wrap">
                                <select
                                    id={parkIdField}
                                    className="vst__control vst__control--select"
                                    name="park_id"
                                    value={parkId}
                                    onChange={(event) => setParkId(event.target.value)}
                                    disabled={disabled}
                                    aria-invalid={parkInvalid || undefined}
                                    aria-describedby={parkInvalid ? noticeId : undefined}
                                >
                                    <option value="">Semua destinasi</option>
                                    {Object.entries(parksByCity).map(([city, items]) => (
                                        <optgroup key={city} label={city}>
                                            {items.map((park) => (
                                                <option key={park.id} value={park.id}>{park.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <svg className="vst__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </span>
                        </div>

                        <div className="vst__field">
                            <label className="vst__label" htmlFor={dateField}>Tanggal kunjungan</label>
                            <span className="vst__control-wrap">
                                <input
                                    id={dateField}
                                    ref={dateRef}
                                    className="vst__control"
                                    type="date"
                                    name="date"
                                    lang="id"
                                    min={today || undefined}
                                    value={date}
                                    onChange={(event) => {
                                        setDate(event.target.value);
                                        if (localError) setLocalError(null);
                                    }}
                                    disabled={disabled}
                                    aria-invalid={dateInvalid || undefined}
                                    aria-describedby={dateInvalid ? noticeId : undefined}
                                />
                            </span>
                        </div>
                    </div>

                    {(isError || isSuccess) && (
                        <p id={noticeId} className="vst__notice" role={isError ? 'alert' : undefined}>
                            {isError ? (errorInfo?.message || 'Periksa kembali destinasi dan tanggal kunjunganmu.') : notice}
                        </p>
                    )}

                    <Link className="vst__quiet" href="/tickets">Lihat semua park</Link>
                </div>

                <div className="vst__stub">
                    <div>
                        <span className="vst__stub-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                <path d="M13 5v2M13 11v2M13 17v2" />
                            </svg>
                        </span>
                        <p className="vst__stub-title">Tiket masuk</p>
                        <p className="vst__stub-copy">E-tiket QR langsung terbit.</p>
                    </div>
                    <button className="vst__submit" type="submit" disabled={disabled || isLoading} aria-busy={isLoading}>
                        <span className="vst__spinner" aria-hidden="true" />
                        <span>Cari tiket</span>
                        {!isLoading && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        )}
                        {isLoading && <span className="vst__sr-only" role="status">Mencari tiket</span>}
                    </button>
                </div>
            </div>
        </form>
    );
}
