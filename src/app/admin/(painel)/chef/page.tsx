import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/page-shell";
import { ChefRequestEditor } from "@/components/admin/chef/request-editor";
import { listChefRequests } from "@/modules/chef/queries";
import {
  CHEF_STATUS,
  formatLabel,
  periodLabel,
  statusLabel,
} from "@/modules/chef/schemas";

export const metadata: Metadata = { title: "Chef Emkasa" };

const when = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const day = (iso: string) => iso.split("-").reverse().join("/");

export default function ChefAdminPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <ChefRequests />
    </AdminPage>
  );
}

async function ChefRequests() {
  const rows = await listChefRequests();
  const open = rows.filter((r) =>
    ["novo", "em_conversa", "proposta_enviada"].includes(r.status),
  );

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl">Chef Emkasa</h1>
        <p className="text-ink-600">
          Pedidos de proposta da Chef em casa. Responda pelo WhatsApp e anote
          aqui o andamento.
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Em aberto", open.length],
          ["Novos", rows.filter((r) => r.status === "novo").length],
          ["Confirmados", rows.filter((r) => r.status === "confirmado").length],
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

      {rows.length === 0 ? (
        <p className="text-ink-600">
          Nenhum pedido ainda. Eles chegam pela página{" "}
          <a href="/chef-emkasa" className="underline">
            Chef em casa
          </a>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => {
            const wa = `https://wa.me/55${r.phone.replace(/^55/, "")}?text=${encodeURIComponent(
              `Olá, ${r.name.split(" ")[0]}! Aqui é da Emkasa, sobre o seu pedido do Chef Emkasa.`,
            )}`;
            return (
              <li
                key={r.id}
                className="border-sand-200 bg-paper grid gap-4 rounded-(--radius-media) border p-5 md:grid-cols-[1.4fr_1fr]"
              >
                <div className="flex flex-col gap-2">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-forest-900 font-medium">
                      {formatLabel(r.format)}
                    </span>
                    <span className="bg-sand-200 rounded-full px-2.5 py-0.5 text-xs">
                      {statusLabel(r.status)}
                    </span>
                    <span className="text-ink-600 text-xs">
                      pedido em {when.format(new Date(r.created_at))}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong>{r.name}</strong> · {r.people}{" "}
                    {r.people === 1 ? "pessoa" : "pessoas"} · {r.neighborhood},{" "}
                    {r.city}
                    {r.desired_date && <> · {day(r.desired_date)}</>}
                    {periodLabel(r.period) && <> · {periodLabel(r.period)}</>}
                    {r.user_id && <> · tem conta no site</>}
                  </p>
                  {r.notes && (
                    <p className="text-ink-600 text-sm whitespace-pre-line">
                      {r.notes}
                    </p>
                  )}
                  {r.restrictions && (
                    <p className="border-terracotta-500 bg-terracotta-500/5 rounded-(--radius-control) border-l-4 px-3 py-2 text-sm">
                      <strong>Alergias e restrições (autorizado):</strong>{" "}
                      {r.restrictions}
                    </p>
                  )}
                  <p className="flex flex-wrap gap-4 text-sm">
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-leaf-700 font-medium underline"
                    >
                      Responder no WhatsApp
                    </a>
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="underline">
                        {r.email}
                      </a>
                    )}
                  </p>
                </div>
                <ChefRequestEditor
                  id={r.id}
                  status={r.status}
                  staffNotes={r.staff_notes}
                />
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-ink-600 text-xs">
        Andamentos: {CHEF_STATUS.map((s) => s.label).join(" → ")}. Toda mudança
        fica registrada na auditoria.
      </p>
    </section>
  );
}
