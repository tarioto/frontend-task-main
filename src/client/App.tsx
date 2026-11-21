import { type ReactElement } from 'react';

import { createRestUpload, fetchFiles, FileList, FileUploader, useFiles } from './file-upload';

const HERO_IMAGE =
    'https://cdn-assets-eu.frontify.com/s3/frontify-enterprise-files-eu/eyJwYXRoIjoid2VhcmVcL2FjY291bnRzXC82ZVwvNDAwMDM4OFwvcHJvamVjdHNcLzk4NFwvYXNzZXRzXC9iOFwvMTE1MjY1XC8xMjYwMTU0YzFhYmVmMDVjNjZlY2Q2MDdmMTRhZTkxNS0xNjM4MjU4MjQwLmpwZyJ9:weare:_kpZgwnGPTxOhYxIyfS1MhuZmxGrFCzP6ZW6dc-F6BQ';

// Created once, so every upload on the page shares one request pool.
const upload = createRestUpload();

export const App = (): ReactElement => {
    const { files, status, error, refresh } = useFiles(fetchFiles);

    return (
        <main className="relative isolate min-h-dvh px-4 py-16 sm:py-24">
            {/* Decorative: empty alt keeps it out of the accessibility tree; the content sits on a solid card. */}
            <img
                src={`${HERO_IMAGE}?width=2400`}
                // The CDN resizes on request, so small screens download a much smaller image.
                srcSet={[800, 1600, 2400].map((width) => `${HERO_IMAGE}?width=${width} ${width}w`).join(', ')}
                sizes="100vw"
                alt=""
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover object-top"
            />

            <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-lg sm:p-8">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">File upload</h1>

                <section aria-labelledby="upload-heading" className="mt-6">
                    <h2 id="upload-heading" className="text-lg font-semibold text-gray-900">
                        Upload files
                    </h2>
                    <FileUploader upload={upload} onUploaded={refresh} className="mt-3" />
                </section>

                <section aria-labelledby="files-heading" className="mt-8">
                    <h2 id="files-heading" className="text-lg font-semibold text-gray-900">
                        Uploaded files
                    </h2>
                    <FileList files={files} status={status} error={error} className="mt-3" />
                </section>
            </div>
        </main>
    );
};
