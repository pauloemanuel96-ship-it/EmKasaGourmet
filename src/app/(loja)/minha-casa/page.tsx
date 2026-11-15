import type { Metadata } from "next";
import { MyHome } from "@/components/loja/my-home";

export const metadata: Metadata = {
  title: "Minha Casa Emkasa",
  robots: { index: false },
};

export default function MinhaCasaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <p className="text-leaf-500 text-xs font-medium tracking-widest uppercase">
        Minha Casa Emkasa
      </p>
      <h1 className="mb-8 text-4xl">Sua casa, sua assinatura, seus pedidos</h1>
      <MyHome />
    </main>
  );
}
