import { type ReactElement } from 'react';

import { classNames } from './lib/classNames';
import { type UploadItem } from './types';

export type UploadQueueProps = {
    items: UploadItem[];
    /** Added to the root element. */
    className?: string;
};

// Status is always given in words; colour only reinforces it (WCAG 1.4.1).
const statusText = (item: UploadItem): string => {
    switch (item.status) {
        case 'uploading':
            return 'Uploading…';
        case 'done':
            return 'Uploaded';
        case 'failed':
            return `Failed: ${item.error}`;
    }
};

const statusColor: Record<UploadItem['status'], string> = {
    uploading: 'text-gray-700',
    done: 'text-green-800',
    failed: 'text-red-800',
};

const fileCount = (count: number) => `${count} ${count === 1 ? 'file' : 'files'}`;

/** One short sentence for screen readers, e.g. "2 of 3 uploaded, 1 failed". */
const summarize = (items: UploadItem[]): string => {
    const done = items.filter((item) => item.status === 'done').length;
    const failed = items.filter((item) => item.status === 'failed').length;
    if (items.length === 0) {
        return '';
    }
    if (done + failed === 0) {
        return `Uploading ${fileCount(items.length)}`;
    }
    return `${done} of ${items.length} uploaded${failed > 0 ? `, ${failed} failed` : ''}`;
};

/** Shows each upload and its status, and announces progress to screen readers. */
export const UploadQueue = ({ items, className }: UploadQueueProps): ReactElement => {
    return (
        <div className={classNames('text-sm text-gray-900', className)}>
            {/* Kept on the page while empty: screen readers only announce changes to a live region that already exists. */}
            <p role="status" className="sr-only">
                {summarize(items)}
            </p>
            {items.length > 0 && (
                <ul aria-label="Upload queue" className="divide-y divide-gray-200">
                    {items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-4 py-2">
                            <span className="min-w-0 break-words">{item.file.name}</span>
                            <span className={classNames('shrink-0', statusColor[item.status])}>{statusText(item)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
