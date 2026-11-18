import { describe, expect, it } from "vitest";
import { chefRequestSchema } from "@/modules/chef/schemas";

const base = {
  format: "ocasiao",
  desiredDate: "",
  period: "jantar",
  neighborhood: "Jardins",
  people: "4",
  notes: "",
  restrictions: "",
  healthConsent: false,
  name: "Maria Souza",
  phone: "(79) 99999-0000",
  email: "",
};

describe("pedido do Chef Emkasa", () => {
  it("aceita o pedido mínimo e limpa telefone e campos vazios", () => {
    const r = chefRequestSchema.parse(base);
    expect(r.phone).toBe("79999990000");
    expect(r.people).toBe(4);
    expect(r.desiredDate).toBeNull();
    expect(r.restrictions).toBeNull();
    expect(r.email).toBeNull();
  });

  it("restrição de saúde exige autorização", () => {
    const r = chefRequestSchema.safeParse({
      ...base,
      restrictions: "Sem glúten",
    });
    expect(r.success).toBe(false);
    expect(
      chefRequestSchema.safeParse({
        ...base,
        restrictions: "Sem glúten",
        healthConsent: true,
      }).success,
    ).toBe(true);
  });

  it("recusa formato inventado, telefone sem DDD e mais de 40 pessoas", () => {
    expect(
      chefRequestSchema.safeParse({ ...base, format: "buffet" }).success,
    ).toBe(false);
    expect(
      chefRequestSchema.safeParse({ ...base, phone: "9999-0000" }).success,
    ).toBe(false);
    expect(chefRequestSchema.safeParse({ ...base, people: "41" }).success).toBe(
      false,
    );
  });
});
