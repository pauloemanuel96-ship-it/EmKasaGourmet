-- =============================================================================
-- Emkasa Gourmet · 0005 · Reduz o que o visitante enxerga
-- 1) Produtores: visitante não lê mais a tabela (tinha observações internas e o
--    número da certificação). Passa a ler só a view v_public_producers.
-- 2) Estoque: visitante não lê mais o saldo exato. A loja só precisa saber se
--    o produto está disponível (v_product_availability.is_available).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Produtores
-- -----------------------------------------------------------------------------
drop policy "producers: leitura" on public.producers;

create policy "producers: equipe lê" on public.producers for select to authenticated
  using (public.is_staff());

revoke select on public.producers from anon;

-- View do dono (sem security_invoker) de propósito: é ela que decide o que sai.
-- Só colunas públicas, só produtores de produtos ativos. O selo usa a mesma
-- regra do bloqueio do termo "orgânico" (SECURITY_AND_PRIVACY §6).
create view public.v_public_producers as
select
  pr.id,
  pr.name,
  pr.kind,
  pr.city,
  (
    pr.certification in ('certificado_auditoria', 'certificado_participativo')
    and (pr.certification_valid_until is null or pr.certification_valid_until >= current_date)
  ) as organic_certified
from public.producers pr
where exists (
  select 1 from public.products p
  where p.producer_id = pr.id and p.status = 'active'
);

grant select on public.v_public_producers to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Estoque
-- -----------------------------------------------------------------------------
drop policy "stock_levels: leitura" on public.stock_levels;

create policy "stock_levels: equipe lê" on public.stock_levels for select to authenticated
  using (public.is_staff());

revoke select on public.stock_levels from anon;

-- A view deixa de rodar com as permissões de quem consulta (o visitante não lê
-- mais stock_levels), então ela mesma filtra: visitante só vê produto ativo e
-- nunca a quantidade; a equipe vê tudo.
drop view public.v_product_availability;

create view public.v_product_availability as
select
  p.id as product_id,
  p.status,
  p.stock_mode,
  case when public.is_staff() then coalesce(sum(s.available), 0) end as available_quantity,
  (p.status = 'active' and (p.stock_mode <> 'tracked' or coalesce(sum(s.available), 0) > 0)) as is_available
from public.products p
left join public.stock_levels s on s.product_id = p.id
where p.status = 'active' or public.is_staff()
group by p.id;

grant select on public.v_product_availability to anon, authenticated;
