import { describe, expect, it } from 'vitest';

import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
    it('should show sizes under 1 KB in bytes', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(512)).toBe('512 B');
    });

    it('should use the largest base-1024 unit, rounded to one decimal place', () => {
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(4.5 * 1024 * 1024)).toBe('4.5 MB');
        expect(formatBytes(1.25 * 1024 ** 3)).toBe('1.3 GB');
    });

    it('should move up a unit when rounding reaches 1024', () => {
        expect(formatBytes(1024 * 1024 - 1)).toBe('1 MB');
    });
});
