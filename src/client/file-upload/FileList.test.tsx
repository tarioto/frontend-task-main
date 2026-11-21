import { render, screen, within } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { FileList } from './FileList';
import { type StoredFile } from './types';

const files: StoredFile[] = [
    { name: 'photo.jpg', size: 2048 },
    { name: 'report.pdf', size: 4.5 * 1024 * 1024 },
];

describe('FileList', () => {
    it('should list each file with its name and size', () => {
        render(<FileList files={files} status="success" />);

        const rows = within(screen.getByRole('list', { name: 'Uploaded files' })).getAllByRole('listitem');
        expect(rows.map((row) => row.textContent)).toEqual(['photo.jpg2 KB', 'report.pdf4.5 MB']);
    });

    it('should say the files are loading', () => {
        render(<FileList files={[]} status="loading" />);

        expect(screen.getByText('Loading files…')).toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should say when there are no files yet', () => {
        render(<FileList files={[]} status="success" />);

        expect(screen.getByText('No files uploaded yet.')).toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should alert the error, and keep showing files that were already loaded', () => {
        render(<FileList files={files} status="error" error="Could not reach the server." />);

        expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the files: Could not reach the server.");
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should still say loading failed when there is no error message', () => {
        render(<FileList files={[]} status="error" />);

        expect(screen.getByRole('alert')).toHaveTextContent(/^Couldn't load the files\.$/);
    });

    it('should add className to its root element', () => {
        const { container } = render(<FileList files={files} status="success" className="custom" />);

        expect(container.firstElementChild).toHaveClass('custom');
    });

    it.each<{ state: string; props: ComponentProps<typeof FileList> }>([
        { state: 'files', props: { files, status: 'success' } },
        { state: 'loading', props: { files: [], status: 'loading' } },
        { state: 'empty', props: { files: [], status: 'success' } },
        { state: 'error', props: { files: [], status: 'error', error: 'Boom' } },
    ])('should have no detectable accessibility violations ($state)', async ({ props }) => {
        const { container } = render(<FileList {...props} />);

        expect(await axe(container)).toHaveNoViolations();
    });
});
