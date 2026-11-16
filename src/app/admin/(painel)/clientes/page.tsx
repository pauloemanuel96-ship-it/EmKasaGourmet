import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/page-shell";
import { listCustomers } from "@/modules/conta/queries";

export const metadata: Metadata = { title: "Clientes" };

const when = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function CustomersPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <CustomerList />
    </AdminPage>
  );
}

async function CustomerList() {
  const customers = await listCustomers();
  const optedIn = customers.filter((c) => c.marketing_consent).length;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl">Clientes</h1>
        <p className="text-ink-600">
          Quem criou conta na loja. Cada pessoa cuida dos próprios dados e
          endereços na Minha Casa.
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          ["Contas criadas", customers.length],
          ["Aceitam receber ofertas", optedIn],
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

      {customers.length === 0 ? (
        <p className="text-ink-600">
          Ninguém criou conta ainda. O cadastro fica em “Minha Casa”, na loja.
        </p>
      ) : (
        <ul className="border-sand-200 bg-paper divide-sand-200 divide-y rounded-(--radius-media) border">
          {customers.map((c) => {
            const main =
              c.addresses.find((a) => a.is_default) ?? c.addresses[0];
            return (
              <li key={c.id} className="flex flex-col gap-1 px-4 py-3">
                <p className="text-forest-900 font-medium">{c.name}</p>
                <p className="text-ink-600 text-sm break-all">
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
                <p className="text-ink-600 text-xs">
                  Desde {when.format(new Date(c.created_at))} ·{" "}
                  {c.addresses.length === 0
                    ? "sem endereço"
                    : `${c.addresses.length} endereço${c.addresses.length > 1 ? "s" : ""}${main ? ` (${main.city}/${main.state})` : ""}`}
                  {c.marketing_consent ? " · aceita ofertas" : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
