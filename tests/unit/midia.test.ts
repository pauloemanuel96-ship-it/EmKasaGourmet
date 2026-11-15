import { describe, expect, it } from "vitest";
import { findUrl, toRawImageUrl } from "@/modules/midia/links";
import { matchProduct, parseFileName } from "@/modules/midia/matching";
import { mediaPath } from "@/modules/midia/paths";

const P = (name: string, slug: string) => ({ id: slug, name, slug });
const products = [
  P("Farofa Nutritiva de Soja", "farofa-nutritiva-de-soja"),
  P("Blend Vegano", "blend-vegano"),
  P("Almôndegas", "almondegas"),
  P("Patê", "pate"),
  P("Pão integral", "pao-integral"),
  P("Quiche de soja", "quiche-de-soja"),
  P("Muqueca de grão-de-bico", "muqueca-de-grao-de-bico"),
  P("Salada Margarita", "salada-margarita"),
  P("Salada no pote", "salada-no-pote"),
  P("Tomate recheado vegetariano", "tomate-recheado-vegetariano"),
];

function pick(file: string) {
  const { base, index } = parseFileName(file);
  const r = matchProduct(base, products, index);
  return r.status === "exato" || r.status === "provavel"
    ? { status: r.status, slug: r.product.slug, index }
    : { status: r.status, index };
}

describe("nome do arquivo → produto", () => {
  it.each([
    ["Almondega_OK.jpg", "almondegas"],
    ["Pate.jpg", "pate"],
    ["Pão_integral_2.jpg", "pao-integral"],
    ["emkasa_quiche de soja 1.jpg", "quiche-de-soja"],
    ["emkasa_muqueca de grao de bico 2.jpg", "muqueca-de-grao-de-bico"],
    ["emkasa_tomate recheado vegetariano 2.jpg", "tomate-recheado-vegetariano"],
    ["farofa-nutritiva-de-soja.webp", "farofa-nutritiva-de-soja"],
    ["Frente_Farofa.jpeg", "farofa-nutritiva-de-soja"],
  ])("%s → %s", (file, slug) => {
    expect(pick(file)).toMatchObject({ slug });
  });

  it("dúvida não vira escolha: 'salada' sozinha é ambígua", () => {
    expect(pick("salada.jpg").status).toBe("ambiguo");
  });

  it("nada parecido não escolhe nada", () => {
    expect(pick("IMG_4432.jpg").status).toBe("nenhum");
  });

  it("número no fim vira a ordem da foto", () => {
    expect(parseFileName("Pão_integral_2.jpg")).toEqual({
      base: "pao integral",
      index: 2,
    });
  });

  it("frase do assistente: 'foto da farofa'", () => {
    const r = matchProduct("foto da farofa", products);
    expect(r.status === "provavel" || r.status === "exato").toBe(true);
    if (r.status === "provavel" || r.status === "exato")
      expect(r.product.slug).toBe("farofa-nutritiva-de-soja");
  });
});

describe("links do GitHub", () => {
  it("página do arquivo vira link raw", () => {
    expect(
      toRawImageUrl(
        "https://github.com/emkasagourmet-code/Emkasa-Gourmet/blob/main/_MG_6765.jpg",
      )?.href,
    ).toBe(
      "https://raw.githubusercontent.com/emkasagourmet-code/Emkasa-Gourmet/main/_MG_6765.jpg",
    );
  });

  it("raw continua raw (com acento codificado)", () => {
    expect(
      toRawImageUrl(
        "https://raw.githubusercontent.com/emkasagourmet-code/Emkasagourmet_/main/P%C3%A3o_integral_1.jpg",
      )?.hostname,
    ).toBe("raw.githubusercontent.com");
  });

  it("recusa outros sites, http e endereços internos", () => {
    expect(toRawImageUrl("https://example.com/a.jpg")).toBeNull();
    expect(
      toRawImageUrl("http://raw.githubusercontent.com/a/b/main/c.jpg"),
    ).toBeNull();
    expect(toRawImageUrl("https://169.254.169.254/latest")).toBeNull();
    expect(toRawImageUrl("https://github.com/org/repo")).toBeNull();
    expect(toRawImageUrl("não é link")).toBeNull();
  });

  it("acha o link no meio da mensagem", () => {
    expect(
      findUrl("foto da farofa https://github.com/a/b/blob/main/f.jpg obrigada"),
    ).toBe("https://github.com/a/b/blob/main/f.jpg");
  });
});

describe("caminho no Storage", () => {
  it("segue o formato aceito pelo banco", () => {
    const path = mediaPath(
      "farofa-nutritiva-de-soja",
      new Date("2026-11-15T12:00:00Z"),
    );
    expect(path).toMatch(
      /^farofa-nutritiva-de-soja\/20261115120000-[a-z0-9]+\.webp$/,
    );
    expect(path).toMatch(/^[a-z0-9][a-z0-9/_.-]*\.(webp|jpe?g|png|avif)$/);
  });
});
