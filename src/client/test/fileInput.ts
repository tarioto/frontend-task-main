/** The browser's file input sits behind the "Choose files" button, so tests reach it directly to simulate a choice. */
export const fileInput = (container: HTMLElement): HTMLInputElement =>
    container.querySelector<HTMLInputElement>('input[type="file"]')!;
