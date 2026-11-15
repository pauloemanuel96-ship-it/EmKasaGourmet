import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { as, createTestDb, createUser } from "./harness";

const OWNER = "00000000-0000-0000-0000-0000000000b1";
const OPERACAO = "00000000-0000-0000-0000-0000000000b2";
let db: PGlite;
let productId: string;

async function put(path: string) {
  await db.query(
    "insert into storage.objects (bucket_id, name) values ('produtos', $1)",
    [path],
  );
}

async function call(
  who: { userId: string } | { anon: true },
  sql: string,
  params: unknown[] = [],
) {
  return as(db, who, async () => (await db.query(sql, params)).rows);
}

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, OWNER, "owner");
  await createUser(db, OPERACAO, "operacao");
  const cat = (
    await db.query<{ id: string }>(
      "select id from public.categories where slug = 'blends-veganos'",
    )
  ).rows[0].id;
  productId = (
    (
      await call(
        { userId: OWNER },
        "select public.admin_save_product($1::jsonb) as id",
        [
          JSON.stringify({
            name: "Blend Vegano",
            category_id: cat,
            sale_unit: "un",
            price_cents: 1500,
            status: "active",
          }),
        ],
      )
    )[0] as { id: string }
  ).id;
}, 60_000);

describe("Fotos de produto", () => {
  it("bucket público, até 5 MB, só imagens", async () => {
    const b = (
      await db.query(
        "select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'produtos'",
      )
    ).rows[0];
    expect(b).toEqual({
      public: true,
      file_size_limit: 5242880,
      allowed_mime_types: [
        "image/webp",
        "image/jpeg",
        "image/png",
        "image/avif",
      ],
    });
  });

  it("só a administração envia arquivo para o bucket", async () => {
    await expect(
      call(
        { userId: OPERACAO },
        "insert into storage.objects (bucket_id, name) values ('produtos', 'x/op.webp')",
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      call(
        { anon: true },
        "insert into storage.objects (bucket_id, name) values ('produtos', 'x/anon.webp')",
      ),
    ).rejects.toThrow(/row-level security/);
    await call(
      { userId: OWNER },
      "insert into storage.objects (bucket_id, name) values ('produtos', 'blend-vegano/a.webp')",
    );
  });

  it("não liga foto cujo arquivo não existe", async () => {
    await expect(
      call(
        { userId: OWNER },
        "select public.admin_attach_media($1, 'blend-vegano/nao-existe.webp', '')",
        [productId],
      ),
    ).rejects.toThrow(/não foi encontrado/);
  });

  it("a primeira foto vira principal; a operação não mexe em fotos", async () => {
    await call(
      { userId: OWNER },
      "select public.admin_attach_media($1, 'blend-vegano/a.webp', '')",
      [productId],
    );
    const first = (
      await db.query(
        "select is_cover, alt_text from public.product_media where storage_path = 'blend-vegano/a.webp'",
      )
    ).rows[0];
    expect(first).toEqual({ is_cover: true, alt_text: "Blend Vegano" });

    await put("blend-vegano/b.webp");
    await expect(
      call(
        { userId: OPERACAO },
        "select public.admin_attach_media($1, 'blend-vegano/b.webp', '')",
        [productId],
      ),
    ).rejects.toThrow(/administração/);
  });

  it("segunda foto vai para a galeria; trocar a principal mantém só uma", async () => {
    await call(
      { userId: OWNER },
      "select public.admin_attach_media($1, 'blend-vegano/b.webp', 'Embalagem', 'embalagem')",
      [productId],
    );
    const rows = (
      await db.query<{ storage_path: string; is_cover: boolean; kind: string }>(
        "select storage_path, is_cover, kind from public.product_media where product_id = $1 order by sort_order",
        [productId],
      )
    ).rows;
    expect(rows).toEqual([
      { storage_path: "blend-vegano/a.webp", is_cover: true, kind: "galeria" },
      {
        storage_path: "blend-vegano/b.webp",
        is_cover: false,
        kind: "embalagem",
      },
    ]);

    const b = (
      await db.query<{ id: string }>(
        "select id from public.product_media where storage_path = 'blend-vegano/b.webp'",
      )
    ).rows[0].id;
    await call({ userId: OWNER }, "select public.admin_set_media_cover($1)", [
      b,
    ]);
    const covers = (
      await db.query(
        "select storage_path from public.product_media where product_id = $1 and is_cover",
        [productId],
      )
    ).rows;
    expect(covers).toEqual([{ storage_path: "blend-vegano/b.webp" }]);
  });

  it("remover a principal promove a próxima e devolve o caminho do arquivo", async () => {
    const b = (
      await db.query<{ id: string }>(
        "select id from public.product_media where storage_path = 'blend-vegano/b.webp'",
      )
    ).rows[0].id;
    const [{ path }] = (await call(
      { userId: OWNER },
      "select public.admin_remove_media($1) as path",
      [b],
    )) as { path: string }[];
    expect(path).toBe("blend-vegano/b.webp");
    const covers = (
      await db.query(
        "select storage_path from public.product_media where product_id = $1 and is_cover",
        [productId],
      )
    ).rows;
    expect(covers).toEqual([{ storage_path: "blend-vegano/a.webp" }]);
  });

  it("visitante vê as fotos do produto à venda; rascunho some", async () => {
    const seen = await call(
      { anon: true },
      "select product_slug, path, is_cover from public.v_store_media",
    );
    expect(seen).toEqual([
      {
        product_slug: "blend-vegano",
        path: "blend-vegano/a.webp",
        is_cover: true,
      },
    ]);
    await call(
      { userId: OWNER },
      "select public.admin_set_product_status($1, 'draft')",
      [productId],
    );
    expect(
      await call({ anon: true }, "select * from public.v_store_media"),
    ).toEqual([]);
  });

  it("caminho fora do formato é recusado", async () => {
    await put("../fora.webp");
    await expect(
      call(
        { userId: OWNER },
        "select public.admin_attach_media($1, '../fora.webp', '')",
        [productId],
      ),
    ).rejects.toThrow(/product_media_path_format/);
  });
});
