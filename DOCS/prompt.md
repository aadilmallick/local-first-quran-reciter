Build a complete frontend-only Quran memorization web app using React,
TypeScript, Vite, and Tailwind CSS.

The main purpose of the app is to help users memorize Quran by selecting a
surah, choosing a range of ayahs, selecting a reciter, and looping that audio
range repeatedly.

Do NOT build a backend, database, auth system, or server-side API. Use browser
localStorage for saved loops and user preferences.

Core app idea: A user should be able to select something like:

- Surah: Al-Kahf
- Start ayah: 4
- End ayah: 9
- Reciter: Mishary Alafasy Then press play, and the app should play ayah 4, then
  5, then 6, then 7, then 8, then 9. If loop mode is enabled, it should go back
  to ayah 4 and repeat continuously.

Use verse-by-verse audio files, not YouTube. The app should use a Quran API that
provides individual ayah audio URLs. Prefer Quran.com / Quran Foundation API if
possible. If you need to abstract the API calls, create a clean API client layer
so the data provider can be swapped later.

Architecture requirements: Use this structure:

src/ api/ quranClient.ts audio.ts surahs.ts reciters.ts

components/ AppLayout.tsx SurahSelector.tsx ReciterSelector.tsx
AyahRangeSelector.tsx QuranTextDisplay.tsx AudioControls.tsx
MemorizationControls.tsx SavedLoopsPanel.tsx CurrentLoopCard.tsx

hooks/ useAudioPlayer.ts useQuranAudioRange.ts useLocalStorage.ts
useSavedLoops.ts

store/ playbackStore.ts

types/ quran.ts

utils/ quran.ts storage.ts

App.tsx main.tsx index.css

Use Zustand for playback state if useful. Otherwise, React state is fine, but
keep the code clean and modular.

Data model:

type Reciter = { id: number | string; name: string; style?: string; };

type Surah = { number: number; nameArabic: string; nameEnglish: string;
englishMeaning?: string; ayahCount: number; };

type AyahAudio = { verseKey: string; // example "18:4" surahNumber: number;
ayahNumber: number; audioUrl: string; textArabic?: string; translation?: string;
durationMs?: number; };

type SavedLoop = { id: string; name: string; surahNumber: number;
surahNameEnglish: string; startAyah: number; endAyah: number; reciterId: number
| string; reciterName: string; repeatEachAyah: number; pauseBetweenAyahsMs:
number; playbackRate: number; createdAt: string; updatedAt: string; };

App state:

- selectedSurah
- selectedReciter
- startAyah
- endAyah
- currentAyah
- isPlaying
- isLoopingRange
- repeatEachAyah
- pauseBetweenAyahsMs
- playbackRate
- showArabic
- showTranslation
- savedLoops

Main features:

1. Surah selector

- Dropdown/searchable select for all 114 surahs.
- Show English name, Arabic name, and ayah count.
- When a surah changes, reset startAyah to 1 and endAyah to min(5, ayahCount),
  or preserve valid range if possible.

2. Ayah range selector

- Start ayah dropdown/input.
- End ayah dropdown/input.
- Validate that startAyah <= endAyah.
- Validate both are within the selected surah’s ayah count.
- Display selected range clearly, e.g. “Looping: Al-Kahf 4–9”.

3. Reciter selector

- Provide a small list of reciters initially.
- Include at least:
  - Mishary Rashid Alafasy
  - Abdul Rahman Al-Sudais
  - Saad Al-Ghamdi
  - Maher Al-Muaiqly
- Use whatever reciter IDs the chosen Quran audio API requires.
- Make this easy to update in src/api/reciters.ts.

4. Audio range loading

- Create a hook called useQuranAudioRange.
- Input: { surahNumber, startAyah, endAyah, reciterId }
- Output: { ayahs, isLoading, error, refetch }
- It should fetch the ayah-by-ayah audio files for the selected surah and
  reciter, then filter to the selected ayah range.
- It should return an ordered array of AyahAudio objects.

Important: If the real API requires a different response shape, adapt the parser
but keep the internal AyahAudio type consistent. If the API call fails, show a
helpful error in the UI.

5. Audio player

- Create a hook called useAudioPlayer.
- It should use a single HTMLAudioElement internally.
- It should accept an ordered array of AyahAudio objects.
- It should support:
  - play
  - pause
  - stop
  - nextAyah
  - previousAyah
  - setCurrentIndex
  - looping the whole selected range
  - repeat each ayah N times before moving to the next
  - pause between ayahs
  - playback speed
- When an ayah ends:
  - If repeatEachAyah has not been reached, replay the same ayah.
  - Else move to the next ayah.
  - If the current ayah is the final ayah in the range and loop range is
    enabled, go back to the first ayah.
  - If the current ayah is the final ayah and loop range is disabled, stop
    playback.
