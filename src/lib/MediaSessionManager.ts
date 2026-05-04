export class MediaSessionManager {
    constructor(metadata: MediaMetadata) {
        if (!MediaSessionManager.isAPIAvailable()) {
            throw new Error("MediaSession API is not available");
        }
        navigator.mediaSession.metadata = metadata;
    }

    setMetadata(metadata: MediaMetadata) {
        navigator.mediaSession.metadata = metadata;
    }

    setState(state: MediaSessionPlaybackState) {
        navigator.mediaSession.playbackState = state;
    }

    static isAPIAvailable() {
        return "mediaSession" in navigator;
    }

    onPlay(cb: () => void) {
        navigator.mediaSession.setActionHandler("play", cb);
    }

    onPause(cb: () => void) {
        navigator.mediaSession.setActionHandler("pause", cb);
    }

    onStop(cb: () => void) {
        navigator.mediaSession.setActionHandler("stop", cb);
    }

    onSeekBackward(cb: (event: MediaSessionActionDetails) => void) {
        navigator.mediaSession.setActionHandler("seekbackward", cb);
    }

    onSeekForward(cb: (event: MediaSessionActionDetails) => void) {
        navigator.mediaSession.setActionHandler("seekforward", cb);
    }

    onSeekTo(cb: (event: MediaSessionActionDetails) => void) {
        navigator.mediaSession.setActionHandler("seekto", cb);
    }

    onPreviousTrack(cb: () => void) {
        navigator.mediaSession.setActionHandler("previoustrack", cb);
    }

    onNextTrack(cb: () => void) {
        navigator.mediaSession.setActionHandler("nexttrack", cb);
    }

    destroy() {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
    }
}
