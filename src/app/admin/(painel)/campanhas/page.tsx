import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/catalogo/action-button";
import { Badge, buttonPrimary } from "@/components/admin/catalogo/fields";
import { AdminPage } from "@/components/admin/page-shell";
import { setCampaignActive } from "@/modules/catalogo/actions";
import { listCampaigns } from "@/modules/catalogo/admin-queries";

export const metadata: Metadata = { title: "Campanhas" };

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});
const fmt = (d: string | null) =>
  d ? date.format(new Date(`${d}T00:00:00Z`)) : null;

export default function CampanhasPage({
  searchParams,
}: PageProps<"/admin/campanhas">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <CampaignList searchParams={searchParams} />
    </AdminPage>
  );
}

async function CampaignList({
  searchParams,
}: {
  searchParams: PageProps<"/admin/campanhas">["searchParams"];
}) {
  const [{ salvo }, campaigns] = await Promise.all([
    searchParams,
    listCampaigns(),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Campanhas</h1>
          <p className="text-ink-600">
            Datas especiais (Natal, Páscoa, Dia das Mães…). Os produtos entram
            na campanha pela ficha do produto.
          </p>
        </div>
        <Link href="/admin/campanhas/nova" className={buttonPrimary}>
          Nova campanha
        </Link>
      </header>

      {salvo === "1" && (
        <p role="status" className="bg-sand-200 rounded-(--radius-control) p-3">
          Campanha criada. Ela começa desligada até você ligar.
        </p>
      )}

      {campaigns.length === 0 ? (
        <p className="text-ink-600">Nenhuma campanha cadastrada.</p>
      ) : (
        <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
          {campaigns.map((c) => {
            const period = [fmt(c.starts_on), fmt(c.ends_on)]
              .filter(Boolean)
              .join(" a ");
            return (
              <li
                key={c.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/campanhas/${c.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={c.is_active ? "ok" : "muted"}>
                      {c.is_active ? "Ligada" : "Desligada"}
                    </Badge>
                    {period && (
                      <span className="text-ink-600 text-xs">{period}</span>
                    )}
                    {c.order_deadline && (
                      <span className="text-ink-600 text-xs">
                        · pedidos até {fmt(c.order_deadline)}
                      </span>
                    )}
                    <span className="text-ink-600 text-xs">
                      · {c.product_count} produto(s)
                    </span>
                  </div>
                </div>
                <ActionButton
                  action={setCampaignActive.bind(null, c.id, !c.is_active)}
                  label={c.is_active ? "Desligar" : "Ligar"}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