- Update currentAyah in the UI.
- Show loading/buffering state if possible.
- Clean up audio event listeners properly.

6. Audio controls UI Create AudioControls component with:

- Play / pause button
- Stop button
- Previous ayah button
- Next ayah button
- Loop range toggle
- Current ayah display
- Progress display if practical
- Playback speed selector:
  - 0.75x
  - 1x
  - 1.25x
  - 1.5x

7. Memorization controls Create MemorizationControls component with:

- Repeat each ayah selector:
  - 1x
  - 2x
  - 3x
  - 5x
  - 10x
- Pause between ayahs selector:
  - 0 seconds
  - 1 second
  - 2 seconds
  - 3 seconds
  - 5 seconds
- Toggle show/hide Arabic text
- Toggle show/hide translation

8. Quran text display Create QuranTextDisplay component.

- Show the selected ayah range.
- Highlight the currently playing ayah.
- Show Arabic text if available.
- Show translation if available.
- If translation or Arabic text is not available from the chosen API, show a
  graceful fallback instead of breaking.
- Keep the UI focused on memorization, not reading a full tafsir app.

9. Saved loops library using localStorage Create a “My Loops” panel. Users
   should be able to:

- Save the current configuration as a loop.
- Give the loop a custom name.
- Example loop name: “Al-Kahf 4–9 Morning Review”
- View all saved loops.
- Click a saved loop to load it into the player.
- Delete a saved loop.
- Update/overwrite a saved loop if possible.

Use localStorage key: `"quran_memorizer_saved_loops"`

Also persist user preferences with localStorage key
`"quran_memorizer_preferences"`, use local storage abstraciton in
src/lib/LocalStorageBrowser.ts, create instances in that file and export them
for a type safe abstraction over local storage.

Preferences should include:

- last selected reciter
- playback speed
- repeatEachAyah
- pauseBetweenAyahsMs
- showArabic
- showTranslation

10. UI design Make the UI clean, modern, and calm. Use Tailwind CSS. Design
    inspiration:

- Islamic but minimal
- soft background
- card-based layout
- readable Arabic text
- mobile-friendly
- desktop-friendly
- not cluttered

Suggested layout:

- Header: App name “Quran Loop Memorizer”
- Main grid:
  - Left/top card: Select Surah, ayah range, reciter
  - Center card: Current loop and audio controls
  - Right/bottom card: Saved loops
- Quran text display below the controls.

Use responsive design:

- On desktop, use a 3-column or 2-column layout.
- On mobile, stack everything vertically.

11. Error and loading states Handle:

- API loading
- no audio found
- invalid ayah range
- failed audio load
- unsupported reciter/surah combination
- localStorage unavailable

12. Code quality

- Use TypeScript properly.
- Avoid giant components.
- Keep API functions isolated.
- Keep audio logic inside hooks.
- Add comments for the audio sequencing logic.
- Avoid unnecessary dependencies.
- Make the app runnable with: npm install npm run dev

13. Package choices Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand if helpful
- Zod for runtime data validation if helpful for fetching from an API
- lucide-react for icons

Only use local storage on the web for data storage.

14. Quran API guidance Use a provider that supports ayah-by-ayah audio. Prefer
    Quran.com / Quran Foundation API.

If API details are uncertain, create a provider abstraction like:

getSurahs(): Promise<Surah[]> getReciters(): Promise<Reciter[]>
getAyahAudioForSurah(params: { surahNumber: number; reciterId: number | string;
}): Promise<AyahAudio[]>

Then implement the current provider in src/api/quranClient.ts.

The rest of the app should not depend directly on the API’s raw response shape.

15. MVP acceptance criteria The final app should let me:

- Select Surah Al-Kahf
- Select ayahs 4 to 9
- Select a reciter (just have mishari rashid alafasy by default or as the only
  voice)
- Press play
- Hear ayahs 4 through 9 in order
- Toggle loop so the range repeats
- Set repeat each ayah to 3x
- Add a 2-second pause between ayahs
- Save this setup as “Al-Kahf 4–9”
- Refresh the browser and still see the saved loop
- Click the saved loop and restore the configuration

16. Fallback behavior If the Quran API blocks requests due to CORS or requires
    an API key, do not build a backend yet. Instead:

- Keep the API layer clean.
- Add clear comments explaining where the API key or proxy would go later.
- Provide mock data mode so the UI and audio player logic can still be
  developed.
- But try to make the real API work directly from the browser first.
- Try to find where the user can download the individual 6,236 ayats mp3s

17. Final output After implementation, provide:

- A summary of what was built
- How to run it
- What files contain the main audio logic
- Any limitations with the Quran audio API
- Suggestions for next steps, especially seamless playback using surah-level
  audio timestamps later and making the app offline first via Vite-plugin-pwa
  and service worker to download all ayat or surah audio files and cache them
  offline via cacheStorage in a service worker.
