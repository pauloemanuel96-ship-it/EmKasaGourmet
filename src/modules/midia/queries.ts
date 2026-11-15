import "server-only";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET, publicMediaUrl, type MediaKind } from "./paths";

export type ProductMedia = {
  id: string;
  path: string;
  url: string;
  alt: string;
  kind: MediaKind;
  isCover: boolean;
};

export async function getProductMedia(
  productId: string,
): Promise<ProductMedia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_media")
    .select("id, storage_path, alt_text, kind, is_cover, sort_order")
    .eq("product_id", productId)
    .order("is_cover", { ascending: false })
    .order("sort_order");
  if (error) throw new Error("Não foi possível carregar as fotos.");
  const base = publicEnv().NEXT_PUBLIC_SUPABASE_URL;
  return (
    (data ?? []) as {
      id: string;
      storage_path: string;
      alt_text: string;
      kind: MediaKind;
      is_cover: boolean;
    }[]
  ).map((m) => ({
    id: m.id,
    path: m.storage_path,
    url: publicMediaUrl(base, m.storage_path),
    alt: m.alt_text,
    kind: m.kind,
    isCover: m.is_cover,
  }));
}

export type LibraryItem = {
  path: string;
  url: string;
  size: number | null;
  createdAt: string | null;
  usedBy: { productId: string; productName: string; isCover: boolean }[];
};

/** Todos os arquivos do bucket, com quem usa cada um. */
export async function getLibrary(): Promise<LibraryItem[]> {
  const supabase = await createClient();
  const bucket = supabase.storage.from(MEDIA_BUCKET);
  const base = publicEnv().NEXT_PUBLIC_SUPABASE_URL;

  const { data: root, error } = await bucket.list("", { limit: 1000 });
  if (error) throw new Error("Não foi possível abrir a Biblioteca de Mídia.");

  type Entry = {
    name: string;
    id: string | null;
    created_at?: string;
    metadata?: { size?: number } | null;
  };
  const files: { path: string; entry: Entry }[] = [];
  const folders = (root as Entry[]).filter((e) => e.id === null);
  for (const e of root as Entry[])
    if (e.id !== null) files.push({ path: e.name, entry: e });
  const nested = await Promise.all(
    folders.map((f) =>
      bucket.list(f.name, { limit: 1000 }).then((r) => ({ f, r })),
    ),
  );
  for (const { f, r } of nested) {
    for (const e of (r.data ?? []) as Entry[]) {
      if (e.id !== null) files.push({ path: `${f.name}/${e.name}`, entry: e });
    }
  }

  const { data: media } = await supabase
    .from("product_media")
    .select("storage_path, is_cover, product_id, products(name)");
  const usage = new Map<string, LibraryItem["usedBy"]>();
  for (const m of (media ?? []) as unknown as {
    storage_path: string;
    is_cover: boolean;
    product_id: string;
    products: { name: string } | null;
  }[]) {
    const list = usage.get(m.storage_path) ?? [];
    list.push({
      productId: m.product_id,
      productName: m.products?.name ?? "Produto",
      isCover: m.is_cover,
    });
    usage.set(m.storage_path, list);
  }

  return files
    .filter(({ path }) => !path.endsWith(".emptyFolderPlaceholder"))
    .map(({ path, entry }) => ({
      path,
      url: publicMediaUrl(base, path),
      size: entry.metadata?.size ?? null,
      createdAt: entry.created_at ?? null,
      usedBy: usage.get(path) ?? [],
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
