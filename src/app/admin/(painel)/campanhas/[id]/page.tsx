import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CampaignForm } from "@/components/admin/catalogo/campaign-form";
import { AdminPage } from "@/components/admin/page-shell";
import { listCampaigns } from "@/modules/catalogo/admin-queries";

export const metadata: Metadata = { title: "Editar campanha" };

export default function EditarCampanhaPage({
  params,
}: PageProps<"/admin/campanhas/[id]">) {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <EditCampaign params={params} />
    </AdminPage>
  );
}

async function EditCampaign({
  params,
}: Pick<PageProps<"/admin/campanhas/[id]">, "params">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const campaign = (await listCampaigns()).find((c) => c.id === id);
  if (!campaign) notFound();
  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <Link href="/admin/campanhas" className="text-ink-600 text-sm underline">
        ← Campanhas
      </Link>
      <h1 className="text-3xl">{campaign.name}</h1>
      <CampaignForm key={id} campaign={campaign} />
    </section>
  );
}
