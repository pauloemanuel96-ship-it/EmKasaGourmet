"use client";

import { startTransition, useActionState } from "react";
import { saveCampaign } from "@/modules/catalogo/actions";
import { IDLE, type Campaign } from "@/modules/catalogo/types";
import {
  Checkbox,
  Field,
  FormMessage,
  buttonPrimary,
  errorsFor,
  inputClass,
} from "./fields";

export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const [state, action, pending] = useActionState(saveCampaign, IDLE);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      {campaign && <input type="hidden" name="id" value={campaign.id} />}

      <Field id="name" label="Nome" errors={errorsFor(state, "name")}>
        {(a11y) => (
          <input
            {...a11y}
            name="name"
            required
            maxLength={80}
            placeholder="Ex.: Natal, Dia das Mães"
            defaultValue={campaign?.name}
            className={inputClass}
          />
        )}
      </Field>

      <Field
        id="description"
        label="Descrição (opcional)"
        errors={errorsFor(state, "description")}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={campaign?.description ?? ""}
            className={`${inputClass} py-2`}
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          id="starts_on"
          label="Começa em"
          errors={errorsFor(state, "starts_on")}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="date"
              name="starts_on"
              defaultValue={campaign?.starts_on ?? ""}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="ends_on"
          label="Termina em"
          errors={errorsFor(state, "ends_on")}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="date"
              name="ends_on"
              defaultValue={campaign?.ends_on ?? ""}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="order_deadline"
          label="Pedidos até"
          hint="Último dia para encomendar."
          errors={errorsFor(state, "order_deadline")}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="date"
              name="order_deadline"
              defaultValue={campaign?.order_deadline ?? ""}
              className={inputClass}
            />
          )}
        </Field>
      </div>

      <Field
        id="sort_order"
        label="Ordem (opcional)"
        hint="Menor aparece primeiro."
        errors={errorsFor(state, "sort_order")}
      >
        {(a11y) => (
          <input
            {...a11y}
            name="sort_order"
            inputMode="numeric"
            defaultValue={campaign?.sort_order ?? ""}
            className={`${inputClass} sm:max-w-40`}
          />
        )}
      </Field>

      <Checkbox
        name="is_active"
        label="Ligada"
        hint="Só campanhas ligadas aparecem nos produtos e na loja."
        defaultChecked={campaign?.is_active ?? false}
      />

      <FormMessage state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending
            ? "Salvando…"
            : campaign
              ? "Salvar campanha"
              : "Criar campanha"}
        </button>
      </div>
    </form>
  );
}
