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

/**
 * Tema claro ou escuro: só um símbolo pequeno. Mostra o sol no modo claro e a
 * lua no escuro; o toque troca com um giro suave. A área de toque continua com
 * 44 px, mesmo o desenho sendo pequeno.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore<Theme>(subscribe, current, () => "light");
  const dark = theme === "dark";
  const label = dark ? "Usar modo claro" : "Usar modo escuro";

  return (
    <button
      type="button"
      onClick={() => apply(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={`text-ink-600 hover:text-forest-900 relative grid size-11 place-items-center rounded-full transition-colors ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`absolute size-[18px] transition-all duration-500 ${dark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`absolute size-[17px] transition-all duration-500 ${dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
