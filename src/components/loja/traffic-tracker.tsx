"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CONSENT_EVENT } from "@/modules/consent/cookies";
import { track } from "@/modules/trafego/tracker";

/** Conta a página vista (só com permissão de medição, D-047). */
export function TrafficTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("view", { path: pathname });
  }, [pathname]);
  // Quem acabou de permitir medição: a página atual também conta.
  useEffect(() => {
    let counted = false;
    const onConsent = () => {
      if (counted) return;
      counted = true;
      track("view");
    };
    addEventListener(CONSENT_EVENT, onConsent);
    return () => removeEventListener(CONSENT_EVENT, onConsent);
  }, []);
  return null;
}
