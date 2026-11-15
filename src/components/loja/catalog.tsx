"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { availableOf, useDemo } from "@/demo/store";
import {
  FILTER_GROUPS,
  type StoreProduct,
  type StoreSection,
} from "@/modules/catalogo/store-types";
import { filterProducts } from "@/modules/catalogo/store-filter";
import { ProductTile } from "./product-tile";

export function Catalog({
  products,
  sections,
}: {
  products: StoreProduct[];
  sections: StoreSection[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stock = useDemo((s) => s);
  const [showFilters, setShowFilters] = useState(false);

  const secao = params.get("secao");
  const categoria = params.get("categoria");
  const busca = params.get("q") ?? "";
  const semRaw = params.get("sem") ?? "";
  const sem = useMemo(() => semRaw.split(",").filter(Boolean), [semRaw]);
  const dieta = params.get("dieta");
  const soDisponiveis = params.get("disponiveis") === "1";

  const shopSections = sections.filter((s) => s.channel === "loja");
  const current = shopSections.find((s) => s.slug === secao);

  const diets = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) for (const d of p.diet) map.set(d.code, d.name);
    return [...map.entries()];
  }, [products]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const results = useMemo(
    () =>
      filterProducts(products, {
        secao,
        categoria,
        busca,
        sem,
        dieta,
        soDisponiveis,
        isAvailable: (p) =>
          p.isDemo ? availableOf(stock, p.slug) > 0 : p.available,
      }),
    [products, secao, categoria, busca, sem, dieta, soDisponiveis, stock],
  );

  const chip =
    "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition";
  const chipOn = "bg-forest-900 border-forest-900 text-cream-50";
  const chipOff = "border-ink-600/30 hover:border-forest-900";

  return (
    <div className="mt-6 flex flex-col gap-6">
      <nav
        aria-label="Seções"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        <button
          type="button"
          onClick={() => update({ secao: null, categoria: null })}
          className={`${chip} ${!secao ? chipOn : chipOff}`}
        >
          Tudo
        </button>
        {shopSections.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => update({ secao: s.slug, categoria: null })}
            className={`${chip} ${secao === s.slug ? chipOn : chipOff}`}
          >
            {s.name}
          </button>
        ))}
      </nav>

      {current && current.children.length > 0 && (
        <nav
          aria-label={`Categorias de ${current.name}`}
          className="-mx-4 -mt-3 flex gap-2 overflow-x-auto px-4 pb-1"
        >
          {current.children.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() =>
                update({ categoria: categoria === c.slug ? null : c.slug })
              }
              aria-pressed={categoria === c.slug}
              className={`min-h-11 shrink-0 rounded-(--radius-control) px-3 text-sm ${
                categoria === c.slug
                  ? "bg-sand-200 text-forest-900 font-medium"
                  : "text-ink-600 hover:text-forest-900"
              }`}
            >
              {c.name}
            </button>
          ))}
        </nav>
      )}

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filtros" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="busca" className="text-sm font-medium">
              Buscar
            </label>
            <input
              id="busca"
              type="search"
              defaultValue={busca}
              placeholder="couve, farofa, blend…"
              onChange={(e) => update({ q: e.target.value })}
              className="border-ink-600/30 bg-paper min-h-11 rounded-(--radius-control) border px-3"
            />
          </div>

          <button
            type="button"
            aria-expanded={showFilters}
            aria-controls="filtros"
            onClick={() => setShowFilters((v) => !v)}
            className="border-ink-600/30 flex min-h-11 items-center justify-between rounded-(--radius-control) border px-3 text-sm font-medium lg:hidden"
          >
            <span>
              Alergias e alimentação
              {sem.length + (dieta ? 1 : 0) + (soDisponiveis ? 1 : 0) > 0 &&
                ` (${sem.length + (dieta ? 1 : 0) + (soDisponiveis ? 1 : 0)})`}
            </span>
            <span aria-hidden="true">{showFilters ? "−" : "+"}</span>
          </button>
          <div
            id="filtros"
            className={`${showFilters ? "flex" : "hidden"} flex-col gap-6 lg:flex`}
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">
                Sem alergênico
              </legend>
              {FILTER_GROUPS.map((g) => (
                <label
                  key={g.code}
                  className="flex min-h-9 items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={sem.includes(g.code)}
                    onChange={(e) =>
                      update({
                        sem: (e.target.checked
                          ? [...sem, g.code]
                          : sem.filter((x) => x !== g.code)
                        ).join(","),
                      })
                    }
                  />
                  Sem {g.name.toLowerCase()}
                </label>
              ))}
              <p className="text-ink-600 text-xs">
                Exclui também &quot;pode conter&quot; e fichas em revisão.
              </p>
            </fieldset>

            {diets.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">
                  Alimentação
                </legend>
                <select
                  value={dieta ?? ""}
                  onChange={(e) => update({ dieta: e.target.value || null })}
                  className="border-ink-600/30 bg-paper min-h-11 rounded-(--radius-control) border px-3 text-sm"
                >
                  <option value="">Qualquer</option>
                  {diets.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            <label className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={soDisponiveis}
                onChange={(e) =>
                  update({ disponiveis: e.target.checked ? "1" : null })
                }
              />
              Só o que tem hoje
            </label>
          </div>
        </aside>

        <section aria-live="polite">
          <p className="text-ink-600 mb-4 text-sm">
            {results.length} produto(s)
          </p>
          {results.length === 0 ? (
            <div className="bg-sand-200/60 text-ink-600 rounded-(--radius-media) p-6">
              {products.length === 0
                ? "Ainda não há produtos à venda. Volte em breve."
                : "Nada encontrado com esses filtros."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {results.map((p) => (
                <ProductTile key={p.slug} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
