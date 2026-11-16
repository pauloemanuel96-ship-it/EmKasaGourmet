-- =============================================================================
-- Emkasa Gourmet — Migration 0010: família da conta (D-043)
-- Cada pessoa da casa, com o que come, o que evita e o que não pode.
-- Alergia, dieta e objetivo são dado de saúde (LGPD art. 11): só entram com
-- consentimento registrado, e SÓ O DONO DA CONTA lê. Nem a administração vê.
-- =============================================================================

-- Registro de consentimentos da conta (texto aceito, quando, e se foi retirado).
create table public.consents (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references public.customers (id) on delete cascade,
  kind        text not null check (kind in ('health_profile')),
  consent_text text not null check (char_length(consent_text) between 20 and 600),
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index consents_customer_idx on public.consents (customer_id, kind);

create table public.household_members (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references public.customers (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  -- Quem é na família: "filho", "mãe", "eu". Texto livre e curto.
  relation    text check (relation is null or char_length(relation) <= 30),
  -- Ano de nascimento em vez de idade: a idade muda sozinha.
  birth_year  smallint check (birth_year is null or birth_year between 1900 and 2100),
  diet        text not null default 'sem_restricao'
              check (diet in ('sem_restricao', 'vegano', 'vegetariano', 'sem_gluten', 'sem_lactose')),
  -- Códigos da tabela allergens (conferidos por trigger).
  allergies   text[] not null default '{}',
  likes       text[] not null default '{}',
  dislikes    text[] not null default '{}',
  goal        text check (goal is null or char_length(goal) <= 160),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (cardinality(allergies) <= 30),
  check (cardinality(likes) <= 20),
  check (cardinality(dislikes) <= 20)
);
create index household_members_customer_idx on public.household_members (customer_id);

create trigger household_members_set_updated_at
  before update on public.household_members
  for each row execute function public.set_updated_at();

-- Consentimento de saúde em vigor para a conta?
create or replace function public.has_health_consent(p_customer uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.consents c
     where c.customer_id = p_customer and c.kind = 'health_profile' and c.revoked_at is null
  );
$$;

-- Regras da pessoa da casa: alergênico tem de existir; dado de saúde exige
-- consentimento; textos livres curtos; no máximo 12 pessoas por conta.
create or replace function public.household_members_check()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_bad text;
begin
  if tg_op = 'INSERT' and (
    select count(*) from public.household_members m where m.customer_id = new.customer_id
  ) >= 12 then
    raise exception 'Limite de 12 pessoas por conta.' using errcode = 'check_violation';
  end if;

  select a into v_bad from unnest(new.allergies) a
   where not exists (select 1 from public.allergens g where g.code = a) limit 1;
  if v_bad is not null then
    raise exception 'Alergênico desconhecido: %', v_bad using errcode = 'check_violation';
  end if;

  if exists (select 1 from unnest(new.likes || new.dislikes) t where char_length(t) not between 1 and 40) then
    raise exception 'Cada item de gosto precisa ter de 1 a 40 letras.' using errcode = 'check_violation';
  end if;

  if (cardinality(new.allergies) > 0 or new.diet <> 'sem_restricao' or new.goal is not null)
     and not public.has_health_consent(new.customer_id) then
    raise exception 'Falta o consentimento para guardar dados de saúde.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger household_members_check
  before insert or update on public.household_members
  for each row execute function public.household_members_check();

-- Retirar o consentimento apaga os dados de saúde de todos da casa, na hora.
create or replace function public.revoke_health_consent()
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.household_members
     set allergies = '{}', diet = 'sem_restricao', goal = null
   where customer_id = (select auth.uid());
  update public.consents
     set revoked_at = now()
   where customer_id = (select auth.uid()) and kind = 'health_profile' and revoked_at is null;
end;
$$;

alter table public.consents          enable row level security;
alter table public.household_members enable row level security;

-- Dono da conta e mais ninguém. Não existe regra de leitura para a equipe.
create policy "consents: só o dono lê"
  on public.consents for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "consents: só o dono registra"
  on public.consents for insert to authenticated
  with check (customer_id = (select auth.uid()));
create policy "consents: só o dono retira"
  on public.consents for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

create policy "household_members: só o dono"
  on public.household_members for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

revoke all on public.consents, public.household_members from public, anon, authenticated;
grant select on public.consents to authenticated;
grant insert (kind, consent_text) on public.consents to authenticated;
grant update (revoked_at) on public.consents to authenticated;
grant select, insert, update, delete on public.household_members to authenticated;
revoke execute on function public.revoke_health_consent() from public, anon;
grant execute on function public.revoke_health_consent() to authenticated;
grant execute on function public.has_health_consent(uuid) to authenticated;
