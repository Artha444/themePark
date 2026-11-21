/**
 * VURASI — PHOTO MARQUEE
 *
 * Pita gambar tanpa teks: satu baris foto besar berjarak rapat, bergerak
 * terus (endless). Jeda saat hover/focus, tombol pause dari section,
 * dan berhenti total pada reduced-motion.
 *
 * Props:
 * - items: [{ caption, image }]
 * - reverse: boolean — arah gerak
 * - paused: boolean — dikontrol section
 * - label: string — aria-label untuk track
 */
export default function PhotoMarquee({ items = [], reverse = false, paused = false, label = 'Foto suasana destinasi' }) {
    if (items.length === 0) return null;

    const group = (ariaHidden) => (
        <div className="pm-group" aria-hidden={ariaHidden || undefined}>
            {items.map((item, index) => (
                <figure key={`${item.caption}-${index}`} className="pm-card">
                    <img
                        src={item.image}
                        alt={ariaHidden ? '' : `Suasana ${item.caption}`}
                        width="720"
                        height="520"
                        loading="lazy"
                        draggable="false"
                        onError={(event) => {
                            const fallback = '/images/ferris.png';
                            if (event.currentTarget.src.endsWith(fallback)) return;
                            event.currentTarget.src = fallback;
                        }}
                    />
                </figure>
            ))}
        </div>
    );

    return (
        <div className={`pm-viewport${paused ? ' pm-paused' : ''}${reverse ? ' pm-reverse' : ''}`}>
            <div className="pm-track" role="group" aria-label={label}>
                {group(false)}
                {group(true)}
            </div>
        </div>
    );
}
