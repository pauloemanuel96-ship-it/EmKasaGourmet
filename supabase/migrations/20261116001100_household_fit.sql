-- =============================================================================
-- Emkasa Gourmet — Migration 0011: "serve para a minha casa?" (D-044)
-- Cruza as pessoas da conta com a ficha de cada produto. A conta é feita aqui
-- no banco, com regra fixa (RN de alergênicos): nenhuma IA decide se é seguro.
-- =============================================================================

-- Alergênicos que andam juntos. Quem não pode glúten não pode trigo, e a
-- regra vale nos dois sentidos, por cautela.
create table public.allergen_groups (
  parent_code text not null references public.allergens (code) on delete cascade,
  child_code  text not null references public.allergens (code) on delete cascade,
  primary key (parent_code, child_code)
);
alter table public.allergen_groups enable row level security;
create policy "allergen_groups: leitura" on public.allergen_groups for select to anon, authenticated
  using (true);
create policy "allergen_groups: gestores escrevem" on public.allergen_groups for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
grant select on public.allergen_groups to anon, authenticated;
grant insert, update, delete on public.allergen_groups to authenticated;

insert into public.allergen_groups (parent_code, child_code) values
  ('gluten', 'trigo'), ('gluten', 'centeio'), ('gluten', 'cevada'), ('gluten', 'aveia'),
  ('castanhas', 'amendoa'), ('castanhas', 'avela'), ('castanhas', 'castanha_de_caju'),
  ('castanhas', 'castanha_do_para'), ('castanhas', 'macadamia'), ('castanhas', 'nozes'),
  ('castanhas', 'peca'), ('castanhas', 'pistache'), ('castanhas', 'pinoli')
on conflict do nothing;

-- Para cada produto ativo e cada pessoa da MINHA casa, o que impede ou põe em
-- dúvida. Só devolve problema; quem não aparece, serve. Ordem de gravidade:
--   blocked  contém ou pode conter algo que a pessoa não pode ("pode conter" bloqueia igual)
--   unknown  a pessoa tem restrição e a ficha de alergênicos ainda não foi validada
--   diet     a dieta da pessoa não está confirmada por selo aprovado
-- security invoker: o RLS garante que só entram as pessoas da própria conta.
create or replace function public.household_fit()
returns table (product_slug text, member_id uuid, member_name text, verdict text, reasons text[])
language sql
stable
set search_path = ''
as $$
  with m as (
    select hm.id, hm.name, hm.allergies, hm.diet
      from public.household_members hm
     where hm.customer_id = (select auth.uid())
  ),
  p as (
    select pr.id, pr.slug, pr.allergens_validated_at
      from public.products pr
     where pr.status = 'active'
  ),
  blocked as (
    select p.slug, m.id, m.name,
           array_agg(distinct
             (case pa.presence when 'contains' then 'contém ' else 'pode conter ' end) || lower(a.name)
           ) as reasons
      from m
      cross join p
      join public.product_allergens pa on pa.product_id = p.id
      join public.allergens a on a.id = pa.allergen_id
     where exists (
             select 1 from unnest(m.allergies) as ma(code)
              where ma.code = a.code
                 or exists (
                      select 1 from public.allergen_groups g
                       where (g.parent_code = ma.code and g.child_code = a.code)
                          or (g.parent_code = a.code and g.child_code = ma.code)
                    )
           )
     group by p.slug, m.id, m.name
  ),
  unknown as (
    select p.slug, m.id, m.name
      from m cross join p
     where cardinality(m.allergies) > 0
       and p.allergens_validated_at is null
       and not exists (select 1 from blocked b where b.slug = p.slug and b.id = m.id)
  ),
  diet as (
    select p.slug, m.id, m.name, lower(dl.name) as diet_name
      from m
      cross join p
      join public.diet_labels dl on dl.code = m.diet
     where m.diet <> 'sem_restricao'
       and not exists (
             select 1 from public.product_diet_labels pdl
               join public.diet_labels l on l.id = pdl.label_id
              where pdl.product_id = p.id
                and pdl.approved_at is not null
                and (l.code = m.diet or (m.diet = 'vegetariano' and l.code = 'vegano'))
           )
       and not exists (select 1 from blocked b where b.slug = p.slug and b.id = m.id)
       and not exists (select 1 from unknown u where u.slug = p.slug and u.id = m.id)
  )
  select slug, id, name, 'blocked', reasons from blocked
  union all
  select slug, id, name, 'unknown', array['ficha de alergênicos em revisão'] from unknown
  union all
  select slug, id, name, 'diet', array['não confirmado como ' || diet_name] from diet;
$$;

revoke execute on function public.household_fit() from public, anon;
grant execute on function public.household_fit() to authenticated;
