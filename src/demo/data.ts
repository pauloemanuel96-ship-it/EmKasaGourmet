/**
 * DADOS FICTÍCIOS DE DEMONSTRAÇÃO
 * Nada aqui é informação real da Emkasa (preços, produtos, prazos, regiões).
 * Servem só para visualizar o protótipo. Serão substituídos pelo banco (Supabase).
 */

export type BusinessUnit = "horta" | "cozinha" | "produtos";
export type Storage = "ambiente" | "refrigerado" | "congelado";
export type SaleUnit = "un" | "kg" | "maco" | "pote" | "porcao" | "pacote";

export type AllergenCode =
  | "gluten"
  | "leite"
  | "lactose"
  | "ovos"
  | "soja"
  | "amendoim"
  | "castanhas"
  | "castanha_de_caju"
  | "trigo";

export type DietLabel = "vegano" | "vegetariano" | "sem_gluten" | "sem_lactose";

export type Product = {
  slug: string;
  name: string;
  unit: BusinessUnit;
  category: string;
  saleUnit: SaleUnit;
  unitLabel: string;
  priceCents: number;
  storage: Storage;
  short: string;
  description: string;
  ingredients: string[];
  contains: AllergenCode[];
  mayContain: AllergenCode[];
  allergensValidated: boolean;
  diet: DietLabel[];
  conservation: string;
  origin?: string;
  madeToOrder?: boolean;
  /** Família de produtos para o BOX (folhas, raízes, frutas, ervas). */
  boxGroup?: "folhas" | "raizes" | "frutas" | "ervas" | "legumes";
  /** Cor do placeholder de imagem. */
  tone: string;
};

export const ALLERGEN_LABEL: Record<AllergenCode, string> = {
  gluten: "Glúten",
  leite: "Leite",
  lactose: "Lactose",
  ovos: "Ovos",
  soja: "Soja",
  amendoim: "Amendoim",
  castanhas: "Castanhas",
  castanha_de_caju: "Castanha-de-caju",
  trigo: "Trigo",
};

export const DIET_LABEL: Record<DietLabel, string> = {
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  sem_gluten: "Sem glúten",
  sem_lactose: "Sem lactose",
};

export const UNIT_LABEL: Record<BusinessUnit, string> = {
  horta: "Horta",
  cozinha: "Cozinha",
  produtos: "Produtos Emkasa",
};

export const STORAGE_LABEL: Record<Storage, string> = {
  ambiente: "Temperatura ambiente",
  refrigerado: "Refrigerado",
  congelado: "Congelado",
};

