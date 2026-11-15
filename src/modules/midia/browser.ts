"use client";

import { createClient } from "@/lib/supabase/browser";
import { attachUploadedMedia } from "./actions";
import { MEDIA_BUCKET, mediaPath, type MediaKind } from "./paths";
import type { FormState } from "@/modules/catalogo/types";

const MAX_SIDE = 1600;
const QUALITY = 0.82;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/**
 * Converte a foto no próprio aparelho para WebP com no máximo 1600 px.
 * Foto de celular de 8 MB vira algo como 200 KB antes de subir.
 */
export async function toWebp(file: Blob): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Foto muito grande (mais de 25 MB).");
  }
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a foto.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  if (!blob) throw new Error("Não foi possível converter a foto.");
  return blob;
}

/** Converte, envia ao Storage e liga ao produto. */
export async function uploadAndAttach(input: {
  file: Blob;
  productId: string;
  productSlug: string;
  alt?: string;
  kind?: MediaKind;
  cover?: boolean;
}): Promise<FormState> {
  let webp: Blob;
  try {
    webp = await toWebp(input.file);
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const path = mediaPath(input.productSlug);
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, webp, { contentType: "image/webp", upsert: false });
  if (error) {
    return {
      status: "error",
      message: /row-level|unauthorized|403/i.test(error.message)
        ? "Sua conta não tem permissão para enviar fotos."
        : "Não foi possível enviar a foto. Confira a internet e tente de novo.",
    };
  }
  return attachUploadedMedia({
    productId: input.productId,
    path,
    alt: input.alt ?? "",
    kind: input.kind ?? "galeria",
    cover: input.cover ?? false,
  });
}
