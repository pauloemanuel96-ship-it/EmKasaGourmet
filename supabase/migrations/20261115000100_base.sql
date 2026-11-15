-- =============================================================================
-- 0001 · Base: extensões, papéis da equipe, auditoria e configurações
-- Ver docs/DATABASE_SCHEMA.md §6 e docs/SECURITY_AND_PRIVACY.md §1, §2 e §8.
-- =============================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Utilitários
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Papéis da equipe
-- -----------------------------------------------------------------------------
create type public.staff_role as enum ('owner', 'admin', 'operacao', 'atendimento');

create table public.staff_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.staff_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger staff_roles_updated_at
  before update on public.staff_roles
  for each row execute function public.set_updated_at();

-- Verdadeiro se o usuário logado tem um dos papéis informados.
-- security definer: lê staff_roles sem depender das policies dela (evita recursão).
create or replace function public.has_role(roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_roles sr
    where sr.user_id = (select auth.uid())
      and sr.role = any (roles)
  );
$$;

-- Atalhos legíveis para as policies
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_role(array['owner','admin','operacao','atendimento']::public.staff_role[]); $$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_role(array['owner','admin']::public.staff_role[]); $$;

-- -----------------------------------------------------------------------------
-- Auditoria (append-only)
-- -----------------------------------------------------------------------------
create type public.audit_action as enum ('insert', 'update', 'delete');
create type public.change_source as enum ('panel', 'assistant', 'system', 'checkout');

create table public.audit_log (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  record_id   text,
  action      public.audit_action not null,
  before      jsonb,
  after       jsonb,
  actor_id    uuid,
  source      public.change_source not null default 'panel',
  created_at  timestamptz not null default now()
);

create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- Origem da alteração: a aplicação pode definir `set local app.source = 'assistant'`.
create or replace function public.current_change_source()
returns public.change_source
language plpgsql
stable
set search_path = ''
as $$
declare
  v text := nullif(current_setting('app.source', true), '');
begin
  if v is null then
    return 'panel';
  end if;
  return v::public.change_source;
exception when invalid_text_representation then
  return 'panel';
end;
$$;

-- Trigger genérico. Grava o antes/depois como jsonb.
-- O identificador é a coluna `id` ou, na falta dela, o 1º argumento do trigger.
create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_after  jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_key    text  := coalesce(tg_argv[0], 'id');
begin
  if tg_op = 'UPDATE' and v_before = v_after then
    return new;
  end if;

  insert into public.audit_log (table_name, record_id, action, before, after, actor_id, source)
  values (
    tg_table_name,
    coalesce(v_after ->> v_key, v_before ->> v_key),
    lower(tg_op)::public.audit_action,
    v_before,
    v_after,
    (select auth.uid()),
    public.current_change_source()
  );

  return coalesce(new, old);
end;
$$;

create trigger staff_roles_audit
  after insert or update or delete on public.staff_roles
  for each row execute function public.audit_row('user_id');

-- -----------------------------------------------------------------------------
-- Configurações (valores do negócio nunca ficam fixos no código: RN-11)
-- -----------------------------------------------------------------------------
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default false,
  description text,
  updated_by  uuid default auth.uid(),
  updated_at  timestamptz not null default now()
);

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger settings_audit
  after insert or update or delete on public.settings
  for each row execute function public.audit_row('key');

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.staff_roles enable row level security;
alter table public.audit_log  enable row level security;
alter table public.settings   enable row level security;

-- staff_roles: cada pessoa vê o próprio papel; só o owner gerencia.
create policy "staff_roles: ver o próprio papel"
  on public.staff_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role(array['owner']::public.staff_role[]));

create policy "staff_roles: owner gerencia"
  on public.staff_roles for all to authenticated
  using (public.has_role(array['owner']::public.staff_role[]))
  with check (public.has_role(array['owner']::public.staff_role[]));

-- audit_log: leitura para owner/admin; escrita só pelo trigger (security definer).
create policy "audit_log: gestores leem"
  on public.audit_log for select to authenticated
  using (public.is_manager());

-- settings: públicas para todos; demais só para a equipe; escrita por gestores.
create policy "settings: leitura pública das chaves públicas"
  on public.settings for select to anon, authenticated
  using (is_public or public.is_staff());

create policy "settings: gestores escrevem"
  on public.settings for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- Grants explícitos (RLS decide as linhas; o grant decide o acesso à tabela).
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.staff_roles to authenticated;
grant select on public.audit_log to authenticated;

revoke execute on function public.audit_row() from public, anon, authenticated;
grant execute on function public.has_role(public.staff_role[]) to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
