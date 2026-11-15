import type { Metadata } from "next";
import { WhatsappForm } from "@/components/admin/catalogo/whatsapp-form";
import { AdminPage } from "@/components/admin/page-shell";
import { getWhatsappSetting } from "@/modules/catalogo/admin-queries";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <AdminPage roles={["owner", "admin"]}>
      <Settings />
    </AdminPage>
  );
}

async function Settings() {
  const whatsapp = await getWhatsappSetting();
  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl">Configurações</h1>
      <div className="border-sand-200 bg-paper rounded-(--radius-media) border p-4 sm:p-5">
        <WhatsappForm current={whatsapp} />
      </div>
    </section>
  );
}
