import { z } from "zod";
import type { AyahAudio } from "../types/quran";
import { getReciterById } from "./reciters";

// Requests go through Vite's dev proxy (/quran-api → https://api.alquran.cloud).
// In production, deploy a reverse proxy or serverless function and update this value.
const BASE_URL = "/quran-api/v1";
const baseTranslationEdition = "en.sahih";

// alquran.cloud sends a different shape for the multi-edition endpoint
const AlquranAyahSchema = z.object({
  number: z.number(), // global ayah number (1-6236)
  numberInSurah: z.number(),
  text: z.string(), // Arabic text
  audio: z.string().optional(), // full CDN URL for audio edition
});

const AlquranEditionDataSchema = z.object({
  number: z.number(),
  edition: z.object({ identifier: z.string() }),
  ayahs: z.array(AlquranAyahSchema),
});

const AlquranMultiEditionResponseSchema = z.object({
  code: z.number(),
  data: z.array(AlquranEditionDataSchema),
});

export async function getAyahAudioForSurah({
  surahNumber,
  reciterId,
}: {
  surahNumber: number;
  reciterId: string;
}): Promise<AyahAudio[]> {
  const reciter = getReciterById(reciterId);
  if (!reciter) {
    throw new Error(`Unknown reciter id: ${reciterId}`);
  }

  const { editionIdentifier } = reciter;
  // Fetching audio + English translation (en.asad) in a single request.
  // To swap to a different translation, change "en.asad" here.
  const url =
    `${BASE_URL}/surah/${surahNumber}/editions/${editionIdentifier},${baseTranslationEdition}`;

  let json: unknown;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    json = await res.json();
  } catch (err) {
    // If this throws with a CORS or network error, add a proxy prefix to BASE_URL above.
    throw new Error(
      `Failed to fetch audio for surah ${surahNumber}: ${
        err instanceof Error ? err.message : String(err)
      }`,
      { cause: err },
    );
  }

  const parsed = AlquranMultiEditionResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Unexpected API response shape: ${parsed.error.message}`);
  }

  // The response contains two items: [audioEdition, translationEdition]
  const audioEdition = parsed.data.data.find((d) =>
    d.edition.identifier === editionIdentifier
  );
  const translationEdition = parsed.data.data.find((d) =>
    d.edition.identifier === baseTranslationEdition
  );

  if (!audioEdition) {
    throw new Error(`No audio data found for edition ${editionIdentifier}`);
  }

  const ayahs: AyahAudio[] = audioEdition.ayahs.map((ayah, i) => ({
    verseKey: `${surahNumber}:${ayah.numberInSurah}`,
    surahNumber,
    ayahNumber: ayah.numberInSurah,
    audioUrl: ayah.audio ?? "",
    textArabic: ayah.text,
    translation: translationEdition?.ayahs[i]?.text,
  }));

  return ayahs;
}
