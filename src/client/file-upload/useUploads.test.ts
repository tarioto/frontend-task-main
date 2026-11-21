import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { flush } from '../test/flush';

import { type UploadItem } from './types';
import { useUploads } from './useUploads';

/** A fake `upload` whose calls the test finishes one by one. */
const controllableUpload = () => {
    const pending = new Map<string, { resolve: () => void; reject: (error: Error) => void }>();
    const upload = vi.fn(
        (file: File) =>
            new Promise<void>((resolve, reject) => {
                pending.set(file.name, { resolve, reject });
            })
    );
    const finish = async (name: string, outcome: Error | 'success') => {
        await act(async () => {
            if (outcome === 'success') {
                pending.get(name)?.resolve();
            } else {
                pending.get(name)?.reject(outcome);
            }
            await flush();
        });
    };
    return { upload, finish };
};

const describeItems = (items: UploadItem[]) =>
    items.map((item) => ({
        name: item.file.name,
        status: item.status,
        ...(item.status === 'failed' ? { error: item.error } : {}),
    }));

describe('useUploads', () => {
    it('should add one uploading item per file and start uploading each one', () => {
        const { upload } = controllableUpload();
        const { result } = renderHook(() => useUploads(upload));
        const first = new File(['a'], 'first.txt');
        const second = new File(['b'], 'second.txt');

        act(() => {
            result.current.add([first, second]);
        });

        expect(describeItems(result.current.items)).toEqual([
            { name: 'first.txt', status: 'uploading' },
            { name: 'second.txt', status: 'uploading' },
        ]);
        expect(new Set(result.current.items.map((item) => item.id)).size).toBe(2);
        expect(upload.mock.calls).toEqual([[first], [second]]);
    });

    it("should mark each item done or failed with the error's message as its upload finishes", async () => {
        const { upload, finish } = controllableUpload();
        const { result } = renderHook(() => useUploads(upload));
        act(() => {
            result.current.add(['ok.txt', 'broken.txt', 'slow.txt'].map((name) => new File(['x'], name)));
        });

        await finish('ok.txt', 'success');
        await finish('broken.txt', new Error('Error saving file'));

        expect(describeItems(result.current.items)).toEqual([
            { name: 'ok.txt', status: 'done' },
            { name: 'broken.txt', status: 'failed', error: 'Error saving file' },
            { name: 'slow.txt', status: 'uploading' },
        ]);
    });

    it('should call onUploaded with each file that uploads successfully, and not for failures', async () => {
        const { upload, finish } = controllableUpload();
        const onUploaded = vi.fn();
        const { result } = renderHook(() => useUploads(upload, { onUploaded }));
        const ok = new File(['x'], 'ok.txt');
        act(() => {
            result.current.add([ok, new File(['x'], 'broken.txt')]);
        });

        await finish('ok.txt', 'success');
        await finish('broken.txt', new Error('Error saving file'));

        expect(onUploaded.mock.calls).toEqual([[ok]]);
    });
});
