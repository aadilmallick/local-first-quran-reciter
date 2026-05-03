export class KeepAwake {
    public wakeLock?: WakeLockSentinel;
    private onVisibilityChange?: () => void;
    private onRelease?: () => void;
    constructor() {}
    async request(onRelease?: () => void) {
        try {
            if (this.onRelease && this.wakeLock) {
                this.wakeLock.removeEventListener("release", this.onRelease);
                this.wakeLock = undefined;
            }
            this.wakeLock = await navigator.wakeLock.request();
            const cb = () => {
                console.log(
                    "Screen Wake Lock released:",
                    this.wakeLock?.released,
                );
                onRelease?.();
            };
            this.onRelease = cb.bind(this);
            this.wakeLock.addEventListener("release", this.onRelease);
            console.log("Screen Wake Lock released:", this.wakeLock?.released);
        } catch (err) {
            const error = err as unknown as any;
            console.error(`${error.name}, ${error.message}`);
        }
    }

    private release() {
        this.wakeLock?.release();
        setTimeout(() => {
            this.wakeLock = undefined;
        }, 250);
    }

    static isAPIAvailable() {
        return (
            navigator.wakeLock &&
            typeof navigator.wakeLock.request === "function"
        );
    }

    async activate() {
        await this.request();
        this.keepAwake();
    }

    // when dcoument is visible, request wakelock
    // when document is hidden, we have no choice but to release wakelock.
    private async handleVisibilityChange({
        onVisible,
        onHidden,
    }: {
        onVisible?: () => void;
        onHidden?: () => void;
    }) {
        if (document.visibilityState === "visible" && !this.wakeLock) {
            console.log("Document is visible again. Re-acquiring wake lock...");
            await this.request();
            onVisible?.();
        } else if (document.visibilityState === "hidden" && this.wakeLock) {
            console.log("Document is hidden. Releasing wake lock...");
            this.release();
            onHidden?.();
        } else {
            this.release();
            //   onHidden?.();
        }
    }

    keepAwake(options?: { onVisible?: () => void; onHidden?: () => void }) {
        const cb = () => {
            this.handleVisibilityChange(options || {});
        };
        this.onVisibilityChange = cb;
        document.addEventListener("visibilitychange", cb);
    }

    destroy() {
        this.release();
        if (this.onVisibilityChange) {
            document.removeEventListener(
                "visibilitychange",
                this.onVisibilityChange,
            );
        }
    }
}

export class KeepAwakePIP {
    public wakeLock?: WakeLockSentinel;
    private onVisibilityChange?: () => void;
    private onRelease?: () => void;
    constructor(private pipWindow: Window) {}
    async request(onRelease?: () => void) {
        try {
            if (this.onRelease && this.wakeLock) {
                this.wakeLock.removeEventListener("release", this.onRelease);
                this.wakeLock = undefined;
            }
            this.wakeLock = await this.pipWindow.navigator.wakeLock.request();
            const cb = () => {
                console.log("PIP Wake Lock released:", this.wakeLock?.released);
                onRelease?.();
            };
            this.onRelease = cb.bind(this);
            this.wakeLock.addEventListener("release", this.onRelease);
            console.log("PIP Wake Lock requested:", !this.wakeLock?.released);
        } catch (err) {
            const error = err as unknown as any;
            console.error(
                `PIP Wake Lock Error: ${error.name}, ${error.message}`,
            );
        }
    }

    release() {
        this.wakeLock?.release();
        setTimeout(() => {
            this.wakeLock = undefined;
        }, 250);
    }

    // when PIP document is visible, request wakelock
    // when PIP document is hidden, we have no choice but to release wakelock.
    private async handleVisibilityChange({
        onVisible,
        onHidden,
    }: {
        onVisible?: () => void;
        onHidden?: () => void;
    }) {
        if (
            this.pipWindow.document.visibilityState === "visible" &&
            !this.wakeLock
        ) {
            console.log(
                "PIP window is visible again. Re-acquiring wake lock...",
            );
            await this.request();
            onVisible?.();
        } else if (
            this.pipWindow.document.visibilityState === "hidden" &&
            this.wakeLock
        ) {
            console.log("PIP window is hidden. Releasing wake lock...");
            this.release();
            onHidden?.();
        } else {
            this.release();
            onHidden?.();
        }
    }

    keepAwake(options?: { onVisible?: () => void; onHidden?: () => void }) {
        // Start with an initial wake lock request
        this.request();

        const cb = () => {
            this.handleVisibilityChange(options || {});
        };
        this.onVisibilityChange = cb;
        // Use PIP window's document for visibility changes
        this.pipWindow.document.addEventListener("visibilitychange", cb);
    }

    destroy() {
        this.release();
        if (this.onVisibilityChange) {
            // Remove listener from PIP window's document
            this.pipWindow.document.removeEventListener(
                "visibilitychange",
                this.onVisibilityChange,
            );
        }
    }
}
