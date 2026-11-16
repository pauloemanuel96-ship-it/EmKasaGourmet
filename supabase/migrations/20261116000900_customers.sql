-- =============================================================================
-- Emkasa Gourmet — Migration 0009: conta do cliente e endereços (D-042)
-- Cada pessoa vê e altera só o que é dela. A administração (owner/admin) lê.
-- A conta guarda vários endereços com nome: casa, trabalho, casa da mãe...
-- =============================================================================

create table public.customers (
  id                   uuid primary key references auth.users (id) on delete cascade,
  name                 text not null check (char_length(name) between 2 and 80),
  -- Cópia do e-mail de login, preenchida pelo banco (a pessoa não escolhe).
  email                text not null check (char_length(email) <= 160),
  phone                text check (phone is null or phone ~ '^[0-9]{10,13}$'),
  marketing_consent    boolean not null default false,
  marketing_consent_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references public.customers (id) on delete cascade,
  -- Nome que a pessoa dá: "Casa", "Trabalho", "Casa da mãe".
  label       text not null check (char_length(label) between 1 and 40),
  -- Quem recebe neste endereço (pode ser um familiar).
  recipient   text check (recipient is null or char_length(recipient) <= 80),
  cep         text not null check (cep ~ '^[0-9]{8}$'),
  street      text not null check (char_length(street) between 1 and 120),
  number      text not null check (char_length(number) between 1 and 15),
  complement  text check (complement is null or char_length(complement) <= 60),
  district    text not null check (char_length(district) between 1 and 80),
  city        text not null check (char_length(city) between 1 and 80),
  state       text not null check (state ~ '^[A-Z]{2}$'),
  reference   text check (reference is null or char_length(reference) <= 120),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index customer_addresses_customer_idx on public.customer_addresses (customer_id);
-- No máximo um endereço principal por pessoa.
create unique index customer_addresses_one_default
  on public.customer_addresses (customer_id) where is_default;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

-- O e-mail da conta vem sempre do login, nunca do que o navegador mandar.
create or replace function public.customers_fill_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := coalesce((select u.email from auth.users u where u.id = new.id), new.email);
  if new.marketing_consent and new.marketing_consent_at is null then
    new.marketing_consent_at := now();
  end if;
  return new;
end;
$$;
create trigger customers_fill_email
  before insert on public.customers
  for each row execute function public.customers_fill_email();

-- Endereço principal: o primeiro vira principal sozinho; marcar outro como
-- principal desmarca o anterior; no máximo 10 endereços por conta.
create or replace function public.customer_addresses_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if tg_op = 'INSERT' and (
    select count(*) from public.customer_addresses a where a.customer_id = new.customer_id
  ) >= 10 then
    raise exception 'Limite de 10 endereços por conta.' using errcode = 'check_violation';
  end if;
  if new.is_default then
    update public.customer_addresses a
       set is_default = false
     where a.customer_id = new.customer_id and a.id <> new.id and a.is_default;
  elsif not exists (
    select 1 from public.customer_addresses a
     where a.customer_id = new.customer_id and a.id <> new.id and a.is_default
  ) then
    new.is_default := true;
  end if;
  return new;
end;
$$;
create trigger customer_addresses_default
  before insert or update of is_default on public.customer_addresses
  for each row execute function public.customer_addresses_default();

-- Apagou o principal: o mais recente dos que sobraram assume.
create or replace function public.customer_addresses_promote()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_default and pg_trigger_depth() = 1 then
    update public.customer_addresses a
       set is_default = true
     where a.id = (
       select b.id from public.customer_addresses b
        where b.customer_id = old.customer_id
        order by b.created_at desc limit 1
     );
  end if;
  return old;
end;
$$;
create trigger customer_addresses_promote
  after delete on public.customer_addresses
  for each row execute function public.customer_addresses_promote();

alter table public.customers          enable row level security;
alter table public.customer_addresses enable row level security;

create policy "customers: a própria conta ou a administração"
  on public.customers for select to authenticated
  using (id = (select auth.uid()) or public.is_manager());
create policy "customers: criar a própria conta"
  on public.customers for insert to authenticated
  with check (id = (select auth.uid()));
create policy "customers: alterar a própria conta"
  on public.customers for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "customer_addresses: os próprios endereços"
  on public.customer_addresses for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));
create policy "customer_addresses: a administração lê"
  on public.customer_addresses for select to authenticated
  using (public.is_manager());

revoke all on public.customers, public.customer_addresses from public, anon, authenticated;
grant select on public.customers to authenticated;
grant insert (id, name, email, phone, marketing_consent) on public.customers to authenticated;
grant update (name, phone, marketing_consent, marketing_consent_at) on public.customers to authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;
