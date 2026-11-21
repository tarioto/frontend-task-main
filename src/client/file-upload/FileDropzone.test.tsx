import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { FileDropzone } from './FileDropzone';

afterEach(() => {
    vi.restoreAllMocks();
});

/** The browser's file input sits behind the button, so tests reach it directly to simulate a choice. */
const fileInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="file"]')!;

/** What a browser reports while files (rather than text or links) are dragged. */
const draggingFiles = { dataTransfer: { types: ['Files'] } };

/** The whole component is the drop area. */
const dropArea = (container: HTMLElement) => container.firstElementChild!;

describe('FileDropzone', () => {
    it('should open the file picker from a keyboard-reachable button', async () => {
        // The picker is the browser's own dialog, so only check that it was asked to open.
        const openPicker = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
        const user = userEvent.setup();
        render(<FileDropzone onFiles={vi.fn()} />);

        await user.tab();
        expect(screen.getByRole('button', { name: 'Choose files' })).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(openPicker).toHaveBeenCalledTimes(1);
    });

    it('should report the chosen files', async () => {
        const onFiles = vi.fn();
        const user = userEvent.setup();
        const { container } = render(<FileDropzone onFiles={onFiles} />);
        const photo = new File(['x'], 'photo.jpg');
        const notes = new File(['y'], 'notes.txt');

        await user.upload(fileInput(container), [photo, notes]);

        expect(onFiles.mock.calls).toEqual([[[photo, notes]]]);
    });

    it('should clear its input after each choice, so choosing the same file again still reports it', async () => {
        // Browsers fire no change event when the chosen file equals the input's current value.
        const user = userEvent.setup();
        const { container } = render(<FileDropzone onFiles={vi.fn()} />);

        await user.upload(fileInput(container), new File(['x'], 'photo.jpg'));

        expect(fileInput(container).value).toBe('');
    });

    it('should ignore an empty choice', () => {
        const onFiles = vi.fn();
        const { container } = render(<FileDropzone onFiles={onFiles} />);

        fireEvent.change(fileInput(container), { target: { files: [] } });

        expect(onFiles).not.toHaveBeenCalled();
    });

    it('should accept dragged files and report the dropped ones', () => {
        const onFiles = vi.fn();
        const { container } = render(<FileDropzone onFiles={onFiles} />);
        const photo = new File(['x'], 'photo.jpg');

        // fireEvent returns false when the event's default was prevented, which is how a drop target accepts a drag.
        expect(fireEvent.dragOver(dropArea(container), { dataTransfer: { types: ['Files'], files: [photo] } })).toBe(
            false
        );
        fireEvent.drop(dropArea(container), { dataTransfer: { files: [photo] } });

        expect(onFiles.mock.calls).toEqual([[[photo]]]);
    });

    it('should ignore a drop with no files', () => {
        const onFiles = vi.fn();
        const { container } = render(<FileDropzone onFiles={onFiles} />);

        fireEvent.drop(dropArea(container), { dataTransfer: { files: [] } });

        expect(onFiles).not.toHaveBeenCalled();
    });

    it('should show a drop hint while files are dragged over it', () => {
        const { container } = render(<FileDropzone onFiles={vi.fn()} />);
        const area = dropArea(container);
        const button = screen.getByRole('button');
        expect(area).toHaveTextContent('Drag files here, or');

        fireEvent.dragEnter(area, draggingFiles);
        expect(area).toHaveTextContent('Drop files to upload');

        // Moving onto the button inside the area enters the button before leaving the area: still dragging.
        fireEvent.dragEnter(button, draggingFiles);
        fireEvent.dragLeave(area, draggingFiles);
        expect(area).toHaveTextContent('Drop files to upload');

        fireEvent.dragLeave(button, draggingFiles);
        expect(area).toHaveTextContent('Drag files here, or');

        fireEvent.dragEnter(area, draggingFiles);
        fireEvent.drop(area, { dataTransfer: { files: [] } });
        expect(area).toHaveTextContent('Drag files here, or');
    });

    it('should neither show the hint nor accept the drop when text is dragged instead of files', () => {
        const { container } = render(<FileDropzone onFiles={vi.fn()} />);
        const area = dropArea(container);
        const draggingText = { dataTransfer: { types: ['text/plain'] } };

        fireEvent.dragEnter(area, draggingText);
        expect(area).toHaveTextContent('Drag files here, or');
        expect(fireEvent.dragOver(area, draggingText)).toBe(true);

        fireEvent.dragLeave(area, draggingText);
        fireEvent.dragEnter(area, draggingFiles);
        expect(area).toHaveTextContent('Drop files to upload');
    });

    it('should add className to its root element', () => {
        const { container } = render(<FileDropzone onFiles={vi.fn()} className="custom" />);

        expect(dropArea(container)).toHaveClass('custom');
    });

    it('should have no detectable accessibility violations', async () => {
        const { container } = render(<FileDropzone onFiles={vi.fn()} />);

        expect(await axe(container)).toHaveNoViolations();
    });
});
