# File upload

A reusable, accessible React file uploader for the Frontify frontend take-home. Upload logic plugs in as a plain function, so the components aren't tied to any API, and the uploader works with or without the file list. The demo page uploads to the provided Express API.

## Run it

```sh
npm install
npm run dev           # http://localhost:3000
npm run test:client   # unit, component and integration tests
npm run test:server   # the server's own tests
npm run lint && npm run typecheck
```

Node 20 (`.nvmrc`). CI runs all of these on pull requests to `main`.

## Decisions and trade-offs

**Pluggable upload logic.** The components never call an API. They take two plain functions, `upload(file)` and `fetchFiles()`. The demo passes REST versions, and another backend (GraphQL, for example) passes its own, with no change to the components. See [Using it](#using-it).

-   Trade-off: chunking is part of the REST version, so a second backend that also chunks would repeat that logic. Separating the two is [#26].

**Three layers instead of one big component.** Hooks (`useUploads`, `useFiles`) hold the state, display components (`FileDropzone`, `UploadQueue`, `FileList`) only render their props, and `FileUploader` is the ready-made combination. A page can use the uploader on its own, combine it with the list in a few lines, or build its own UI on the hooks.

-   Planned: compound components, once rows get actions such as cancel and retry ([#12]). Until then they'd only add a context.
-   No store library: it would add a dependency to every app that uses the component, for very little state.

**Chunking and parallel uploads.** Files up to 5 MiB go in one request, larger files in 5 MiB chunks, and all requests share one pool of 4.

-   Most files in a bulk upload are small, so each goes in a single request. A large file is split so it can use several connections at once.
-   The pool of 4 stays under the browser's limit of 6 connections per server, so the file list can still load during uploads.
-   The server merges when the last chunk arrives ([#15]), so that chunk is sent last. If a chunk fails, the rest of that file isn't sent.
-   5 MiB is a common default, not a measured one. It's an option on `createRestUpload`.

**The file list shows what the server returns.** It reloads after each upload. Reloads asked for while one is running are combined into one follow-up, so a burst of finished uploads doesn't flood the API, and an older response can't overwrite a newer one.

-   No optimistic updates: the list could drift from what the server actually stored.
-   In a production app, I'd use TanStack Query for this.

**Rendering.** Each hook keeps its own state, so a status change in the upload queue doesn't re-render the file list. I haven't profiled it. With thousands of files, virtualising the lists would be the first thing to try.

**Errors.** A failed upload shows the server's own message, or a plain one if the server can't be reached, and the other files keep uploading. If the file list fails to load, it shows an error and keeps showing the files it loaded before.

**Accessibility (WCAG 2.2 AA).** A native file input behind a visible button, with drag and drop as an extra. Status is always in words, not just colour. A polite live region announces a summary such as "2 of 3 uploaded, 1 failed". axe runs in every component test but can't measure contrast in happy-dom, so I checked that by hand. I also tested the page in Safari and Chrome with the keyboard and VoiceOver.

**Testing.** Vitest only. Unit and component tests stub `fetch` at the network boundary. An integration test runs the upload against the real Express server and compares a chunked file byte for byte. A real browser isn't covered yet ([#13]).

**Server bugs.** I left the server as it was, filed the bugs I found ([#14], [#15], [#16], [#18]) and worked around them in the client. One of the server's own tests is skipped because it's flaky until [#14] is fixed.

## With more time

-   Upload progress and a "queued" state ([#7])
-   Cancel and retry ([#8], [#9])
-   A Playwright test of the main path in a real browser ([#13])
-   Separate the chunking strategy from the REST transport ([#26])
-   Compound components, once rows get actions ([#12])
-   The server fixes ([#14], [#15], [#16], [#18])

Every deliberate leftover is an [open issue](https://github.com/tarioto/frontend-task-main/issues).

## Using it

Everything is exported from [`src/client/file-upload`](src/client/file-upload/index.ts).

```tsx
// Created once, outside any component, so all uploads share one request pool.
const upload = createRestUpload();

export const UploaderOnly = () => <FileUploader upload={upload} />;

export const UploaderWithList = () => {
    const { files, status, error, refresh } = useFiles(fetchFiles);

    return (
        <>
            <FileUploader upload={upload} onUploaded={refresh} />
            <FileList files={files} status={status} error={error} />
        </>
    );
};
```

For different markup, use the hooks directly and reuse individual display components such as `FileDropzone`.

Another backend supplies its own two functions, and the components stay the same (`graphqlUpload` and `graphqlQuery` stand for the app's GraphQL client):

```tsx
// Defined outside the component, so `useFiles` gets the same function on every render.
const uploadFile: Upload = (file) =>
    graphqlUpload('mutation ($file: Upload!) { uploadFile(file: $file) { id } }', file);
const fetchStoredFiles: FetchFiles = () => graphqlQuery('{ files { name size } }').then((data) => data.files);

export const GraphQLUploadPage = () => {
    const { files, status, error, refresh } = useFiles(fetchStoredFiles);

    return (
        <>
            <FileUploader upload={uploadFile} onUploaded={refresh} />
            <FileList files={files} status={status} error={error} />
        </>
    );
};
```

## API

The Express server is in [`src/server`](src/server). It stores files in `uploads/` and chunks in `uploads-chunks/` (under `src/server/test/` when `NODE_ENV=test`); both folders must already exist. Request bodies are `multipart/form-data`.

| Endpoint                  | Body                                                                                          | Responses                                            |
| :------------------------ | :-------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `GET /api/files`          |                                                                                               | `200 { files: [{ name, size }] }`, `500 { message }` |
| `POST /api/upload-single` | `file`                                                                                        | `200 { message }`, `400`/`500 { error }`             |
| `POST /api/upload-chunk`  | `file` (this chunk, with the original file name), `currentChunkIndex` (from 0), `totalChunks` | `200 { message }`, `400`/`500 { error }`             |

The server merges the chunks as soon as it receives index `totalChunks - 1`, so send that chunk last ([#15]).

[#7]: https://github.com/tarioto/frontend-task-main/issues/7
[#8]: https://github.com/tarioto/frontend-task-main/issues/8
[#9]: https://github.com/tarioto/frontend-task-main/issues/9
[#12]: https://github.com/tarioto/frontend-task-main/issues/12
[#13]: https://github.com/tarioto/frontend-task-main/issues/13
[#14]: https://github.com/tarioto/frontend-task-main/issues/14
[#15]: https://github.com/tarioto/frontend-task-main/issues/15
[#16]: https://github.com/tarioto/frontend-task-main/issues/16
[#18]: https://github.com/tarioto/frontend-task-main/issues/18
[#26]: https://github.com/tarioto/frontend-task-main/issues/26
