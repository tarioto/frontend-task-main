/** Uploads one file. Resolves once the file is stored; rejects with a user-readable message if it isn't. */
export type Upload = (file: File) => Promise<void>;

export type StoredFile = {
    name: string;
    size: number;
};

/** Loads the files already stored. */
export type FetchFiles = () => Promise<StoredFile[]>;
