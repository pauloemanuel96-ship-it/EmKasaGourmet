import type { FormState } from "@/modules/catalogo/types";

export const inputClass =
  "border-ink-600/40 bg-paper min-h-11 w-full rounded-(--radius-control) border px-3 text-base aria-[invalid=true]:border-danger-600";

export const buttonPrimary =
  "bg-forest-900 text-cream-50 hover:bg-forest-700 inline-flex min-h-11 items-center justify-center rounded-(--radius-control) px-4 font-medium disabled:opacity-60";

export const buttonSecondary =
  "border-forest-900 text-forest-900 hover:bg-sand-200 inline-flex min-h-11 items-center justify-center rounded-(--radius-control) border px-4 font-medium disabled:opacity-60";

export function errorsFor(state: FormState, name: string): string[] {
  return state.status === "error" ? (state.fieldErrors?.[name] ?? []) : [];
}

/** Rótulo + campo + dica + erro, com os ids de acessibilidade ligados. */
export function Field({
  id,
  label,
  hint,
  errors = [],
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: (a11y: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const describedBy =
    [hint ? `${id}-dica` : null, errors.length ? `${id}-erro` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": errors.length > 0,
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p id={`${id}-dica`} className="text-ink-600 text-sm">
          {hint}
        </p>
      )}
      {errors.length > 0 && (
        <p id={`${id}-erro`} className="text-danger-600 text-sm">
          {errors.join(" ")}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  name,
  value,
  label,
  defaultChecked,
  hint,
  onChange,
}: {
  name: string;
  value?: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="accent-forest-900 mt-0.5 size-5 shrink-0"
      />
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && <span className="text-ink-600 text-sm">{hint}</span>}
      </span>
    </label>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error"
          ? "border-danger-600 text-danger-600 rounded-(--radius-control) border p-3"
          : "bg-sand-200 rounded-(--radius-control) p-3"
      }
    >
      {state.message}
    </p>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "muted";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-sand-200 text-ink-900",
    ok: "bg-leaf-700 text-cream-50",
    warn: "border border-warning-600 text-warning-600",
    muted: "border border-ink-600/40 text-ink-600",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
