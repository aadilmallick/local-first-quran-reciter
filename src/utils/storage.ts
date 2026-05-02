import { LocalStorageBrowser } from "../lib/LocalStorageBrowser";
import type { SavedLoop, UserPreferences } from "../types/quran";

type SavedLoopsStore = {
  quran_memorizer_saved_loops: SavedLoop[];
};

type PreferencesStore = {
  quran_memorizer_preferences: UserPreferences;
};

export const savedLoopsStorage = new LocalStorageBrowser<SavedLoopsStore>("");
export const prefsStorage = new LocalStorageBrowser<PreferencesStore>("");
