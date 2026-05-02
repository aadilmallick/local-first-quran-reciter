export class LocalStorageBrowser<T extends Record<string, unknown>> {
    private prefix: string;
    constructor(prefix: string = "") {
        this.prefix = prefix;
    }

    private getKey(key: keyof T & string): string {
        return this.prefix + key;
    }

    public set<K extends keyof T & string>(key: K, value: T[K]): void {
        window.localStorage.setItem(this.getKey(key), JSON.stringify(value));
    }

    public get<K extends keyof T & string>(key: K): T[K] | null {
        const item = window.localStorage.getItem(this.getKey(key));
        return item ? JSON.parse(item) : null;
    }

    public removeItem(key: keyof T & string): void {
        window.localStorage.removeItem(this.getKey(key));
    }

    public clear(): void {
        window.localStorage.clear();
    }
}
