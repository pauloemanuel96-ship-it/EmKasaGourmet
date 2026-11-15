import type { Metadata } from "next";
import { ClubView } from "@/components/loja/club-view";

export const metadata: Metadata = { title: "Clube Emkasa" };

export default function ClubePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <p className="text-leaf-500 text-xs font-medium tracking-widest uppercase">
        Emkasa Clube
      </p>
      <h1 className="mb-8 text-4xl">Quem cuida junto ganha junto</h1>
      <ClubView />
    </main>
  );
}
