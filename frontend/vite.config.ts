import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: 'localhost', port: 5173, strictPort: true },
    lint: { ignorePatterns: ['starter/**', 'node_modules/**', 'dist/**'] },
    fmt: {
        ignorePatterns: ['starter/**', 'node_modules/**', 'dist/**'],
        singleQuote: true,
        tabWidth: 4,
    },
});
