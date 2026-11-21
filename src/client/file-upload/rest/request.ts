const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

/** Sends a request, rejecting with a user-readable message if it can't be sent or the server reports an error. */
export const request = async (url: string, init?: RequestInit): Promise<Response> => {
    const response = await fetch(url, init).catch(() => {
        throw new Error(NETWORK_ERROR);
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }
    return response;
};

const readErrorMessage = async (response: Response): Promise<string> => {
    // The API reports errors as `{ error }` from the upload endpoints and `{ message }` from the file list.
    const body = (await response.json().catch(() => ({}))) as { error?: unknown; message?: unknown };
    const message = body.error ?? body.message;
    return typeof message === 'string' ? message : `The server responded with an error (${response.status}).`;
};
