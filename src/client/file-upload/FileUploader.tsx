import { type ReactElement } from 'react';

import { FileDropzone } from './FileDropzone';
import { UploadQueue } from './UploadQueue';
import { classNames } from './lib/classNames';
import { type Upload } from './types';
import { useUploads } from './useUploads';

export type FileUploaderProps = {
    /** Sends one file to whichever backend the app uses. */
    upload: Upload;
    /** Called with each file once it has uploaded successfully, e.g. to refresh a file list. */
    onUploaded?: (file: File) => void;
    /** Added to the root element. */
    className?: string;
};

/** A ready-made uploader: pick or drop files and follow their progress. Works with or without a file list. */
export const FileUploader = ({ upload, onUploaded, className }: FileUploaderProps): ReactElement => {
    const { items, add } = useUploads(upload, { onUploaded });

    return (
        <div className={classNames('space-y-4', className)}>
            <FileDropzone onFiles={add} />
            <UploadQueue items={items} />
        </div>
    );
};
