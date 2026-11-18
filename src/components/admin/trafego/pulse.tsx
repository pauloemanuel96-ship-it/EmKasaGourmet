import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/staff";
import { getTrafficReport } from "@/modules/trafego/queries";

const int = new Intl.NumberFormat("pt-BR");

/** Faixa do radar no início do painel. Só o dono vê (D-048). */
export async function TrafficPulse() {
  const user = await getCurrentUser();
  if (user?.role !== "owner") return null;
  const r = await getTrafficReport(7);
  if (!r) return null;
  const items: [string, number][] = [
    ["visitantes", r.totals.visitors],
    ["no carrinho", r.funnel[2]?.sessions ?? 0],
    ["abandonados", r.abandoned.sessions],
    ["contatos", r.totals.leads],
  ];
  return (
    <Link
      href="/admin/trafego"
      className="radar group relative mb-8 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-(--radius-media) px-5 py-4"
    >
      <span aria-hidden="true" className="fit-scan" />
      <span className="flex items-center gap-3">
        <span aria-hidden="true" className="fit-dot" />
        <span className="text-xs font-semibold tracking-[0.2em] text-[#8fd14f] uppercase">
          Radar · últimos 7 dias
        </span>
      </span>
      <span className="flex flex-wrap gap-5">
        {items.map(([label, value]) => (
          <span key={label} className="text-sm text-[#e9f3e1]/70">
            <strong className="mr-1 text-lg text-[#f4f9ef] tabular-nums">
              {int.format(value)}
            </strong>
            {label}
          </span>
        ))}
      </span>
      <span className="text-sm font-medium text-[#fed216] group-hover:underline">
        Abrir radar →
      </span>
    </Link>
  );
}
