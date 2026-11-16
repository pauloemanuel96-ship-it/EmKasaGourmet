import { getCurrentUser } from "@/modules/auth/staff";
import { listLeads } from "@/modules/leads/queries";
import { originLabel } from "@/modules/leads/schemas";

/** Planilha dos contatos (CSV). Só owner e admin; o RLS confere de novo. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return new Response("Sem permissão.", { status: 403 });
  }
  const leads = await listLeads(5000);
  // Aspas dobradas e apóstrofo na frente de fórmulas: a planilha não executa nada.
  const cell = (v: string | null | undefined) => {
    let s = v ?? "";
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = [
    "data",
    "nome",
    "email",
    "whatsapp",
    "chamada",
    "origem",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "pagina_de_entrada",
  ];
  const rows = leads.map((l) =>
    [
      l.created_at,
      l.name,
      l.email,
      l.phone,
      l.campaign,
      originLabel(l),
      l.utm_source,
      l.utm_medium,
      l.utm_campaign,
      l.landing_path,
    ]
      .map(cell)
      .join(";"),
  );
  return new Response(`﻿${head.join(";")}\n${rows.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contatos-emkasa.csv"',
      "Cache-Control": "no-store",
    },
  });
}
