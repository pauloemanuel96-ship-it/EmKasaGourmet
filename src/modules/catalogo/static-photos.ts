/**
 * Fotos reais enviadas pela Emkasa (repositórios emkasagourmet-code/*),
 * otimizadas em WebP dentro de /public/fotos. Valem até o produto ganhar foto
 * própria pelo painel (Storage), que sempre tem prioridade.
 * Chave: slug do produto no banco (o painel gera o slug a partir do nome:
 * "Farofa Nutritiva de Soja" → "farofa-nutritiva-de-soja").
 */
type Photo = { url: string; alt: string };

const p = (file: string, alt: string): Photo => ({
  url: `/fotos/${file}.webp`,
  alt,
});

export const STATIC_COVERS: Record<string, Photo> = {
  "farofa-nutritiva-de-soja": p(
    "farofa-nutritiva-de-soja",
    "Farofa Nutritiva de Soja numa tigela, com grãos de soja ao fundo",
  ),
  "blend-vegano": p(
    "blend-vegano",
    "Blend Vegano grelhado servido sobre folhas e tomate",
  ),
  almondegas: p(
    "almondegas",
    "Almôndegas ao molho num prato, com arroz ao lado",
  ),
  pate: p("pate", "Patê numa taça de vidro, com torradas e cebolinha"),
  "pao-integral": p("pao-integral-1", "Pão integral fatiado sobre a tábua"),
  "quiche-de-soja": p(
    "quiche-de-soja",
    "Quiche de soja inteira com folha de manjericão",
  ),
  "muqueca-de-grao-de-bico": p(
    "muqueca-de-grao-de-bico",
    "Muqueca de grão-de-bico numa tigela de vidro",
  ),
  "salada-margarita": p(
    "salada-margarita",
    "Salada Margarita com beterraba e cenoura raladas sobre folhas",
  ),
  "tomate-recheado-vegetariano": p(
    "tomate-recheado-vegetariano",
    "Tomates recheados vegetarianos numa travessa branca",
  ),
  "salada-no-pote": p(
    "salada-no-pote-1",
    "Salada no pote com folhas, brócolis, tomate e pepino, segurada na mão",
  ),
};

/** Fotos extras do produto (embalagem, outros ângulos). */
export const STATIC_GALLERY: Record<string, Photo[]> = {
  "farofa-nutritiva-de-soja": [
    p(
      "farofa-embalagem-frente",
      "Pote da Farofa Nutritiva de Soja, frente do rótulo",
    ),
    p(
      "farofa-embalagem-verso",
      "Pote da Farofa Nutritiva de Soja, verso do rótulo",
    ),
  ],
  "pao-integral": [
    p("pao-integral-2", "Pão integral fatiado ao lado do rolo de massa"),
  ],
  "salada-no-pote": [
    p(
      "salada-no-pote-2",
      "Salada no pote em camadas sobre um abacaxi, entre folhagens",
    ),
  ],
};

export const SITE_PHOTOS = {
  saladaNoPote1: STATIC_COVERS["salada-no-pote"],
  saladaNoPote2: STATIC_GALLERY["salada-no-pote"][0],
  chefAngela: p(
    "chef-angela-acioli",
    "Chef Angela Acioli finalizando um prato na cozinha",
  ),
} as const;
