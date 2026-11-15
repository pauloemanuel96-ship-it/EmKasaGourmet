# Catálogo de imagens dos produtos

> A lista **sempre atualizada** fica no painel: **Fotos → Produtos sem foto**
> (com botão "Baixar lista" em planilha). Ela lê o banco na hora. Este documento
> registra o que já existe e a regra de nomes.

## Como nomear os arquivos (importação em lote)

O nome do arquivo deve ser o nome do produto, do jeito que está no painel. Acento,
maiúscula, espaço e `_` não atrapalham. Número no fim indica a ordem:

| Arquivo | Vira |
|---|---|
| `farofa-nutritiva-de-soja.jpg` | foto principal da Farofa Nutritiva de Soja |
| `Pão integral 2.jpg` | segunda foto do Pão integral (galeria) |
| `Frente_Farofa.jpeg` | foto de **embalagem** da Farofa (palavras frente, fundo, verso, rótulo, pote) |

Quando o nome bate com mais de um produto (ex.: `salada.jpg`), o sistema **não
escolhe**: a linha fica marcada e você escolhe na tela de revisão. A foto
principal de um produto que já tem foto só é trocada se você marcar
"Substituir principal".

## Fotos reais já no site (em `public/fotos`, valem até subirem pelo painel)

| Produto (nome no painel) | Slug esperado | Foto | Situação |
|---|---|---|---|
| Farofa Nutritiva de Soja | `farofa-nutritiva-de-soja` | farofa-nutritiva-de-soja.webp + embalagem frente e verso | ✅ |
| Blend Vegano | `blend-vegano` | blend-vegano.webp | ✅ (ainda sem foto por sabor) |
| Almôndegas | `almondegas` | almondegas.webp | ✅ |
| Patê | `pate` | pate.webp | ✅ |
| Pão integral | `pao-integral` | pao-integral-1.webp + pao-integral-2.webp | ✅ |
| Quiche de soja | `quiche-de-soja` | quiche-de-soja.webp | ✅ |
| Muqueca de grão-de-bico | `muqueca-de-grao-de-bico` | muqueca-de-grao-de-bico.webp | ✅ |
| Salada Margarita | `salada-margarita` | salada-margarita.webp | ✅ |
| Tomate recheado vegetariano | `tomate-recheado-vegetariano` | tomate-recheado-vegetariano.webp | ✅ |
| Salada no pote | `salada-no-pote` | salada-no-pote-1.webp + salada-no-pote-2.webp | ✅ |
| Horta (frutas, legumes, verduras) | — | — | ⏳ pendente |
| Ceia Natural / Ceia Tradicional | — | — | ⏳ pendente |
| Chef Angela (Quem Somos) | — | chef-angela-acioli.webp | ✅ (confirmar se é foto real) |

Se o produto for cadastrado com outro nome, a foto estática não entra sozinha:
use a importação em lote ou a página do produto.
