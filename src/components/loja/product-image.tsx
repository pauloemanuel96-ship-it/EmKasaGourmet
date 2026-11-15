import Image from "next/image";
import type { StoreProduct } from "@/modules/catalogo/store-types";
import { ProductArt } from "./product-art";

/** Foto do produto quando existe; ilustração com o nome enquanto não há foto. */
export function ProductImage({
  product,
  className = "",
  priority = false,
  sizes = "(min-width: 768px) 33vw, 50vw",
}: {
  product: Pick<StoreProduct, "name" | "tone" | "cover">;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!product.cover) {
    return (
      <ProductArt
        name={product.name}
        tone={product.tone}
        className={className}
      />
    );
  }
  return (
    <div
      className={`bg-sand-200 relative overflow-hidden rounded-(--radius-media) ${className}`}
      style={{ aspectRatio: "4/5" }}
    >
      <Image
        src={product.cover.url}
        alt={product.cover.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
