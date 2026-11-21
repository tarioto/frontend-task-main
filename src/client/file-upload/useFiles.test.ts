import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { flush } from '../test/flush';

import { type StoredFile } from './types';
import { useFiles } from './useFiles';

const photo: StoredFile = { name: 'photo.jpg', size: 2048 };
const report: StoredFile = { name: 'report.pdf', size: 4096 };

describe('useFiles', () => {
    it('should start loading on mount and then show the files', async () => {
        const fetchFiles = vi.fn(() => Promise.resolve([photo]));
        const { result } = renderHook(() => useFiles(fetchFiles));

        expect(result.current.status).toBe('loading');
        await waitFor(() => {
            expect(result.current.status).toBe('success');
        });
        expect(result.current.files).toEqual([photo]);
        expect(fetchFiles).toHaveBeenCalledTimes(1);
    });

    it("should show the error's message when loading fails", async () => {
        const fetchFiles = () => Promise.reject(new Error('Could not reach the server.'));
        const { result } = renderHook(() => useFiles(fetchFiles));

        await waitFor(() => {
            expect(result.current.status).toBe('error');
        });
        expect(result.current.error).toBe('Could not reach the server.');
    });

    it('should clear the error once a later load succeeds', async () => {
        const fetchFiles = vi
            .fn()
            .mockRejectedValueOnce(new Error('Could not reach the server.'))
            .mockResolvedValueOnce([photo]);
        const { result } = renderHook(() => useFiles(fetchFiles));
        await waitFor(() => {
            expect(result.current.status).toBe('error');
        });

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.status).toBe('success');
        });
        expect(result.current.error).toBeUndefined();
        expect(result.current.files).toEqual([photo]);
    });

    it('should load the files again when refreshed', async () => {
        const fetchFiles = vi.fn().mockResolvedValueOnce([photo]).mockResolvedValueOnce([photo, report]);
        const { result } = renderHook(() => useFiles(fetchFiles));
        await waitFor(() => {
            expect(result.current.files).toEqual([photo]);
        });

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.files).toEqual([photo, report]);
        });
    });

    it('should combine refreshes made while a request is in flight into one follow-up request', async () => {
        const responses: Array<(files: StoredFile[]) => void> = [];
        const fetchFiles = vi.fn(
            () =>
                new Promise<StoredFile[]>((resolve) => {
                    responses.push(resolve);
                })
        );
        const { result } = renderHook(() => useFiles(fetchFiles));
        expect(fetchFiles).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.refresh();
            result.current.refresh();
            result.current.refresh();
        });
        expect(fetchFiles).toHaveBeenCalledTimes(1);

        await act(async () => {
            responses[0]([photo]);
            await flush();
        });
        expect(fetchFiles).toHaveBeenCalledTimes(2);

        await act(async () => {
            responses[1]([photo, report]);
            await flush();
        });
        expect(fetchFiles).toHaveBeenCalledTimes(2);
        expect(result.current.files).toEqual([photo, report]);
    });
});
