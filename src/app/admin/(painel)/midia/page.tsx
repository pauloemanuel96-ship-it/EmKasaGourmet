import type { Metadata } from "next";
import Link from "next/link";
import { BulkImport } from "@/components/admin/midia/bulk-import";
import { Library } from "@/components/admin/midia/library";
import { MissingPhotos } from "@/components/admin/midia/missing-photos";
import { AdminPage } from "@/components/admin/page-shell";
import { listProductsForPhotos } from "@/modules/midia/actions";
import { getLibrary } from "@/modules/midia/queries";

export const metadata: Metadata = { title: "Biblioteca de Mídia" };

export default function MidiaPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <Media />
    </AdminPage>
  );
}

async function Media() {
  const [products, library] = await Promise.all([
    listProductsForPhotos(),
    getLibrary(),
  ]);
  const missing = products.filter((p) => !p.hasCover);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-3xl">Biblioteca de Mídia</h1>
        <p className="text-ink-600">
          Fotos dos produtos. Para uma foto só, use a página do produto em{" "}
          <Link href="/admin/produtos" className="underline">
            Produtos
          </Link>
          . Aqui você envia muitas de uma vez.
        </p>
      </header>

      <section aria-labelledby="importar" className="flex flex-col gap-4">
        <h2 id="importar" className="font-serif text-2xl">
          Importar em lote
        </h2>
        <BulkImport products={products} />
      </section>

      <section aria-labelledby="sem-foto" className="flex flex-col gap-4">
        <h2 id="sem-foto" className="font-serif text-2xl">
          Produtos sem foto ({missing.length})
        </h2>
        <MissingPhotos products={missing} />
      </section>

      <section aria-labelledby="biblioteca" className="flex flex-col gap-4">
        <h2 id="biblioteca" className="font-serif text-2xl">
          Todas as fotos ({library.length})
        </h2>
        <Library items={library} />
      </section>
    </div>
  );
}
