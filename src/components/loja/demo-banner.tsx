import { HOME_CAMPAIGN } from "@/modules/campanhas/home-campaign";
import { getStoreCatalog } from "@/modules/catalogo/store";
import { AnnouncementTicker, type Announcement } from "./announcement-ticker";

/**
 * Faixa do topo (D-051, antes D-031): passa as campanhas e os serviços e,
 * enquanto a loja não vende de verdade, também o aviso de demonstração. Os
 * textos não prometem desconto nem preço: isso ainda não foi definido.
 */
export async function DemoBanner() {
  const { source } = await getStoreCatalog();
  const items: Announcement[] = [];
  if (HOME_CAMPAIGN === "natal") {
    items.push({
      id: "natal",
      text: "Natal Emkasa: ceias naturais sob encomenda",
      href: "/natal",
      gold: true,
    });
  }
  items.push(
    {
      id: "chef",
      text: "Novo: Chef Emkasa, a Chef cozinhando na sua casa",
      href: "/chef-emkasa",
      gold: true,
    },
    {
      id: "black-friday",
      text: "Black Friday Emkasa: cadastre-se e receba as ofertas primeiro",
      action: "ofertas",
    },
    {
      id: "box",
      text: "Monte seu BOX pensando em quem mora na sua casa",
      href: "/box",
    },
    {
      id: "aviso",
      text:
        source === "demo"
          ? "Loja em demonstração: itens DEMO ou EM BREVE ainda não estão à venda e nada é cobrado"
          : "Pagamento em teste: pedidos feitos aqui não são cobrados nem entregues",
    },
  );
  return <AnnouncementTicker items={items} />;
}
