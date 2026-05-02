import type { AyahAudio, Reciter, Surah } from "../types/quran";
import { getAyahAudioForSurah } from "./audio";
import { getReciters } from "./reciters";
import { getSurahs } from "./surahs";

// Swap this interface implementation to use a different data provider.
interface QuranProvider {
  getSurahs(): Promise<Surah[]>;
  getReciters(): Promise<Reciter[]>;
  getAyahAudioForSurah(params: {
    surahNumber: number;
    reciterId: string;
  }): Promise<AyahAudio[]>;
}

const alquranCloudProvider: QuranProvider = {
  getSurahs: async () => getSurahs(),
  getReciters: async () => getReciters(),
  getAyahAudioForSurah,
};

export const quranClient: QuranProvider = alquranCloudProvider;
