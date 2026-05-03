import { create } from "zustand";
import { RECITERS } from "../api/reciters";
import { SURAHS } from "../api/surahs";
import type { Reciter, Surah, UserPreferences } from "../types/quran";
import { clampAyahRange, defaultRangeForSurah } from "../utils/quran";
import { prefsStorage } from "../utils/storage";

interface PlaybackState {
  selectedSurah: Surah;
  selectedReciter: Reciter;
  startAyah: number;
  endAyah: number;
  currentAyahIndex: number;
  isPlaying: boolean;
  isLoopingRange: boolean;
  repeatEachAyah: number;
  pauseBetweenAyahsMs: number;
  playbackRate: number;
  showArabic: boolean;
  showTranslation: boolean;
}

interface PlaybackActions {
  setSelectedSurah: (surah: Surah) => void;
  setSelectedReciter: (reciter: Reciter) => void;
  setAyahRange: (start: number, end: number) => void;
  setCurrentAyahIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLoop: () => void;
  setRepeatEachAyah: (n: number) => void;
  setPauseBetweenAyahs: (ms: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleShowArabic: () => void;
  toggleShowTranslation: () => void;
  loadPreferences: (prefs: Partial<UserPreferences>) => void;
}

function loadSavedPrefs(): Partial<PlaybackState> {
  try {
    const prefs = prefsStorage.get("quran_memorizer_preferences");
    if (!prefs) return {};
    const reciter = RECITERS.find((r) => r.id === prefs.reciterId);
    return {
      selectedReciter: reciter ?? RECITERS[0],
      playbackRate: prefs.playbackRate,
      repeatEachAyah: prefs.repeatEachAyah,
      pauseBetweenAyahsMs: prefs.pauseBetweenAyahsMs,
      showArabic: prefs.showArabic,
      showTranslation: prefs.showTranslation,
    };
  } catch {
    return {};
  }
}

const defaultSurah = SURAHS[17]; // Al-Kahf (surah 18, index 17)
const defaultRange = defaultRangeForSurah(defaultSurah);

export const usePlaybackStore = create<PlaybackState & PlaybackActions>(
  (set, get) => ({
    selectedSurah: defaultSurah,
    selectedReciter: RECITERS[0],
    startAyah: defaultRange.start,
    endAyah: defaultRange.end,
    currentAyahIndex: 0,
    isPlaying: false,
    isLoopingRange: true,
    repeatEachAyah: 1,
    pauseBetweenAyahsMs: 0,
    playbackRate: 1,
    showArabic: true,
    showTranslation: true,
    ...loadSavedPrefs(),

    setSelectedSurah: (surah) => {
      // Always reset range to the entire surah (first to last ayah) — not persisted
      set({
        selectedSurah: surah,
        startAyah: 1,
        endAyah: surah.ayahCount,
        currentAyahIndex: 0,
        isPlaying: false,
      });
    },

    setSelectedReciter: (reciter) => {
      set({ selectedReciter: reciter, currentAyahIndex: 0, isPlaying: false });
      persistPrefs(get());
    },

    setAyahRange: (start, end) => {
      const { selectedSurah } = get();
      const clamped = clampAyahRange(selectedSurah, start, end);
      set({ startAyah: clamped.start, endAyah: clamped.end, currentAyahIndex: 0, isPlaying: false });
    },

    setCurrentAyahIndex: (index) => set({ currentAyahIndex: index }),

    setIsPlaying: (playing) => set({ isPlaying: playing }),

    toggleLoop: () => set((s) => ({ isLoopingRange: !s.isLoopingRange })),

    setRepeatEachAyah: (n) => {
      set({ repeatEachAyah: n });
      persistPrefs(get());
    },

    setPauseBetweenAyahs: (ms) => {
      set({ pauseBetweenAyahsMs: ms });
      persistPrefs(get());
    },

    setPlaybackRate: (rate) => {
      set({ playbackRate: rate });
      persistPrefs(get());
    },

    toggleShowArabic: () => {
      set((s) => ({ showArabic: !s.showArabic }));
      persistPrefs(get());
    },

    toggleShowTranslation: () => {
      set((s) => ({ showTranslation: !s.showTranslation }));
      persistPrefs(get());
    },

    loadPreferences: (prefs) => {
      const reciter = prefs.reciterId
        ? RECITERS.find((r) => r.id === prefs.reciterId)
        : undefined;
      set({
        ...(reciter ? { selectedReciter: reciter } : {}),
        ...(prefs.playbackRate !== undefined ? { playbackRate: prefs.playbackRate } : {}),
        ...(prefs.repeatEachAyah !== undefined ? { repeatEachAyah: prefs.repeatEachAyah } : {}),
        ...(prefs.pauseBetweenAyahsMs !== undefined ? { pauseBetweenAyahsMs: prefs.pauseBetweenAyahsMs } : {}),
        ...(prefs.showArabic !== undefined ? { showArabic: prefs.showArabic } : {}),
        ...(prefs.showTranslation !== undefined ? { showTranslation: prefs.showTranslation } : {}),
      });
    },
  })
);

function persistPrefs(state: PlaybackState) {
  try {
    prefsStorage.set("quran_memorizer_preferences", {
      reciterId: state.selectedReciter.id,
      playbackRate: state.playbackRate,
      repeatEachAyah: state.repeatEachAyah,
      pauseBetweenAyahsMs: state.pauseBetweenAyahsMs,
      showArabic: state.showArabic,
      showTranslation: state.showTranslation,
    });
  } catch {
    // localStorage unavailable — silently skip
  }
}
