/** Upload and fetch functions are pluggable, so a rejection may not be an `Error`. */
export const toErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
