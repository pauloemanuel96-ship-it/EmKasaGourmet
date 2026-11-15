import { describe, expect, it } from "vitest";
import { formatCents } from "@/lib/money";

// Intl usa espaço não separável entre "R$" e o número.
const normalize = (s: string) => s.replace(/ /g, " ");

describe("formatCents", () => {
  it("formata centavos em reais", () => {
    expect(normalize(formatCents(2590))).toBe("R$ 25,90");
    expect(normalize(formatCents(0))).toBe("R$ 0,00");
    expect(normalize(formatCents(123456))).toBe("R$ 1.234,56");
  });

  it("recusa valor não inteiro", () => {
    expect(() => formatCents(25.9)).toThrow(TypeError);
  });
});
