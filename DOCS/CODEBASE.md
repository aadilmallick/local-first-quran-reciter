# Quran Loop Memorizer — Codebase Reference

Frontend-only Quran memorization app. No backend. All state is client-side; persistence via `localStorage`. Audio served from [alquran.cloud](https://api.alquran.cloud) CDN.

**Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand · Zod · lucide-react

---

## Project Layout

```
src/
├── api/              # Data fetching and static data
│   ├── audio.ts      # Fetch per-surah audio from alquran.cloud (Zod-validated)
│   ├── quranClient.ts# Provider interface + default implementation
│   ├── reciters.ts   # Static list of 4 reciters
│   └── surahs.ts     # Static list of all 114 surahs
├── components/       # UI components
│   └── ui/           # shadcn-generated components (button, dialog, tabs, select)
├── contexts/
│   └── UiSettingsContext.tsx   # React context for UI preferences (font size, etc.)
├── hooks/            # Custom React hooks
├── lib/
│   └── LocalStorageBrowser.ts  # Generic typed localStorage wrapper (pre-existing)
├── store/
│   └── playbackStore.ts        # Zustand global state
├── types/
│   ├── quran.ts      # All shared TypeScript types
│   └── settings.ts   # UI settings types (ArabicFontSize, UiSettings)
└── utils/
    ├── quran.ts      # Formatting + clamping helpers
    └── storage.ts    # Typed localStorage instances
```

---

## Types (`src/types/quran.ts` and `src/types/settings.ts`)

```ts
type Reciter = {
  id: string;
  name: string;
  style?: string;
  editionIdentifier: string; // alquran.cloud edition ID, e.g. "ar.alafasy"
};

type Surah = {
  number: number;          // 1–114
  nameArabic: string;
  nameEnglish: string;
  englishMeaning?: string;
  ayahCount: number;
};

type AyahAudio = {
  verseKey: string;        // e.g. "18:4"
  surahNumber: number;
  ayahNumber: number;      // 1-based within surah
  audioUrl: string;        // full CDN URL, e.g. "https://cdn.islamic.network/..."
  textArabic?: string;
  translation?: string;
  durationMs?: number;
};

type SavedLoop = {
  id: string;              // crypto.randomUUID()
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
  createdAt: string;       // ISO string
  updatedAt: string;
};

type UserPreferences = {
  reciterId: string;
  playbackRate: number;
  repeatEachAyah: number;
  pauseBetweenAyahsMs: number;
  showArabic: boolean;
  showTranslation: boolean;
  volume: number;        // float [0, 1]; defaults to 1 for old prefs without this field
  playBismillah?: boolean;
};
```

`src/types/settings.ts` holds UI-only preferences that are unrelated to Quran data:

```ts
type ArabicFontSize = "small" | "medium" | "large";

type UiSettings = {
  arabicFontSize: ArabicFontSize;  // maps to text-2xl / text-3xl / text-4xl
};
```

---

## API Layer

### `src/api/audio.ts`

Core fetcher. Calls the alquran.cloud multi-edition endpoint and parses it with Zod.

```
GET /quran-api/v1/surah/{n}/editions/{editionIdentifier},en.asad
```

The `/quran-api` prefix is rewritten by the Vite dev proxy to `https://api.alquran.cloud`. For production, a reverse proxy or serverless rewrite must be configured.

The response contains two edition arrays: one audio (`ar.alafasy` etc.) and one text (`en.asad`). The function zips them by index to produce `AyahAudio[]` for the full surah. Filtering to the user's range happens in `useQuranAudioRange`, not here.

**Key export:** `getAyahAudioForSurah({ surahNumber, reciterId }): Promise<AyahAudio[]>`

### `src/api/quranClient.ts`

Thin provider abstraction. To swap data sources, implement `QuranProvider` and reassign `quranClient`.

```ts
interface QuranProvider {
  getSurahs(): Promise<Surah[]>;
  getReciters(): Promise<Reciter[]>;
  getAyahAudioForSurah(params: { surahNumber: number; reciterId: string }): Promise<AyahAudio[]>;
}

export const quranClient: QuranProvider; // currently alquranCloudProvider
```

### `src/api/reciters.ts`

Static array of 4 reciters. Each entry maps an app-internal `id` to an alquran.cloud `editionIdentifier`.

| id | name | editionIdentifier |
|----|------|-------------------|
| `alafasy` | Mishary Rashid Alafasy | `ar.alafasy` |
| `sudais` | Abdul Rahman Al-Sudais | `ar.abdurrahmansudais` |
| `ghamdi` | Saad Al-Ghamdi | `ar.saoodashgali` |
| `muaiqly` | Maher Al-Muaiqly | `ar.mahermuaiqly` |

To add a reciter, find its identifier at `GET https://api.alquran.cloud/v1/edition?format=audio&language=ar` and add an entry to `RECITERS`.

### `src/api/surahs.ts`

Hardcoded array of all 114 surahs. Never fetched from the network — avoids a round-trip and makes the surah list available instantly.

---

## Zustand Store (`src/store/playbackStore.ts`)

Single store for all playback state. Initialized from `prefsStorage` on creation; persists certain fields back to localStorage on change.

### State shape

| Field | Type | Default |
|-------|------|---------|
| `selectedSurah` | `Surah` | Al-Kahf (surah 18) |
| `selectedReciter` | `Reciter` | Mishary Alafasy |
| `startAyah` | `number` | 1 |
| `endAyah` | `number` | 5 |
| `currentAyahIndex` | `number` | 0 (index into loaded ayahs array) |
| `isPlaying` | `boolean` | false |
| `isLoopingRange` | `boolean` | true |
| `repeatEachAyah` | `number` | 1 |
| `pauseBetweenAyahsMs` | `number` | 0 |
| `playbackRate` | `number` | 1 |
| `volume` | `number` | 1 |
| `showArabic` | `boolean` | true |
| `showTranslation` | `boolean` | true |

### Actions

| Action | Effect |
|--------|--------|
| `setSelectedSurah(surah)` | Clamps range to new surah's bounds; resets index + isPlaying |
| `setSelectedReciter(reciter)` | Resets index + isPlaying; persists prefs |
| `setAyahRange(start, end)` | Clamps and stores; resets index + isPlaying |
| `setCurrentAyahIndex(n)` | Updates index (driven by audio player) |
| `setIsPlaying(bool)` | Mirrors audio element playing state |
| `toggleLoop()` | Flips `isLoopingRange` |
| `setRepeatEachAyah(n)` | Persists prefs |
| `setPauseBetweenAyahs(ms)` | Persists prefs |
| `setPlaybackRate(rate)` | Persists prefs |
| `setVolume(v)` | Clamps to `[0, 1]`; persists prefs |
| `toggleShowArabic()` | Persists prefs |
| `toggleShowTranslation()` | Persists prefs |

**Persisted fields** (via `prefsStorage`): `reciterId`, `playbackRate`, `repeatEachAyah`, `pauseBetweenAyahsMs`, `showArabic`, `showTranslation`, `volume`. Surah/range are not persisted.

---

## Hooks

### `useQuranAudioRange` (`src/hooks/useQuranAudioRange.ts`)

Fetches audio + text for one surah and filters to the selected range.

```ts
function useQuranAudioRange(params: {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  reciterId: string;
}): {
  ayahs: AyahAudio[];   // memoized — stable reference between renders
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**Key behaviors:**
- Fetches the full surah once per `(surahNumber, reciterId)` pair; a `lastFetchKey` ref deduplicates.
- `ayahs` is **memoized** with `useMemo` on `[allAyahs, startAyah, endAyah]`. This is load-bearing: a new array reference on every render would cause `useAudioPlayer`'s load effect to re-fire and interrupt playback.
- All `setState` calls happen inside an async IIFE after `await Promise.resolve()` to satisfy the `react-hooks/set-state-in-effect` lint rule.
- `refetch()` resets `lastFetchKey` and increments `refetchTrigger` to force a re-fetch.

### `useAudioPlayer` (`src/hooks/useAudioPlayer.ts`)

All audio sequencing logic. Uses a single persistent `HTMLAudioElement`.

```ts
export interface UseAudioPlayerResult {
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextAyah: () => void;
  prevAyah: () => void;
  setCurrentIndex: (index: number) => void;
  isBuffering: boolean;
  currentTime: number;  // seconds
  duration: number;     // seconds
}

function useAudioPlayer(ayahs: AyahAudio[]): UseAudioPlayerResult
```

**Ref architecture** — avoids stale closures inside event callbacks:

| Ref | Mirrors |
|-----|---------|
| `ayahsRef` | `ayahs` prop |
| `currentIndexRef` | `currentAyahIndex` from store |
| `isLoopingRef` | `isLoopingRange` |
| `repeatEachRef` | `repeatEachAyah` |
| `pauseMsRef` | `pauseBetweenAyahsMs` |
| `isPlayingRef` | `isPlaying` |
| `repeatCountRef` | How many times current ayah has played (0-based) |
| `isPausingRef` | Whether in an inter-ayah pause window |
| `pauseTimerRef` | `setTimeout` handle for inter-ayah pause |

All "mirror" refs are synced in a `useLayoutEffect` with no dependency array (fires after every render, synchronously before paint).

**`onEnded` logic:**

```
if repeatCountRef.current < repeatEachRef.current - 1:
  increment repeatCountRef, replay same ayah
else:
  reset repeatCountRef
  if pauseMsRef.current > 0:
    set isPausingRef = true
    setTimeout(advanceAyah, pauseMs)
  else:
    advanceAyah()
```

**`advanceAyah`:**
- If at last ayah and `isLoopingRange`: go to index 0
- If at last ayah and not looping: stop, reset to 0
- Otherwise: go to next index

**Load effect** (deps: `[currentAyahIndex, ayahs]`): sets `audio.src` and calls `audio.load()`. Auto-resumes playback if `isPlayingRef.current && !isPausingRef.current` at the time it fires.

**Event listeners** managed in a single `useEffect`: `ended`, `loadstart`, `waiting`, `canplay`, `timeupdate`, `durationchange`, `error`. `loadstart` resets `currentTime`/`duration` to 0 so the progress bar clears when a new ayah begins loading.

### `useSavedLoops` (`src/hooks/useSavedLoops.ts`)

CRUD for saved loops backed by `savedLoopsStorage`.

```ts
function useSavedLoops(): {
  loops: SavedLoop[];
  saveLoop: (name: string) => void;
  updateLoop: (id: string, name: string) => void;
  deleteLoop: (id: string) => void;
  loadLoop: (loop: SavedLoop) => void;
}
```

**`loadLoop`** restores a saved loop to the store: calls `setSelectedSurah` immediately, then uses `setTimeout(0)` to call the remaining setters so the surah's range reset doesn't overwrite the loop's range.

**Important:** `useSavedLoops` is called once in `App.tsx` and its return values passed as props to `CurrentLoopCard` and `SavedLoopsPanel`. Calling it in both components would create independent state instances that don't stay in sync.

### `useKeyboardShortcuts` (`src/hooks/useKeyboardShortcuts.ts`)

Registers document-level keyboard shortcuts for audio control. Called once in `App.tsx`.

```ts
function useKeyboardShortcuts(player: UseAudioPlayerResult, totalAyahs: number): void
```

| Key | Action |
|-----|--------|
| `Space` | Toggle play/pause |
| `ArrowRight` | Next ayah |
| `ArrowLeft` | Previous ayah |

Skips handling when the focused element is an `INPUT`, `SELECT`, or `TEXTAREA`. Reads `isPlaying` via `usePlaybackStore.getState()` inside the handler (avoids stale closure without re-registering). Uses a `useLayoutEffect` ref for `totalAyahs` so the listener isn't re-registered when the ayah count changes.

### `useLocalStorage` (`src/hooks/useLocalStorage.ts`)

Generic hook wrapping `LocalStorageBrowser` with `useState` for reactive reads.

```ts
function useLocalStorage<T extends Record<string, unknown>, K extends keyof T & string>(
  storage: LocalStorageBrowser<T>,
  key: K,
  defaultValue: T[K]
): [T[K], (value: T[K]) => void, () => void]
```

Used by `UiSettingsContext` to back display preferences with localStorage. The playback store manages its own persistence directly (no hook needed there); `useLocalStorage` is for contexts or components that want reactive localStorage without Zustand.

---

## Components

### `AppLayout`

3-column grid on `lg:` screens, single column on mobile. Accepts four render-prop slots: `selectionPanel`, `controlsPanel`, `loopsPanel`, `textDisplay`. The text display spans all 3 columns at the bottom.

### `SurahSelector`

Searchable surah list. A text input filters the `SURAHS` array by English name, Arabic name, or number. Renders as a `<select size={6}>` (scrollable list box). On change, calls `setSelectedSurah`.

### `AyahRangeSelector`

Two number inputs (From / To). Clamps values against `[1, selectedSurah.ayahCount]` and keeps start ≤ end. Displays the formatted range label below.

### `ReciterSelector`

Simple `<select>` over the static `RECITERS` array.

### `AudioControls`

Accepts `player: UseAudioPlayerResult` and `totalAyahs: number`.

- Play/Pause toggle, Stop, Prev, Next (all disabled when `totalAyahs === 0`)
- Loop toggle button (highlights when `isLoopingRange`)
- Progress bar: `(currentTime / duration) * 100%`
- Current ayah label: `startAyah + currentAyahIndex`
- Playback speed pill buttons: 0.75× 1× 1.25× 1.5×
- Volume row: mute-toggle icon (`VolumeX` / `Volume1` / `Volume2`) + range slider `[0, 1]` with step 0.05; persisted across sessions
- All five navigation buttons call `e.currentTarget.blur()` after their action so keyboard shortcuts remain active immediately after a click

### `MemorizationControls`

- Repeat count buttons: 1× 2× 3× 5× 10×
- Pause between ayahs buttons: 0s 1s 2s 3s 5s
- Arabic text toggle / Translation toggle

### `CurrentLoopCard`

Shows current surah name, range label, reciter. "Save" button reveals an inline text input to name the loop, with Enter key support.

Props: `onSave: (name: string) => void` — lifted from `App.tsx`.

### `SavedLoopsPanel`

Lists all saved loops. Each item shows name, range label, and reciter name, with Load (▶) and Delete (🗑) buttons.

Props: `loops`, `onLoad`, `onDelete` — all lifted from `App.tsx` via `useSavedLoops`.

### `QuranTextDisplay`

Renders all loaded ayahs as cards. The active ayah (`currentAyahIndex`) gets an emerald highlight and scrolls into view via `scrollIntoView({ behavior: "smooth" })`. Arabic text is rendered `dir="rtl"` in a serif font whose size is driven by `arabicFontSize` from `useUiSettings` (`text-2xl` / `text-3xl` / `text-4xl`). Shows graceful fallbacks for missing Arabic text or translation.

### `SettingsDialog`

See the dedicated section below (under **shadcn Components**).

---

## Utilities

### `src/utils/quran.ts`

| Function | Returns |
|----------|---------|
| `formatVerseKey(surahNumber, ayahNumber)` | `"18:4"` |
| `formatRangeLabel(surah, start, end)` | `"Al-Kahf 4–9"` |
| `clampAyahRange(surah, start, end)` | `{ start, end }` clamped to `[1, ayahCount]` |
| `defaultRangeForSurah(surah)` | `{ start: 1, end: min(5, ayahCount) }` |

### `src/utils/storage.ts`

Three typed `LocalStorageBrowser` instances:

```ts
savedLoopsStorage   // key: "quran_memorizer_saved_loops"      → SavedLoop[]
prefsStorage        // key: "quran_memorizer_preferences"      → UserPreferences
uiSettingsStorage   // key: "quran_memorizer_ui_settings"      → UiSettings
```

`uiSettingsStorage` is consumed exclusively by `UiSettingsContext` via the `useLocalStorage` hook — not by the Zustand store. Add new UI-preference keys to `UiSettings` (in `src/types/settings.ts`) and handle them inside the context.

---

## UI Settings Context (`src/contexts/UiSettingsContext.tsx`)

React context that owns all display preferences that live outside the Zustand playback store. Uses `useLocalStorage` internally so state is reactive within the session and automatically persisted to `uiSettingsStorage`.

```ts
// Provider — wrap the app root with this (already done in main.tsx)
function UiSettingsProvider({ children }: { children: ReactNode }): JSX.Element

// Hook — call in any component under the provider
function useUiSettings(): {
  arabicFontSize: ArabicFontSize;
  setArabicFontSize: (size: ArabicFontSize) => void;
}
```

**Why a context instead of Zustand?** The UI settings don't interact with audio playback at all. Keeping them in a separate context avoids polluting the playback store and makes the dependency clear: components that only care about display can import from the context without touching audio state.

**Adding a new setting:** add the field to `UiSettings` in `src/types/settings.ts`, add state + setter to the provider, expose via the `useUiSettings` return value.

---

## shadcn Components (`src/components/ui/`)

Installed via `npx shadcn@latest` (CLI v4) using **Base UI** primitives (`@base-ui/react`) for Tailwind v4 compatibility. Components are source-owned — edit them directly if behaviour needs to change.

| File | Primitives used |
|------|-----------------|
| `button.tsx` | `@base-ui/react/button` + `cva` |
| `dialog.tsx` | `@base-ui/react/dialog` |
| `tabs.tsx` | `@base-ui/react/tabs` + `cva` |
| `select.tsx` | `@base-ui/react/select` |

**Path alias:** `@/` resolves to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`). Required by shadcn's generated imports (`@/lib/utils`, `@/components/ui/...`).

