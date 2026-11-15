"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type StaffRole } from "@/modules/auth/staff";
import { friendlyDbError } from "./errors";
import {
  campaignSchema,
  categorySchema,
  fieldErrors,
  ingredientSchema,
  readCampaignForm,
  readIngredientForm,
  toCampaignPayload,
  toIngredientPayload,
  whatsappSchema,
  productSchema,
  readCategoryForm,
  readProductForm,
  toCategoryPayload,
  toProductPayload,
} from "./schemas";
import { PRODUCT_STATUSES, type FormState } from "./types";

/**
 * Server Actions do catálogo (D-029): validam com Zod e chamam a função SQL.
 * O banco confere o papel de novo (RLS + checagem na função).
 */

/** Tag usada pela leitura pública da loja (`use cache` + cacheTag). */
const CATALOG_TAG = "catalogo";

const MANAGERS: StaffRole[] = ["owner", "admin"];

async function roleOrNull(): Promise<StaffRole | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user.role;
}

function denied(): FormState {
  return {
    status: "error",
    message: "Sua conta não tem permissão para esta alteração.",
  };
}

function invalid(error: z.ZodError): FormState {
  return {
    status: "error",
    message: "Revise os campos destacados.",
    fieldErrors: fieldErrors(error),
  };
}

function changed() {
  updateTag(CATALOG_TAG);
  refresh();
}

// -----------------------------------------------------------------------------
// Categorias
// -----------------------------------------------------------------------------

export async function saveCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();

  const parsed = categorySchema.safeParse(readCategoryForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("admin_save_category", {
    p: toCategoryPayload(parsed.data),
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  if (!parsed.data.id) redirect(`/admin/categorias/${id}?salvo=1`);
  return { status: "ok", message: "Categoria salva." };
}

/** Ativa ou desativa uma categoria (desativar esconde a árvore inteira da loja). */
export async function setCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();
  if (!z.uuid().safeParse(categoryId).success) {
    return { status: "error", message: "Categoria inválida." };
  }

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("categories")
    .select(
      "id, name, parent_id, kind, business_unit, description, is_featured, sort_order",
    )
    .eq("id", categoryId)
    .maybeSingle();
  if (readError || !row) {
    return { status: "error", message: "Categoria não encontrada." };
  }

  const { error } = await supabase.rpc("admin_save_category", {
    p: { ...row, is_active: isActive },
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  return {
    status: "ok",
    message: isActive ? "Categoria ativada." : "Categoria desativada.",
  };
}

// -----------------------------------------------------------------------------
// Produtos
// -----------------------------------------------------------------------------

export async function saveProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const role = await roleOrNull();
  const isManager = !!role && MANAGERS.includes(role);
  if (!isManager && role !== "operacao") return denied();

  const parsed = productSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  // Operação só cria rascunho, sem ficha técnica (o banco também barra).
  const input = isManager
    ? parsed.data
    : { ...parsed.data, status: "draft" as const, sheet: undefined };
  if (!isManager && input.id) return denied();

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("admin_save_product", {
    p: toProductPayload(input),
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  if (!input.id) {
    redirect(
      isManager
        ? `/admin/produtos/${id}?salvo=1`
        : "/admin/produtos?rascunho=1",
    );
  }
  return { status: "ok", message: "Produto salvo." };
}

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(PRODUCT_STATUSES),
});

export async function setProductStatus(
  productId: string,
  status: string,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();
  const parsed = statusSchema.safeParse({ id: productId, status });
  if (!parsed.success) return { status: "error", message: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_product_status", {
    p_product_id: parsed.data.id,
    p_status: parsed.data.status,
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  return { status: "ok", message: "Situação atualizada." };
}

/**
 * Confirma que ingredientes, "contém" e "pode conter" conferem com a ficha
 * técnica. Qualquer mudança posterior na ficha desfaz a validação (trigger).
 */
export async function validateProductAllergens(
  productId: string,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();
  if (!z.uuid().safeParse(productId).success) {
    return { status: "error", message: "Produto inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("validate_product_allergens", {
    p_product_id: productId,
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  return { status: "ok", message: "Ficha de alergênicos validada." };
}

// -----------------------------------------------------------------------------
// Ingredientes
// -----------------------------------------------------------------------------

/**
 * Salva ingrediente e os alergênicos dele. Mudar os alergênicos recalcula o
 * "contém" de todos os produtos que usam o ingrediente e desfaz a validação
 * da ficha deles (triggers do banco).
 */
export async function saveIngredient(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();

  const parsed = ingredientSchema.safeParse(readIngredientForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_ingredient", {
    p: toIngredientPayload(parsed.data),
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  if (!parsed.data.id) redirect("/admin/ingredientes?salvo=1");
  return { status: "ok", message: "Ingrediente salvo." };
}

// -----------------------------------------------------------------------------
// Campanhas
// -----------------------------------------------------------------------------

export async function saveCampaign(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();

  const parsed = campaignSchema.safeParse(readCampaignForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_campaign", {
    p: toCampaignPayload(parsed.data),
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  if (!parsed.data.id) redirect("/admin/campanhas?salvo=1");
  return { status: "ok", message: "Campanha salva." };
}

export async function setCampaignActive(
  campaignId: string,
  isActive: boolean,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();
  if (!z.uuid().safeParse(campaignId).success) {
    return { status: "error", message: "Campanha inválida." };
  }

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("campaigns")
    .select(
      "id, name, description, starts_on, ends_on, order_deadline, sort_order",
    )
    .eq("id", campaignId)
    .maybeSingle();
  if (readError || !row) {
    return { status: "error", message: "Campanha não encontrada." };
  }

  const { error } = await supabase.rpc("admin_save_campaign", {
    p: { ...row, is_active: isActive },
  });
  if (error) return { status: "error", message: friendlyDbError(error) };

  changed();
  return {
    status: "ok",
    message: isActive ? "Campanha ligada." : "Campanha desligada.",
  };
}

// -----------------------------------------------------------------------------
// Configurações
// -----------------------------------------------------------------------------

export async function saveWhatsapp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const role = await roleOrNull();
  if (!role || !MANAGERS.includes(role)) return denied();

  const parsed = whatsappSchema.safeParse({
    whatsapp: formData.get("whatsapp") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  // A chave já existe (migration 0004); o RLS só deixa a administração escrever.
  const { data, error } = await supabase
    .from("settings")
    // null no JSON viraria NULL no SQL (coluna not null): "vazio" é texto vazio.
    .update({ value: parsed.data.whatsapp ?? "" })
    .eq("key", "whatsapp_number")
    .select("key");
  if (error) return { status: "error", message: friendlyDbError(error) };
  if (!data || data.length === 0) {
    return {
      status: "error",
      message: "Configuração não encontrada no banco.",
    };
  }

  changed();
  return {
    status: "ok",
    message: parsed.data.whatsapp
      ? `WhatsApp salvo: ${parsed.data.whatsapp}.`
      : "WhatsApp removido.",
  };
}
