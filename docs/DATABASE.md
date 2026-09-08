# Base de Dados — ContaCerta

Estado: Fase 1 apenas. Ver `supabase/migrations/0001_fase1_fundacao.sql` para o SQL completo e comentado.

## Tabelas (Fase 1)

### `users`
Perfil de utilizador, espelha `auth.users` 1:1. Criado automaticamente pelo trigger `on_auth_user_created` sempre que alguém se regista — nunca inserido manualmente pela aplicação.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | = auth.users.id |
| name | text | do metadata do signup |
| phone | text | opcional |
| email | text | único |
| created_at | timestamptz | |

### `businesses`
O tenant. Um negócio por utilizador no MVP.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| currency | text | default `'MZN'` |
| owner_id | uuid, FK → users | |
| created_at | timestamptz | |

### `business_users`
Associação utilizador↔negócio com papel.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses | |
| user_id | uuid, FK → users | |
| role | text | CHECK IN ('admin','funcionario') |
| created_at | timestamptz | UNIQUE(business_id, user_id) |

## Funções

### `handle_new_user()` — trigger
Corre `AFTER INSERT ON auth.users`. Cria a linha correspondente em `public.users`. `SECURITY DEFINER` porque a tabela `auth.users` não é acessível diretamente pelo utilizador anónimo/recém-criado.

### `is_member_of_business(p_business_id)` / `current_user_role(p_business_id)`
Funções auxiliares `STABLE SECURITY DEFINER`, usadas dentro das policies de RLS de **todas** as tabelas com `business_id` (presentes e futuras). Centralizam a lógica de "este utilizador pertence a este negócio / tem este papel" para não a duplicar em cada policy.

### `create_business_with_admin(p_name)` — RPC
Chamada pelo frontend via `supabase.rpc(...)` no onboarding. Atómica: cria o negócio e associa o criador como `admin` numa única transação implícita de função PL/pgSQL. Rejeita se o utilizador já tiver um negócio (regra do MVP).

## RLS — política aplicada

Todas as tabelas com `business_id` seguem o mesmo princípio, encapsulado em `is_member_of_business` / `current_user_role`:

```sql
using (public.is_member_of_business(business_id))          -- leitura: qualquer membro
using (public.current_user_role(business_id) = 'admin')    -- escrita sensível: só admin
```

`users` é a exceção — cada utilizador só vê e edita o seu próprio perfil (`id = auth.uid()`).

## Convenção de migrations

Uma migration por fase de implementação, numerada sequencialmente: `000N_faseN_<nome-curto>.sql`. Nunca editar uma migration já aplicada em produção — alterações posteriores entram como nova migration.

## Fase 2 — Produtos, Stock e Alertas

### `categories`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses | |
| name | text | UNIQUE(business_id, name) |
| created_at | timestamptz | |

### `products`
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses | |
| category_id | uuid, FK → categories | nullable |
| name | text | |
| cost_price | numeric(12,2) | **nullable** — RF-12, nunca tratado como zero |
| selling_price | numeric(12,2) | CHECK ≥ 0 |
| stock_quantity | integer | CHECK ≥ 0, default 0 |
| low_stock_threshold | integer | default 5 |
| is_active | boolean | default true |
| created_at / updated_at | timestamptz | `updated_at` mantido por trigger `set_products_updated_at` |

**Importante:** `stock_quantity` nunca é atualizado por um `UPDATE` solto vindo da aplicação — só pela RPC `create_product` (stock inicial) ou `adjust_stock` (entradas/ajustes). Isto é garantido por convenção no código da aplicação (a action `updateProduct` nunca envia este campo), não por uma restrição a nível de coluna no Postgres — ver nota de limitação abaixo.

### `stock_movements`
Registo **append-only** — nunca há `UPDATE` nem `DELETE`, só `INSERT` (sempre via RPC).

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK | |
| product_id | uuid, FK → products | |
| type | text | `'entrada'` \| `'venda'` \| `'ajuste'` |
| quantity | integer | CHECK ≠ 0; positivo ou negativo consoante o tipo |
| note | text | opcional |
| reference_type / reference_id | text / uuid | usado pela Fase 4 para ligar a uma venda |
| created_by | uuid, FK → users | |
| created_at | timestamptz | |

