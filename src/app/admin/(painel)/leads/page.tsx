import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/page-shell";
import { deleteLead } from "@/modules/leads/actions";
import { leadStats, listLeads } from "@/modules/leads/queries";
import { originLabel } from "@/modules/leads/schemas";

export const metadata: Metadata = { title: "Contatos" };

const when = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const CAMPAIGN: Record<string, string> = {
  "black-friday": "Black Friday",
  geral: "Descontos e promoções",
};

export default function LeadsPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <LeadList />
    </AdminPage>
  );
}

async function LeadList() {
  const leads = await listLeads();
  const { week, sources } = leadStats(leads);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Contatos</h1>
          <p className="text-ink-600">
            Quem se cadastrou para receber ofertas, e de onde veio. Todos
            aceitaram receber mensagens.
          </p>
        </div>
        {leads.length > 0 && (
          <a
            href="/admin/leads/export"
            className="border-sand-200 hover:bg-sand-200 inline-flex min-h-11 items-center rounded-(--radius-control) border px-4 font-medium"
          >
            Baixar planilha (CSV)
          </a>
        )}
      </header>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total de contatos", leads.length],
          ["Nos últimos 7 dias", week],
          ["Origem mais comum", sources[0]?.[0] ?? "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-sand-200 bg-paper rounded-(--radius-media) border p-4"
          >
            <dt className="text-ink-600 text-sm">{label}</dt>
            <dd className="text-forest-900 mt-1 font-serif text-2xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {sources.length > 1 && (
        <p className="text-ink-600 text-sm">
          De onde vieram:{" "}
          {sources.map(([name, n]) => `${name} (${n})`).join(" · ")}
        </p>
      )}

      {leads.length === 0 ? (
        <p className="text-ink-600">
          Ninguém se cadastrou ainda. O aviso de ofertas aparece para quem
          visita a loja.
        </p>
      ) : (
        <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
          {leads.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-forest-900 font-medium">{l.name}</p>
                <p className="text-ink-600 text-sm break-all">
                  {l.email}
                  {l.phone ? ` · ${l.phone}` : ""}
                </p>
                <p className="text-ink-600 text-xs">
                  {when.format(new Date(l.created_at))} ·{" "}
                  {CAMPAIGN[l.campaign] ?? l.campaign} · veio de{" "}
                  {originLabel(l)}
                  {l.utm_campaign ? ` (campanha ${l.utm_campaign})` : ""}
                </p>
              </div>
              <details className="shrink-0 text-sm">
                <summary className="text-ink-600 cursor-pointer underline">
                  Apagar
                </summary>
                <form action={deleteLead} className="mt-2">
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="bg-terracotta-500 min-h-10 rounded-(--radius-control) px-3 font-medium text-white"
                  >
                    Apagar de vez
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
