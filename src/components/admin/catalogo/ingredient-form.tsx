"use client";

import { startTransition, useActionState } from "react";
import { saveIngredient } from "@/modules/catalogo/actions";
import {
  IDLE,
  type Allergen,
  type Ingredient,
  type Option,
} from "@/modules/catalogo/types";
import {
  Checkbox,
  Field,
  FormMessage,
  buttonPrimary,
  errorsFor,
  inputClass,
} from "./fields";

export function IngredientForm({
  ingredient,
  allergens,
  bases,
}: {
  ingredient?: Ingredient;
  allergens: Allergen[];
  /** Ingredientes que podem ser a origem deste (sem ele mesmo). */
  bases: Option[];
}) {
  const [state, action, pending] = useActionState(saveIngredient, IDLE);

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
      {ingredient && <input type="hidden" name="id" value={ingredient.id} />}

      <Field id="name" label="Nome" errors={errorsFor(state, "name")}>
        {(a11y) => (
          <input
            {...a11y}
            name="name"
            required
            maxLength={120}
            defaultValue={ingredient?.name}
            className={inputClass}
          />
        )}
      </Field>

      <Field
        id="is_derived_from"
        label="Feito a partir de (opcional)"
        hint="Ex.: proteína texturizada de soja vem da soja. Ajuda a não esquecer alergênicos."
        errors={errorsFor(state, "is_derived_from")}
      >
        {(a11y) => (
          <select
            {...a11y}
            name="is_derived_from"
            defaultValue={ingredient?.is_derived_from ?? ""}
            className={inputClass}
          >
            <option value="">Nenhum</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <fieldset>
        <legend className="font-medium">
          Alergênicos que este ingrediente contém
        </legend>
        <p className="text-ink-600 text-sm">
          Confira na embalagem ou na ficha do fornecedor. Mudar aqui atualiza o
          “contém” de todos os produtos que usam este ingrediente e pede nova
          validação da ficha deles.
        </p>
        <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
          {allergens.map((a) => (
            <Checkbox
              key={a.id}
              name="allergen_ids"
              value={a.id}
              label={a.name}
              defaultChecked={ingredient?.allergen_ids.includes(a.id)}
            />
          ))}
        </div>
      </fieldset>

      <FormMessage state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending
            ? "Salvando…"
            : ingredient
              ? "Salvar ingrediente"
              : "Criar ingrediente"}
        </button>
      </div>
    </form>
  );
}
