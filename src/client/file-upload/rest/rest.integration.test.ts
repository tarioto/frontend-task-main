// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { type Server } from 'node:http';
import { type AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { app } from '../../../server/server';

import { createRestUpload } from './createRestUpload';
import { fetchFiles } from './fetchFiles';

let server: Server;

beforeAll(async () => {
    server = await new Promise<Server>((resolve) => {
        const listening = app.listen(0, () => resolve(listening));
    });
    // The client calls the API with same-origin paths; in Node, point them at the test server.
    const { port } = server.address() as AddressInfo;
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', (path: string, init?: RequestInit) => realFetch(`http://localhost:${port}${path}`, init));
});

afterAll(async () => {
    vi.unstubAllGlobals();
    await new Promise((resolve) => {
        server.close(resolve);
    });
});

// Where the server stores files when NODE_ENV=test (see src/server/server.ts).
const TEST_UPLOAD_DIR = 'src/server/test/uploads';

// The server's own test suite clears the shared upload folder, so each test uses a name no other test uses.
const uniqueName = (name: string) => `${crypto.randomUUID()}-${name}`;

describe('REST upload against the demo server', () => {
    it('should upload a small file in one request and list it with its size', async () => {
        const name = uniqueName('small.txt');
        const content = 'Hello from Frontify!';

        const upload = createRestUpload();

        await upload(new File([content], name));

        expect(await fetchFiles()).toContainEqual({ name, size: content.length });
    });

    it('should upload a larger file in chunks that the server merges back into the original', async () => {
        const name = uniqueName('chunked.txt');
        const content = 'Chunk one, chunk two, chunk three, and the last chunk.';
        const upload = createRestUpload({ chunkSize: 8 });

        await upload(new File([content], name));

        // The server replies before the merged file is fully written (#14), so wait for it to settle.
        await vi.waitFor(async () => {
            expect(await fetchFiles()).toContainEqual({ name, size: content.length });
            expect(await readFile(`${TEST_UPLOAD_DIR}/${name}`, 'utf8')).toBe(content);
        });
    });
});
