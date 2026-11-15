"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme";

const EVENT = "emkasa-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sem armazenamento (modo privado): vale só para esta visita.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore<Theme>(subscribe, current, () => "light");
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={() => apply(dark ? "light" : "dark")}
      className={`text-ink-600 hover:text-forest-900 inline-flex min-h-11 items-center gap-2 text-sm ${className}`}
    >
      <span
        aria-hidden="true"
        className={`border-ink-600 relative inline-block h-5 w-9 rounded-full border transition-colors ${dark ? "bg-forest-900" : "bg-transparent"}`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${dark ? "bg-cream-50 left-[18px]" : "bg-ink-600 left-0.5"}`}
        />
      </span>
      Modo escuro
    </button>
  );
}
