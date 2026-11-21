/** Resolves after pending promise callbacks and timers queued so far have run. */
export const flush = (): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve);
    });
