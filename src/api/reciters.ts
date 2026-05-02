import type { Reciter } from "../types/quran";

// Add or update reciter IDs here to match alquran.cloud edition identifiers.
// Full list: https://api.alquran.cloud/v1/edition?format=audio&language=ar
export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    style: "Murattal",
    editionIdentifier: "ar.alafasy",
  },
  {
    id: "sudais",
    name: "Abdul Rahman Al-Sudais",
    style: "Murattal",
    editionIdentifier: "ar.abdurrahmansudais",
  },
  {
    id: "ghamdi",
    name: "Saad Al-Ghamdi",
    style: "Murattal",
    editionIdentifier: "ar.saoodashgali",
  },
  {
    id: "muaiqly",
    name: "Maher Al-Muaiqly",
    style: "Murattal",
    editionIdentifier: "ar.mahermuaiqly",
  },
];

export function getReciterById(id: string): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

export function getReciters(): Reciter[] {
  return RECITERS;
}
