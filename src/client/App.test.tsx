import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { App } from './App';
import { type StoredFile } from './file-upload';
import { fileInput } from './test/fileInput';

const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

/** Stands in for the demo API at the network boundary, remembering what was uploaded. */
const stubApi = () => {
    const stored: StoredFile[] = [];
    const fetch = vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/files') {
            return json({ files: [...stored] });
        }
        if (url === '/api/upload-single') {
            const file = (init?.body as FormData).get('file') as File;
            stored.push({ name: file.name, size: file.size });
            return json({ message: 'File uploaded successfully' });
        }
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetch);
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('App', () => {
    it('should show the uploader and the list of uploaded files', async () => {
        stubApi();
        render(<App />);

        expect(screen.getByRole('heading', { level: 1, name: 'File upload' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Upload files' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Choose files' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Uploaded files' })).toBeInTheDocument();
        expect(await screen.findByText('No files uploaded yet.')).toBeInTheDocument();
    });

    it('should upload a chosen file and then show it in the list of uploaded files', async () => {
        stubApi();
        const user = userEvent.setup();
        const { container } = render(<App />);
        await screen.findByText('No files uploaded yet.');

        await user.upload(fileInput(container), new File(['Hello from Frontify!'], 'hello.txt'));

        const queue = await screen.findByRole('list', { name: 'Upload queue' });
        expect(await within(queue).findByText('Uploaded')).toBeInTheDocument();
        const list = await screen.findByRole('list', { name: 'Uploaded files' });
        expect(list).toHaveTextContent('hello.txt20 B');
    });

    it('should have no detectable accessibility violations', async () => {
        stubApi();
        const { container } = render(<App />);
        await screen.findByText('No files uploaded yet.');

        expect(await axe(container)).toHaveNoViolations();
    });
});
