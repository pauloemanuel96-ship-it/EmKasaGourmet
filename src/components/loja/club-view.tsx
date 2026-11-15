"use client";

import { CLUB_REWARDS } from "@/demo/data";
import { demo, useDemo } from "@/demo/store";

export function ClubView() {
  const points = useDemo((s) => s.points);
  return (
    <div className="flex flex-col gap-8">
      <div className="bg-forest-900 text-cream-50 rounded-(--radius-media) p-8">
        <p className="text-cream-50/80 text-sm">Seus pontos</p>
        <p className="font-serif text-6xl">{points}</p>
        <p className="text-cream-50/80 mt-2 text-sm">
          Cada R$ 1 em compras vale 1 ponto (regra de demonstração).
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {CLUB_REWARDS.map((r) => (
          <li
            key={r.points}
            className="flex flex-col gap-3 rounded-(--radius-media) bg-white p-5"
          >
            <p className="text-forest-900 font-serif text-2xl">
              {r.points} pts
            </p>
            <p className="flex-1 text-sm">{r.label}</p>
            <button
              type="button"
              disabled={points < r.points}
              onClick={() => demo.redeem(r.points, r.label)}
              className="bg-forest-900 text-cream-50 min-h-11 rounded-(--radius-control) px-4 text-sm font-medium disabled:opacity-40"
            >
              {points < r.points ? `Faltam ${r.points - points}` : "Resgatar"}
            </button>
          </li>
        ))}
      </ul>
      <section className="bg-sand-200/60 rounded-(--radius-media) p-6">
        <h2 className="mb-2 text-xl">Indique e ganhe</h2>
        <p className="text-ink-600 text-sm">
          Na versão real, cada indicação que fizer a primeira compra rende
          pontos para os dois. Seu link:{" "}
          <code className="rounded bg-white px-1">emkasa.com.br/i/DEMO123</code>
        </p>
      </section>
    </div>
  );
}
