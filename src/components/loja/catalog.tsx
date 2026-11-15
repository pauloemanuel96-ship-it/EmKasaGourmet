"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  ALLERGEN_LABEL,
  DIET_LABEL,
  PRODUCTS,
  UNIT_LABEL,
  type AllergenCode,
  type BusinessUnit,
  type DietLabel,
} from "@/demo/data";
import { availableOf, useDemo } from "@/demo/store";
import { ProductTile } from "./product-tile";

const FILTER_ALLERGENS: AllergenCode[] = [
  "gluten",
  "leite",
  "ovos",
  "soja",
  "castanhas",
  "castanha_de_caju",
  "amendoim",
];

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function Catalog() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stock = useDemo((s) => s);

  const unidade = (params.get("unidade") as BusinessUnit | null) ?? null;
  const busca = params.get("q") ?? "";
  const semRaw = params.get("sem") ?? "";
  const sem = useMemo(
    () => semRaw.split(",").filter(Boolean) as AllergenCode[],
    [semRaw],
  );
  const dieta = (params.get("dieta") as DietLabel | null) ?? null;
  const disponiveis = params.get("disponiveis") === "1";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const results = useMemo(() => {
    const q = norm(busca);
    return PRODUCTS.filter((p) => {
      if (unidade && p.unit !== unidade) return false;
      if (
        q &&
        !norm(`${p.name} ${p.short} ${p.ingredients.join(" ")}`).includes(q)
      )
        return false;
      if (sem.length > 0) {
        if (!p.allergensValidated) return false; // RN-08
        if (sem.some((a) => p.contains.includes(a) || p.mayContain.includes(a)))
          return false; // RN-09
      }
      if (
        dieta &&
        !p.diet.includes(dieta) &&
        !(dieta === "vegetariano" && p.diet.includes("vegano"))
      )
        return false;
      if (disponiveis && availableOf(stock, p.slug) === 0) return false;
      return true;
    });
  }, [busca, unidade, sem, dieta, disponiveis, stock]);

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside aria-label="Filtros" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="busca" className="text-sm font-medium">
            Buscar
          </label>
          <input
            id="busca"
            type="search"
            defaultValue={busca}
            placeholder="couve, lasanha, farofa…"
            onChange={(e) => update({ q: e.target.value })}
            className="border-ink-600/30 min-h-11 rounded-(--radius-control) border bg-white px-3"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Seção</legend>
          {([null, "horta", "cozinha", "produtos"] as const).map((u) => (
            <label
              key={u ?? "todas"}
              className="flex min-h-9 items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="unidade"
                checked={unidade === u}
                onChange={() => update({ unidade: u })}
              />
              {u ? UNIT_LABEL[u] : "Tudo"}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Sem alergênico</legend>
          {FILTER_ALLERGENS.map((a) => (
            <label key={a} className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sem.includes(a)}
                onChange={(e) =>
                  update({
                    sem: (e.target.checked
                      ? [...sem, a]
                      : sem.filter((x) => x !== a)
                    ).join(","),
                  })
                }
              />
              Sem {ALLERGEN_LABEL[a].toLowerCase()}
            </label>
          ))}
          <p className="text-ink-600 text-xs">
            Exclui também &quot;pode conter&quot; e fichas em revisão.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Alimentação</legend>
          <select
            value={dieta ?? ""}
            onChange={(e) => update({ dieta: e.target.value || null })}
            className="border-ink-600/30 min-h-11 rounded-(--radius-control) border bg-white px-3 text-sm"
          >
            <option value="">Qualquer</option>
            {(Object.keys(DIET_LABEL) as DietLabel[]).map((d) => (
              <option key={d} value={d}>
                {DIET_LABEL[d]}
              </option>
            ))}
          </select>
        </fieldset>

        <label className="flex min-h-9 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disponiveis}
            onChange={(e) =>
              update({ disponiveis: e.target.checked ? "1" : null })
            }
          />
          Só o que tem hoje
        </label>
      </aside>

      <section aria-live="polite">
        <p className="text-ink-600 mb-4 text-sm">{results.length} produto(s)</p>
        {results.length === 0 ? (
          <p className="bg-sand-200/60 text-ink-600 rounded-(--radius-media) p-6">
            Nada encontrado com esses filtros.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
            {results.map((p) => (
              <ProductTile key={p.slug} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
