import { type FetchFiles, type StoredFile } from '../types';

import { request } from './request';

export const fetchFiles: FetchFiles = async () => {
    const response = await request('/api/files');
    const { files } = (await response.json()) as { files: StoredFile[] };
    return files;
};
