import { describe, expect, it } from 'vitest';

import { flush } from '../../test/flush';

import { createLimiter } from './createLimiter';

const deferred = () => {
    let settle!: () => void;
    const promise = new Promise<void>((resolve) => {
        settle = resolve;
    });
    return { promise, resolve: settle };
};

describe('createLimiter', () => {
    it('should run a task and resolve with its result', async () => {
        const limit = createLimiter(1);

        await expect(limit(() => Promise.resolve('done'))).resolves.toBe('done');
    });

    it('should run at most `max` tasks at once and start the next when one finishes', async () => {
        const limit = createLimiter(2);
        const started: string[] = [];
        const tasks = { a: deferred(), b: deferred(), c: deferred() };
        const runs = Object.entries(tasks).map(([name, task]) =>
            limit(() => {
                started.push(name);
                return task.promise;
            })
        );

        await flush();
        expect(started).toEqual(['a', 'b']);

        tasks.a.resolve();
        await flush();
        expect(started).toEqual(['a', 'b', 'c']);

        tasks.b.resolve();
        tasks.c.resolve();
        await Promise.all(runs);
    });

    it('should start waiting tasks in the order they were added', async () => {
        const limit = createLimiter(1);
        const started: string[] = [];
        const blocker = deferred();
        const track = (name: string) => () => {
            started.push(name);
            return Promise.resolve();
        };

        const runs = [limit(() => blocker.promise), limit(track('a')), limit(track('b')), limit(track('c'))];
        blocker.resolve();
        await Promise.all(runs);

        expect(started).toEqual(['a', 'b', 'c']);
    });

    it('should start a priority task before tasks already waiting', async () => {
        const limit = createLimiter(1);
        const started: string[] = [];
        const blocker = deferred();
        const track = (name: string) => () => {
            started.push(name);
            return Promise.resolve();
        };

        const runs = [limit(() => blocker.promise), limit(track('queued')), limit(track('urgent'), { priority: true })];
        blocker.resolve();
        await Promise.all(runs);

        expect(started).toEqual(['urgent', 'queued']);
    });

    it("should reject with a failing task's error and free its slot", async () => {
        const limit = createLimiter(1);
        const throwsSynchronously = (): Promise<string> => {
            throw new Error('boom');
        };

        await expect(limit(throwsSynchronously)).rejects.toThrow('boom');
        await expect(limit(() => Promise.resolve('next'))).resolves.toBe('next');
    });

    it('should start priority tasks in the order they were added', async () => {
        const limit = createLimiter(1);
        const started: string[] = [];
        const blocker = deferred();
        const track = (name: string) => () => {
            started.push(name);
            return Promise.resolve();
        };

        const runs = [
            limit(() => blocker.promise),
            limit(track('queued')),
            limit(track('first urgent'), { priority: true }),
            limit(track('second urgent'), { priority: true }),
        ];
        blocker.resolve();
        await Promise.all(runs);

        expect(started).toEqual(['first urgent', 'second urgent', 'queued']);
    });
});
