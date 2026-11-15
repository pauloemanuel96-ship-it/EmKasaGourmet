"use client";

import { useEffect } from "react";

/** Registra o service worker (só em produção; em dev ele atrapalha o hot reload). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem service worker o site funciona igual, só não abre offline.
    });
  }, []);
  return null;
}
