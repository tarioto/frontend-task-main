/** Uploads one file. Resolves once the file is stored; rejects with a user-readable message if it isn't. */
export type Upload = (file: File) => Promise<void>;

export type StoredFile = {
    name: string;
    size: number;
};

/** Loads the files already stored. */
export type FetchFiles = () => Promise<StoredFile[]>;

/** Where one upload is up to. `error` exists only on a failed upload. */
export type UploadState = { status: 'uploading' } | { status: 'done' } | { status: 'failed'; error: string };

/** One file being uploaded. */
export type UploadItem = { id: string; file: File } & UploadState;

/** `loading` only until the first load finishes; later refreshes keep the current status until they finish. */
export type FilesStatus = 'loading' | 'success' | 'error';
