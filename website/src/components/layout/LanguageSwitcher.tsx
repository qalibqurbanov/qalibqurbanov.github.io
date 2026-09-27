import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { useLocale } from "@/i18n/context";
import { isLocale, SUPPORTED_LOCALES } from "@/i18n/locale";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  function handleValueChange(value: string) {
    if (isLocale(value)) setLocale(value);
  }

  return (
    <Select.Root value={locale} onValueChange={handleValueChange} modal={false}>
      <Select.Trigger
        aria-label="Language"
        className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-xs text-muted outline-none transition-colors hover:border-accent/60 hover:text-accent focus-visible:border-accent focus-visible:text-accent data-[state=open]:border-accent data-[state=open]:text-accent"
      >
        <Select.Value />
        <Select.Icon className="transition-transform data-[state=open]:rotate-180">
          <ChevronDown size={12} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-lg animate-popover-in"
        >
          <Select.Viewport className="p-1">
            {SUPPORTED_LOCALES.map((meta) => (
              <Select.Item
                key={meta.code}
                value={meta.code}
                className="relative flex cursor-pointer select-none items-center justify-between gap-4 rounded px-2.5 py-1.5 font-mono text-xs text-muted outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-accent data-[state=checked]:text-accent"
              >
                <Select.ItemText>{meta.nativeLabel}</Select.ItemText>
                <Select.ItemIndicator className="inline-flex items-center">
                  <Check size={12} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
