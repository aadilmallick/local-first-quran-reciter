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
├── hooks/            # Custom React hooks
├── lib/
│   └── LocalStorageBrowser.ts  # Generic typed localStorage wrapper (pre-existing)
├── store/
│   └── playbackStore.ts        # Zustand global state
├── types/
│   └── quran.ts      # All shared TypeScript types
└── utils/
    ├── quran.ts      # Formatting + clamping helpers
    └── storage.ts    # Typed localStorage instances
```

---

## Types (`src/types/quran.ts`)

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
| `toggleShowArabic()` | Persists prefs |
| `toggleShowTranslation()` | Persists prefs |

**Persisted fields** (via `prefsStorage`): `reciterId`, `playbackRate`, `repeatEachAyah`, `pauseBetweenAyahsMs`, `showArabic`, `showTranslation`. Surah/range are not persisted.

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

### `useLocalStorage` (`src/hooks/useLocalStorage.ts`)

Generic hook wrapping `LocalStorageBrowser` with `useState` for reactive reads. Not used directly by the main app flow (store handles persistence internally), but available for simpler use cases.

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

Renders all loaded ayahs as cards. The active ayah (`currentAyahIndex`) gets an emerald highlight and scrolls into view via `scrollIntoView({ behavior: "smooth" })`. Arabic text is rendered `dir="rtl"` in a large serif font. Shows graceful fallbacks for missing Arabic text or translation.

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

Two typed `LocalStorageBrowser` instances:

```ts
savedLoopsStorage  // key: "quran_memorizer_saved_loops" → SavedLoop[]
prefsStorage       // key: "quran_memorizer_preferences" → UserPreferences
```

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
