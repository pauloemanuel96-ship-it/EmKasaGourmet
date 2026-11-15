import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTracking } from "@/components/loja/order-tracking";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  robots: { index: false },
};

export default function PedidoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <Suspense fallback={<p className="text-ink-600">Carregando pedido…</p>}>
        <OrderTracking />
      </Suspense>
    </main>
  );
}
