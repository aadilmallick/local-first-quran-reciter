import { createContext, useContext, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { uiSettingsStorage } from "../utils/storage";
import type { ArabicFontSize, UiSettings } from "../types/settings";

const DEFAULT: UiSettings = { arabicFontSize: "small" };

interface UiSettingsContextValue {
  arabicFontSize: ArabicFontSize;
  setArabicFontSize: (size: ArabicFontSize) => void;
}

const UiSettingsContext = createContext<UiSettingsContextValue | null>(null);

export function UiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage(
    uiSettingsStorage,
    "quran_memorizer_ui_settings",
    DEFAULT
  );

  const setArabicFontSize = (size: ArabicFontSize) =>
    setSettings({ ...settings, arabicFontSize: size });

  return (
    <UiSettingsContext.Provider
      value={{ arabicFontSize: settings.arabicFontSize, setArabicFontSize }}
    >
      {children}
    </UiSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUiSettings(): UiSettingsContextValue {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) throw new Error("useUiSettings must be used inside UiSettingsProvider");
  return ctx;
}
