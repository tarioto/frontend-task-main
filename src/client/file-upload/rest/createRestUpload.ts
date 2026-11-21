import { createLimiter } from '../lib/createLimiter';
import { type Upload } from '../types';

import { request } from './request';

type RestUploadOptions = {
    /** Files up to this size are sent in one request; larger files are sent in chunks of this size. */
    chunkSize?: number;
    /** Requests in flight at once, shared by every file this uploader handles. */
    maxConcurrentRequests?: number;
};

const MiB = 1024 * 1024;

/** Creates an `Upload` for the demo REST API (`/api/upload-single` and `/api/upload-chunk`). */
export const createRestUpload = ({
    chunkSize = 5 * MiB,
    maxConcurrentRequests = 4,
}: RestUploadOptions = {}): Upload => {
    // One pool shared by every file this uploader handles, so many files can't flood the connection.
    const limit = createLimiter(maxConcurrentRequests);

    return async (file) => {
        if (file.size <= chunkSize) {
            const body = new FormData();
            body.append('file', file);
            await limit(() => request('/api/upload-single', { method: 'POST', body }));
            return;
        }

        const totalChunks = Math.ceil(file.size / chunkSize);
        const sendChunk = (index: number) => {
            const body = new FormData();
            // The server needs the original file name on every chunk.
            body.append('file', new File([file.slice(index * chunkSize, (index + 1) * chunkSize)], file.name));
            body.append('currentChunkIndex', String(index));
            body.append('totalChunks', String(totalChunks));
            return request('/api/upload-chunk', { method: 'POST', body });
        };

        // Once one chunk fails the file has failed, so chunks still waiting in the pool are skipped.
        let failed = false;
        const sendChunkUnlessFailed = async (index: number) => {
            if (failed) {
                return;
            }
            try {
                await sendChunk(index);
            } catch (error) {
                failed = true;
                throw error;
            }
        };

        const lastIndex = totalChunks - 1;
        await Promise.all(Array.from({ length: lastIndex }, (_, index) => limit(() => sendChunkUnlessFailed(index))));
        // The server merges as soon as it receives the last index, so that chunk must arrive after all the others.
        // It jumps ahead of chunks still waiting, so files finish roughly in the order they were added.
        await limit(() => sendChunk(lastIndex), { priority: true });
    };
};
