"use client";

import { startTransition, useActionState, useState } from "react";
import { saveCategory } from "@/modules/catalogo/actions";
import type { CategoryNode } from "@/modules/catalogo/tree";
import {
  BUSINESS_UNITS,
  BUSINESS_UNIT_LABEL,
  CATEGORY_KINDS,
  CATEGORY_KIND_LABEL,
  IDLE,
  type Category,
} from "@/modules/catalogo/types";
import {
  Checkbox,
  Field,
  FormMessage,
  buttonPrimary,
  errorsFor,
  inputClass,
} from "./fields";

export function CategoryForm({
  category,
  parents,
  defaultParentId,
}: {
  category?: Category;
  /** Categorias que podem ser mãe (sem a própria e sem as descendentes). */
  parents: CategoryNode[];
  defaultParentId?: string;
}) {
  const [state, action, pending] = useActionState(saveCategory, IDLE);
  const [parentId, setParentId] = useState(
    category?.parent_id ?? defaultParentId ?? "",
  );
  const parent = parents.find((p) => p.id === parentId);

  return (
    <form
      // onSubmit em vez de action: o React limpa o formulário depois de uma
      // action, e um erro de validação faria a pessoa perder o que digitou.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      {category && <input type="hidden" name="id" value={category.id} />}

      <Field id="name" label="Nome" errors={errorsFor(state, "name")}>
        {(a11y) => (
          <input
            {...a11y}
            name="name"
            required
            maxLength={80}
            defaultValue={category?.name}
            className={inputClass}
          />
        )}
      </Field>

      <Field
        id="parent_id"
        label="Fica dentro de"
        hint="Sem categoria-mãe, ela vira uma seção da loja. Subcategoria herda o canal e a área da mãe."
        errors={errorsFor(state, "parent_id")}
      >
        {(a11y) => (
          <select
            {...a11y}
            name="parent_id"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">Nenhuma (seção da loja)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {"— ".repeat(p.depth)}
                {p.name}
                {p.is_active ? "" : " (inativa)"}
              </option>
            ))}
          </select>
        )}
      </Field>

      {parent ? (
        <p className="bg-sand-200 rounded-(--radius-control) p-3 text-sm">
          Canal: <strong>{CATEGORY_KIND_LABEL[parent.kind]}</strong> · Área:{" "}
          <strong>{BUSINESS_UNIT_LABEL[parent.business_unit]}</strong> (vêm de “
          {parent.name}”).
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="kind"
            label="Canal"
            hint="Encomendas abre pedido de orçamento, sem carrinho."
            errors={errorsFor(state, "kind")}
          >
            {(a11y) => (
              <select
                {...a11y}
                name="kind"
                defaultValue={category?.kind ?? "loja"}
                className={inputClass}
              >
                {CATEGORY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="business_unit"
            label="Área da empresa"
            errors={errorsFor(state, "business_unit")}
          >
            {(a11y) => (
              <select
                {...a11y}
                name="business_unit"
                defaultValue={category?.business_unit ?? "cozinha"}
                className={inputClass}
              >
                {BUSINESS_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {BUSINESS_UNIT_LABEL[u]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      )}

      <Field
        id="description"
        label="Descrição (opcional)"
        hint="Aparece no topo da categoria na loja."
        errors={errorsFor(state, "description")}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            name="description"
            rows={3}
            maxLength={500}
            defaultValue={category?.description ?? ""}
            className={`${inputClass} py-2`}
          />
        )}
      </Field>

      <Field
        id="sort_order"
        label="Ordem (opcional)"
        hint="Menor aparece primeiro. Vazio = vai para o fim."
        errors={errorsFor(state, "sort_order")}
      >
        {(a11y) => (
          <input
            {...a11y}
            name="sort_order"
            inputMode="numeric"
            defaultValue={category?.sort_order ?? ""}
            className={`${inputClass} sm:max-w-40`}
          />
        )}
      </Field>

      <fieldset className="flex flex-col">
        <legend className="sr-only">Opções</legend>
        <Checkbox
          name="is_active"
          label="Ativa"
          hint="Desativar esconde esta categoria e tudo dentro dela da loja. Nada é apagado."
          defaultChecked={category?.is_active ?? true}
        />
        <Checkbox
          name="is_featured"
          label="Em destaque"
          hint="Ganha mais espaço na página da seção (ex.: as duas ceias)."
          defaultChecked={category?.is_featured ?? false}
        />
      </fieldset>

      <FormMessage state={state} />

      <div>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending
            ? "Salvando…"
            : category
              ? "Salvar alterações"
              : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}
