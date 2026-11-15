import type { Category } from "./types";

export type CategoryNode = Category & {
  depth: number;
  /** Nomes do topo até esta categoria: ["Produtos da Emkasa", "Blends Veganos"]. */
  path: string[];
  /** Visível na loja: ela e todas as ancestrais estão ativas. */
  visible: boolean;
  childCount: number;
};

function byOrder(a: Category, b: Category) {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR");
}

/**
 * Árvore achatada em ordem de exibição (mãe, depois as filhas).
 * Categorias cuja mãe não veio na lista aparecem no topo, para nada sumir do painel.
 */
export function flattenTree(categories: Category[]): CategoryNode[] {
  const ids = new Set(categories.map((c) => c.id));
  const children = new Map<string | null, Category[]>();
  for (const c of categories) {
    const key = c.parent_id && ids.has(c.parent_id) ? c.parent_id : null;
    const list = children.get(key) ?? [];
    list.push(c);
    children.set(key, list);
  }

  const out: CategoryNode[] = [];
  const seen = new Set<string>();
  const walk = (
    parent: string | null,
    depth: number,
    path: string[],
    visible: boolean,
  ) => {
    for (const c of (children.get(parent) ?? []).sort(byOrder)) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const nodePath = [...path, c.name];
      const nodeVisible = visible && c.is_active;
      out.push({
        ...c,
        depth,
        path: nodePath,
        visible: nodeVisible,
        childCount: children.get(c.id)?.length ?? 0,
      });
      walk(c.id, depth + 1, nodePath, nodeVisible);
    }
  };
  walk(null, 0, [], true);
  return out;
}

/** O id informado e todos os descendentes. */
export function descendantIds(categories: Category[], id: string): Set<string> {
  const result = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parent_id && result.has(c.parent_id) && !result.has(c.id)) {
        result.add(c.id);
        grew = true;
      }
    }
  }
  return result;
}
