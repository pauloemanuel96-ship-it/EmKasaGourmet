"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  importMediaFromUrl,
  removeMedia,
  setMediaCover,
} from "@/modules/midia/actions";
import { uploadAndAttach } from "@/modules/midia/browser";
import {
  MEDIA_KINDS,
  MEDIA_KIND_LABEL,
  type MediaKind,
} from "@/modules/midia/paths";
import type { ProductMedia } from "@/modules/midia/queries";
import type { FormState } from "@/modules/catalogo/types";
import { FormMessage, inputClass } from "../catalogo/fields";

export function PhotoManager({
  productId,
  productSlug,
  productName,
  media,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  media: ProductMedia[];
}) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [pending, start] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [kind, setKind] = useState<MediaKind>("galeria");
  const [link, setLink] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setState({ status: "error", message: "Escolha arquivos de imagem." });
      return;
    }
    start(async () => {
      let ok = 0;
      let last: FormState = { status: "idle" };
      for (const [i, file] of images.entries()) {
        setProgress(`Enviando ${i + 1} de ${images.length}…`);
        last = await uploadAndAttach({
          file,
          productId,
          productSlug,
          alt: productName,
          kind,
        });
        if (last.status === "ok") ok++;
        else break;
      }
      setProgress(null);
      setState(
        last.status === "error"
          ? last
          : { status: "ok", message: `${ok} foto(s) colocada(s).` },
      );
    });
  }

  return (
    <section
      aria-labelledby="fotos"
      className="border-sand-200 bg-paper flex flex-col gap-5 rounded-(--radius-media) border p-4 sm:p-5"
    >
      <div>
        <h2 id="fotos" className="font-serif text-xl">
          Fotos
        </h2>
        <p className="text-ink-600 text-sm">
          A primeira foto vira a principal. As fotos são convertidas e reduzidas
          automaticamente antes de subir.
        </p>
      </div>

      {media.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <li key={m.id} className="flex flex-col gap-2">
              <div className="bg-sand-200 relative aspect-square overflow-hidden rounded-(--radius-control)">
                <Image
                  src={m.url}
                  alt={m.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {m.isCover && (
                  <span className="bg-forest-900 text-cream-50 absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-medium">
                    Principal
                  </span>
                )}
              </div>
              <p className="text-ink-600 text-xs">{MEDIA_KIND_LABEL[m.kind]}</p>
              <div className="flex flex-wrap gap-1">
                {!m.isCover && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => setState(await setMediaCover(m.id)))
                    }
                    className="text-forest-900 min-h-11 px-1 text-sm font-medium underline"
                  >
                    Tornar principal
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm("Remover esta foto do produto?"))
                      return;
                    start(async () => setState(await removeMedia(m.id)));
                  }}
                  className="text-danger-600 min-h-11 px-1 text-sm underline"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-600 text-sm">Este produto ainda não tem foto.</p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="media-kind" className="text-sm font-medium">
          Tipo das próximas fotos
        </label>
        <select
          id="media-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as MediaKind)}
          className={`${inputClass} sm:max-w-64`}
        >
          {MEDIA_KINDS.map((k) => (
            <option key={k} value={k}>
              {MEDIA_KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles([...e.dataTransfer.files]);
        }}
        className={`flex flex-col items-center gap-3 rounded-(--radius-media) border-2 border-dashed p-6 text-center ${
          dragging ? "border-forest-900 bg-sand-200" : "border-ink-600/30"
        }`}
      >
        <p className="text-sm">Arraste fotos para cá ou</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id="media-file"
          onChange={(e) => {
            uploadFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => fileInput.current?.click()}
          className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-5 font-medium disabled:opacity-60"
        >
          Escolher fotos
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!link.trim()) return;
          start(async () => {
            setProgress("Baixando do GitHub…");
            const r = await importMediaFromUrl({
              productId,
              url: link,
              kind,
              alt: productName,
            });
            setProgress(null);
            setState(r);
            if (r.status === "ok") setLink("");
          });
        }}
        className="flex flex-col gap-1.5"
      >
        <label htmlFor="media-link" className="text-sm font-medium">
          Ou cole o link da foto no GitHub
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="media-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://github.com/…/foto.jpg"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button
            type="submit"
            disabled={pending || !link.trim()}
            className="border-forest-900 text-forest-900 min-h-11 rounded-(--radius-control) border px-4 font-medium disabled:opacity-50"
          >
            Usar link
          </button>
        </div>
        <p className="text-ink-600 text-xs">
          Vale o link da página do arquivo ou o link raw. O repositório precisa
          ser público.
        </p>
      </form>

      {progress && (
        <p role="status" className="text-ink-600 text-sm">
          {progress}
        </p>
      )}
      <FormMessage state={state} />
    </section>
  );
}
