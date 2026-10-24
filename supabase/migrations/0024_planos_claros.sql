-- ============================================================
-- ContaCerta — Planos claros
-- Migration: 0024_planos_claros.sql
--
-- Os limites guardados passam a ser exactamente os que a app aplica:
--   Grátis       1 utilizador · 5 produtos · 30 vendas/mês · 30 faturas/mês
--   Profissional 5 utilizadores (você + 4) · tudo o resto ilimitado
--   Empresarial  15 utilizadores (você + 14) · tudo o resto ilimitado
-- Clientes são ilimitados em todos os planos.
-- Também simplifica as descrições e as listas de funcionalidades,
-- para mostrarem só o que a app tem de facto. Preços não mudam.
-- ============================================================

update public.plans set
  description = 'Para experimentar e organizar um negócio pequeno.',
  limits = coalesce(limits, '{}'::jsonb)
           || '{"users": 1, "products": 5, "sales_per_month": 30, "invoices_per_month": 30, "clients": -1}'::jsonb,
  features = '["Vendas, stock, dívidas e clientes", "Funciona mesmo sem internet", "Recibos por WhatsApp e em PDF", "Relatório do mês em Excel e PDF"]'::jsonb
where slug = 'gratis';

update public.plans set
  description = 'Para negócios que crescem e têm funcionários.',
  limits = coalesce(limits, '{}'::jsonb)
           || '{"users": 5, "products": -1, "sales_per_month": -1, "invoices_per_month": -1, "clients": -1}'::jsonb,
  features = '["Tudo do Grátis, sem limites", "Faturas numeradas com o NUIT", "Equipa: você + 4 funcionários", "Avisos diários no telemóvel"]'::jsonb
where slug = 'profissional';

update public.plans set
  description = 'Para lojas maiores ou com várias pessoas a vender.',
  limits = coalesce(limits, '{}'::jsonb)
           || '{"users": 15, "products": -1, "sales_per_month": -1, "invoices_per_month": -1, "clients": -1}'::jsonb,
  features = '["Tudo do Profissional", "Equipa: você + 14 funcionários", "Suporte prioritário"]'::jsonb
where slug = 'empresarial';
