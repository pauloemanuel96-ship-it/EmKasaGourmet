"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/modules/catalogo/types";

/**
 * Botão que chama uma Server Action já com os argumentos (`action.bind(...)`)
 * e mostra o resultado ao lado. Usado nas ações rápidas das listas.
 */
export function ActionButton({
  action,
  label,
  pendingLabel = "Salvando…",
  confirm,
  variant = "link",
}: {
  action: () => Promise<FormState>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  variant?: "link" | "secondary" | "primary";
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({ status: "idle" });

  const styles = {
    link: "text-forest-900 min-h-11 px-2 text-sm font-medium underline underline-offset-2",
    secondary:
      "border-forest-900 text-forest-900 hover:bg-sand-200 min-h-11 rounded-(--radius-control) border px-3 text-sm font-medium",
    primary:
      "bg-forest-900 text-cream-50 hover:bg-forest-700 min-h-11 rounded-(--radius-control) px-3 text-sm font-medium",
  } as const;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className={`${styles[variant]} disabled:opacity-60`}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => setState(await action()));
        }}
      >
        {pending ? pendingLabel : label}
      </button>
      {state.status !== "idle" && (
        <span
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-danger-600 text-sm"
              : "text-ink-600 text-sm"
          }
        >
          {state.message}
        </span>
      )}
    </span>
  );
}
