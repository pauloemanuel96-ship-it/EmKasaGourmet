import type { Metadata } from "next";
import { BoxBuilder } from "@/components/loja/box-builder";

export const metadata: Metadata = { title: "Monte seu BOX" };

export default function BoxPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <p className="text-leaf-500 text-xs font-medium tracking-widest uppercase">
        Emkasa BOX
      </p>
      <h1 className="mb-8 text-4xl">Uma cesta do tamanho da sua casa</h1>
      <BoxBuilder />
    </main>
  );
}
