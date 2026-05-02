export type Reciter = {
  id: string;
  name: string;
  style?: string;
  editionIdentifier: string;
};

export type Surah = {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  englishMeaning?: string;
  ayahCount: number;
};

export type AyahAudio = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  audioUrl: string;
  textArabic?: string;
  translation?: string;
  durationMs?: number;
};

export type SavedLoop = {
  id: string;
  name: string;
  surahNumber: number;
  surahNameEnglish: string;
  startAyah: number;
  endAyah: number;
  reciterId: string;
  reciterName: string;
  repeatEachAyah: number;
  pauseBetweenAyahsMs: number;
  playbackRate: number;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  reciterId: string;
  playbackRate: number;
  repeatEachAyah: number;
  pauseBetweenAyahsMs: number;
  showArabic: boolean;
  showTranslation: boolean;
};
