"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONSENT_GROUPS,
  CONSENT_OPEN_EVENT,
  openConsentPreferences,
  readConsent,
  saveConsent,
  type ConsentChoice,
} from "@/modules/consent/cookies";

/** Espera a tela de carregamento sair antes de aparecer. */
const DELAY_MS = 1500;

/**
 * Aviso de cookies (D-045). Fica embaixo, acima da barra do celular, sem
 * bloquear a página. "Só os necessários" tem o mesmo peso de "Aceitar todos".
 * O aviso de ofertas só aparece depois desta escolha, para os dois nunca
 * se sobreporem. O link "Preferências de cookies" do rodapé reabre o painel.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice>({
    measurement: false,
    ads: false,
  });
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const timer = readConsent()
      ? undefined
      : window.setTimeout(() => setOpen(true), DELAY_MS);
    const reopen = () => {
      const saved = readConsent();
      setChoice({
        measurement: saved?.measurement ?? false,
        ads: saved?.ads ?? false,
      });
      setDetails(true);
      setOpen(true);
      requestAnimationFrame(() => titleRef.current?.focus());
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    };
  }, []);

  function decide(next: ConsentChoice) {
    saveConsent(next);
    setOpen(false);
    setDetails(false);
  }

  if (!open) return null;

  const btn =
    "min-h-11 flex-1 rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-transform active:scale-[0.97]";

  return (
    <section
      aria-labelledby="cookies-titulo"
      className="cookie-card fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl overflow-hidden rounded-3xl border border-[#faf6ee]/15 text-[#faf6ee] shadow-2xl md:inset-x-auto md:bottom-5 md:left-5"
      style={{
        background:
          "radial-gradient(120% 120% at 0% 0%, #2c4a37 0%, #16271b 55%, #0b150e 100%)",
      }}
    >
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <p
          id="cookies-titulo"
          ref={titleRef}
          tabIndex={-1}
          className="font-serif text-xl text-[#faf6ee] outline-none"
        >
          Cookies, do seu jeito
        </p>
        <p className="text-sm text-[#faf6ee]/80">
          Usamos o necessário para a loja funcionar. Medição e anúncios só com a
          sua permissão, e você muda isso quando quiser no rodapé.
        </p>

        {details && (
          <ul className="flex flex-col gap-2">
            {CONSENT_GROUPS.map((g) => {
              const fixed = g.key === "necessary";
              const on = fixed ? true : choice[g.key];
              return (
                <li
                  key={g.key}
                  className="flex items-start justify-between gap-4 rounded-2xl bg-[#faf6ee]/6 p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      id={`cookie-${g.key}`}
                      className="text-sm font-semibold"
                    >
                      {g.title}
                    </span>
                    <span className="text-xs text-[#faf6ee]/70">{g.text}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby={`cookie-${g.key}`}
                    aria-disabled={fixed}
                    disabled={fixed}
                    onClick={() => {
                      if (fixed) return;
                      setChoice((c) => ({ ...c, [g.key]: !c[g.key] }));
                    }}
                    className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-[#9cc46b]" : "bg-[#faf6ee]/25"} ${fixed ? "opacity-60" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-1 left-1 size-5 rounded-full bg-[#faf6ee] shadow transition-transform duration-200 ${on ? "translate-x-5" : ""}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {details ? (
            <button
              type="button"
              onClick={() => decide(choice)}
              className={`${btn} bg-[#fed216] text-[#1c1206]`}
            >
              Salvar minha escolha
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => decide({ measurement: true, ads: true })}
                className={`${btn} bg-[#fed216] text-[#1c1206]`}
              >
                Aceitar todos
              </button>
              <button
                type="button"
                onClick={() => decide({ measurement: false, ads: false })}
                className={`${btn} bg-[#faf6ee] text-[#16271b]`}
              >
                Só os necessários
              </button>
            </>
          )}
        </div>
        {!details && (
          <button
            type="button"
            onClick={() => setDetails(true)}
            className="min-h-11 self-start text-sm font-medium text-[#faf6ee]/85 underline underline-offset-4"
          >
            Escolher o que permitir
          </button>
        )}
      </div>
    </section>
  );
}

/** Link do rodapé que reabre as preferências. */
export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="text-ink-600 hover:text-forest-900 text-left"
    >
      Preferências de cookies
    </button>
  );
}
