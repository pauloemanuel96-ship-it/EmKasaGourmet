import Link from "next/link";
import { sourceLabel } from "@/modules/trafego/schemas";
import type { Period, TrafficReport } from "@/modules/trafego/queries";

const NEON = "#8fd14f";
const GOLD = "#fed216";
const ORANGE = "#f9630e";
const int = new Intl.NumberFormat("pt-BR");
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;
const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});
const when = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** Moldura escura do radar, com a faixa de leitura passando. */
export function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`radar-panel relative min-w-0 overflow-hidden rounded-(--radius-media) border border-[#8fd14f]/15 p-5 text-[#e9f3e1] ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-xs font-semibold tracking-[0.2em] text-[#8fd14f] uppercase">
          {title}
        </h2>
        {hint && <p className="text-xs text-[#e9f3e1]/55">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export function PeriodPicker({ current }: { current: Period }) {
  const options: [Period, string][] = [
    [1, "Hoje"],
    [7, "7 dias"],
    [30, "30 dias"],
    [90, "90 dias"],
  ];
  return (
    <nav aria-label="Período" className="flex flex-wrap gap-2">
      {options.map(([d, label]) => (
        <Link
          key={d}
          href={`/admin/trafego?dias=${d}`}
          aria-current={d === current ? "page" : undefined}
          className="min-h-11 rounded-full border border-[#8fd14f]/30 px-4 py-2.5 text-sm font-medium text-[#e9f3e1]/80 aria-[current=page]:border-[#8fd14f] aria-[current=page]:bg-[#8fd14f] aria-[current=page]:text-[#0b1510] aria-[current=page]:shadow-[0_0_18px_#8fd14f80]"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Kpis({ r }: { r: TrafficReport }) {
  const items: [string, number, string, string?][] = [
    ["Visitantes", r.totals.visitors, NEON],
    ["Visitas", r.totals.sessions, NEON],
    ["Páginas vistas", r.totals.views, GOLD],
    ["Contatos captados", r.totals.leads, GOLD],
    [
      "Carrinhos abandonados",
      r.abandoned.sessions,
      ORANGE,
      r.abandoned.logged > 0 ? `${r.abandoned.logged} com conta` : undefined,
    ],
    ["Pedidos (demonstração)", r.totals.orders, ORANGE],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map(([label, value, color, sub]) => (
        <div
          key={label}
          className="radar-panel min-w-0 rounded-(--radius-media) border border-[#8fd14f]/15 p-4"
        >
          <dt className="text-xs text-[#e9f3e1]/60">{label}</dt>
          <dd
            className="mt-1 font-sans text-3xl font-semibold tabular-nums"
            style={{ color, textShadow: `0 0 18px ${color}88` }}
          >
            {int.format(value)}
          </dd>
          {sub && <p className="mt-1 text-xs text-[#e9f3e1]/55">{sub}</p>}
        </div>
      ))}
    </dl>
  );
}

/** Visitantes por dia (área com brilho) e páginas vistas (linha dourada). */
export function DailyChart({ r }: { r: TrafficReport }) {
  const W = 640;
  const H = 180;
  const pad = 8;
  // Cada linha na sua escala: páginas vistas são sempre muito mais que visitantes.
  const maxOf = {
    visitors: Math.max(1, ...r.daily.map((d) => d.visitors)),
    views: Math.max(1, ...r.daily.map((d) => d.views)),
  };
  const n = r.daily.length;
  const x = (i: number) =>
    n === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1);
  const y = (v: number, key: "visitors" | "views" = "visitors") =>
    H - pad - (v / maxOf[key]) * (H - pad * 2);
  const line = (key: "visitors" | "views") =>
    r.daily
      .map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key], key)}`)
      .join(" ");
  const area = `${line("visitors")} L${x(n - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  const step = Math.max(1, Math.ceil(n / 7));
  return (
    <Panel
      title="Movimento"
      hint="Verde: visitantes por dia · Dourado: páginas vistas"
    >
      <svg
        viewBox={`0 0 ${W} ${H + 22}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Visitantes por dia nos últimos ${r.days} dias`}
      >
        <defs>
          <linearGradient id="radar-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={NEON} stopOpacity="0.55" />
            <stop offset="100%" stopColor={NEON} stopOpacity="0" />
          </linearGradient>
          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={W - pad}
            y1={pad + f * (H - pad * 2)}
            y2={pad + f * (H - pad * 2)}
            stroke="#8fd14f"
            strokeOpacity="0.08"
          />
        ))}
        <path d={area} fill="url(#radar-area)" />
        <path
          d={line("views")}
          fill="none"
          stroke={GOLD}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.8"
        />
        <path
          d={line("visitors")}
          fill="none"
          stroke={NEON}
          strokeWidth="2.5"
          filter="url(#radar-glow)"
        />
        {r.daily.map((d, i) => (
          <g key={d.day}>
            <circle cx={x(i)} cy={y(d.visitors)} r="3" fill={NEON}>
              <title>
                {dayLabel.format(new Date(d.day))}: {d.visitors} visitante(s),{" "}
                {d.views} página(s)
              </title>
            </circle>
            {i % step === 0 && (
              <text
                x={x(i)}
                y={H + 16}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize="11"
                fill="#e9f3e1"
                opacity="0.55"
              >
                {dayLabel.format(new Date(d.day))}
              </text>
            )}
          </g>
        ))}
      </svg>
    </Panel>
  );
}

/** Funil: quanto de cada etapa chega à seguinte. */
export function Funnel({ r }: { r: TrafficReport }) {
  const top = Math.max(1, r.funnel[0]?.sessions ?? 0);
  return (
    <Panel title="Funil da compra" hint="Contado por visita">
      <ol className="flex flex-col gap-3">
        {r.funnel.map((f, i) => {
          const prev = i > 0 ? r.funnel[i - 1].sessions : f.sessions;
          const width = Math.max(4, (f.sessions / top) * 100);
          return (
            <li key={f.step} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>{f.step}</span>
                <span className="text-[#e9f3e1]/70 tabular-nums">
                  {int.format(f.sessions)}
                  {i > 0 && (
                    <span className="ml-2 text-xs" style={{ color: GOLD }}>
                      {pct(f.sessions, prev)}% da etapa anterior
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 rounded-full bg-[#e9f3e1]/5">
                <div
                  className="radar-bar h-3 rounded-full"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${NEON}, ${i >= 3 ? ORANGE : GOLD})`,
                    boxShadow: `0 0 14px ${NEON}66`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export function Sources({ r }: { r: TrafficReport }) {
  const max = Math.max(1, ...r.sources.map((s) => s.sessions));
  return (
    <Panel title="De onde vieram" hint="Origem da visita">
      {r.sources.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-3">
          {r.sources.map((s) => (
            <li key={s.source} className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between gap-2">
                <span>
                  {sourceLabel(s.source)}
                  {s.medium && (
                    <span className="text-xs text-[#e9f3e1]/50">
                      {" "}
                      · {s.medium}
                    </span>
                  )}
                </span>
                <span className="text-[#e9f3e1]/70 tabular-nums">
                  {int.format(s.sessions)} visita(s) · {s.carts} carrinho(s) ·{" "}
                  {s.conversions} conversão(ões)
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#e9f3e1]/5">
                <div
                  className="radar-bar h-1.5 rounded-full"
                  style={{
                    width: `${(s.sessions / max) * 100}%`,
                    background: NEON,
                    boxShadow: `0 0 10px ${NEON}`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function Devices({ r }: { r: TrafficReport }) {
  const total = r.devices.reduce((t, d) => t + d.sessions, 0);
  const colors = [NEON, GOLD, ORANGE, "#6b8f71"];
  return (
    <Panel title="Aparelhos">
      {total === 0 ? (
        <Empty />
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full">
            {r.devices.map((d, i) => (
              <div
                key={d.device}
                style={{
                  width: `${(d.sessions / total) * 100}%`,
                  background: colors[i % colors.length],
                }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {r.devices.map((d, i) => (
              <li key={d.device} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ background: colors[i % colors.length] }}
                />
                <span className="capitalize">{d.device}</span>
                <span className="text-[#e9f3e1]/60 tabular-nums">
                  {pct(d.sessions, total)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

export function Pages({ r }: { r: TrafficReport }) {
  return (
    <Panel title="Páginas mais vistas">
      {r.pages.length === 0 ? (
        <Empty />
      ) : (
        <ol className="flex flex-col divide-y divide-[#8fd14f]/10 text-sm">
          {r.pages.map((p) => (
            <li key={p.path} className="flex justify-between gap-3 py-2">
              <span className="truncate font-mono text-xs text-[#e9f3e1]/85">
                {p.path}
              </span>
              <span className="shrink-0 text-[#e9f3e1]/70 tabular-nums">
                {int.format(p.views)} · {int.format(p.visitors)} pessoa(s)
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function Products({ r }: { r: TrafficReport }) {
  return (
    <Panel
      title="Carrinho: entrou e saiu"
      hint="Unidades postas e tiradas do carrinho"
    >
      {r.products.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col divide-y divide-[#8fd14f]/10 text-sm">
          {r.products.map((p) => (
            <li key={p.slug} className="flex justify-between gap-3 py-2">
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 tabular-nums">
                <span style={{ color: NEON }}>+{p.added}</span>
                {p.removed > 0 && (
                  <span className="ml-3" style={{ color: ORANGE }}>
                    −{p.removed}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function Recent({ r }: { r: TrafficReport }) {
  return (
    <Panel
      title="Últimas visitas"
      hint="Nome só aparece para quem entrou na conta"
    >
      {r.recent.length === 0 ? (
        <Empty />
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-[#e9f3e1]/55">
              <tr>
                <th className="px-2 py-1 font-medium">Quando</th>
                <th className="px-2 py-1 font-medium">Quem</th>
                <th className="px-2 py-1 font-medium">Origem</th>
                <th className="px-2 py-1 font-medium">Entrou por</th>
                <th className="px-2 py-1 font-medium">Chegou até</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8fd14f]/10">
              {r.recent.map((v, i) => (
                <tr key={`${v.started}-${i}`}>
                  <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                    {when.format(new Date(v.started))}
                  </td>
                  <td className="px-2 py-2">
                    {v.customer ?? (
                      <span className="text-[#e9f3e1]/50">
                        Visitante · {v.device ?? "?"}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">{sourceLabel(v.source)}</td>
                  <td className="max-w-40 truncate px-2 py-2 font-mono text-xs">
                    {v.landing}
                  </td>
                  <td
                    className="px-2 py-2 whitespace-nowrap"
                    style={{
                      color:
                        v.reached === "Fez o pedido"
                          ? NEON
                          : v.reached === "Visitou a loja"
                            ? undefined
                            : GOLD,
                    }}
                  >
                    {v.reached} · {v.views} pág.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Empty() {
  return <p className="text-sm text-[#e9f3e1]/55">Ainda sem dados.</p>;
}
