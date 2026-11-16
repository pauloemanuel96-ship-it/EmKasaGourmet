/**
 * Aviso de ofertas da loja (D-037). Até o fim da Black Friday ele fala da
 * campanha; depois vira o convite geral de "descontos e promoções".
 * Para mudar a data ou os textos, é só aqui.
 */

/** Último dia da Black Friday Emkasa (novembro tem 30 dias). */
export const BLACK_FRIDAY_END = "2026-11-30";

export type LeadPopupMode = "black-friday" | "geral";

/** Fim do dia no horário de Brasília (UTC-3). */
export function leadPopupMode(now: Date): LeadPopupMode {
  const end = new Date(`${BLACK_FRIDAY_END}T23:59:59-03:00`);
  return now.getTime() <= end.getTime() ? "black-friday" : "geral";
}

export const LEAD_POPUP_COPY: Record<
  LeadPopupMode,
  { eyebrow: string; title: string; text: string; button: string }
> = {
  "black-friday": {
    eyebrow: "Black Friday Emkasa",
    title: "Descontos exclusivos até 30/11",
    text: "Cadastre-se para receber os cupons e as ofertas da Black Friday em primeira mão.",
    button: "Quero meus descontos",
  },
  geral: {
    eyebrow: "Emkasa Gourmet",
    title: "Descontos e promoções",
    text: "Quer receber cupons de desconto, avisos de promoções e novidades?",
    button: "Receber",
  },
};

/** Texto exato que a pessoa aceita. Vai gravado junto com o cadastro. */
export const LEAD_CONSENT_TEXT =
  "Aceito receber ofertas e novidades da Emkasa por e-mail e WhatsApp. Posso sair quando quiser.";
