import { describe, expect, it } from "vitest";
import {
  ageFrom,
  hasHealthData,
  memberSchema,
  parseList,
} from "@/modules/familia/schemas";

const ok = {
  name: " Léo ",
  relation: "filho",
  birthYear: "2018",
  diet: "sem_restricao",
  allergies: [],
  likes: "banana, abóbora,banana ,, ",
  dislikes: "",
  goal: "",
};

describe("pessoa da casa", () => {
  it("limpa textos e transforma listas", () => {
    expect(memberSchema.parse(ok)).toMatchObject({
      name: "Léo",
      birthYear: 2018,
      likes: ["banana", "abóbora"],
      dislikes: [],
      goal: null,
    });
  });
  it("ano de nascimento é opcional, mas tem de ser um ano de verdade", () => {
    expect(memberSchema.parse({ ...ok, birthYear: "" }).birthYear).toBeNull();
    expect(memberSchema.safeParse({ ...ok, birthYear: "18" }).success).toBe(
      false,
    );
    expect(memberSchema.safeParse({ ...ok, birthYear: "2999" }).success).toBe(
      false,
    );
  });
  it("recusa dieta fora da lista e código de alergênico estranho", () => {
    expect(memberSchema.safeParse({ ...ok, diet: "carnivora" }).success).toBe(
      false,
    );
    expect(
      memberSchema.safeParse({ ...ok, allergies: ["DROP TABLE"] }).success,
    ).toBe(false);
  });
  it("sabe quando há dado de saúde", () => {
    const base = memberSchema.parse(ok);
    expect(hasHealthData(base)).toBe(false);
    expect(hasHealthData({ ...base, allergies: ["leite"] })).toBe(true);
    expect(hasHealthData({ ...base, diet: "vegano" })).toBe(true);
    expect(hasHealthData({ ...base, goal: "menos açúcar" })).toBe(true);
  });
  it("corta listas longas e itens grandes", () => {
    expect(
      parseList(Array.from({ length: 30 }, (_, i) => `item ${i}`).join(",")),
    ).toHaveLength(20);
    expect(parseList("x".repeat(80))[0]).toHaveLength(40);
  });
  it("calcula a idade pelo ano", () => {
    expect(ageFrom(2018, new Date("2026-11-16"))).toBe(8);
    expect(ageFrom(null)).toBeNull();
  });
});
