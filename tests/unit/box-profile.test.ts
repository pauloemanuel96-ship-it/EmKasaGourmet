import { describe, expect, it } from "vitest";
import {
  dislikeMatches,
  expandAllergens,
  toBoxMembers,
} from "@/modules/familia/box-profile";

const PRODUCTS = [
  { slug: "tomate", name: "Tomate italiano" },
  { slug: "banana", name: "Banana-prata" },
  { slug: "couve", name: "Couve-manteiga" },
  { slug: "rucula", name: "Rúcula" },
];

describe("expandAllergens", () => {
  it("glúten puxa trigo, centeio, cevada e aveia", () => {
    expect(expandAllergens(["gluten"])).toEqual(
      expect.arrayContaining(["gluten", "trigo", "centeio", "cevada", "aveia"]),
    );
  });
  it("trigo puxa glúten (sentido contrário)", () => {
    expect(expandAllergens(["trigo"])).toContain("gluten");
  });
  it("uma castanha puxa o grupo castanhas", () => {
    expect(expandAllergens(["nozes"])).toContain("castanhas");
  });
  it("alergênico sem grupo fica sozinho", () => {
    expect(expandAllergens(["ovos"])).toEqual(["ovos"]);
  });
});

describe("dislikeMatches", () => {
  it("ignora acento, maiúscula, hífen e plural", () => {
    expect(dislikeMatches("tomates", "Tomate italiano")).toBe(true);
    expect(dislikeMatches("RUCULA", "Rúcula")).toBe(true);
    expect(dislikeMatches("banana prata", "Banana-prata")).toBe(true);
    expect(dislikeMatches("couves", "Couve-manteiga")).toBe(true);
  });
  it("não casa palavra pela metade nem texto vazio", () => {
    expect(dislikeMatches("tom", "Tomate italiano")).toBe(false);
    expect(dislikeMatches("  ", "Tomate italiano")).toBe(false);
    expect(dislikeMatches("banana nanica", "Banana-prata")).toBe(false);
  });
});

describe("toBoxMembers", () => {
  it("converte a pessoa da conta para o formato do BOX", () => {
    const [m] = toBoxMembers(
      [
        {
          id: "1",
          name: "Lia",
          diet: "vegano",
          allergies: ["trigo", "peixes"],
          dislikes: ["banana", "jiló"],
        },
      ],
      PRODUCTS,
    );
    expect(m.nickname).toBe("Lia");
    expect(m.diet).toBe("vegano");
    // trigo puxa glúten; peixes não existe nos itens do BOX.
    expect(m.allergies.sort()).toEqual(["gluten", "trigo"]);
    expect(m.dislikes).toEqual(["banana"]);
  });
});
