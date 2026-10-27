import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vite-plus';

export default defineConfig(({ mode }) => {
    const backend = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || 'http://localhost:8000';
    return {
        plugins: [react(), tailwindcss()],
        resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
        server: {
            host: 'localhost',
            port: 5173,
            strictPort: true,
            proxy: {
                '/api': { target: backend, changeOrigin: true },
                '/sanctum': { target: backend, changeOrigin: true },
            },
        },
        lint: { ignorePatterns: ['starter/**', 'node_modules/**', 'dist/**'] },
        fmt: {
            ignorePatterns: ['starter/**', 'node_modules/**', 'dist/**'],
            singleQuote: true,
            tabWidth: 4,
        },
    };
});
