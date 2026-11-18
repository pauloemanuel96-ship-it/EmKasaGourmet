"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BLACK_FRIDAY_END } from "@/modules/leads/popup-config";
import { LEAD_OPEN_EVENT } from "@/modules/leads/origin";

export type Announcement = {
  id: string;
  text: string;
  href?: string;
  /** Abre o aviso de ofertas (cadastro de contato) em vez de ir a uma página. */
  action?: "ofertas";
  /** Destaque dourado (campanha). */
  gold?: boolean;
};

/**
 * Faixa do topo (D-051): as novidades passam devagar, da direita para a
 * esquerda, e param quando o mouse ou o foco estão nela. Com "reduzir
 * movimento", fica parada e rola com o dedo. A Black Friday some sozinha
 * depois do último dia.
 */
export function AnnouncementTicker({ items }: { items: Announcement[] }) {
  const [bfOver, setBfOver] = useState(false);
  useEffect(() => {
    const end = new Date(`${BLACK_FRIDAY_END}T23:59:59-03:00`).getTime();
    if (Date.now() > end) {
      const id = requestAnimationFrame(() => setBfOver(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);
  const list = items.filter((i) => !(bfOver && i.id === "black-friday"));

  const row = (copy: boolean) => (
    <ul aria-hidden={copy || undefined} className="flex shrink-0 items-center">
      {list.map((i) => {
        const tone = i.gold ? "text-[#fed216]" : "text-cream-50";
        const inner = (
          <>
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${i.gold ? "bg-[#fed216] shadow-[0_0_8px_#fed216]" : "bg-leaf-500"}`}
            />
            <span>{i.text}</span>
            {(i.href || i.action) && (
              <span aria-hidden="true" className="opacity-70">
                →
              </span>
            )}
          </>
        );
        const cls = `flex min-h-9 items-center gap-2 px-6 whitespace-nowrap ${tone}`;
        return (
          <li key={i.id}>
            {i.href ? (
              <Link
                href={i.href}
                tabIndex={copy ? -1 : undefined}
                className={`${cls} hover:underline`}
              >
                {inner}
              </Link>
            ) : i.action === "ofertas" ? (
              <button
                type="button"
                tabIndex={copy ? -1 : undefined}
                onClick={() => window.dispatchEvent(new Event(LEAD_OPEN_EVENT))}
                className={`${cls} hover:underline`}
              >
                {inner}
              </button>
            ) : (
              <span className={cls}>{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <section
      aria-label="Novidades da Emkasa"
      className="ticker bg-forest-900 relative overflow-hidden text-xs"
    >
      <div className="ticker-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
