"use client";

import { useMemo, useState, useTransition } from "react";
import { importMediaFromUrl } from "@/modules/midia/actions";
import { uploadAndAttach } from "@/modules/midia/browser";
import { fileNameFromUrl, toRawImageUrl } from "@/modules/midia/links";
import {
  matchProduct,
  parseFileName,
  type MatchResult,
} from "@/modules/midia/matching";
import {
  MEDIA_KINDS,
  MEDIA_KIND_LABEL,
  type MediaKind,
} from "@/modules/midia/paths";
import { Badge, inputClass } from "../catalogo/fields";

type Product = { id: string; slug: string; name: string; hasCover: boolean };

type Row = {
  key: string;
  label: string;
  file?: File;
  url?: string;
  preview?: string;
  match: MatchResult<Product>;
  productId: string;
  kind: MediaKind;
  cover: boolean;
  status: "pronto" | "enviando" | "feito" | "erro" | "pulado";
  message?: string;
};

const PACKAGING = /frente|fundo|verso|embalagem|rotulo|pote/i;

function buildRows(
  items: { key: string; label: string; file?: File; url?: string }[],
  products: Product[],
): Row[] {
  const coverTaken = new Set(
    products.filter((p) => p.hasCover).map((p) => p.id),
  );
  return items.map((it) => {
    const { base, index } = parseFileName(it.label);
    const match = matchProduct(base, products, index);
    // Ambíguo ou sem produto: ninguém é escolhido sozinho.
    const productId =
      match.status === "exato" || match.status === "provavel"
        ? match.product.id
        : "";
    const kind: MediaKind = PACKAGING.test(it.label) ? "embalagem" : "galeria";
    const cover =
      !!productId && kind === "galeria" && !coverTaken.has(productId);
    if (cover) coverTaken.add(productId);
    return {
      ...it,
      preview: it.file ? URL.createObjectURL(it.file) : it.url,
      match,
      productId,
      kind,
      cover,
      status: "pronto",
    };
  });
}

const STATUS_BADGE: Record<
  MatchResult<Product>["status"],
  [string, "ok" | "warn" | "muted" | "neutral"]
> = {
  exato: ["Nome confere", "ok"],
  provavel: ["Provável: confira", "warn"],
  ambiguo: ["Mais de um produto: escolha", "warn"],
  nenhum: ["Sem produto: escolha", "muted"],
};

