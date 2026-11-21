import { useState } from 'react';

import { toErrorMessage } from './lib/toErrorMessage';
import { type Upload, type UploadItem } from './types';

type UseUploadsOptions = {
    /** Called with each file once it has uploaded successfully. */
    onUploaded?: (file: File) => void;
};

export type UseUploadsResult = {
    items: UploadItem[];
    /** Adds one item per file and starts uploading each one. */
    add: (files: File[]) => void;
};

export const useUploads = (upload: Upload, { onUploaded }: UseUploadsOptions = {}): UseUploadsResult => {
    const [items, setItems] = useState<UploadItem[]>([]);

    const update = (id: string, next: UploadItem) => {
        setItems((current) => current.map((item) => (item.id === id ? next : item)));
    };

    const start = ({ id, file }: UploadItem) => {
        upload(file).then(
            () => {
                update(id, { id, file, status: 'done' });
                onUploaded?.(file);
            },
            (error: unknown) =>
                update(id, {
                    id,
                    file,
                    status: 'failed',
                    error: toErrorMessage(error),
                })
        );
    };

    const add = (files: File[]) => {
        const added = files.map((file): UploadItem => ({ id: crypto.randomUUID(), file, status: 'uploading' }));
        setItems((current) => [...current, ...added]);
        for (const item of added) {
            start(item);
        }
    };

    return { items, add };
};
