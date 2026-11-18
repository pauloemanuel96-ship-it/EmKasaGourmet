"use client";

import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readConsent } from "@/modules/consent/cookies";
import { captureLead, type LeadState } from "@/modules/leads/actions";
import { rememberOrigin } from "@/modules/leads/origin";
import { track } from "@/modules/trafego/tracker";
import {
  LEAD_CONSENT_TEXT,
  LEAD_POPUP_COPY,
  leadPopupMode,
  type LeadPopupMode,
} from "@/modules/leads/popup-config";

const KEY = "emkasa:ofertas";
const SNOOZE_DAYS = 7;
const IDLE: LeadState = { status: "idle" };
/** Onde o aviso não aparece, para não atrapalhar a compra. */
const QUIET = ["/carrinho", "/checkout", "/pedido"];

function shouldOffer() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "feito") return false;
    if (saved && Date.now() - Number(saved) < SNOOZE_DAYS * 86_400_000)
      return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * Aviso de ofertas (D-037): Black Friday até 30/11, depois "descontos e
 * promoções". Aparece uma vez, alguns segundos depois de a pessoa chegar ou
 * quando ela rola a página. Fechar adia por uma semana; cadastrar encerra.
 */
export function LeadPopup() {
  const pathname = usePathname();
  const [mode, setMode] = useState<LeadPopupMode | null>(null);
  const [origin, setOrigin] = useState("{}");
  const [state, action, pending] = useActionState(captureLead, IDLE);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const quiet = QUIET.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const o = rememberOrigin();
    if (quiet || !shouldOffer()) return;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOrigin(JSON.stringify(o));
      setMode(leadPopupMode(new Date()));
    };
    // Só depois da escolha de cookies (D-045): os dois avisos nunca aparecem
    // juntos. Quem acabou de escolher ganha alguns segundos de respiro.
    let decided = readConsent() !== null;
    let timer = decided ? window.setTimeout(show, 9000) : 0;
    const onConsent = () => {
      if (decided) return;
      decided = true;
      timer = window.setTimeout(show, 6000);
    };
    const onScroll = () => {
      if (!decided) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.35) show();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener("scroll", onScroll);
    };
  }, [quiet]);

  useEffect(() => {
    if (state.status !== "ok") return;
    track("lead");
    try {
      localStorage.setItem(KEY, "feito");
    } catch {
      // sem armazenamento: só não lembra
    }
  }, [state.status]);

  useEffect(() => {
    if (!mode) return;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  function close() {
    try {
      if (localStorage.getItem(KEY) !== "feito")
        localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // segue sem lembrar
    }
    setMode(null);
  }

  // Leve inclinação 3D acompanhando o ponteiro.
  function tilt(e: React.PointerEvent) {
    const el = cardRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${(x * 4).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg)`;
  }

  if (!mode || quiet) return null;
  const copy = LEAD_POPUP_COPY[mode];
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const field =
    "min-h-12 w-full rounded-(--radius-control) border border-[#faf6ee]/25 bg-[#faf6ee]/8 px-4 text-[#faf6ee] placeholder:text-[#faf6ee]/50 focus:border-[#fed216] focus:outline-none";

  return (
    <div
      className="lead-pop fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#040a06]/75 p-4 backdrop-blur-sm"
      style={{ perspective: "1200px" }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ofertas-titulo"
        onPointerMove={tilt}
        onPointerLeave={() => {
          if (cardRef.current) cardRef.current.style.transform = "";
        }}
        className="lead-card relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#faf6ee]/15 text-[#faf6ee] shadow-2xl transition-transform duration-200 ease-out"
        style={{
          background:
            mode === "black-friday"
              ? "radial-gradient(120% 90% at 100% 0%, #5a2a06 0%, #1b1408 40%, #08130d 100%)"
              : "radial-gradient(120% 90% at 100% 0%, #24402f 0%, #152519 45%, #08130d 100%)",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full text-2xl leading-none text-[#faf6ee]/80 hover:bg-[#faf6ee]/10"
        >
          ×
        </button>

        <div className="relative px-6 pt-9 pb-2 sm:px-8">
          <span
            aria-hidden="true"
            className="lead-glow absolute -top-16 -right-10 size-48 rounded-full blur-3xl"
            style={{
              background: mode === "black-friday" ? "#f9630e" : "#8fd14f",
            }}
          />
          <p className="relative text-xs font-semibold tracking-widest text-[#fed216] uppercase">
            {copy.eyebrow}
          </p>
          <h2
            id="ofertas-titulo"
            className="relative mt-2 text-3xl leading-tight text-[#faf6ee] sm:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="relative mt-3 text-[#faf6ee]/80">{copy.text}</p>
        </div>

        {state.status === "ok" ? (
          <div className="flex flex-col gap-4 px-6 pt-4 pb-8 sm:px-8">
            <p role="status" className="text-lg text-[#faf6ee]">
              Cadastro feito. Você vai saber das ofertas antes de todo mundo.
            </p>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="min-h-12 rounded-full bg-[#faf6ee] px-6 font-semibold text-[#12200f]"
            >
              Continuar na loja
            </button>
          </div>
        ) : (
          <form
            action={action}
            className="flex flex-col gap-3 px-6 pt-4 pb-7 sm:px-8"
          >
            <input type="hidden" name="campaign" value={mode} />
            <input type="hidden" name="origin" value={origin} />
            {/* campo-isca para robôs: escondido de pessoas e leitores de tela */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <div>
              <label htmlFor="lead-name" className="sr-only">
                Seu nome
              </label>
              <input
                ref={firstRef}
                id="lead-name"
                name="name"
                required
                autoComplete="name"
                placeholder="Seu nome"
                aria-invalid={Boolean(errors.name)}
                className={field}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-[#ffb4a8]">{errors.name[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="lead-email" className="sr-only">
                Seu e-mail
              </label>
              <input
                id="lead-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Seu e-mail"
                aria-invalid={Boolean(errors.email)}
                className={field}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-[#ffb4a8]">{errors.email[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="lead-phone" className="sr-only">
                Seu WhatsApp com DDD
              </label>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="Seu WhatsApp com DDD (opcional)"
                aria-invalid={Boolean(errors.phone)}
                className={field}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-[#ffb4a8]">{errors.phone[0]}</p>
              )}
            </div>
            <label className="mt-1 flex items-start gap-3 text-sm text-[#faf6ee]/85">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-0.5 size-5 shrink-0 accent-[#fed216]"
              />
              <span>{LEAD_CONSENT_TEXT}</span>
            </label>
            {errors.consent && (
              <p className="text-sm text-[#ffb4a8]">{errors.consent[0]}</p>
            )}
            {state.status === "error" && !state.fieldErrors && (
              <p role="alert" className="text-sm text-[#ffb4a8]">
                {state.message}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 min-h-12 rounded-full bg-[#f9630e] px-6 font-semibold text-[#1c1206] transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Enviando…" : copy.button}
            </button>
            <button
              type="button"
              onClick={close}
              className="min-h-10 text-sm text-[#faf6ee]/65 underline underline-offset-4"
            >
              Agora não
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
