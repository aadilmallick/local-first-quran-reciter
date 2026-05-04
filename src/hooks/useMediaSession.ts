import { useEffect, useRef } from "react";
import { MediaSessionManager } from "@/lib/MediaSessionManager";
import { usePlaybackStore } from "@/store/playbackStore";
import type { UseAudioPlayerResult } from "./useAudioPlayer";
import type { Reciter, Surah } from "@/types/quran";

function getMediaMetadata(
    selectedSurahName: string,
    selectedReciterName: string,
    startAyah: number,
    endAyah: number,
) {
    return new MediaMetadata(
        {
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
        },
    );
}

export const useMediaSession = (audioPlayerResult: UseAudioPlayerResult) => {
    const {
        nextAyah,
        pause,
        play,
        setCurrentIndex,
        stop,
        prevAyah,
    } = audioPlayerResult;
    const {
        selectedSurah,
        selectedReciter,
        startAyah,
        endAyah,
        currentAyahIndex,
    } = usePlaybackStore();

    const mediaSessionManagerRef = useRef<MediaSessionManager | null>(null);

    useEffect(() => {
        if (MediaSessionManager.isAPIAvailable()) {
            mediaSessionManagerRef.current = new MediaSessionManager(
                getMediaMetadata(
                    selectedSurah.nameEnglish,
                    selectedReciter.name,
                    startAyah,
                    endAyah,
                ),
            );
        }

        return () => {
            mediaSessionManagerRef.current?.destroy();
        };
    }, []);

    useEffect(() => {
        if (MediaSessionManager.isAPIAvailable()) {
            if (!mediaSessionManagerRef.current) {
                mediaSessionManagerRef.current = new MediaSessionManager(
                    getMediaMetadata(
                        selectedSurah.nameEnglish,
                        selectedReciter.name,
                        startAyah,
                        endAyah,
                    ),
                );
            }
            mediaSessionManagerRef.current.setMetadata(
                getMediaMetadata(
                    selectedSurah.nameEnglish,
                    selectedReciter.name,
                    startAyah,
                    endAyah,
                ),
            );
            console.log("set media session metadata");

            mediaSessionManagerRef.current.onPlay(() => {
                play();
            });

            mediaSessionManagerRef.current.onPause(() => {
                pause();
            });

            mediaSessionManagerRef.current.onStop(() => {
                stop();
            });

            mediaSessionManagerRef.current.onSeekBackward(() => {
                prevAyah();
            });

            mediaSessionManagerRef.current.onSeekForward(() => {
                nextAyah();
            });

            mediaSessionManagerRef.current.onPreviousTrack(() => {
                prevAyah();
            });

            mediaSessionManagerRef.current.onNextTrack(() => {
                nextAyah();
            });
        }

        return () => {
            mediaSessionManagerRef.current?.destroy();
        };
    }, [
        selectedSurah,
        startAyah,
        endAyah,
        selectedReciter.name,
        currentAyahIndex,
        setCurrentIndex,
        prevAyah,
        nextAyah,
        play,
        pause,
        stop,
    ]);
};
