import 'vitest';
import { type AxeMatchers } from 'vitest-axe/matchers';

// vitest-axe@0.1.0 only augments Vitest's legacy `Vi` namespace, so register the matcher for current Vitest.
declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-interface
    interface Assertion<T = any> extends AxeMatchers {}
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface AsymmetricMatchersContaining extends AxeMatchers {}
}
