import type { Metadata } from "next";
import Link from "next/link";
import { CampaignForm } from "@/components/admin/catalogo/campaign-form";
import { AdminPage } from "@/components/admin/page-shell";

export const metadata: Metadata = { title: "Nova campanha" };

export default function NovaCampanhaPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <section className="flex max-w-2xl flex-col gap-6">
        <Link
          href="/admin/campanhas"
          className="text-ink-600 text-sm underline"
        >
          ← Campanhas
        </Link>
        <h1 className="text-3xl">Nova campanha</h1>
        <CampaignForm />
      </section>
    </AdminPage>
  );
}
