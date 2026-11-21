type Limit = <T>(task: () => Promise<T>, options?: { priority?: boolean }) => Promise<T>;

/**
 * Runs async tasks with at most `max` in flight. Waiting tasks start in the order they were added;
 * tasks added with `priority` start before any others still waiting.
 */
export const createLimiter = (max: number): Limit => {
    let running = 0;
    const priorityQueue: Array<() => void> = [];
    const queue: Array<() => void> = [];

    const startNext = () => {
        if (running >= max) {
            return;
        }
        const start = priorityQueue.shift() ?? queue.shift();
        if (start) {
            running++;
            start();
        }
    };

    return <T>(task: () => Promise<T>, { priority = false } = {}) =>
        new Promise<T>((resolve, reject) => {
            const start = () => {
                // Starting via a resolved promise turns a synchronous throw into a rejection, so the slot is always freed.
                Promise.resolve()
                    .then(task)
                    .then(resolve, reject)
                    .finally(() => {
                        running--;
                        startNext();
                    });
            };
            (priority ? priorityQueue : queue).push(start);
            startNext();
        });
};
