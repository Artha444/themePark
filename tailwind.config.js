import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                // PLUMY landing — headline/body harus Montserrat (support Cyrillic)
                plumy: ['Montserrat', ...defaultTheme.fontFamily.sans],
                script: ['Caveat', 'cursive'],
                // Landing OTTA (TokaPark × Wahanaku style)
                inter: ['Inter', ...defaultTheme.fontFamily.sans],
                // VURASI gallery landing — display art-deco + italic editorial
                display: ['"Poiret One"', '"Iowan Old Style"', 'Georgia', 'serif'],
                edserif: ['"Playfair Display"', 'Georgia', 'serif'],
            },
            colors: {
                // PLUMY "picnic-cloth editorial" palette
                plumysky: '#79B1DC',
                plumycream: '#FBF1E4',
                plumybeige: '#F4E6D6',
                plumymaroon: '#8B0A14',
                plumyink: '#3A3A3A',
                plumystripe: '#D5E3EC',
                // TokaPark/Wahanaku OTTA palette (model-1 × model-2)
                tblue: '#0077B6',
                tcyan: '#00B4D8',
                tdark: '#03045E',
                tsun: '#FF9F1C',
                tcoral: '#FF70A6',
            },
            maxWidth: {
                content: '76rem',
            },
            keyframes: {
                'plumy-marquee': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(-50%)' },
                },
                // Progress bar autoplay hero slider (durasi harus = interval slide)
                'hero-progress': {
                    from: { width: '0%' },
                    to: { width: '100%' },
                },
                // Ken-burns zoom halus pada slide hero aktif
                'kenburns': {
                    from: { transform: 'scale(1)' },
                    to: { transform: 'scale(1.08)' },
                },
            },
            animation: {
                'plumy-marquee': 'plumy-marquee 26s linear infinite',
                'hero-progress': 'hero-progress 6s linear forwards',
                'kenburns': 'kenburns 9s ease-out forwards',
            },
        },
    },

    plugins: [forms],
};
