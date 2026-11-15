import type { Metadata } from "next";
import { CartView } from "@/components/loja/cart-view";

export const metadata: Metadata = { title: "Carrinho" };

export default function CarrinhoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <h1 className="text-4xl">Carrinho</h1>
      <CartView />
    </main>
  );
}
