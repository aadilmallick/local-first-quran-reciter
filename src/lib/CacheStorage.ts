/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/**
 * A class for storing cache data around a single cache name.
 */
export class CacheStorageModel {
    private cache: Cache | null = null;
    constructor(public readonly cacheName: string) {}

    private async openCache() {
        const cache = await caches.open(this.cacheName);
        return cache;
    }

    async deleteOldCaches() {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter((name) => name !== this.cacheName);
        await Promise.all(oldCaches.map((name) => caches.delete(name)));
    }

    async addAll(requests: string[]) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        await this.cache.addAll(requests);
    }

    async match(request: Request) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        return this.cache.match(request);
    }

    async matchAll(request: Request) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        return this.cache.matchAll(request);
    }

    async add(request: Request) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        return this.cache.add(request);
    }

    async delete(request: Request) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        return this.cache.delete(request);
    }

    async keys(request: Request) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        return this.cache.keys(request);
    }

    async put(request: Request, response: Response) {
        if (!this.cache) {
            this.cache = await this.openCache();
        }
        return this.cache.put(request, response);
    }
}

/**
 * A class for implementing caching strategies with service workers
 */
export class CacheStrategist {
    public cacheStorage: CacheStorageModel;
    constructor(public readonly cacheName: string) {
        this.cacheStorage = new CacheStorageModel(cacheName);
    }

    async cacheFirst(request: Request) {
        return CacheStrategist.cacheFirst(request, this.cacheStorage);
    }

    async staleWhileRevalidate(request: Request) {
        return CacheStrategist.staleWhileRevalidate(request, this.cacheStorage);
    }

    async cacheAppShell(appShell: string[]) {
        return CacheStrategist.cacheAppShell(this.cacheStorage, appShell);
    }

    static async cacheAll(cacheStorage: CacheStorageModel, requests: string[]) {
        await cacheStorage.addAll(requests);
    }

    static async cacheAppShell(
        cacheStorage: CacheStorageModel,
        appShell: string[],
    ) {
        await cacheStorage.addAll(appShell);
    }

    static async cacheFirst(request: Request, cacheStorage: CacheStorageModel) {
        // 1. go to cache
        const cacheResponse = await cacheStorage.match(request);
        // 2. if cache-hit, return response
        if (cacheResponse) {
            return cacheResponse;
        } // 3. if cache-miss, go to network and update cache
        else {
            const response = await fetch(request);
            await cacheStorage.put(request, response.clone());
            return response;
        }
    }

    static async staleWhileRevalidate(
        request: Request,
        cacheStorage: CacheStorageModel,
    ) {
        const cacheResponse = await cacheStorage.match(request);
        // 1. go to cache
        // 2. if cache-hit, update cache in the background and return cache response
        if (cacheResponse) {
            try {
                fetch(request).then((response) => {
                    cacheStorage.put(request, response.clone());
                });
            } catch (e) {
                console.error("Failed to update cache:", e);
            }
            // 2a. return cache response
            return cacheResponse;
        } // 3. if cache-miss, go to network and update cache
        else {
            const response = await fetch(request);
            await cacheStorage.put(request, response.clone());
            return response;
        }
    }
}
