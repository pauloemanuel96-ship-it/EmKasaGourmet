import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/page-shell";
import {
  DailyChart,
  Devices,
  Funnel,
  Kpis,
  Pages,
  PeriodPicker,
  Products,
  Recent,
  Sources,
} from "@/components/admin/trafego/radar";
import { getTrafficReport, toPeriod } from "@/modules/trafego/queries";

export const metadata: Metadata = {
  title: "Tráfego",
  robots: { index: false, follow: false },
};

export default function TrafegoPage({
  searchParams,
}: PageProps<"/admin/trafego">) {
  return (
    <AdminPage roles={["owner"]}>
      <Radar searchParams={searchParams} />
    </AdminPage>
  );
}

async function Radar({
  searchParams,
}: {
  searchParams: PageProps<"/admin/trafego">["searchParams"];
}) {
  const days = toPeriod((await searchParams).dias);
  const report = await getTrafficReport(days);

  return (
    <div className="radar -mx-4 flex min-w-0 flex-col gap-4 overflow-hidden rounded-(--radius-media) px-4 py-6 sm:mx-0 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-[#fed216] uppercase">
            Painel master
          </p>
          <h1 className="text-3xl text-[#f4f9ef]">Radar da loja</h1>
          <p className="max-w-xl text-sm text-[#e9f3e1]/65">
            Quem visitou, de onde veio, até onde chegou e onde desistiu. Conta
            só quem permitiu medição no aviso de cookies; não guardamos IP.
          </p>
        </div>
        <PeriodPicker current={days} />
      </header>

      {!report ? (
        <p className="rounded-(--radius-media) border border-[#f9630e]/40 p-4 text-sm text-[#e9f3e1]">
          Não foi possível carregar o relatório. Confira se a atualização do
          banco (migration 0012) foi aplicada.
        </p>
      ) : report.totals.sessions === 0 ? (
        <p className="radar-panel rounded-(--radius-media) border border-[#8fd14f]/15 p-6 text-[#e9f3e1]/80">
          Nenhuma visita registrada neste período ainda. Os números aparecem
          conforme as pessoas aceitam “Medição” no aviso de cookies da loja.
        </p>
      ) : (
        <>
          <Kpis r={report} />
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <DailyChart r={report} />
            <Funnel r={report} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Sources r={report} />
            <div className="flex min-w-0 flex-col gap-4">
              <Devices r={report} />
              <Products r={report} />
            </div>
          </div>
          <Pages r={report} />
          <Recent r={report} />
          <p className="text-xs text-[#e9f3e1]/50">
            Pedidos ainda são de demonstração: o funil de compra fica completo
            quando o carrinho e o pagamento de verdade entrarem. Visitas da
            equipe navegando na loja também contam.
          </p>
        </>
      )}
    </div>
  );
}
