import { describe, expect, it } from "vitest";
import {
  addressSchema,
  formatCep,
  safeNext,
  signUpSchema,
} from "@/modules/conta/schemas";

describe("cadastro de conta", () => {
  const ok = {
    name: " Ana ",
    email: " Ana@Exemplo.com ",
    password: "segredo123",
    phone: "(79) 99999-0000",
    marketing: false,
  };
  it("limpa nome, e-mail e celular", () => {
    expect(signUpSchema.parse(ok)).toMatchObject({
      name: "Ana",
      email: "ana@exemplo.com",
      phone: "79999990000",
    });
  });
  it("celular vazio vira nulo; senha curta é recusada", () => {
    expect(signUpSchema.parse({ ...ok, phone: "" }).phone).toBeNull();
    expect(signUpSchema.safeParse({ ...ok, password: "1234567" }).success).toBe(
      false,
    );
  });
});

describe("endereço", () => {
  const ok = {
    label: "Casa da mãe",
    recipient: "",
    cep: "49000-000",
    street: "Rua A",
    number: "10",
    complement: "",
    district: "Centro",
    city: "Aracaju",
    state: "se",
    reference: "",
    isDefault: false,
  };
  it("normaliza CEP e estado e esvazia opcionais", () => {
    expect(addressSchema.parse(ok)).toMatchObject({
      cep: "49000000",
      state: "SE",
      recipient: null,
      complement: null,
    });
  });
  it("recusa CEP incompleto e estado que não existe", () => {
    expect(addressSchema.safeParse({ ...ok, cep: "4900" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...ok, state: "XX" }).success).toBe(false);
  });
  it("mostra o CEP com traço", () => {
    expect(formatCep("49000000")).toBe("49000-000");
  });
});

describe("destino depois do link do e-mail", () => {
  it("só aceita páginas da área do cliente", () => {
    expect(safeNext("/minha-casa/senha")).toBe("/minha-casa/senha");
    expect(safeNext("https://golpe.com")).toBe("/minha-casa");
    expect(safeNext("/minha-casa//golpe.com")).toBe("/minha-casa");
    expect(safeNext("/admin")).toBe("/minha-casa");
    expect(safeNext(null)).toBe("/minha-casa");
  });
});
