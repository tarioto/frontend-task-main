import { mkdirSync } from 'node:fs';

// The server writes test uploads here when NODE_ENV=test (see src/server/server.ts).
// These folders are gitignored, so create them before any suite runs on a clean checkout.
const TEST_UPLOAD_DIRS = ['src/server/test/uploads', 'src/server/test/uploads-chunks'];

export const setup = (): void => {
    for (const dir of TEST_UPLOAD_DIRS) {
        mkdirSync(dir, { recursive: true });
    }
};
