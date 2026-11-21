// The public API of the file upload feature. Import from here, not from individual files.
//
// Three layers, all public on purpose so each context can take as much or as little as it needs:
//   1. hooks (useUploads, useFiles) for a fully custom UI;
//   2. display components (FileDropzone, UploadQueue, FileList) that only render props;
//   3. the ready-made FileUploader.
// Upload and list logic are plain functions (Upload, FetchFiles); createRestUpload and fetchFiles are the
// implementations for the demo REST API.
export { FileDropzone, type FileDropzoneProps } from './FileDropzone';
export { FileList, type FileListProps } from './FileList';
export { FileUploader, type FileUploaderProps } from './FileUploader';
export { UploadQueue, type UploadQueueProps } from './UploadQueue';
export { useFiles, type UseFilesResult } from './useFiles';
export { useUploads, type UseUploadsResult } from './useUploads';
export { createRestUpload, type RestUploadOptions } from './rest/createRestUpload';
export { fetchFiles } from './rest/fetchFiles';
export type { FetchFiles, FilesStatus, StoredFile, Upload, UploadItem, UploadState } from './types';
