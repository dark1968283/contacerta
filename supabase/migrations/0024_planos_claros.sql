-- ============================================================
-- ContaCerta — Planos claros
-- Migration: 0024_planos_claros.sql
--
-- Os limites guardados passam a ser exactamente os que a app aplica:
--   Grátis       só você · 5 produtos · 30 vendas/mês · 30 facturas/mês
--   Profissional você + 4 funcionários · sem limite no resto
--   Empresarial  você + 14 funcionários · sem limite no resto
-- Clientes sem limite em todos os planos.
-- Cada plano lista as suas vantagens por extenso. Preços não mudam.
-- ============================================================

update public.plans set
  description = 'Para começar e organizar um negócio pequeno.',
  limits = coalesce(limits, '{}'::jsonb)
           || '{"users": 1, "products": 5, "sales_per_month": 30, "invoices_per_month": 30, "clients": -1}'::jsonb,
  features = '["Registar vendas e ver o lucro", "Controlar o stock e as dívidas dos clientes", "Funciona mesmo sem internet", "Recibos por WhatsApp e em PDF", "Relatório do mês em Excel e PDF"]'::jsonb
where slug = 'gratis';

update public.plans set
  description = 'Para negócios que crescem e têm funcionários.',
  limits = coalesce(limits, '{}'::jsonb)
           || '{"users": 5, "products": -1, "sales_per_month": -1, "invoices_per_month": -1, "clients": -1}'::jsonb,
  features = '["Produtos, vendas e facturas sem limite", "Até 4 funcionários a vender na mesma conta", "Facturas numeradas com o NUIT do negócio", "Aviso todas as manhãs no celular: vendas, stock e dívidas", "Lucro, stock, dívidas e relatórios em Excel e PDF", "Funciona mesmo sem internet"]'::jsonb
where slug = 'profissional';

update public.plans set
  description = 'Para lojas maiores, com muitas pessoas a vender.',
  limits = coalesce(limits, '{}'::jsonb)
           || '{"users": 15, "products": -1, "sales_per_month": -1, "invoices_per_month": -1, "clients": -1}'::jsonb,
  features = '["Produtos, vendas e facturas sem limite", "Até 14 funcionários a vender na mesma conta", "Facturas numeradas com o NUIT do negócio", "Aviso todas as manhãs no celular: vendas, stock e dívidas", "Lucro, stock, dívidas e relatórios em Excel e PDF", "Atendimento prioritário pelo WhatsApp"]'::jsonb
where slug = 'empresarial';
