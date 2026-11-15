import { Suspense } from "react";
import { DemoBanner } from "@/components/loja/demo-banner";
import { SiteFooter } from "@/components/loja/site-footer";
import { SiteHeader } from "@/components/loja/site-header";

export default function LojaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DemoBanner />
      <Suspense
        fallback={<div className="border-sand-200 h-[68px] border-b" />}
      >
        <SiteHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
