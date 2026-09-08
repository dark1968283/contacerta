-- ============================================================
-- ContaCerta — Fase 9.2
-- Integridade estrutural de debts.status (correção do RF-52)
--
-- CONTEXTO: a auditoria confirmou que debts.status é lido diretamente
-- por dashboard/page.tsx, dashboard/dividas/page.tsx e
-- dashboard/dividas/[id]/page.tsx (com filtros .in("status", [...])).
-- Remover a coluna exigiria refatorar essas queries — fora do escopo
-- desta correção. Decisão: MANTER a coluna materializada, mas torná-la
-- estruturalmente impossível de dessincronizar dos valores financeiros,
-- através de um trigger que recalcula `status` em toda escrita,
-- substituindo qualquer valor manual (incluindo dentro de
-- register_debt_payment, que continua a funcionar sem alterações —
-- ver nota no fim deste ficheiro).
-- ============================================================

create or replace function public.set_debt_status()
returns trigger
language plpgsql
as $$
begin
  -- Prioridade de negócio (definida explicitamente, não inferida):
  -- 1. paga    — quitada, mesmo que já tenha estado vencida no passado
  -- 2. parcial — tem pagamento registado mas não está quitada
  -- 3. vencida — nada pago (ou pagamento parcial já coberto acima) e passou do prazo
  -- 4. pendente — sem pagamento, dentro do prazo (ou sem prazo definido)
  --
  -- O CHECK "amount_paid <= total_amount" já existente na tabela garante
  -- que amount_paid nunca ultrapassa total_amount — por isso ">=" abaixo
  -- na prática só é atingido quando são iguais, mas mantém-se ">=" por
  -- segurança semântica (não depende de assumir que o CHECK nunca muda).
  if new.amount_paid >= new.total_amount then
    new.status := 'paga';
  elsif new.amount_paid > 0 then
    new.status := 'parcial';
  elsif new.due_date is not null and new.due_date < current_date then
    new.status := 'vencida';
  else
    new.status := 'pendente';
  end if;

  return new;
end;
$$;

comment on function public.set_debt_status() is
  'Recalcula debts.status a partir de amount_paid/total_amount/due_date em toda escrita, ignorando qualquer valor manual atribuído a status. due_date é `date`; a comparação usa current_date (não now()) para evitar problemas de fuso horário.';

drop trigger if exists trg_set_debt_status on public.debts;
create trigger trg_set_debt_status
  before insert or update of total_amount, amount_paid, due_date, status
  on public.debts
  for each row
  execute function public.set_debt_status();

comment on trigger trg_set_debt_status on public.debts is
  'RF-52: garante que debts.status nunca diverge dos valores financeiros, mesmo perante um UPDATE manual que tente definir status diretamente (ex.: UPDATE debts SET status = ''paga'').';

-- ------------------------------------------------------------
-- Nota sobre register_debt_payment (migration 0005): NÃO foi alterada.
-- A função continua a definir `status` explicitamente no seu próprio
-- UPDATE (case/when idêntico ao do trigger) — isso é agora redundante,
-- mas inofensivo: o trigger recalcula e sobrepõe o mesmo valor correto
-- de qualquer forma. Optou-se por não tocar numa função já validada em
-- produção só para remover uma redundância cosmética (regra "trabalhar
-- de forma conservadora" — Parte 7 do handoff desta fase).
-- ------------------------------------------------------------
