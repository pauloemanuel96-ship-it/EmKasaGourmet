import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/loja/checkout-form";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <h1 className="text-4xl">Finalizar pedido</h1>
      <Suspense fallback={<p className="text-ink-600 mt-8">Carregando…</p>}>
        <CheckoutForm />
      </Suspense>
    </main>
  );
}
