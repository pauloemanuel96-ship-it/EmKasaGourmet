import { describe, expect, it } from "vitest";
import { summarizeFit } from "@/modules/familia/schemas";

describe("selo da casa na vitrine", () => {
  it("sem problema não há selo de alerta", () => {
    expect(summarizeFit([])).toBeNull();
  });
  it("mostra o pior caso e só os nomes de quem está nele", () => {
    expect(
      summarizeFit([
        { memberName: "Maria", verdict: "diet" },
        { memberName: "Léo", verdict: "blocked" },
        { memberName: "Ana", verdict: "unknown" },
        { memberName: "Bia", verdict: "blocked" },
      ]),
    ).toEqual({ verdict: "blocked", names: ["Léo", "Bia"] });
  });
  it("ficha em revisão pesa mais que dieta não confirmada", () => {
    expect(
      summarizeFit([
        { memberName: "Maria", verdict: "diet" },
        { memberName: "Ana", verdict: "unknown" },
      ])?.verdict,
    ).toBe("unknown");
  });
});
