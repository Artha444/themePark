import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: 'localhost',
        proxy: {
            '/admin': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/sanctum': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/login': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/logout': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/register': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/password': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/profile': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/verification': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/confirm-password': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/midtrans': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/scanner': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/tickets': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/my-orders': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/dashboard': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/parks': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
});
