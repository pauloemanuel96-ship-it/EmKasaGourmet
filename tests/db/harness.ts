/**
 * Banco de teste em memória (PGlite = Postgres compilado para WebAssembly).
 * Recria o mínimo do ambiente Supabase (schemas auth/extensions, papéis anon e
 * authenticated, auth.uid()) e aplica as migrations reais de supabase/migrations.
 * Assim os testes de RLS e de estoque rodam no CI sem Docker.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const SUPABASE_STUB = `
  create schema if not exists extensions;
  create schema if not exists auth;
  create role anon nologin;
  create role authenticated nologin;
  create table auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid
    language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, extensions, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { unaccent, pg_trgm } });
  await db.exec(SUPABASE_STUB);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
  return db;
}

export type Role = "owner" | "admin" | "operacao" | "atendimento";

/** Cria um usuário em auth.users e, se informado, um papel da equipe. */
export async function createUser(db: PGlite, id: string, role?: Role) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [
    id,
    `${id.slice(0, 8)}@teste.local`,
  ]);
  if (role) {
    await db.query(
      "insert into public.staff_roles (user_id, role) values ($1, $2)",
      [id, role],
    );
  }
}

/** Executa `fn` como um papel do Supabase (anon ou usuário logado). */
export async function as<T>(
  db: PGlite,
  who: { anon: true } | { userId: string },
  fn: () => Promise<T>,
): Promise<T> {
  if ("anon" in who) {
    await db.exec(`set role anon; set request.jwt.claim.sub = '';`);
  } else {
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub = '${who.userId}';`,
    );
  }
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; set request.jwt.claim.sub = '';`);
  }
}
