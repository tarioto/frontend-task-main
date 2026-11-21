import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush } from '../../test/flush';

import { createRestUpload } from './createRestUpload';

type SentRequest = {
    url: string;
    fields: FormData;
    respond: (status: number, body?: unknown) => void;
    fail: () => void;
};

/** Stands in for the network: records every request and lets the test decide when and how each one completes. */
const stubNetwork = () => {
    const requests: SentRequest[] = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
            requests.push({
                url,
                fields: init.body as FormData,
                respond: (status, body = {}) =>
                    resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })),
                fail: () => reject(new TypeError('Failed to fetch')),
            });
        });
    });
    return requests;
};

/** Answers every request with 200, including ones sent in response to earlier answers. */
const answerAll = async (requests: SentRequest[]) => {
    await flush();
    for (let index = 0; index < requests.length; index++) {
        requests[index].respond(200);
        await flush();
    }
};

const describeChunk = async ({ url, fields }: SentRequest) => {
    const chunk = fields.get('file') as File;
    return {
        url,
        name: chunk.name,
        content: await chunk.text(),
        currentChunkIndex: fields.get('currentChunkIndex'),
        totalChunks: fields.get('totalChunks'),
    };
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('createRestUpload', () => {
    it('should send a file no larger than the chunk size as a single upload', async () => {
        const requests = stubNetwork();
        const upload = createRestUpload({ chunkSize: 10 });
        const file = new File(['small'], 'small.txt');

        const uploading = upload(file);
        await flush();

        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe('/api/upload-single');
        expect(requests[0].fields.get('file')).toBe(file);

        requests[0].respond(200);
        await expect(uploading).resolves.toBeUndefined();
    });

    it('should split a larger file into chunks sent with their index, the total and the file name', async () => {
        const requests = stubNetwork();
        const upload = createRestUpload({ chunkSize: 4 });

        const uploading = upload(new File(['abcdefghij'], 'large.txt'));
        await answerAll(requests);
        await uploading;

        const chunks = await Promise.all(requests.map(describeChunk));
        expect(chunks).toEqual([
            { url: '/api/upload-chunk', name: 'large.txt', content: 'abcd', currentChunkIndex: '0', totalChunks: '3' },
            { url: '/api/upload-chunk', name: 'large.txt', content: 'efgh', currentChunkIndex: '1', totalChunks: '3' },
            { url: '/api/upload-chunk', name: 'large.txt', content: 'ij', currentChunkIndex: '2', totalChunks: '3' },
        ]);
    });

    it('should send the last chunk only after every other chunk has succeeded', async () => {
        const requests = stubNetwork();
        const upload = createRestUpload({ chunkSize: 4 });

        const uploading = upload(new File(['abcdefghij'], 'large.txt'));
        await flush();
        const indexesSent = () => requests.map(({ fields }) => fields.get('currentChunkIndex'));

        expect(indexesSent()).toEqual(['0', '1']);

        requests[0].respond(200);
        await flush();
        expect(indexesSent()).toEqual(['0', '1']);

        requests[1].respond(200);
        await flush();
        expect(indexesSent()).toEqual(['0', '1', '2']);

        requests[2].respond(200);
        await expect(uploading).resolves.toBeUndefined();
    });

    it('should keep at most `maxConcurrentRequests` requests in flight across all files', async () => {
        const requests = stubNetwork();
        const upload = createRestUpload({ chunkSize: 4, maxConcurrentRequests: 2 });

        const uploads = [
            upload(new File(['abcdefghijkl'], 'first.txt')),
            upload(new File(['abcdefghijkl'], 'second.txt')),
            upload(new File(['tiny'], 'third.txt')),
        ];
        await flush();
        expect(requests).toHaveLength(2);

        requests[0].respond(200);
        await flush();
        expect(requests).toHaveLength(3);

        await answerAll(requests);
        await Promise.all(uploads);
        expect(requests).toHaveLength(7);
    });

    it("should send a file's last chunk ahead of chunks still waiting from files added later", async () => {
        const requests = stubNetwork();
        const upload = createRestUpload({ chunkSize: 4, maxConcurrentRequests: 1 });

        const uploads = [
            upload(new File(['abcdefghijkl'], 'first.txt')),
            upload(new File(['abcdefghijkl'], 'second.txt')),
        ];
        await answerAll(requests);
        await Promise.all(uploads);

        const sendOrder = requests.map(
            ({ fields }) => `${(fields.get('file') as File).name}#${String(fields.get('currentChunkIndex'))}`
        );
        // The slot freed by first.txt#1 is taken by second.txt#0 before first.txt's last chunk is queued;
        // from then on the last chunk goes ahead of everything still waiting.
        expect(sendOrder).toEqual([
            'first.txt#0',
            'first.txt#1',
            'second.txt#0',
            'first.txt#2',
            'second.txt#1',
            'second.txt#2',
        ]);
    });

    it("should reject with the server's error message when a request fails", async () => {
        const requests = stubNetwork();
        const upload = createRestUpload();

        const uploading = upload(new File(['content'], 'file.txt'));
        await flush();
        requests[0].respond(500, { error: 'Error saving file' });

        await expect(uploading).rejects.toThrow('Error saving file');
    });

    it('should reject with a readable message when the network fails', async () => {
        const requests = stubNetwork();
        const upload = createRestUpload();

        const uploading = upload(new File(['content'], 'file.txt'));
        await flush();
        requests[0].fail();

        await expect(uploading).rejects.toThrow('Could not reach the server. Check your connection and try again.');
    });

    it('should reject with the status when an error response has no readable message', async () => {
        const requests = stubNetwork();
        const upload = createRestUpload();

        const uploading = upload(new File(['content'], 'file.txt'));
        await flush();
        requests[0].respond(502, '<html>Bad Gateway</html>');

        await expect(uploading).rejects.toThrow('The server responded with an error (502).');
    });

    it("should stop sending a file's remaining chunks after one fails", async () => {
        const requests = stubNetwork();
        const upload = createRestUpload({ chunkSize: 4, maxConcurrentRequests: 1 });

        const uploading = upload(new File(['abcdefghijklmnop'], 'large.txt'));
        await flush();
        requests[0].respond(500, { error: 'Error saving chunk' });

        await expect(uploading).rejects.toThrow('Error saving chunk');
        await answerAll(requests);
        expect(requests).toHaveLength(1);
    });
});
