import { Suspense } from "react";
import { BottomNav } from "@/components/loja/bottom-nav";
import { DemoBanner } from "@/components/loja/demo-banner";
import { SiteFooter } from "@/components/loja/site-footer";
import { SiteHeader } from "@/components/loja/site-header";
import { SplashScreen } from "@/components/loja/splash-screen";

export default function LojaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SplashScreen />
      <Suspense fallback={<div className="bg-forest-900 h-8" />}>
        <DemoBanner />
      </Suspense>
      <Suspense
        fallback={<div className="border-sand-200 h-[68px] border-b" />}
      >
        <SiteHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <SiteFooter />
      {/* Espaço para a barra inferior não cobrir o fim da página no celular. */}
      <div aria-hidden="true" className="pb-safe h-16 md:hidden" />
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
