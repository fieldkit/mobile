const strings: { [index: string]: string } = {};

export function getString(key: string): string | null {
    return strings[key];
}

export function setString(key: string, value: string): string {
    strings[key] = value;
    return strings[key];
}
