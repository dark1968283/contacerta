# Matriz de Rastreabilidade — ContaCerta

Liga cada requisito do PRD Técnico v1.2 à sua implementação. Atualizado a cada fase — nenhum RF deve ficar sem entrada ou justificação de adiamento.

| RF-ID | Requisito | Tabela | RPC/API | Rota | Componente | Teste |
|---|---|---|---|---|---|---|
| RF-01 | Registo/login/recuperação | `auth.users`, `public.users` | Supabase Auth + trigger `handle_new_user` | `/signup`, `/login` | `SignupPage`, `LoginPage` | pendente (secção 17 do prompt) |
| RF-02 | Login e recuperação | `auth.users` | Supabase Auth | `/login` | `LoginPage` | pendente |
| RF-03 | Criar negócio no 1º acesso | `businesses`, `business_users` | RPC `create_business_with_admin` | `/onboarding` | `OnboardingPage` | pendente |
| RF-04 | Criador = admin | `business_users` | RPC `create_business_with_admin` | `/onboarding` | — | pendente |
| RF-05 | 1 negócio por utilizador (MVP) | `business_users` | validação dentro da RPC (`raise exception` se já existir) | `/onboarding` | — | pendente |
| RF-10 | Criar/editar/desativar produto | `products` | RPC `create_product` (criação); `UPDATE` direto sob RLS (edição) | `/dashboard/produtos/novo`, `/dashboard/produtos/[id]` | `NewProductForm`, `EditProductForm`, `ToggleActiveButton` | pendente |
| RF-11 | Preço/stock nunca negativos | `products` | CHECK constraints na tabela + validação em `create_product`/`adjust_stock` | — | — | pendente |
| RF-12 | Custo opcional (nullable) | `products.cost_price` | — | `/dashboard/produtos/novo` | `NewProductForm` | pendente |
| RF-13 | Pesquisa de produtos por nome | `products` | `ilike` via Supabase client | `/dashboard/produtos?q=` | `ProdutosPage` | pendente |
| RF-20 | Registar venda paga | `sales`, `sale_items` | RPC `create_sale` | `/dashboard/vendas/nova` | `NewSaleForm` | pendente |
| RF-21 | Registar venda a crédito com cliente obrigatório | `sales`, `debts` | RPC `create_sale` | `/dashboard/vendas/nova` | `NewSaleForm` | pendente |
| RF-22 | Histórico de vendas | `sales` | — | `/dashboard/vendas` | `VendasPage` | pendente |
| RF-30 | Venda gera stock_movement (tipo venda) | `stock_movements` | RPC `create_sale` | `/dashboard/vendas/nova` | `NewSaleForm` | pendente |
| RF-31 | Entradas/ajustes manuais geram stock_movement | `stock_movements` | RPC `adjust_stock` | `/dashboard/produtos/[id]` | `StockAdjustmentForm` | pendente |
| RF-32 | Indicador "Stock baixo"/"Esgotado" | `products` | cálculo no componente | `/dashboard/produtos`, `/dashboard/produtos/[id]` | `StockBadge` | pendente |
| RF-40 | Criar/editar cliente | `customers` | `INSERT` (todos) / `UPDATE` (só admin), ambos sob RLS | `/dashboard/clientes/novo`, `/dashboard/clientes/[id]` | `NewCustomerForm`, `EditCustomerForm` | pendente |
| RF-41 | Ficha do cliente (comprado, dívida, histórico) | `customers`, `sales`, `debts` | — | `/dashboard/clientes/[id]` | `ClienteDetalhePage` | totais e última compra implementados; histórico detalhado adiado |
| RF-42 | Pesquisa por nome ou telefone | `customers` | `ilike` (name OR phone) via Supabase client | `/dashboard/clientes?q=` | `ClientesPage` | pendente |

## Requisitos ainda não implementados (fora do escopo das Fases 1-3)

RF-23 a RF-25 (detalhe/anulação/relatórios de vendas), RF-50 a RF-55 (pagamentos de dívida) e RF-60 a RF-62 (Dashboard) continuam planeados para as Fases 5 e 6.

## Como manter este ficheiro

Sempre que uma fase for concluída:
1. Adicionar uma linha por RF-ID coberto (não por ficheiro — um RF pode tocar vários ficheiros, listar os principais)
2. Preencher a coluna "Teste" com o nome do ficheiro/caso de teste real assim que a suite de testes existir (a partir da Fase 4, onde a atomicidade se torna crítica)
3. Nunca remover uma linha — se um requisito for descontinuado, marcar como "Removido do escopo em vX.X" em vez de apagar
