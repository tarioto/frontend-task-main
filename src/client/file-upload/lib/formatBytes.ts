const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

const toOneDecimal = (value: number) => Math.round(value * 10) / 10;

/** Formats a byte count with base-1024 units, e.g. `512 B`, `1.5 KB`, `4.5 MB`. */
export const formatBytes = (bytes: number): string => {
    let value = bytes;
    let unit = 0;
    // Compare the rounded value, so 1023.99 KB shows as 1 MB rather than 1024 KB.
    while (toOneDecimal(value) >= 1024 && unit < UNITS.length - 1) {
        value /= 1024;
        unit++;
    }
    return `${toOneDecimal(value)} ${UNITS[unit]}`;
};
