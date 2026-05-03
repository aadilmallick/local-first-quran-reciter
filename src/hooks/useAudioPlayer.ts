import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AyahAudio } from "../types/quran";
import { usePlaybackStore } from "../store/playbackStore";
import bismillahUrl from "../assets/Bismillah.mp3";

export interface UseAudioPlayerResult {
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextAyah: () => void;
  prevAyah: () => void;
  setCurrentIndex: (index: number) => void;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
}

export function useAudioPlayer(ayahs: AyahAudio[]): UseAudioPlayerResult {
  const {
    currentAyahIndex,
    isPlaying,
    isLoopingRange,
    repeatEachAyah,
    pauseBetweenAyahsMs,
    playbackRate,
    volume,
    playBismillah,
    setCurrentAyahIndex,
    setIsPlaying,
  } = usePlaybackStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Allowed initialization pattern: == null check during render
  if (audioRef.current == null) {
    audioRef.current = new Audio();
  }

  const bismillahAudioRef = useRef(new Audio(bismillahUrl));
  const isBismillahPlayingRef = useRef(false);

  const repeatCountRef = useRef(0);
  const isPausingRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Stable refs for use inside async callbacks — updated synchronously after every render
  const ayahsRef = useRef(ayahs);
  const currentIndexRef = useRef(currentAyahIndex);
  const isLoopingRef = useRef(isLoopingRange);
  const repeatEachRef = useRef(repeatEachAyah);
  const pauseMsRef = useRef(pauseBetweenAyahsMs);
  const isPlayingRef = useRef(isPlaying);
  const playBismillahRef = useRef(playBismillah);

  useLayoutEffect(() => {
    ayahsRef.current = ayahs;
    currentIndexRef.current = currentAyahIndex;
    isLoopingRef.current = isLoopingRange;
    repeatEachRef.current = repeatEachAyah;
    pauseMsRef.current = pauseBetweenAyahsMs;
    isPlayingRef.current = isPlaying;
    playBismillahRef.current = playBismillah;
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    bismillahAudioRef.current.volume = volume;
  }, [volume]);

  // Load the correct audio source whenever the current ayah or ayahs array changes.
  // currentTime/duration resets are handled by the loadstart event listener below.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || ayahs.length === 0) return;

    const ayah = ayahs[currentAyahIndex];
    if (!ayah) return;

    const wasPlaying = isPlayingRef.current && !isPausingRef.current;
    audio.pause();
    audio.src = ayah.audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = volume;
    audio.load();

    if (wasPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAyahIndex, ayahs]);

  const playBismillahThen = (onDone: () => void) => {
    const bismillah = bismillahAudioRef.current;
    bismillah.pause();
    bismillah.currentTime = 0;
    bismillah.volume = audioRef.current?.volume ?? 1;
    isBismillahPlayingRef.current = true;

    const onEnded = () => {
      isBismillahPlayingRef.current = false;
      bismillah.removeEventListener("ended", onEnded);
      onDone();
    };
    bismillah.addEventListener("ended", onEnded);
    bismillah.play().catch(() => {
      bismillah.removeEventListener("ended", onEnded);
      isBismillahPlayingRef.current = false;
      onDone();
    });
  };

  const advanceAyah = useCallback(() => {
    const currentAyahs = ayahsRef.current;
    const index = currentIndexRef.current;

    if (index >= currentAyahs.length - 1) {
      if (isLoopingRef.current) {
        repeatCountRef.current = 0;
        if (playBismillahRef.current) {
          playBismillahThen(() => {
            if (currentIndexRef.current === 0) {
              // Single-ayah loop: index won't change so loading effect won't fire; play directly
              const audio = audioRef.current!;
              audio.currentTime = 0;
              audio.play().catch(() => setIsPlaying(false));
            } else {
              // Multi-ayah loop: changing the index triggers the loading effect which plays
              // the audio. Don't call audio.play() here — doing both causes the loading
              // effect's audio.load() to abort the first play() promise, which fires
              // setIsPlaying(false) and breaks subsequent loop iterations.
              setCurrentAyahIndex(0);
            }
          });
        } else {
          setCurrentAyahIndex(0);
        }
      } else {
        setIsPlaying(false);
        setCurrentAyahIndex(0);
      }
    } else {
      repeatCountRef.current = 0;
      setCurrentAyahIndex(index + 1);
    }
  }, [setCurrentAyahIndex, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current!;

    const onEnded = () => {
      if (isPausingRef.current) return;

      if (repeatCountRef.current < repeatEachRef.current - 1) {
        repeatCountRef.current += 1;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      repeatCountRef.current = 0;
      if (pauseMsRef.current > 0) {
        isPausingRef.current = true;
        pauseTimerRef.current = setTimeout(() => {
          isPausingRef.current = false;
          advanceAyah();
        }, pauseMsRef.current);
      } else {
        advanceAyah();
      }
    };

    // Reset progress display when a new source starts loading
    const onLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("error", onError);
    };
  }, [advanceAyah, setIsPlaying]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || ayahsRef.current.length === 0) return;
    const ayah = ayahsRef.current[currentIndexRef.current];
    if (!ayah) return;

    if (!audio.src || audio.src !== ayah.audioUrl) {
      audio.src = ayah.audioUrl;
      audio.playbackRate = playbackRate;
      audio.volume = volume;
      audio.load();
    }

    setIsPlaying(true);

    if (currentIndexRef.current === 0 && playBismillahRef.current) {
      playBismillahThen(() => {
        audio.play().catch(() => setIsPlaying(false));
      });
    } else {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [playbackRate, volume, setIsPlaying]);

  const pause = useCallback(() => {
    if (isBismillahPlayingRef.current) {
      bismillahAudioRef.current.pause();
      isBismillahPlayingRef.current = false;
    }
    audioRef.current?.pause();
    setIsPlaying(false);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      isPausingRef.current = false;
    }
  }, [setIsPlaying]);

  const stop = useCallback(() => {
    if (isBismillahPlayingRef.current) {
      bismillahAudioRef.current.pause();
      bismillahAudioRef.current.currentTime = 0;
      isBismillahPlayingRef.current = false;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      isPausingRef.current = false;
    }
    repeatCountRef.current = 0;
    setIsPlaying(false);
    setCurrentAyahIndex(0);
  }, [setIsPlaying, setCurrentAyahIndex]);

  const nextAyah = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    isPausingRef.current = false;
    repeatCountRef.current = 0;
    advanceAyah();
  }, [advanceAyah]);

  const prevAyah = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    isPausingRef.current = false;
    repeatCountRef.current = 0;
    setCurrentAyahIndex(Math.max(0, currentIndexRef.current - 1));
  }, [setCurrentAyahIndex]);

  const setCurrentIndex = useCallback(
    (index: number) => {
      repeatCountRef.current = 0;
      setCurrentAyahIndex(index);
    },
    [setCurrentAyahIndex]
  );

  return { play, pause, stop, nextAyah, prevAyah, setCurrentIndex, isBuffering, currentTime, duration };
}
