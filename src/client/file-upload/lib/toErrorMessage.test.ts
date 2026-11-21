import { describe, expect, it } from 'vitest';

import { toErrorMessage } from './toErrorMessage';

describe('toErrorMessage', () => {
    it("should use an Error's message", () => {
        expect(toErrorMessage(new Error('Error saving file'))).toBe('Error saving file');
    });

    it('should turn anything else into text', () => {
        expect(toErrorMessage('Quota exceeded')).toBe('Quota exceeded');
    });
});
