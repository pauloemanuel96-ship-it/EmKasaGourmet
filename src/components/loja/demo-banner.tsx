import { getStoreCatalog } from "@/modules/catalogo/store";

/** Aviso do topo: diz com clareza o que ainda é demonstração (D-031). */
export async function DemoBanner() {
  const { source } = await getStoreCatalog();
  return (
    <div className="bg-forest-900 text-cream-50 px-4 py-2 text-center text-xs">
      {source === "demo" ? (
        <>
          Loja em <strong>demonstração</strong>: itens com selo DEMO não estão à
          venda. Nenhum pagamento é cobrado.
        </>
      ) : (
        <>
          Pagamento ainda em <strong>teste</strong>: pedidos feitos aqui não são
          cobrados nem entregues.
        </>
      )}
    </div>
  );
}
