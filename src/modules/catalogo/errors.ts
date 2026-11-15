/**
 * Traduz o erro do banco em uma mensagem para a pessoa do painel.
 * As funções admin_* levantam mensagens em português, escritas para o usuário;
 * erros técnicos (restrição, sintaxe) viram uma mensagem genérica.
 */
type DbError = { code?: string; message?: string } | null | undefined;

const FRIENDLY_CODES = new Set([
  "22023", // invalid_parameter_value
  "23514", // check_violation
  "23505", // unique_violation
  "42501", // insufficient_privilege
  "P0002", // no_data_found
  "23503", // foreign_key_violation
]);

const TECHNICAL = /violates|constraint|syntax|relation|column|invalid input/i;

export function friendlyDbError(error: DbError): string {
  const message = error?.message?.trim() ?? "";
  if (
    error?.code &&
    FRIENDLY_CODES.has(error.code) &&
    message &&
    !TECHNICAL.test(message)
  ) {
    return message;
  }
  switch (error?.code) {
    case "42501":
      return "Sua conta não tem permissão para esta alteração.";
    case "23505":
      return "Já existe um cadastro com esses dados.";
    case "23503":
      return "Há outros cadastros ligados a este. Desative em vez de apagar.";
    case "23514":
      return "Algum dado não passou na conferência do banco. Revise os campos.";
    default:
      return "Não foi possível salvar agora. Tente de novo em instantes.";
  }
}
