# ContaCerta — Project Handoff

Última atualização: 07 de setembro de 2026.

## Estado atual

As Fases 1 (fundação), 2 (produtos e stock), 3 (clientes) e 4 (vendas) estão concluídas. A Fase 5, pagamentos de dívidas, ainda não começou.

## Fase 4 implementada

- Migration `0004_fase4_vendas.sql` com `sales`, `sale_items` e `debts`.
- RPC `create_sale` atómica, suportando `pago` e `credito`.
- Crédito exige cliente do mesmo `business_id` e cria uma dívida pendente com `amount_paid = 0`.
- Cada venda cria itens com preço congelado e movimento `venda` negativo; o stock é alterado por `UPDATE ... WHERE stock_quantity >= quantidade`.
- RLS permite apenas leitura aos membros do negócio; as escritas financeiras não têm policies diretas e passam exclusivamente pela RPC.
- Rotas `/dashboard/vendas` e `/dashboard/vendas/nova`, mais totais e última compra na ficha de cliente.

## Próximo passo

Fase 5: registo de pagamentos de dívidas, atualização de estados e histórico de pagamentos. Não criar pagamentos diretamente na Fase 4.
