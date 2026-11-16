import type { Metadata } from "next";
import { Suspense } from "react";
import { BoxBuilder } from "@/components/loja/box-builder";
import { BoxStage } from "@/components/loja/home-stage/home-stage";
import { SITE_PHOTOS } from "@/modules/catalogo/static-photos";
import { getBoxHousehold } from "@/modules/familia/queries";

export const metadata: Metadata = { title: "Monte seu BOX" };

/** Com login, o BOX usa a família da Minha Casa (D-046). */
async function BoxForAccount() {
  const account = await getBoxHousehold();
  return <BoxBuilder account={account} />;
}

export default function BoxPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-10">
      <BoxStage photo={SITE_PHOTOS.saladaNoPote1}>
        <p className="text-xs font-semibold tracking-widest text-[#fed216] uppercase">
          Emkasa BOX
        </p>
        <h1 id="box-titulo" className="text-4xl text-[#faf6ee] sm:text-5xl">
          Uma cesta do tamanho da sua casa
        </h1>
        <p className="max-w-md text-[#faf6ee]/80 sm:text-lg">
          Frutas, verduras e ervas da semana, escolhidas para quem mora com
          você.
        </p>
      </BoxStage>
      <div className="pt-10">
        <Suspense
          fallback={
            <div className="bg-sand-200/60 h-64 animate-pulse rounded-(--radius-media)" />
          }
        >
          <BoxForAccount />
        </Suspense>
      </div>
    </main>
  );
}