export function BulkImport({ products }: { products: Product[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [links, setLinks] = useState("");
  const [pending, start] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    setSummary(null);
    setRows((rs) => [
      ...rs,
      ...buildRows(
        images.map((f) => ({
          key: `${f.name}-${f.size}-${Math.random()}`,
          label: f.name,
          file: f,
        })),
        products,
      ),
    ]);
  }

  function addLinks() {
    const urls = links
      .split(/\s+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const valid = urls
      .map((u) => ({ raw: u, url: toRawImageUrl(u) }))
      .filter((u): u is { raw: string; url: URL } => u.url !== null);
    setSummary(
      valid.length < urls.length
        ? `${urls.length - valid.length} link(s) ignorado(s): só links de imagem do GitHub.`
        : null,
    );
    setRows((rs) => [
      ...rs,
      ...buildRows(
        valid.map(({ url }) => ({
          key: `${url.href}-${Math.random()}`,
          label: fileNameFromUrl(url),
          url: url.href,
        })),
        products,
      ),
    ]);
    setLinks("");
  }

  const ready = rows.filter((r) => r.status === "pronto" && r.productId);

  function send() {
    start(async () => {
      let ok = 0;
      let fail = 0;
      for (const r of ready) {
        update(r.key, { status: "enviando" });
        const product = byId.get(r.productId)!;
        const result = r.file
          ? await uploadAndAttach({
              file: r.file,
              productId: product.id,
              productSlug: product.slug,
              alt: product.name,
              kind: r.kind,
              cover: r.cover,
            })
          : await importMediaFromUrl({
              productId: product.id,
              url: r.url!,
              kind: r.kind,
              cover: r.cover,
              alt: product.name,
            });
        if (result.status === "ok") {
          ok++;
          update(r.key, { status: "feito" });
        } else {
          fail++;
          update(r.key, {
            status: "erro",
            message: result.status === "error" ? result.message : undefined,
          });
        }
      }
      setSummary(
        `${ok} foto(s) colocada(s)${fail ? `, ${fail} com erro` : ""}.`,
      );
    });
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles([...e.dataTransfer.files]);
          }}
          className="border-ink-600/30 hover:border-forest-900 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-(--radius-media) border-2 border-dashed p-6 text-center"
        >
          <span className="font-medium">Arraste a pasta de fotos aqui</span>
          <span className="text-ink-600 text-sm">
            ou toque para escolher. O nome do arquivo indica o produto (ex.:
            farofa-nutritiva-de-soja.jpg).
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </label>
        <div className="flex flex-col gap-2">
          <label htmlFor="links" className="font-medium">
            Ou cole links do GitHub, um por linha
          </label>
          <textarea
            id="links"
            rows={4}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="https://raw.githubusercontent.com/…/Farofa.jpg"
            className={`${inputClass} py-2`}
          />
          <button
            type="button"
            onClick={addLinks}
            disabled={!links.trim()}
            className="border-forest-900 text-forest-900 min-h-11 self-start rounded-(--radius-control) border px-4 font-medium disabled:opacity-50"
          >
            Conferir links
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <p className="text-ink-600 text-sm">
            Confira cada linha antes de enviar. Nada é enviado sem o seu clique,
            e a foto principal de um produto só é trocada se você marcar.
          </p>
          <ul className="border-sand-200 divide-sand-200 divide-y rounded-(--radius-media) border">
            {rows.map((r) => {
              const product = byId.get(r.productId);
              // Em caso de dúvida, os candidatos aparecem primeiro na lista.
              const first =
                r.match.status === "ambiguo"
                  ? r.match.options
                  : r.match.status === "provavel"
                    ? [r.match.product, ...r.match.others]
                    : [];
              const options = [
                ...first,
                ...products.filter((p) => !first.includes(p)),
              ];
              const [label, tone] = STATUS_BADGE[r.match.status];
              return (
                <li
                  key={r.key}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start"
                >
                  {r.preview && (
                    // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) antes do envio
                    <img
                      src={r.preview}
                      alt=""
                      className="bg-sand-200 size-20 shrink-0 rounded-(--radius-control) object-cover"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {r.label}
                      </span>
                      <Badge tone={tone}>{label}</Badge>
                      {r.status === "feito" && <Badge tone="ok">Enviada</Badge>}
                      {r.status === "enviando" && <Badge>Enviando…</Badge>}
                      {r.status === "erro" && (
                        <span className="text-danger-600 text-sm">
                          {r.message}
                        </span>
                      )}
                    </div>
                    {r.status === "pronto" && (
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <select
                          aria-label={`Produto da foto ${r.label}`}
                          value={r.productId}
                          onChange={(e) => {
                            const p = byId.get(e.target.value);
                            update(r.key, {
                              productId: e.target.value,
                              cover: !!p && !p.hasCover && r.kind === "galeria",
                            });
                          }}
                          className={inputClass}
                        >
                          <option value="">Não enviar</option>
                          {options.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Tipo da foto"
                          value={r.kind}
                          onChange={(e) =>
                            update(r.key, { kind: e.target.value as MediaKind })
                          }
                          className={inputClass}
                        >
                          {MEDIA_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {MEDIA_KIND_LABEL[k]}
                            </option>
                          ))}
                        </select>
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={r.cover}
                            onChange={(e) =>
                              update(r.key, { cover: e.target.checked })
                            }
                            className="accent-forest-900 size-5"
                          />
                          {product?.hasCover
                            ? "Substituir principal"
                            : "Principal"}
                        </label>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending || ready.length === 0}
              onClick={send}
              className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-5 font-medium disabled:opacity-60"
            >
              {pending ? "Enviando…" : `Enviar ${ready.length} foto(s)`}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setRows([]);
                setSummary(null);
              }}
              className="text-ink-600 min-h-11 px-2 text-sm underline"
            >
              Limpar lista
            </button>
          </div>
        </>
      )}
      {summary && (
        <p
          role="status"
          className="bg-sand-200 rounded-(--radius-control) p-3 text-sm"
        >
          {summary}
        </p>
      )}
    </section>
  );
}
