"use client";

import { startTransition, useActionState, useState } from "react";
import { centsToInput } from "@/lib/money";
import { saveProduct } from "@/modules/catalogo/actions";
import type { CategoryNode } from "@/modules/catalogo/tree";
import {
  IDLE,
  MONTH_LABEL,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABEL,
  SALE_UNITS,
  SALE_UNIT_LABEL,
  STOCK_MODES,
  STOCK_MODE_LABEL,
  STORAGE_KINDS,
  STORAGE_LABEL,
  type Allergen,
  type DietLabel,
  type Option,
  type Product,
  type ProductSheet,
} from "@/modules/catalogo/types";
import {
  Checkbox,
  Field,
  FormMessage,
  buttonPrimary,
  errorsFor,
  inputClass,
} from "./fields";
import { IngredientPicker } from "./ingredient-picker";

export type ProductFormOptions = {
  ingredients: Option[];
  allergens: Allergen[];
  dietLabels: DietLabel[];
  campaigns: (Option & { is_active: boolean })[];
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-sand-200 bg-paper flex flex-col gap-5 rounded-(--radius-media) border p-4 sm:p-5">
      <legend className="px-1 font-serif text-xl">{title}</legend>
      {description && (
        <p className="text-ink-600 -mt-2 text-sm">{description}</p>
      )}
      {children}
    </fieldset>
  );
}

