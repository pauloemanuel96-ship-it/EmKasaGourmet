/** Modo escuro opcional: o padrão é claro; a escolha fica só neste aparelho. */
export const THEME_KEY = "emkasa-theme";
export type Theme = "light" | "dark";

/**
 * Roda no <head>, antes da primeira pintura, para a página não piscar clara
 * quando a pessoa escolheu o modo escuro. Texto fixo, sem dado externo.
 */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="dark"){document.documentElement.dataset.theme="dark"}}catch(e){}`;
