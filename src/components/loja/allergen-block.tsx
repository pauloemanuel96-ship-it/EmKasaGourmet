import { ALLERGEN_LABEL, type Product } from "@/demo/data";

export function AllergenBlock({ product }: { product: Product }) {
  if (!product.allergensValidated) {
    return (
      <div
        role="note"
        className="border-warning-600/40 bg-warning-600/5 rounded-(--radius-control) border p-4 text-sm"
      >
        <p className="text-warning-600 font-medium">
          ⚠ Informações de alergênicos em revisão
        </p>
        <p className="text-ink-600 mt-1">
          Este produto não aparece nos filtros &quot;sem alergênico&quot; até a
          ficha ser validada.
        </p>
      </div>
    );
  }
  const none = product.contains.length === 0 && product.mayContain.length === 0;
  return (
    <div
      role="note"
      className="border-sand-200 flex flex-col gap-1 rounded-(--radius-control) border bg-white p-4 text-sm"
    >
      <p className="text-forest-900 font-medium">Alergênicos</p>
      {none && (
        <p className="text-ink-600">
          Nenhum alergênico declarado na ficha técnica.
        </p>
      )}
      {product.contains.length > 0 && (
        <p className="text-danger-600">
          <strong>Contém:</strong>{" "}
          {product.contains.map((a) => ALLERGEN_LABEL[a]).join(", ")}
        </p>
      )}
      {product.mayContain.length > 0 && (
        <p className="text-warning-600">
          <strong>Pode conter:</strong>{" "}
          {product.mayContain.map((a) => ALLERGEN_LABEL[a]).join(", ")}
        </p>
      )}
    </div>
  );
}