---

## `SettingsDialog` (`src/components/SettingsDialog.tsx`)

Gear-icon button in the navbar that opens a wide (`max-w-2xl`) modal with a sidebar-style navigation layout.

- Left panel (`w-52`, stone-50): vertical `TabsList` acting as a category sidebar
- Right panel: scrollable `TabsContent` area per category
- Uses `Tabs orientation="vertical"` from shadcn — triggers are full-width, left-aligned, with active-state highlight

To add a new settings category:
1. Add an entry to the `NAV_ITEMS` array (value, label, lucide icon)
2. Add a corresponding `<TabsContent value="...">` block with the settings controls
3. Wire any new preference fields through `useUiSettings` (or a new context if the domain is unrelated to display)

---

## Vite Proxy

`vite.config.ts` proxies `/quran-api/*` → `https://api.alquran.cloud/*` in development to avoid CORS. The audio CDN (`cdn.islamic.network`) is loaded directly by the `<audio>` element and does not require a proxy (media elements are exempt from CORS restrictions).

For production deployment, configure equivalent rewrites at the hosting layer.

---

## Data Flow

```
User selects surah/range/reciter
        │
        ▼
useQuranAudioRange
  → fetches full surah via quranClient
  → filters to [startAyah..endAyah]
  → returns memoized AyahAudio[]
        │
        ▼
useAudioPlayer(ayahs)
  → manages single HTMLAudioElement
  → reads playback settings from store via refs
  → advances index via setCurrentAyahIndex
  → returns { play, pause, stop, ... }
        │
        ▼
AudioControls (play/pause/stop/nav)
QuranTextDisplay (highlights active ayah)
```

---

## Known Limitations

- **No offline support.** Audio files are streamed from the CDN on demand. Adding `vite-plugin-pwa` with a cache-first strategy for CDN MP3s would enable offline playback.
- **Vite proxy is dev-only.** The production build needs a server-side rewrite for `/quran-api` requests.
- **`ar.saoodashgali`** (Saad Al-Ghamdi's edition identifier) has not been verified against the live API; it may need adjustment.
