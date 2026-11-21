import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchFiles } from './fetchFiles';

const respondWith = (status: number, body: unknown) => {
    const fetch = vi.fn((_url: string) => Promise.resolve(new Response(JSON.stringify(body), { status })));
    vi.stubGlobal('fetch', fetch);
    return fetch;
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('fetchFiles', () => {
    it('should return the stored files listed by the server', async () => {
        const fetch = respondWith(200, { files: [{ name: 'photo.jpg', size: 2048 }] });

        await expect(fetchFiles()).resolves.toEqual([{ name: 'photo.jpg', size: 2048 }]);
        expect(fetch.mock.calls[0]?.[0]).toBe('/api/files');
    });

    it("should reject with the server's message when listing fails", async () => {
        respondWith(500, { message: "ENOENT: no such file or directory, scandir 'uploads'" });

        await expect(fetchFiles()).rejects.toThrow("ENOENT: no such file or directory, scandir 'uploads'");
    });
});