### RPCs da Fase 2

**`create_product(...)`** — cria o produto e, se houver stock inicial > 0, cria também o `stock_movement` tipo `entrada` correspondente, na mesma transação. Só admin.

**`adjust_stock(p_product_id, p_type, p_quantity, p_note)`** — usa o padrão `UPDATE products SET stock_quantity = stock_quantity + p_quantity WHERE id = ... AND stock_quantity + p_quantity >= 0` para garantir atomicidade sem janela de corrida (o mesmo padrão já combinado para `create_sale` na Fase 4). Só admin.

### Limitação conhecida (documentada, não corrigida na Fase 2)

A política de RLS de `UPDATE` em `products` é ao nível da linha, não da coluna — tecnicamente um `UPDATE` direto à tabela (fora da aplicação, ex. via API REST do Supabase) poderia alterar `stock_quantity` sem passar pela RPC, quebrando a auditoria em `stock_movements`. Mitigação atual: disciplina na camada de aplicação. Mitigação mais rigorosa (não implementada por estar fora do escopo do MVP): `REVOKE UPDATE (stock_quantity) ON products FROM authenticated` + `GRANT` seletivo, ou um trigger `BEFORE UPDATE` que rejeita alterações a `stock_quantity` fora de um contexto de função conhecido.

## Fase 3 — Clientes

### `customers`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses | |
| name | text | obrigatório |
| phone | text | opcional, indexado para pesquisa |
| email | text | opcional |
| address | text | opcional |
| created_by | uuid, FK → users | quem adicionou o cliente |
| created_at / updated_at | timestamptz | `updated_at` mantido pelo mesmo trigger `set_updated_at` usado em `products` |

**RLS — nuance importante desta tabela:** ao contrário de `products` (onde só admin escreve), `customers` distingue leitura/inserção de edição:
- `select` — qualquer membro do negócio
- `insert` — qualquer membro (admin **ou** funcionário) — reflete a permissão do PRD de que a equipa toda pode captar um cliente novo no balcão
- `update` — só admin

Não existe policy de `delete` de propósito — o MVP não remove clientes, para evitar registos órfãos quando `sales`/`debts` existirem (Fases 4/5) e referenciarem este cliente.

RF-41 (ficha do cliente: total comprado, dívida atual, última compra, histórico de produtos) tem a página estruturada mas os dados dependem de `sales` (Fase 4) e `debts` (Fase 5) — por agora mostra placeholders explícitos em vez de valores inventados.

## Índices (Fase 1 + Fase 2 + Fase 3)

```sql
business_users(user_id)
business_users(business_id)
categories(business_id)
products(business_id, name)
stock_movements(business_id, product_id)
customers(business_id, name)
customers(business_id, phone)
```

## Fase 4 — Vendas

### `sales` e `sale_items`

`sales` guarda o cabeçalho, o método de pagamento (`pago` ou `credito`), cliente opcional para pagamentos imediatos e obrigatório para crédito, total e autor. `sale_items` guarda cada produto, quantidade, preço unitário e subtotal no momento da venda; preços históricos nunca dependem do preço atual do produto.

### `debts`

Cada venda a crédito cria exatamente uma dívida associada à venda, cliente e negócio. Começa com `amount_paid = 0` e estado `pendente`. A tabela existe nesta fase para manter a operação de crédito consistente; o registo de pagamentos é escopo da Fase 5.

### `create_sale(p_business_id, p_payment_method, p_customer_id, p_items)`

RPC `SECURITY DEFINER` que verifica associação ao negócio, cliente, itens e stock. Cria a venda, debita stock com `UPDATE ... WHERE stock_quantity >= quantidade`, adiciona `sale_items`, escreve movimentos `venda` e cria a dívida para crédito. Tudo ocorre numa única transação de PostgreSQL: qualquer erro lança uma exceção e reverte todos os passos.

RLS permite leitura apenas a membros do mesmo negócio em `sales`, `sale_items` e `debts`. Não existem policies de escrita direta; a criação é exclusivamente pela RPC.
