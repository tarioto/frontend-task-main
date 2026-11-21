import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { UploadQueue } from './UploadQueue';
import { type UploadItem, type UploadState } from './types';

const item = (name: string, state: UploadState): UploadItem => ({ id: name, file: new File(['x'], name), ...state });

describe('UploadQueue', () => {
    it('should show one row per upload with its file name and status in words', () => {
        render(
            <UploadQueue
                items={[
                    item('photo.jpg', { status: 'uploading' }),
                    item('notes.txt', { status: 'done' }),
                    item('video.mp4', { status: 'failed', error: 'Error saving file' }),
                ]}
            />
        );

        const rows = within(screen.getByRole('list', { name: 'Upload queue' })).getAllByRole('listitem');
        expect(rows.map((row) => row.textContent)).toEqual([
            'photo.jpgUploading…',
            'notes.txtUploaded',
            'video.mp4Failed: Error saving file',
        ]);
    });

    it('should announce a summary of the queue as uploads finish', () => {
        const { rerender } = render(<UploadQueue items={[]} />);
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('');

        rerender(<UploadQueue items={[item('a.txt', { status: 'uploading' })]} />);
        expect(announcement).toHaveTextContent('Uploading 1 file');

        const uploading = ['a.txt', 'b.txt', 'c.txt'].map((name) => item(name, { status: 'uploading' }));
        rerender(<UploadQueue items={uploading} />);
        expect(announcement).toHaveTextContent('Uploading 3 files');

        rerender(<UploadQueue items={[item('a.txt', { status: 'done' }), ...uploading.slice(1)]} />);
        expect(announcement).toHaveTextContent('1 of 3 uploaded');

        rerender(
            <UploadQueue
                items={[
                    item('a.txt', { status: 'done' }),
                    item('b.txt', { status: 'failed', error: 'Error saving file' }),
                    item('c.txt', { status: 'done' }),
                ]}
            />
        );
        expect(announcement).toHaveTextContent('2 of 3 uploaded, 1 failed');
    });

    it('should show no list while the queue is empty', () => {
        render(<UploadQueue items={[]} />);

        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should add className to its root element', () => {
        const { container } = render(<UploadQueue items={[]} className="custom" />);

        expect(container.firstElementChild).toHaveClass('custom');
    });

    it('should have no detectable accessibility violations', async () => {
        const { container } = render(
            <UploadQueue
                items={[
                    item('photo.jpg', { status: 'uploading' }),
                    item('notes.txt', { status: 'done' }),
                    item('video.mp4', { status: 'failed', error: 'Error saving file' }),
                ]}
            />
        );

        expect(await axe(container)).toHaveNoViolations();
    });
});
