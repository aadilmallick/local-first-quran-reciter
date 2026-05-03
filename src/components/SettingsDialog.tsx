import { Settings, Type } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useUiSettings } from "../contexts/UiSettingsContext";
import type { ArabicFontSize } from "../types/settings";

const NAV_ITEMS = [
  { value: "translation", label: "Translation", icon: Type },
];

export function SettingsDialog() {
  const { arabicFontSize, setArabicFontSize } = useUiSettings();

  return (
    <Dialog>
      <DialogTrigger className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
        <Settings size={20} />
        <span className="sr-only">Open settings</span>
      </DialogTrigger>

      <DialogContent
        showCloseButton
        className="p-0 gap-0 min-w-2xl w-full overflow-hidden"
      >
        {/* Visually hidden title for screen readers */}
        <DialogTitle className="sr-only">Settings</DialogTitle>

        <Tabs
          defaultValue="translation"
          orientation="vertical"
          className="h-[480px]"
        >
          {/* Sidebar nav */}
          <div className="flex flex-col w-52 shrink-0 border-r border-stone-100 bg-stone-50 p-3 gap-1">
            <p className="px-3 pt-2 pb-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Settings
            </p>
            <TabsList
              variant="line"
              className="flex-col items-stretch h-auto w-full gap-0.5 bg-transparent p-0"
            >
              {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="justify-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 data-active:bg-white data-active:text-emerald-700 data-active:shadow-sm hover:bg-white/70"
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent
              value="translation"
              className="m-0 p-6 flex flex-col gap-6 h-full"
            >
              <div>
                <h2 className="text-base font-semibold text-stone-800">
                  Translation
                </h2>
                <p className="text-sm text-stone-400 mt-0.5">
                  Adjust how the Quran text is displayed.
                </p>
              </div>

              <hr className="border-stone-100" />

              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-stone-700">
                    Arabic text size
                  </span>
                  <span className="text-xs text-stone-400">
                    Font size of the Arabic ayah text
                  </span>
                </div>
                <Select
                  value={arabicFontSize}
                  onValueChange={(v) => setArabicFontSize(v as ArabicFontSize)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
