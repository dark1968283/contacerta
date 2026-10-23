-- ============================================================
-- 0020 — Vendas registadas sem internet (fila no telemóvel)
--
-- Cada venda criada no telemóvel leva um identificador próprio
-- (client_ref). Se a mesma venda for enviada duas vezes (por ex.
-- a rede cai a meio do envio e a app tenta de novo), o servidor
-- devolve a venda já existente em vez de criar um duplicado.
--
-- A hora da venda (p_sold_at) é a hora real em que foi feita no
-- telemóvel, aceite apenas se estiver nos últimos 7 dias e não
-- no futuro; caso contrário fica a hora do servidor.
--
-- Toda a validação (stock, cliente, permissões, assinatura)
-- continua a ser feita por public.create_sale.
-- ============================================================

alter table public.sales
  add column if not exists client_ref uuid;

create unique index if not exists uq_sales_business_client_ref
  on public.sales (business_id, client_ref)
  where client_ref is not null;

create or replace function public.create_sale_idempotent(
  p_business_id uuid,
  p_payment_method text,
  p_customer_id uuid,
  p_items jsonb,
  p_client_ref uuid,
  p_sold_at timestamptz default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
begin
  if public.current_user_role(p_business_id) is null then
    raise exception 'Sem permissão para registar vendas neste negócio';
  end if;

  if p_client_ref is null then
    raise exception 'Identificador da venda em falta';
  end if;

  -- Evita que dois envios simultâneos da mesma venda corram em paralelo.
  perform pg_advisory_xact_lock(hashtextextended(p_client_ref::text, 0));

  select * into v_sale
    from public.sales
   where business_id = p_business_id
     and client_ref = p_client_ref;

  if found then
    return v_sale;
  end if;

  v_sale := public.create_sale(p_business_id, p_payment_method, p_customer_id, p_items);

  update public.sales
     set client_ref = p_client_ref,
         created_at = case
           when p_sold_at is not null
            and p_sold_at <= now() + interval '5 minutes'
            and p_sold_at >= now() - interval '7 days'
           then least(p_sold_at, now())
           else created_at
         end
   where id = v_sale.id
  returning * into v_sale;

  update public.debts
     set created_at = v_sale.created_at
   where sale_id = v_sale.id;

  return v_sale;
end;
$$;

revoke execute on function public.create_sale_idempotent(uuid, text, uuid, jsonb, uuid, timestamptz) from public;
grant execute on function public.create_sale_idempotent(uuid, text, uuid, jsonb, uuid, timestamptz) to authenticated;
