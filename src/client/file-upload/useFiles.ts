import { useCallback, useEffect, useRef, useState } from 'react';

import { toErrorMessage } from './lib/toErrorMessage';
import { type FetchFiles, type FilesStatus, type StoredFile } from './types';

export type UseFilesResult = {
    files: StoredFile[];
    status: FilesStatus;
    error?: string;
    /** Loads the list again. Calls made while a request is in flight share one follow-up request. */
    refresh: () => void;
};

/**
 * Loads the stored files on mount, and again whenever `fetchFiles` changes.
 *
 * `fetchFiles` must keep the same identity between renders: define it outside the component or wrap it in
 * `useCallback`. An inline function is new on every render and would reload the list in a loop.
 */
export const useFiles = (fetchFiles: FetchFiles): UseFilesResult => {
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [status, setStatus] = useState<FilesStatus>('loading');
    const [error, setError] = useState<string>();
    const inFlight = useRef(false);
    const refreshQueued = useRef(false);

    // At most one request in flight plus one queued: refreshes asked for meanwhile (e.g. many uploads finishing
    // together) share a single follow-up request, so responses can't overlap or arrive out of order.
    const refresh = useCallback(() => {
        const load = () => {
            inFlight.current = true;
            fetchFiles()
                .then(
                    (loaded) => {
                        setFiles(loaded);
                        setStatus('success');
                        setError(undefined);
                    },
                    (error_: unknown) => {
                        setError(toErrorMessage(error_));
                        setStatus('error');
                    }
                )
                .finally(() => {
                    inFlight.current = false;
                    if (refreshQueued.current) {
                        refreshQueued.current = false;
                        load();
                    }
                });
        };

        if (inFlight.current) {
            refreshQueued.current = true;
        } else {
            load();
        }
    }, [fetchFiles]);

    useEffect(refresh, [refresh]);

    return { files, status, error, refresh };
};
