import HeroSearchTicket from './HeroSearchTicket';

/** Hallmark eight-state preview. Each row forces one state with a helper class. */
const states = [
    { label: 'Default', className: '', props: {} },
    { label: 'Hover', className: 'vst-state--hover', props: {} },
    { label: 'Focus', className: 'vst-state--focus', props: {} },
    { label: 'Active', className: 'vst-state--active', props: {} },
    { label: 'Disabled', className: 'vst-state--disabled', props: { disabled: true } },
    { label: 'Loading', className: 'vst-state--loading', props: { status: 'loading' } },
    { label: 'Error', className: 'vst-state--error', props: { error: { field: 'date', message: 'Park itu tutup pada tanggal ini. Pilih tanggal lain.' } } },
    { label: 'Success', className: 'vst-state--success', props: { status: 'success', notice: 'Tiket tersedia untuk pilihanmu.' } },
];

export default function HeroSearchTicketPreview() {
    return (
        <div className="vst-preview">
            {states.map((state) => (
                <section key={state.label}>
                    <h2>{state.label}</h2>
                    <div className={state.className}>
                        <HeroSearchTicket {...state.props} />
                    </div>
                </section>
            ))}
        </div>
    );
}
