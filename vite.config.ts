import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'happy-dom',
        // Server tests need Node's own fetch/FormData; happy-dom's versions don't encode multipart bodies the way Express expects.
        environmentMatchGlobs: [['src/server/**', 'node']],
        env: {
            NODE_ENV: 'test',
        },
        globalSetup: ['src/server/test/global-setup.ts'],
    },
});
