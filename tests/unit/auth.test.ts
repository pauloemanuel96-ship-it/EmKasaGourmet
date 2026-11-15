import { describe, expect, it } from "vitest";
import { loginSchema } from "@/modules/auth/schemas";
import { siteUrl } from "@/lib/site";

describe("loginSchema", () => {
  it("normaliza o e-mail", () => {
    expect(loginSchema.parse({ email: "  Chef@Emkasa.COM " }).email).toBe(
      "chef@emkasa.com",
    );
  });

  it("recusa e-mail inválido com mensagem em português", () => {
    const r = loginSchema.safeParse({ email: "chef" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("Informe um e-mail válido.");
  });
});

describe("siteUrl", () => {
  it("remove a barra final", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://emkasa.com.br/";
    expect(siteUrl()).toBe("https://emkasa.com.br");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