export function ProductForm({
  product,
  sheet,
  categories,
  options,
  canManage,
}: {
  product?: Product;
  sheet?: ProductSheet;
  categories: CategoryNode[];
  options: ProductFormOptions;
  /** Administração: publica e preenche ficha técnica, rótulos e campanhas. */
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(saveProduct, IDLE);
  const [quoteOnly, setQuoteOnly] = useState(product?.quote_only ?? false);
  const allergenName = new Map(options.allergens.map((a) => [a.id, a.name]));
  const labelEvidence = new Map(
    (sheet?.dietLabels ?? []).map((l) => [l.label_id, l.evidence ?? ""]),
  );

  return (
    <form
      // onSubmit em vez de action: o React limpa o formulário depois de uma
      // action, e um erro de validação faria a pessoa perder o que digitou.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      {canManage && <input type="hidden" name="sheet" value="1" />}

      <Section title="Produto">
        <Field id="name" label="Nome" errors={errorsFor(state, "name")}>
          {(a11y) => (
            <input
              {...a11y}
              name="name"
              required
              maxLength={120}
              defaultValue={product?.name}
              className={inputClass}
            />
          )}
        </Field>

        <Field
          id="category_id"
          label="Categoria"
          hint="Para sabores e variedades, use a subcategoria (ex.: Blends Veganos)."
          errors={errorsFor(state, "category_id")}
        >
          {(a11y) => (
            <select
              {...a11y}
              name="category_id"
              required
              defaultValue={product?.category_id ?? ""}
              className={inputClass}
            >
              <option value="" disabled>
                Escolha…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {"— ".repeat(c.depth)}
                  {c.name}
                  {c.visible ? "" : " (oculta)"}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="short_description"
          label="Resumo (opcional)"
          hint="Uma linha que aparece no cartão da loja."
          errors={errorsFor(state, "short_description")}
        >
          {(a11y) => (
            <input
              {...a11y}
              name="short_description"
              maxLength={200}
              defaultValue={product?.short_description ?? ""}
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
              rows={4}
              maxLength={4000}
              defaultValue={product?.description ?? ""}
              className={`${inputClass} py-2`}
            />
          )}
        </Field>
      </Section>

      <Section
        title="Venda"
        description="Sem preço, o produto fica em rascunho. Encomendas podem ser “sob orçamento”."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="sale_unit"
            label="Vendido por"
            errors={errorsFor(state, "sale_unit")}
          >
            {(a11y) => (
              <select
                {...a11y}
                name="sale_unit"
                defaultValue={product?.sale_unit ?? ""}
                className={inputClass}
              >
                <option value="" disabled>
                  Escolha…
                </option>
                {SALE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {SALE_UNIT_LABEL[u]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="unit_size"
            label="Tamanho da unidade (opcional)"
            hint="Pote, pacote, porção e bandeja: peso em gramas (ex.: 500). Quilo: em kg (ex.: 0,5). Litro: em litros."
            errors={errorsFor(state, "unit_size")}
          >
            {(a11y) => (
              <input
                {...a11y}
                name="unit_size"
                inputMode="decimal"
                defaultValue={
                  product?.unit_size != null
                    ? String(product.unit_size).replace(".", ",")
                    : ""
                }
                className={inputClass}
              />
            )}
          </Field>
        </div>

        <Checkbox
          name="quote_only"
          label="Sob orçamento"
          hint="Sem preço fixo: a loja mostra “sob orçamento” e não usa carrinho."
          defaultChecked={product?.quote_only ?? false}
          onChange={setQuoteOnly}
        />

        <Field
          id="price"
          label={quoteOnly ? "Preço de referência (opcional)" : "Preço (R$)"}
          hint="Ex.: 24,90. Deixe vazio enquanto não houver preço definido."
          errors={errorsFor(state, "price_cents")}
        >
          {(a11y) => (
            <input
              {...a11y}
              name="price"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={centsToInput(product?.price_cents)}
              className={`${inputClass} sm:max-w-48`}
            />
          )}
        </Field>

        {canManage && (
          <Field
            id="status"
            label="Situação"
            hint="“À venda” aparece na loja. Arquivado some do painel do dia a dia."
            errors={errorsFor(state, "status")}
          >
            {(a11y) => (
              <select
                {...a11y}
                name="status"
                defaultValue={product?.status ?? "draft"}
                className={`${inputClass} sm:max-w-64`}
              >
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PRODUCT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
      </Section>

      <Section title="Estoque, conservação e época">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="stock_mode"
            label="Estoque"
            errors={errorsFor(state, "stock_mode")}
          >
            {(a11y) => (
              <select
                {...a11y}
                name="stock_mode"
                defaultValue={product?.stock_mode ?? "tracked"}
                className={inputClass}
              >
                {STOCK_MODES.map((m) => (
                  <option key={m} value={m}>
                    {STOCK_MODE_LABEL[m]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="storage"
            label="Conservação"
            errors={errorsFor(state, "storage")}
          >
            {(a11y) => (
              <select
                {...a11y}
                name="storage"
                defaultValue={product?.storage ?? "ambiente"}
                className={inputClass}
              >
                {STORAGE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {STORAGE_LABEL[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="shelf_life_days"
            label="Validade em dias (opcional)"
            errors={errorsFor(state, "shelf_life_days")}
          >
            {(a11y) => (
              <input
                {...a11y}
                name="shelf_life_days"
                inputMode="numeric"
                defaultValue={product?.shelf_life_days ?? ""}
                className={inputClass}
              />
            )}
          </Field>
          <Field
            id="portions"
            label="Porções (opcional)"
            errors={errorsFor(state, "portions")}
          >
            {(a11y) => (
              <input
                {...a11y}
                name="portions"
                inputMode="numeric"
                defaultValue={product?.portions ?? ""}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        <Field
          id="conservation_info"
          label="Como conservar (opcional)"
          errors={errorsFor(state, "conservation_info")}
        >
          {(a11y) => (
            <textarea
              {...a11y}
              name="conservation_info"
              rows={2}
              maxLength={1000}
              defaultValue={product?.conservation_info ?? ""}
              className={`${inputClass} py-2`}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="yield_info"
            label="Rendimento (opcional)"
            hint="Ex.: serve 4 pessoas."
            errors={errorsFor(state, "yield_info")}
          >
            {(a11y) => (
              <input
                {...a11y}
                name="yield_info"
                maxLength={300}
                defaultValue={product?.yield_info ?? ""}
                className={inputClass}
              />
            )}
          </Field>
          <Field
            id="origin"
            label="Origem (opcional)"
            hint="Ex.: horta própria, produtor parceiro."
            errors={errorsFor(state, "origin")}
          >
            {(a11y) => (
              <input
                {...a11y}
                name="origin"
                maxLength={200}
                defaultValue={product?.origin ?? ""}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="font-medium">Meses de época (opcional)</legend>
          <p className="text-ink-600 text-sm">
            Marque os meses em que há colheita. Vazio = o ano todo.
          </p>
          <div className="mt-2 grid grid-cols-4 gap-x-2 sm:grid-cols-6">
            {MONTH_LABEL.map((m, i) => (
              <Checkbox
                key={m}
                name="seasonal_months"
                value={String(i + 1)}
                label={m}
                defaultChecked={product?.seasonal_months?.includes(i + 1)}
              />
            ))}
          </div>
        </fieldset>
      </Section>

      {canManage ? (
        <>
          <Section
            title="Ficha técnica"
            description="Mudar ingredientes, “contém” ou “pode conter” desfaz a validação da ficha. Depois de conferir, valide de novo."
          >
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Ingredientes, na ordem do rótulo</h3>
              <IngredientPicker
                options={options.ingredients}
                initial={sheet?.ingredientIds ?? []}
              />
            </div>

            {sheet && sheet.containsFromIngredients.length > 0 && (
              <p className="bg-sand-200 rounded-(--radius-control) p-3 text-sm">
                Contém, pelos ingredientes:{" "}
                <strong>
                  {sheet.containsFromIngredients
                    .map((id) => allergenName.get(id))
                    .filter(Boolean)
                    .join(", ")}
                </strong>
                . Calculado pelo banco a partir da ficha de cada ingrediente.
              </p>
            )}

            <fieldset>
              <legend className="font-medium">Contém (declarado à mão)</legend>
              <p className="text-ink-600 text-sm">
                Só para alergênicos que não vêm de um ingrediente cadastrado.
              </p>
              <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
                {options.allergens.map((a) => (
                  <Checkbox
                    key={a.id}
                    name="contains_manual_ids"
                    value={a.id}
                    label={a.name}
                    defaultChecked={sheet?.containsManualIds.includes(a.id)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-medium">Pode conter</legend>
              <p className="text-ink-600 text-sm">
                Contato cruzado no preparo (mesma cozinha, mesmos utensílios).
              </p>
              <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
                {options.allergens.map((a) => (
                  <Checkbox
                    key={a.id}
                    name="may_contain_ids"
                    value={a.id}
                    label={a.name}
                    defaultChecked={sheet?.mayContainIds.includes(a.id)}
                  />
                ))}
              </div>
            </fieldset>
          </Section>

          <Section
            title="Rótulos"
            description="Cada rótulo precisa de evidência (ficha técnica, laudo ou composição). O banco recusa rótulo que contraria os alergênicos, e a loja só mostra rótulos com a ficha validada."
          >
            {errorsFor(state, "sheet").length > 0 && (
              <p className="text-danger-600 text-sm">
                {errorsFor(state, "sheet").join(" ")}
              </p>
            )}
            <ul className="flex flex-col gap-4">
              {options.dietLabels.map((l) => (
                <li key={l.id} className="flex flex-col gap-1">
                  <Checkbox
                    name="label_ids"
                    value={l.id}
                    label={l.name}
                    defaultChecked={labelEvidence.has(l.id)}
                  />
                  <label className="sr-only" htmlFor={`evidence_${l.id}`}>
                    Evidência para {l.name}
                  </label>
                  <input
                    id={`evidence_${l.id}`}
                    name={`evidence_${l.id}`}
                    maxLength={500}
                    placeholder="Evidência (ex.: ficha técnica revisada em 10/11)"
                    defaultValue={labelEvidence.get(l.id) ?? ""}
                    className={inputClass}
                  />
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Campanhas"
            description="O produto aparece na campanha enquanto ela estiver ligada."
          >
            <div className="grid gap-x-4 sm:grid-cols-2">
              {options.campaigns.map((c) => (
                <Checkbox
                  key={c.id}
                  name="campaign_ids"
                  value={c.id}
                  label={c.name}
                  hint={c.is_active ? "Ligada" : "Desligada"}
                  defaultChecked={sheet?.campaignIds.includes(c.id)}
                />
              ))}
            </div>
          </Section>
        </>
      ) : (
        <p className="bg-sand-200 rounded-(--radius-control) p-3 text-sm">
          O produto será salvo como rascunho. Ficha técnica, rótulos, campanhas
          e publicação são feitos pela administração.
        </p>
      )}

      <FormMessage state={state} />

      <div className="bg-cream-50/95 border-sand-200 sticky bottom-0 -mx-4 border-t px-4 py-3 backdrop-blur">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending
            ? "Salvando…"
            : product
              ? "Salvar alterações"
              : canManage
                ? "Criar produto"
                : "Salvar rascunho"}
        </button>
      </div>
    </form>
  );
}
