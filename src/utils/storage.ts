import { LocalStorageBrowser } from "../lib/LocalStorageBrowser";
import type { SavedLoop, UserPreferences } from "../types/quran";
import type { UiSettings } from "../types/settings";

type SavedLoopsStore = {
  quran_memorizer_saved_loops: SavedLoop[];
};

type PreferencesStore = {
  quran_memorizer_preferences: UserPreferences;
};

type UiSettingsStore = {
  quran_memorizer_ui_settings: UiSettings;
};

export const savedLoopsStorage = new LocalStorageBrowser<SavedLoopsStore>("");
export const prefsStorage = new LocalStorageBrowser<PreferencesStore>("");
export const uiSettingsStorage = new LocalStorageBrowser<UiSettingsStore>("");
