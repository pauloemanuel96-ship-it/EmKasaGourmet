"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/modules/auth/staff";
import { friendlyDbError } from "@/modules/catalogo/errors";
import type { FormState } from "@/modules/catalogo/types";
import { fileNameFromUrl, toRawImageUrl } from "./links";
import { MEDIA_BUCKET, MEDIA_KINDS, mediaPath } from "./paths";

/**
 * Fotos de produto. Os arquivos ficam no Storage (bucket "produtos"); o banco
 * guarda só o caminho (admin_attach_media confere que o arquivo existe).
 */

const MAX_DOWNLOAD = 20 * 1024 * 1024;

async function requireManager(): Promise<FormState | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "owner" && user.role !== "admin") {
    return {
      status: "error",
      message: "Só a administração pode alterar fotos.",
    };
  }
  return null;
}

function changed() {
  updateTag("catalogo");
  refresh();
}

const attachSchema = z.object({
  productId: z.uuid(),
  path: z.string().regex(/^[a-z0-9][a-z0-9/_.-]*\.(webp|jpe?g|png|avif)$/),
  alt: z.string().trim().max(200),
  kind: z.enum(MEDIA_KINDS),
  cover: z.boolean(),
});

export async function attachUploadedMedia(
  input: z.input<typeof attachSchema>,
): Promise<FormState> {
  const denied = await requireManager();
  if (denied) return denied;
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: "Dados da foto inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_attach_media", {
    p_product_id: parsed.data.productId,
    p_path: parsed.data.path,
    p_alt: parsed.data.alt,
    p_kind: parsed.data.kind,
    p_cover: parsed.data.cover,
  });
  if (error) {
    // O arquivo subiu mas não foi ligado: apaga para não sobrar lixo.
    await supabase.storage.from(MEDIA_BUCKET).remove([parsed.data.path]);
    return { status: "error", message: friendlyDbError(error) };
  }
  changed();
  return { status: "ok", message: "Foto colocada." };
}

const urlSchema = z.object({
  productId: z.uuid(),
  url: z.string().max(2000),
  kind: z.enum(MEDIA_KINDS).default("galeria"),
  cover: z.boolean().default(false),
  alt: z.string().trim().max(200).default(""),
});

/**
 * Baixa a foto de um link do GitHub, converte para WebP e liga ao produto.
 * Só aceita endereços do GitHub e não segue redirecionamento para outro lugar.
 */
export async function importMediaFromUrl(
  input: z.input<typeof urlSchema>,
): Promise<FormState> {
  const denied = await requireManager();
  if (denied) return denied;
  const parsed = urlSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Dados inválidos." };

  const url = toRawImageUrl(parsed.data.url);
  if (!url) {
    return {
      status: "error",
      message:
        "Use um link de imagem do GitHub (a página do arquivo ou o link raw).",
    };
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, slug, name")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!product) return { status: "error", message: "Produto não encontrado." };

  let buffer: Buffer;
  try {
    const res = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
      headers: { accept: "image/*" },
    });
    if (!res.ok) {
      return {
        status: "error",
        message:
          res.status === 404
            ? "Não achei a imagem nesse link. Confira se o repositório é público."
            : "O GitHub não entregou a imagem. Tente de novo.",
      };
    }
    const type = res.headers.get("content-type") ?? "";
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > MAX_DOWNLOAD) {
      return {
        status: "error",
        message: "Imagem muito grande (mais de 20 MB).",
      };
    }
    // raw.githubusercontent responde image/* ou octet-stream conforme o arquivo.
    if (
      !type.startsWith("image/") &&
      !type.startsWith("application/octet-stream")
    ) {
      return { status: "error", message: "Esse link não é de uma imagem." };
    }
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_DOWNLOAD) {
      return {
        status: "error",
        message: "Imagem muito grande (mais de 20 MB).",
      };
    }
    buffer = Buffer.from(bytes);
  } catch {
    return {
      status: "error",
      message: "Não consegui baixar a imagem desse link. Tente de novo.",
    };
  }

  let webp: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    webp = await sharp(buffer, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return {
      status: "error",
      message: "Esse arquivo não é uma imagem válida.",
    };
  }

  const path = mediaPath((product as { slug: string }).slug);
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, webp, { contentType: "image/webp", upsert: false });
  if (uploadError) {
    return { status: "error", message: "Não foi possível guardar a foto." };
  }

  return attachUploadedMedia({
    productId: parsed.data.productId,
    path,
    alt: parsed.data.alt || (product as { name: string }).name,
    kind: parsed.data.kind,
    cover: parsed.data.cover,
  }).then((r) =>
    r.status === "ok"
      ? { status: "ok", message: `Foto "${fileNameFromUrl(url)}" colocada.` }
      : r,
  );
}

export async function setMediaCover(mediaId: string): Promise<FormState> {
  const denied = await requireManager();
  if (denied) return denied;
  if (!z.uuid().safeParse(mediaId).success) {
    return { status: "error", message: "Foto inválida." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_media_cover", {
    p_media_id: mediaId,
  });
  if (error) return { status: "error", message: friendlyDbError(error) };
  changed();
  return { status: "ok", message: "Agora é a foto principal." };
}

export async function removeMedia(mediaId: string): Promise<FormState> {
  const denied = await requireManager();
  if (denied) return denied;
  if (!z.uuid().safeParse(mediaId).success) {
    return { status: "error", message: "Foto inválida." };
  }
  const supabase = await createClient();
  const { data: path, error } = await supabase.rpc("admin_remove_media", {
    p_media_id: mediaId,
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  // Apaga o arquivo só se nenhum outro produto usa o mesmo caminho.
  const { count } = await supabase
    .from("product_media")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", path as string);
  if (!count)
    await supabase.storage.from(MEDIA_BUCKET).remove([path as string]);

  changed();
  return { status: "ok", message: "Foto removida." };
}

/** Apaga arquivo sem uso da Biblioteca (confere de novo que ninguém usa). */
export async function deleteUnusedFile(path: string): Promise<FormState> {
  const denied = await requireManager();
  if (denied) return denied;
  if (!/^[a-z0-9][a-z0-9/_.-]*$/.test(path)) {
    return { status: "error", message: "Arquivo inválido." };
  }
  const supabase = await createClient();
  const { count } = await supabase
    .from("product_media")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", path);
  if (count) {
    return {
      status: "error",
      message: "Essa foto está em uso e não foi apagada.",
    };
  }
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) return { status: "error", message: "Não foi possível apagar." };
  refresh();
  return { status: "ok", message: "Arquivo apagado." };
}

/** Lista curta de produtos para a importação em lote e o assistente. */
export async function listProductsForPhotos(): Promise<
  { id: string; slug: string; name: string; hasCover: boolean }[]
> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const [products, covers] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, name")
      .neq("status", "archived")
      .order("name"),
    supabase.from("product_media").select("product_id").eq("is_cover", true),
  ]);
  const withCover = new Set(
    ((covers.data ?? []) as { product_id: string }[]).map((c) => c.product_id),
  );
  return (
    (products.data ?? []) as { id: string; slug: string; name: string }[]
  ).map((p) => ({ ...p, hasCover: withCover.has(p.id) }));
}
