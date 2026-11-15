"use client";

import { startTransition, useActionState } from "react";
import { saveWhatsapp } from "@/modules/catalogo/actions";
import { IDLE } from "@/modules/catalogo/types";
import {
  Field,
  FormMessage,
  buttonPrimary,
  errorsFor,
  inputClass,
} from "./fields";

export function WhatsappForm({ current }: { current: string | null }) {
  const [state, action, pending] = useActionState(saveWhatsapp, IDLE);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field
        id="whatsapp"
        label="WhatsApp de atendimento"
        hint="Recebe os pedidos de orçamento das encomendas. Ex.: (79) 99999-9999. Deixe vazio para tirar."
        errors={errorsFor(state, "whatsapp")}
      >
        {(a11y) => (
          <input
            {...a11y}
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            defaultValue={current ?? ""}
            className={`${inputClass} sm:max-w-72`}
          />
        )}
      </Field>
      <FormMessage state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
