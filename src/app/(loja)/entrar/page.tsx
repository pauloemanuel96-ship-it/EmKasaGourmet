import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForms } from "@/components/loja/conta/auth-forms";
import { getCustomerAccount } from "@/modules/conta/queries";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

/** Quem já está logado não precisa ver esta tela. */
async function Forms({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; erro?: string }>;
}) {
  const [account, params] = await Promise.all([
    getCustomerAccount(),
    searchParams,
  ]);
  if (account) redirect("/minha-casa");
  return (
    <>
      {params.erro === "link" && (
        <p role="alert" className="text-terracotta-500 mb-4 text-sm">
          Esse link expirou ou já foi usado. Entre com a sua senha ou peça um
          link novo em “Esqueci a senha”.
        </p>
      )}
      <AuthForms initial={params.criar ? "criar" : "entrar"} />
    </>
  );
}

export default function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ criar?: string; erro?: string }>;
}) {
  return (
    <main className="mx-auto max-w-md px-4 pt-10 sm:px-6">
      <p className="text-leaf-700 text-xs font-medium tracking-widest uppercase">
        Minha Casa Emkasa
      </p>
      <h1 className="mb-6 text-4xl">Sua conta</h1>
      <Suspense
        fallback={
          <div className="bg-sand-200/60 h-80 rounded-(--radius-media)" />
        }
      >
        <Forms searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
