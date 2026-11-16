import type { FormState } from "@/modules/conta/schemas";

export const INPUT =
  "border-sand-200 bg-paper text-ink-900 focus:border-forest-700 min-h-12 w-full rounded-(--radius-control) border px-4 focus:outline-none";
export const BTN_PRIMARY =
  "bg-forest-900 text-cream-50 hover:bg-forest-700 inline-flex min-h-12 items-center justify-center rounded-full px-6 font-medium disabled:opacity-60";
export const BTN_GHOST =
  "border-sand-200 hover:bg-sand-200 inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium";

/** Campo com rótulo visível e erro logo abaixo. */
export function Field({
  label,
  name,
  state,
  hint,
  className = "",
  ...input
}: {
  label: string;
  name: string;
  state: FormState;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const error =
    state.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined;
  const id = input.id ?? `campo-${name}`;
  // Depois de um erro, o campo volta com o que a pessoa tinha digitado.
  const kept = state.status === "error" ? state.values?.[name] : undefined;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="text-ink-900 mb-1 block text-sm font-medium"
      >
        {label}
      </label>
      <input
        {...input}
        defaultValue={kept ?? input.defaultValue}
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-erro` : hint ? `${id}-dica` : undefined
        }
        className={INPUT}
      />
      {error ? (
        <p id={`${id}-erro`} className="text-terracotta-500 mt-1 text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="text-ink-600 mt-1 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Mensagem geral do formulário (sucesso ou erro sem campo). */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  if (state.status === "error" && state.fieldErrors) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error"
          ? "text-terracotta-500 text-sm"
          : "text-leaf-700 text-sm font-medium"
      }
    >
      {state.message}
    </p>
  );
}
