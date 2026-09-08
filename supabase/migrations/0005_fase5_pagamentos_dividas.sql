-- ============================================================
-- ContaCerta — Fase 5: Pagamentos de dívidas
-- Tabela: debt_payments
-- RPC: register_debt_payment (atómica)
-- ============================================================

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('dinheiro', 'mpesa', 'emola', 'transferencia', 'outro')),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

create index idx_debt_payments_business_debt_created_at
  on public.debt_payments (business_id, debt_id, created_at desc);

-- O método é próprio do recebimento da dívida. A Fase 4 só modela se a
-- venda é paga ou a crédito, sem armazenar meio de pagamento de caixa.
create or replace function public.register_debt_payment(
  p_debt_id uuid,
  p_amount numeric,
  p_payment_method text
)
returns public.debts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt public.debts;
  v_remaining numeric(12, 2);
  v_new_amount_paid numeric(12, 2);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'O pagamento deve ser maior que zero';
  end if;

  if p_payment_method not in ('dinheiro', 'mpesa', 'emola', 'transferencia', 'outro') then
    raise exception 'Método de pagamento inválido';
  end if;

  -- O lock impede que dois pagamentos concorrentes usem o mesmo saldo.
  select * into v_debt
  from public.debts
  where id = p_debt_id
  for update;

  if v_debt.id is null then
    raise exception 'Dívida não encontrada';
  end if;

  if public.current_user_role(v_debt.business_id) is null then
    raise exception 'Sem permissão para registar pagamento nesta dívida';
  end if;

  if v_debt.status = 'paga' then
    raise exception 'Esta dívida já foi paga';
  end if;

  v_remaining := v_debt.total_amount - v_debt.amount_paid;
  if p_amount > v_remaining then
    raise exception 'O pagamento não pode ser superior ao saldo em aberto';
  end if;

  v_new_amount_paid := v_debt.amount_paid + p_amount;

  insert into public.debt_payments (business_id, debt_id, amount, payment_method, created_by)
  values (v_debt.business_id, v_debt.id, p_amount, p_payment_method, auth.uid());

  update public.debts
  set
    amount_paid = v_new_amount_paid,
    status = case
      when v_new_amount_paid = 0 then 'pendente'
      when v_new_amount_paid < v_debt.total_amount then 'parcial'
      else 'paga'
    end
  where id = v_debt.id
  returning * into v_debt;

  return v_debt;
end;
$$;

alter table public.debt_payments enable row level security;

-- Só a RPC escreve pagamentos; os membros do negócio podem consultar o
-- histórico da sua própria empresa.
create policy "debt_payments_select_members" on public.debt_payments
  for select using (public.is_member_of_business(business_id));
