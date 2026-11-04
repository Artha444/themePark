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
            },
            colors: {
                // PLUMY "picnic-cloth editorial" palette
                plumysky: '#79B1DC',
                plumycream: '#FBF1E4',
                plumybeige: '#F4E6D6',
                plumymaroon: '#8B0A14',
                plumyink: '#3A3A3A',
                plumystripe: '#D5E3EC',
            },
            maxWidth: {
                content: '76rem',
            },
            keyframes: {
                'plumy-marquee': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(-50%)' },
                },
            },
            animation: {
                'plumy-marquee': 'plumy-marquee 26s linear infinite',
            },
        },
    },

    plugins: [forms],
};