export const PRODUCTS: Product[] = [
  // ---------------- HORTA ----------------
  {
    slug: "alface-crespa",
    name: "Alface crespa",
    unit: "horta",
    category: "Folhas",
    saleUnit: "un",
    unitLabel: "pé",
    priceCents: 450,
    storage: "refrigerado",
    short: "Colhida no dia da entrega.",
    description: "Folhas crocantes e frescas, colhidas na manhã da entrega.",
    ingredients: ["Alface"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation:
      "Guarde na geladeira em pote fechado com papel-toalha. Até 5 dias.",
    origin: "Horta Emkasa [DEMO]",
    boxGroup: "folhas",
    tone: "#7d9a5c",
  },
  {
    slug: "couve-manteiga",
    name: "Couve-manteiga",
    unit: "horta",
    category: "Folhas",
    saleUnit: "maco",
    unitLabel: "maço",
    priceCents: 500,
    storage: "refrigerado",
    short: "Maço generoso para refogar ou suco verde.",
    description:
      "Couve de folhas largas, ótima para refogados, farofas e sucos.",
    ingredients: ["Couve"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Na geladeira, enrolada em pano úmido. Até 4 dias.",
    origin: "Horta Emkasa [DEMO]",
    boxGroup: "folhas",
    tone: "#4f7343",
  },
  {
    slug: "rucula",
    name: "Rúcula",
    unit: "horta",
    category: "Folhas",
    saleUnit: "maco",
    unitLabel: "maço",
    priceCents: 550,
    storage: "refrigerado",
    short: "Picante na medida certa.",
    description: "Rúcula de folhas pequenas e sabor marcante.",
    ingredients: ["Rúcula"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Geladeira, em pote fechado. Até 3 dias.",
    origin: "Horta Emkasa [DEMO]",
    boxGroup: "folhas",
    tone: "#5f8a4a",
  },
  {
    slug: "cenoura",
    name: "Cenoura",
    unit: "horta",
    category: "Raízes",
    saleUnit: "kg",
    unitLabel: "kg",
    priceCents: 790,
    storage: "refrigerado",
    short: "Doce e crocante.",
    description:
      "Cenouras de tamanho médio, ideais para assar, ralar ou fazer bolo.",
    ingredients: ["Cenoura"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Geladeira, na gaveta de legumes. Até 2 semanas.",
    origin: "Fornecedor parceiro [DEMO]",
    boxGroup: "raizes",
    tone: "#d9823b",
  },
  {
    slug: "mandioca",
    name: "Mandioca descascada",
    unit: "horta",
    category: "Raízes",
    saleUnit: "kg",
    unitLabel: "kg",
    priceCents: 990,
    storage: "congelado",
    short: "Pronta para cozinhar.",
    description:
      "Mandioca descascada e congelada, cozinha rápido e fica macia.",
    ingredients: ["Mandioca"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Freezer. Até 3 meses.",
    origin: "Fornecedor parceiro [DEMO]",
    boxGroup: "raizes",
    tone: "#cdb38a",
  },
  {
    slug: "tomate",
    name: "Tomate italiano",
    unit: "horta",
    category: "Legumes",
    saleUnit: "kg",
    unitLabel: "kg",
    priceCents: 1190,
    storage: "ambiente",
    short: "Para molhos e saladas.",
    description: "Tomate italiano firme e saboroso.",
    ingredients: ["Tomate"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation:
      "Fora da geladeira até amadurecer; depois, geladeira por 5 dias.",
    origin: "Fornecedor parceiro [DEMO]",
    boxGroup: "legumes",
    tone: "#c4472f",
  },
  {
    slug: "abobrinha",
    name: "Abobrinha",
    unit: "horta",
    category: "Legumes",
    saleUnit: "kg",
    unitLabel: "kg",
    priceCents: 890,
    storage: "refrigerado",
    short: "Leve e versátil.",
    description:
      "Abobrinha italiana para grelhar, refogar ou fazer espaguete de legumes.",
    ingredients: ["Abobrinha"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Geladeira. Até 1 semana.",
    origin: "Horta Emkasa [DEMO]",
    boxGroup: "legumes",
    tone: "#6c8f3c",
  },
  {
    slug: "banana-prata",
    name: "Banana-prata",
    unit: "horta",
    category: "Frutas",
    saleUnit: "kg",
    unitLabel: "kg",
    priceCents: 690,
    storage: "ambiente",
    short: "Doce, para o dia a dia.",
    description: "Banana-prata em ponto de consumo ao longo da semana.",
    ingredients: ["Banana"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Fora da geladeira, longe de outras frutas.",
    origin: "Fornecedor parceiro [DEMO]",
    boxGroup: "frutas",
    tone: "#e3c25a",
  },
  {
    slug: "mamao-formosa",
    name: "Mamão formosa",
    unit: "horta",
    category: "Frutas",
    saleUnit: "un",
    unitLabel: "unidade",
    priceCents: 890,
    storage: "ambiente",
    short: "Maduro em 2 a 3 dias.",
    description: "Mamão formosa de polpa alaranjada.",
    ingredients: ["Mamão"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Fora da geladeira até amadurecer.",
    origin: "Fornecedor parceiro [DEMO]",
    boxGroup: "frutas",
    tone: "#e48a3c",
  },
  {
    slug: "manjericao",
    name: "Manjericão",
    unit: "horta",
    category: "Ervas",
    saleUnit: "maco",
    unitLabel: "maço",
    priceCents: 400,
    storage: "ambiente",
    short: "Perfume para molhos e pestos.",
    description: "Manjericão de folhas grandes e aroma intenso.",
    ingredients: ["Manjericão"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation:
      "Como um buquê, com os talos num copo d'água, fora da geladeira.",
    origin: "Horta Emkasa [DEMO]",
    boxGroup: "ervas",
    tone: "#3f6b3a",
  },

  // ---------------- COZINHA ----------------
  {
    slug: "lasanha-vegana-berinjela",
    name: "Lasanha vegana de berinjela",
    unit: "cozinha",
    category: "Pratos congelados",
    saleUnit: "porcao",
    unitLabel: "porção 400 g",
    priceCents: 3290,
    storage: "congelado",
    short: "Camadas de berinjela, molho de tomate e creme de castanhas.",
    description:
      "Lasanha sem massa de trigo: fatias de berinjela grelhada, molho de tomate da casa e creme de castanha-de-caju.",
    ingredients: [
      "Berinjela",
      "Tomate",
      "Castanha-de-caju",
      "Azeite",
      "Alho",
      "Manjericão",
      "Sal",
    ],
    contains: ["castanha_de_caju"],
    mayContain: ["gluten"],
    allergensValidated: true,
    diet: ["vegano"],
    conservation:
      "Freezer por até 60 dias. Aqueça no forno a 180 °C por 35 min.",
    tone: "#a4462f",
  },
  {
    slug: "escondidinho-mandioca-cogumelos",
    name: "Escondidinho de mandioca com cogumelos",
    unit: "cozinha",
    category: "Pratos congelados",
    saleUnit: "porcao",
    unitLabel: "porção 400 g",
    priceCents: 2990,
    storage: "congelado",
    short: "Purê de mandioca sobre ragu de cogumelos.",
    description:
      "Purê cremoso de mandioca com ragu de cogumelos e cebola caramelizada.",
    ingredients: [
      "Mandioca",
      "Cogumelo shimeji",
      "Cebola",
      "Azeite",
      "Sal",
      "Molho de soja",
    ],
    contains: ["soja", "trigo", "gluten"],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano"],
    conservation:
      "Freezer por até 60 dias. Micro-ondas por 6 min ou forno por 30 min.",
    tone: "#b8956a",
  },
  {
    slug: "sopa-abobora-gengibre",
    name: "Sopa de abóbora com gengibre",
    unit: "cozinha",
    category: "Sopas e caldos",
    saleUnit: "pote",
    unitLabel: "pote 500 ml",
    priceCents: 2290,
    storage: "congelado",
    short: "Aconchego em forma de sopa.",
    description: "Abóbora cabotiá assada, gengibre fresco e leite de coco.",
    ingredients: ["Abóbora", "Gengibre", "Leite de coco", "Cebola", "Sal"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Freezer por até 90 dias. Aqueça em panela, mexendo.",
    tone: "#e0953a",
  },
  {
    slug: "strogonoff-grao-de-bico",
    name: "Strogonoff de grão-de-bico",
    unit: "cozinha",
    category: "Pratos congelados",
    saleUnit: "porcao",
    unitLabel: "porção 350 g",
    priceCents: 2790,
    storage: "congelado",
    short: "Com arroz integral.",
    description:
      "Grão-de-bico e cogumelos em creme de castanhas, servido com arroz integral.",
    ingredients: [
      "Grão-de-bico",
      "Cogumelo paris",
      "Castanha-de-caju",
      "Tomate",
      "Arroz integral",
    ],
    contains: ["castanha_de_caju"],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Freezer por até 60 dias.",
    tone: "#c9a15b",
  },
  {
    slug: "quiche-alho-poro",
    name: "Quiche de alho-poró",
    unit: "cozinha",
    category: "Encomendas",
    saleUnit: "un",
    unitLabel: "inteira (8 fatias)",
    priceCents: 8900,
    storage: "refrigerado",
    short: "Sob encomenda, com 2 dias de antecedência.",
    description: "Massa amanteigada e recheio cremoso de alho-poró.",
    ingredients: [
      "Farinha de trigo",
      "Manteiga",
      "Ovos",
      "Leite",
      "Alho-poró",
      "Queijo",
    ],
    contains: ["trigo", "gluten", "leite", "lactose", "ovos"],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegetariano"],
    conservation: "Geladeira por até 4 dias.",
    madeToOrder: true,
    tone: "#d8c27a",
  },
  {
    slug: "bolo-cenoura-integral",
    name: "Bolo de cenoura integral",
    unit: "cozinha",
    category: "Encomendas",
    saleUnit: "un",
    unitLabel: "inteiro",
    priceCents: 5900,
    storage: "ambiente",
    short: "Ficha de alergênicos em revisão.",
    description: "Bolo fofinho de cenoura com farinha integral.",
    ingredients: ["Cenoura", "Farinha integral", "Açúcar mascavo", "Óleo"],
    contains: ["trigo", "gluten"],
    mayContain: [],
    allergensValidated: false,
    diet: [],
    conservation: "Em pote fechado, por até 3 dias.",
    madeToOrder: true,
    tone: "#cf7d3c",
  },

  // ---------------- PRODUTOS ----------------
  {
    slug: "farofa-nutritiva",
    name: "Farofa Nutritiva",
    unit: "produtos",
    category: "Linha própria",
    saleUnit: "pote",
    unitLabel: "pote 250 g",
    priceCents: 2490,
    storage: "ambiente",
    short: "Sementes, castanhas e temperos da casa.",
    description:
      "A farofa que acompanha tudo: farinha de mandioca, sementes, castanhas e ervas. [Receita fictícia de demonstração]",
    ingredients: [
      "Farinha de mandioca",
      "Semente de girassol",
      "Castanha-do-pará",
      "Linhaça",
      "Cúrcuma",
      "Sal",
    ],
    contains: ["castanhas"],
    mayContain: ["amendoim"],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation:
      "Pote bem fechado, local seco. Consumir em até 30 dias após aberto.",
    tone: "#b9873f",
  },
  {
    slug: "blend-tempero-verde",
    name: "Blend Vegano Tempero Verde",
    unit: "produtos",
    category: "Linha própria",
    saleUnit: "pote",
    unitLabel: "pote 80 g",
    priceCents: 1890,
    storage: "ambiente",
    short: "Ervas desidratadas para finalizar pratos.",
    description:
      "Salsa, cebolinha, manjericão e alho desidratados. [Demonstração]",
    ingredients: ["Salsa", "Cebolinha", "Manjericão", "Alho", "Sal rosa"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Local seco e arejado. Até 6 meses.",
    tone: "#5b7d3e",
  },
  {
    slug: "blend-golden",
    name: "Blend Golden",
    unit: "produtos",
    category: "Linha própria",
    saleUnit: "pote",
    unitLabel: "pote 100 g",
    priceCents: 2190,
    storage: "ambiente",
    short: "Cúrcuma, gengibre e canela para bebidas.",
    description: "Mistura para leite dourado e chás. [Demonstração]",
    ingredients: ["Cúrcuma", "Gengibre", "Canela", "Pimenta-do-reino"],
    contains: [],
    mayContain: [],
    allergensValidated: true,
    diet: ["vegano", "sem_gluten", "sem_lactose"],
    conservation: "Local seco. Até 6 meses.",
    tone: "#d39a2a",
  },
];

/** Estoque inicial fictício (unidades na unidade de venda). */
export const INITIAL_STOCK: Record<string, number> = {
  "alface-crespa": 18,
  "couve-manteiga": 12,
  rucula: 0,
  cenoura: 15,
  mandioca: 10,
  tomate: 9,
  abobrinha: 8,
  "banana-prata": 20,
  "mamao-formosa": 6,
  manjericao: 7,
  "lasanha-vegana-berinjela": 9,
  "escondidinho-mandioca-cogumelos": 6,
  "sopa-abobora-gengibre": 11,
  "strogonoff-grao-de-bico": 4,
  "quiche-alho-poro": 0,
  "bolo-cenoura-integral": 0,
  "farofa-nutritiva": 8,
  "blend-tempero-verde": 14,
  "blend-golden": 3,
};

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

// ---------------- BOX ----------------
export type BoxPlan = {
  code: "solo" | "casal" | "familia" | "familia_plus";
  name: string;
  people: string;
  priceCents: number;
  /** Quantas unidades de cada grupo a cesta-base leva. */
  groups: Record<NonNullable<Product["boxGroup"]>, number>;
};

export const BOX_PLANS: BoxPlan[] = [
  {
    code: "solo",
    name: "BOX Solo",
    people: "1 pessoa",
    priceCents: 5900,
    groups: { folhas: 2, raizes: 1, legumes: 1, frutas: 1, ervas: 1 },
  },
  {
    code: "casal",
    name: "BOX Casal",
    people: "2 pessoas",
    priceCents: 8900,
    groups: { folhas: 3, raizes: 2, legumes: 2, frutas: 2, ervas: 1 },
  },
  {
    code: "familia",
    name: "BOX Família",
    people: "3 a 4 pessoas",
    priceCents: 12900,
    groups: { folhas: 4, raizes: 2, legumes: 3, frutas: 3, ervas: 1 },
  },
  {
    code: "familia_plus",
    name: "BOX Família Plus",
    people: "5 ou mais pessoas",
    priceCents: 16900,
    groups: { folhas: 5, raizes: 3, legumes: 4, frutas: 4, ervas: 2 },
  },
];

// ---------------- CONTEÚDO ----------------
export type Recipe = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  servings: number;
  steps: string[];
  products: string[];
  tone: string;
};

export const RECIPES: Recipe[] = [
  {
    slug: "salada-morna-de-abobrinha",
    title: "Salada morna de abobrinha com manjericão",
    summary:
      "Um prato rápido para usar a horta da semana. [Receita de demonstração]",
    minutes: 15,
    servings: 2,
    steps: [
      "Corte a abobrinha em fitas finas e grelhe em frigideira quente com um fio de azeite.",
      "Monte sobre a alface e a rúcula, com o tomate em cubos.",
      "Finalize com manjericão rasgado e o Blend Tempero Verde.",
    ],
    products: [
      "abobrinha",
      "alface-crespa",
      "tomate",
      "manjericao",
      "blend-tempero-verde",
    ],
    tone: "#6c8f3c",
  },
  {
    slug: "couve-com-farofa-nutritiva",
    title: "Couve refogada com Farofa Nutritiva",
    summary:
      "O acompanhamento que vira prato principal. [Receita de demonstração]",
    minutes: 10,
    servings: 3,
    steps: [
      "Fatie a couve bem fininha.",
      "Refogue rapidamente em fogo alto com alho, sem deixar murchar demais.",
      "Desligue o fogo e misture a Farofa Nutritiva na hora de servir.",
    ],
    products: ["couve-manteiga", "farofa-nutritiva"],
    tone: "#4f7343",
  },
  {
    slug: "leite-dourado",
    title: "Leite dourado da noite",
    summary: "Bebida quente para desacelerar. [Receita de demonstração]",
    minutes: 5,
    servings: 1,
    steps: [
      "Aqueça 250 ml de bebida vegetal sem ferver.",
      "Misture 1 colher (chá) de Blend Golden e adoce a gosto.",
    ],
    products: ["blend-golden"],
    tone: "#d39a2a",
  },
];

export type Course = {
  slug: string;
  title: string;
  format: string;
  priceCents: number | null;
  lessons: number;
  summary: string;
};

export const COURSES: Course[] = [
  {
    slug: "cozinha-vegana-do-dia-a-dia",
    title: "Cozinha vegana do dia a dia",
    format: "Curso online · 8 aulas",
    priceCents: 19700,
    lessons: 8,
    summary: "Planejamento da semana, bases, molhos e marmitas. [Demonstração]",
  },
  {
    slug: "aproveitamento-integral",
    title: "Aproveitamento integral dos alimentos",
    format: "Oficina presencial · 3 h",
    priceCents: 12000,
    lessons: 1,
    summary: "Cascas, talos e sementes que viram receitas. [Demonstração]",
  },
  {
    slug: "primeiros-passos",
    title: "Primeiros passos na alimentação saudável",
    format: "Minicurso gratuito · 3 aulas",
    priceCents: null,
    lessons: 3,
    summary: "Conteúdo de boas-vindas para novos clientes. [Demonstração]",
  },
];

export const TESTIMONIALS = [
  {
    name: "Cliente de exemplo 1",
    text: "Texto de exemplo para mostrar o espaço dos depoimentos. Será substituído por depoimentos reais, com autorização.",
  },
  {
    name: "Cliente de exemplo 2",
    text: "Depoimento fictício de demonstração. Nenhuma promessa de saúde aparece aqui.",
  },
];

// ---------------- ENTREGAS ----------------
export type DeliveryZone = {
  id: string;
  name: string;
  feeCents: number;
  /** Dias da semana com entrega (0 = domingo). */
  weekdays: number[];
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "zona-a", name: "Zona A [DEMO]", feeCents: 800, weekdays: [2, 4, 6] },
  { id: "zona-b", name: "Zona B [DEMO]", feeCents: 1200, weekdays: [3, 6] },
  {
    id: "retirada",
    name: "Retirada no local [DEMO]",
    feeCents: 0,
    weekdays: [1, 2, 3, 4, 5, 6],
  },
];

export const CLUB_POINTS_PER_REAL = 1;
export const CLUB_REWARDS = [
  { points: 100, label: "Blend Tempero Verde de presente" },
  { points: 250, label: "10% de desconto na próxima compra" },
  { points: 500, label: "Vaga em uma oficina presencial" },
];
