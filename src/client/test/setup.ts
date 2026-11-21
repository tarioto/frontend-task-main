import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// Testing Library only auto-cleans when Vitest globals are enabled, which this project doesn't use.
afterEach(() => {
    cleanup();
});
