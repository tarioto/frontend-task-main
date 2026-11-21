import { type ReactElement } from 'react';

import { classNames } from './lib/classNames';
import { formatBytes } from './lib/formatBytes';
import { type FilesStatus, type StoredFile } from './types';

export type FileListProps = {
    files: StoredFile[];
    status: FilesStatus;
    error?: string;
    /** Added to the root element. */
    className?: string;
};

/** Shows stored files. It only displays what it's given: loading them is `useFiles`'s job. */
export const FileList = ({ files, status, error, className }: FileListProps): ReactElement => {
    return (
        <div className={classNames('text-sm text-gray-900', className)}>
            {status === 'error' && (
                <p role="alert" className="mb-2 rounded-md bg-red-50 px-3 py-2 text-red-800">
                    {error ? `Couldn't load the files: ${error}` : "Couldn't load the files."}
                </p>
            )}
            {/* Plain text: it's on screen from the first render, so it's read with the page rather than announced. */}
            {status === 'loading' && <p className="text-gray-700">Loading files…</p>}
            {status === 'success' && files.length === 0 && <p className="text-gray-700">No files uploaded yet.</p>}
            {files.length > 0 && (
                <ul aria-label="Uploaded files" className="divide-y divide-gray-200">
                    {files.map((file) => (
                        // The server lists one folder, so file names are unique.
                        <li key={file.name} className="flex justify-between gap-4 py-2">
                            <span className="min-w-0 break-words">{file.name}</span>
                            <span className="shrink-0 text-gray-700">{formatBytes(file.size)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
