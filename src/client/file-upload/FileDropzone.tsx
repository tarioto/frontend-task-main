import { type DragEvent, type ReactElement, useRef, useState } from 'react';

import { classNames } from './lib/classNames';

export type FileDropzoneProps = {
    /** Called with the files chosen or dropped; never with an empty list. */
    onFiles: (files: File[]) => void;
    /** Added to the root element. */
    className?: string;
};

/** True when files are being dragged, as opposed to text or links. */
const isDraggingFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

/**
 * Lets the user pick files with a button (keyboard and screen-reader friendly) or drop them onto the area.
 * Dragging is an extra; the button is the accessible route (WCAG 2.5.7).
 */
export const FileDropzone = ({ onFiles, className }: FileDropzoneProps): ReactElement => {
    const input = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    // Entering a child element fires dragenter on it before dragleave on the parent, so counting the two keeps the
    // hint steady while moving inside the area. (relatedTarget is null on drag events in Safari, so it can't be used.)
    const dragDepth = useRef(0);

    const reportFiles = (files: FileList | null) => {
        if (files && files.length > 0) {
            onFiles([...files]);
        }
    };

    return (
        // Drag and drop is a pointer-only extra; keyboard and screen-reader users choose files with the button below.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={classNames(
                'rounded-lg border-2 border-dashed p-6 text-center text-sm text-gray-700',
                isDragging ? 'border-blue-700 bg-blue-50' : 'border-gray-500',
                className
            )}
            onDragEnter={(event) => {
                if (isDraggingFiles(event)) {
                    dragDepth.current++;
                    setIsDragging(true);
                }
            }}
            onDragOver={(event) => {
                // Cancelling dragover is what tells the browser this element accepts the drop; only accept files.
                if (isDraggingFiles(event)) {
                    event.preventDefault();
                }
            }}
            onDragLeave={(event) => {
                if (isDraggingFiles(event)) {
                    dragDepth.current--;
                    if (dragDepth.current === 0) {
                        setIsDragging(false);
                    }
                }
            }}
            onDrop={(event) => {
                event.preventDefault();
                dragDepth.current = 0;
                setIsDragging(false);
                reportFiles(event.dataTransfer.files);
            }}
        >
            <p className="mb-3">{isDragging ? 'Drop files to upload' : 'Drag files here, or'}</p>
            <button
                type="button"
                className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                onClick={() => input.current?.click()}
            >
                Choose files
            </button>
            <input
                ref={input}
                type="file"
                multiple
                hidden
                // Never read out (hidden inputs aren't in the accessibility tree), but axe under happy-dom doesn't
                // treat `hidden` as hidden and would flag the input as unlabelled.
                aria-label="Choose files"
                onChange={(event) => {
                    reportFiles(event.target.files);
                    // Reset so choosing the same file again still fires a change.
                    event.target.value = '';
                }}
            />
        </div>
    );
};
