/** Joins class names, skipping empty ones, so consumers can add `className` to a component's root. */
export const classNames = (...names: Array<string | false | undefined>): string => names.filter(Boolean).join(' ');
