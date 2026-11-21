import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { fileInput } from '../test/fileInput';

import { FileUploader } from './FileUploader';

const queueRows = () => within(screen.getByRole('list', { name: 'Upload queue' })).getAllByRole('listitem');

describe('FileUploader', () => {
    it('should upload chosen files on its own and report each one that succeeds', async () => {
        let finishUpload = () => {};
        const upload = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    finishUpload = resolve;
                })
        );
        const onUploaded = vi.fn();
        const user = userEvent.setup();
        const { container } = render(<FileUploader upload={upload} onUploaded={onUploaded} />);
        const photo = new File(['x'], 'photo.jpg');

        await user.upload(fileInput(container), photo);
        expect(queueRows().map((row) => row.textContent)).toEqual(['photo.jpgUploading…']);
        expect(upload).toHaveBeenCalledWith(photo);

        finishUpload();
        expect(await screen.findByText('Uploaded')).toBeInTheDocument();
        expect(onUploaded).toHaveBeenCalledWith(photo);
    });

    it('should show why an upload failed', async () => {
        const upload = () => Promise.reject(new Error('Error saving file'));
        const user = userEvent.setup();
        const { container } = render(<FileUploader upload={upload} />);

        await user.upload(fileInput(container), new File(['x'], 'photo.jpg'));

        expect(await screen.findByText('Failed: Error saving file')).toBeInTheDocument();
    });

    it('should add className to its root element', () => {
        const { container } = render(<FileUploader upload={vi.fn()} className="custom" />);

        expect(container.firstElementChild).toHaveClass('custom');
    });

    it('should have no detectable accessibility violations', async () => {
        const user = userEvent.setup();
        const { container } = render(<FileUploader upload={() => Promise.resolve()} />);
        await user.upload(fileInput(container), new File(['x'], 'photo.jpg'));
        await screen.findByText('Uploaded');

        expect(await axe(container)).toHaveNoViolations();
    });
});
