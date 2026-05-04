import { useEffect, useLayoutEffect, useRef } from "react";
import { MediaSessionManager } from "@/lib/MediaSessionManager";
import { usePlaybackStore } from "@/store/playbackStore";
import type { UseAudioPlayerResult } from "./useAudioPlayer";

function getMediaMetadata(
    selectedSurahName: string,
    selectedReciterName: string,
    startAyah: number,
    endAyah: number,
) {
    return new MediaMetadata({
        album: selectedSurahName,
        title: `${selectedSurahName} ${startAyah}-${endAyah}`,
        artist: selectedReciterName,
        artwork: [
            {
                src: "/quran.png",
                type: "image/png",
                sizes: "256x256",
            },
            {
                src: "/quran.png",
                type: "image/png",
                sizes: "512x512",
            },
            {
                src: "/quran.png",
                type: "image/png",
                sizes: "1024x1024",
            },
        ],
    });
}

type PlayerActions = Pick<
    UseAudioPlayerResult,
    "play" | "pause" | "stop" | "nextAyah" | "prevAyah"
>;

export const useMediaSession = (audioPlayerResult: UseAudioPlayerResult) => {
    const { selectedSurah, selectedReciter, startAyah, endAyah, isPlaying } =
        usePlaybackStore();

    const mediaSessionManagerRef = useRef<MediaSessionManager | null>(null);
    const playerActionsRef = useRef<PlayerActions | null>(null);
    useLayoutEffect(() => {
        playerActionsRef.current = {
            play: audioPlayerResult.play,
            pause: audioPlayerResult.pause,
            stop: audioPlayerResult.stop,
            nextAyah: audioPlayerResult.nextAyah,
            prevAyah: audioPlayerResult.prevAyah,
        };
    });

    // One-time setup: never destroy on dependency churn — that clears metadata and lets
    // another tab's MediaSession (e.g. YouTube) take over the OS transport.
    useEffect(() => {
        if (!MediaSessionManager.isAPIAvailable()) return;

        const state = usePlaybackStore.getState();
        const manager = new MediaSessionManager(
            getMediaMetadata(
                state.selectedSurah.nameEnglish,
                state.selectedReciter.name,
                state.startAyah,
                state.endAyah,
            ),
        );
        mediaSessionManagerRef.current = manager;
        manager.setState(state.isPlaying ? "playing" : "paused");

        manager.onPlay(() => {
            playerActionsRef.current?.play();
        });
        manager.onPause(() => {
            playerActionsRef.current?.pause();
        });
        manager.onStop(() => {
            playerActionsRef.current?.stop();
        });
        manager.onSeekBackward(() => {
            playerActionsRef.current?.prevAyah();
        });
        manager.onSeekForward(() => {
            playerActionsRef.current?.nextAyah();
        });
        manager.onPreviousTrack(() => {
            playerActionsRef.current?.prevAyah();
        });
        manager.onNextTrack(() => {
            playerActionsRef.current?.nextAyah();
        });

        return () => {
            manager.destroy();
            mediaSessionManagerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const m = mediaSessionManagerRef.current;
        if (!m) return;
        m.setMetadata(
            getMediaMetadata(
                selectedSurah.nameEnglish,
                selectedReciter.name,
                startAyah,
                endAyah,
            ),
        );
    }, [selectedSurah, selectedReciter, startAyah, endAyah]);

    useEffect(() => {
        const m = mediaSessionManagerRef.current;
        if (!m) return;
        m.setState(isPlaying ? "playing" : "paused");
    }, [isPlaying]);
};
