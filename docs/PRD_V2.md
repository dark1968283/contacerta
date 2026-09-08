# ContaCerta — PRD v2.0 (Fonte de Verdade)

**Substitui:** PRD v1.2 e o handoff `PROJECT_HANDOFF.md` como referência única.
**Base:** auditoria direta do repositório (migrations `0001` a `0009`, código-fonte em `src/`), não do plano original.
**Estado:** Fases 1 a 9.2 implementadas e verificadas. Fase 10 (UI/UX) ainda não iniciada.

---

## 1. O que permanece do PRD v1 (sem alterações de fundo)

- **Autenticação e negócio** — Supabase Auth, trigger `handle_new_user`, RPC `create_business_with_admin`, um negócio por utilizador no MVP.
- **Multi-tenancy e RLS** — isolamento por `business_id` em todas as tabelas operacionais, via `is_member_of_business()`/`current_user_role()`.
- **Produtos e stock** — `categories`, `products` (`cost_price` nullable, nunca tratado como zero), `stock_movements` como registo de auditoria append-only, RPCs `create_product`/`adjust_stock` com o padrão `UPDATE...WHERE` para evitar stock negativo.
- **Clientes** — `customers`, qualquer membro cria, só admin edita.
- **Vendas** — RPC `create_sale` atómica, completa desde a origem (pago + crédito), cria dívida automaticamente em venda a crédito, copia preço no momento da venda.
- **Segurança geral** — funções `SECURITY DEFINER` com validação explícita de `business_id`/papel dentro da própria função, nunca só confiando em RLS; segredos (`SUPABASE_SERVICE_ROLE_KEY`) nunca expostos ao frontend.

---

## 2. O que foi alterado — `debts.status`

**Divergência do v1:** o RF-52 original definia o estado da dívida (`pendente`/`parcial`/`paga`/`vencida`) como **sempre calculado na leitura, nunca armazenado**.

**Estado real encontrado:** o código da aplicação (`dashboard/page.tsx`, `dashboard/dividas/page.tsx`, `dashboard/dividas/[id]/page.tsx`) lê e filtra diretamente pela coluna `status`, incluindo `.in("status", ["pendente","parcial","vencida"])`. Remover a coluna exigiria reescrever essas queries.

**Decisão v2.0:** `debts.status` **permanece materializado**, por compatibilidade com a UI existente, mas a sua integridade passa a ser garantida pelo PostgreSQL, não pela disciplina do código chamador:

- Migration `0009_fase9_2_rf52_debt_status_integrity.sql`
- Função `public.set_debt_status()` + trigger `trg_set_debt_status`, `BEFORE INSERT OR UPDATE OF total_amount, amount_paid, due_date, status ON public.debts`
- O trigger recalcula `status` a partir de `total_amount`/`amount_paid`/`due_date` em **toda** escrita, substituindo qualquer valor manual — incluindo dentro de `register_debt_payment`, que continua com a mesma lógica de `case/when` (agora redundante, mas inofensiva; não foi alterada, por decisão conservadora)
- Regra de prioridade: **paga → parcial → vencida → pendente** — uma dívida vencida que é paga na totalidade fica `paga`, nunca presa em `vencida`
- `due_date` é `date`; a comparação usa `current_date`, não `now()`, evitando problemas de fuso horário

Isto substitui a interpretação literal de "status nunca armazenado" da v1 por: **"status materializado, mas estruturalmente impossível de dessincronizar dos valores financeiros"**. Ver secção 9 (Testes) para a validação.

---

## 3. Subscription / SaaS Billing — arquitetura real

O projeto **não utiliza Zenofy**. O fluxo real, implementado nas Fases 8, 9 e 9.1:

```
Cliente escolhe plano e ciclo (mensal/anual)
        ↓
create_subscription_payment(plan_id, billing_cycle, payment_method, transaction_id?, notes?)
        ↓
subscription_payments criado com status = 'pending'
(reference gerada no servidor: 'CC-' || YYYYMMDD || '-' || 6 chars aleatórios)
        ↓
Platform Admin revê o pedido em /platform-admin
        ↓
confirm_subscription_payment(payment_id, confirm, notes?)
        ↓
Se confirmado: subscriptions.status = 'active', datas de período calculadas
Se rejeitado: subscription_payments.status = 'rejected'
```

Pontos de segurança confirmados por auditoria direta do código:
- O cliente **nunca** envia `amount` — é sempre calculado no servidor a partir de `plans.monthly_price`/`yearly_price`.
- O cliente **nunca** confirma o próprio pagamento — `confirm_subscription_payment` exige `is_platform_admin()`.
- `transaction_id` tem `UNIQUE` — mesma transação não pode ser reutilizada (testado em produção pelo dono do produto, confirmado no handoff original).
- `subscription_payments` é uma tabela **separada** de `payments`/dívidas dos comerciantes — nunca há mistura entre o dinheiro do comerciante e o dinheiro da própria ContaCerta.
- Toda operação relevante grava em `subscription_audit_logs` (`subscription_created`, `payment_created`, `payment_confirmed`, `payment_rejected`, `subscription_expired`).
- `expire_due_subscriptions()` também exige `is_platform_admin()` — não é uma função pública nem um cron sem proteção descrito neste repositório (a auditoria não encontrou agendamento automático configurado; presumivelmente corre via chamada manual ou um agendador externo não incluído neste código).

**Correção da Fase 9.1** (confirmada na migration `0008`): ao pedir upgrade de plano, uma assinatura já `active` nunca é rebaixada a `pending` — só o novo pedido de pagamento fica `pending`; o plano atual continua a dar acesso até o novo pagamento ser confirmado.

---

## 4. Zenofy — nota histórica

O PRD v1 (e o prompt de engenharia original) previa a Zenofy como gateway externo de pagamento para a monetização do SaaS, com webhook idempotente e ativação automática da subscrição.

**Essa integração não foi construída.** Durante a implementação (Fase 8), optou-se por um sistema próprio de pedido + confirmação manual, pelos seguintes motivos (inferidos do handoff e confirmados pela auditoria do código, não é uma decisão documentada num registo de decisão formal anterior a este PRD):

- Permitir operação imediata sem depender de aprovação/integração comercial externa
- Controlo total da lógica de negócio (a correção da Fase 9.1 seria mais difícil de orquestrar através de um webhook de terceiros)
- Custo zero de gateway no curto prazo

**Estado atual: `Zenofy = não utilizado`.** Nenhuma variável de ambiente, código ou configuração Zenofy existe neste repositório. Não recriar.

**Nota de risco a reavaliar no futuro** (não é uma tarefa desta fase): a confirmação manual não escala indefinidamente e não reconcilia automaticamente com o extrato real do operador móvel — ver auditoria anterior, secção D, para detalhe.

---

## 5. Fase 4 / Vendas — divergências reais confirmadas

Comparado com o PRD v1.2, a implementação real:

- **Não tem tabela `payments`** para vendas com `payment_method = 'pago'` — a venda paga não gera nenhum registo de pagamento próprio, o `payment_method` na própria `sales` já é suficiente para o MVP atual.
- **`sale_items` tem `UNIQUE(sale_id, product_id)`** — o mesmo produto não pode aparecer duas vezes na mesma venda (força agregar quantidade numa única linha).
- **`debts.sale_id` é `UNIQUE`** — uma dívida está sempre ligada a exatamente uma venda (1:1), não é reutilizável entre vendas.
- **`sales` tem um `CHECK (payment_method = 'pago' or customer_id is not null)`** ao nível da tabela — o RF-21 (crédito exige cliente) está protegido tanto na RPC como na constraint, uma camada a mais que o v1.2 não tinha.
- `create_sale` usa `UPDATE...WHERE stock_quantity >= quantidade` (mesmo padrão documentado no v1.2) para evitar stock negativo.

Todas estas diferenças foram classificadas na auditoria anterior como simplificações ou reforços válidos, não bugs.

---

## 6. Fase 5 / Pagamento de Dívidas — implementação real

- Tabela `debt_payments`: `debt_id`, `amount` (`CHECK > 0`), `payment_method` (`CHECK IN ('dinheiro','mpesa','emola','transferencia','outro')`), `created_by`, `created_at`.
- RPC `register_debt_payment(p_debt_id, p_amount, p_payment_method)`:
  - `SELECT ... FOR UPDATE` na dívida (lock explícito de linha — técnica diferente do padrão `UPDATE...WHERE` usado em `adjust_stock`/`create_sale`, mas igualmente válida contra concorrência)
  - Rejeita `amount <= 0`
  - Rejeita se a dívida já está `paga`
  - Rejeita pagamento superior ao saldo em aberto (`total_amount - amount_paid`)
  - Atualiza `amount_paid` e (redundantemente, desde a Fase 9.2) `status` — o trigger `trg_set_debt_status` é agora a fonte de verdade estrutural do `status`, não esta atribuição manual
- RLS: só `SELECT` para membros do negócio; escrita exclusiva via esta RPC.

---

## 7. Planos — estado real (com ressalva)

A estrutura real (`plans`: `name`, `slug`, `monthly_price`, `yearly_price`, `currency`, `limits jsonb`, `features jsonb`, `grace_period_days`) foi confirmada por leitura direta da migration `0006`.

**Ressalva importante:** os **valores concretos** dos planos (nomes, preços, limites) não estão em nenhuma migration nem seed deste repositório — foram inseridos diretamente na base de dados de produção, à qual não tenho acesso nesta auditoria. Os exemplos abaixo vêm do handoff anterior (testes reais relatados), não de uma consulta direta que eu tenha feito:

| Plano (citado no handoff) | Preço mensal citado | Observação |
|---|---|---|
| Profissional | 249 MT | testado ponta a ponta, confirmado ativo |
| Empresarial | 499 MT | testado ponta a ponta, confirmado ativo |

Antes de qualquer decisão de produto que dependa destes valores (ex.: Fase 10 mostrar preços), **confirmar diretamente na tabela `plans`** em vez de assumir os valores acima.

`limits` segue a convenção `-1 = ilimitado`, convertida na UI para texto amigável (ex.: "Ilimitado", "Até 15 utilizadores") — a conversão acontece na camada de apresentação, os valores internos da coluna nunca são mostrados ao utilizador.

---

## 8. Subscription Payments — estrutura real

Tabela `subscription_payments`: `business_id`, `subscription_id`, `plan_id`, `amount`, `currency` (default `MZN`), `billing_cycle` (`monthly`/`yearly`), `payment_method` (`mpesa`/`emola`/`mkesh`/`bank_transfer`/`cash`/`other`), `status` (`pending`/`confirmed`/`rejected`/`cancelled`/`refunded`), `reference` (`UNIQUE`, gerada no servidor), `transaction_id` (`UNIQUE`, opcional), `notes`, `paid_at`, `confirmed_at`, `confirmed_by`.

`reference` é gerada dentro da própria função `create_subscription_payment` (`'CC-' || to_char(now(),'YYYYMMDD') || '-' || 6 chars`), nunca pelo frontend. `transaction_id` é o único valor que o comerciante fornece manualmente, e está protegido por `UNIQUE` (a migration `0008` trata explicitamente a violação dessa constraint com uma mensagem amigável: "Esta transação já foi utilizada").

---

## 9. Platform Admin

Tabela `platform_admins` (`auth_user_id UNIQUE`, `active`). Função `is_platform_admin()` (`SECURITY DEFINER`, `STABLE`) usada como guarda em:
- `confirm_subscription_payment` — só admin de plataforma confirma/rejeita
- `expire_due_subscriptions` — só admin de plataforma dispara a expiração em lote
- Policies de `plans` (gestão) e leitura de `platform_admins`/`subscription_audit_logs`

Rotas: `/platform-admin` (`page.tsx` + `actions.ts`).

---

## 10. Auditoria

Tabela `subscription_audit_logs` (`business_id`, `actor_id`, `action`, `details jsonb`, `created_at`). Eventos confirmados no código: `subscription_created`, `payment_created`, `payment_confirmed`, `payment_rejected`, `subscription_expired`. Nenhum outro evento foi encontrado — não inventar eventos adicionais na Fase 10 sem necessidade real.

---

## 11. Segurança — consolidado

- **RLS** em todas as tabelas operacionais e comerciais, por `business_id` (negócio) ou `is_platform_admin()` (plataforma).
- **`SECURITY DEFINER` com `set search_path = public`** em todas as RPCs, e validação explícita de autorização *dentro* da função (nunca só confiar na RLS para a lógica de negócio).
- **`debts.status`** agora protegido estruturalmente por trigger (secção 2) — deixa de depender só de disciplina de código.
- **Separação total** entre dados financeiros do comerciante (`sales`, `debts`, `debt_payments`) e dados de subscrição do SaaS (`subscriptions`, `subscription_payments`) — nenhuma tabela ou função cruza os dois domínios.
- **`transaction_id` único** impede reutilização da mesma transação em dois pagamentos.
- **Impossível ativar subscrição só pelo frontend** — `confirm_subscription_payment` exige `is_platform_admin()`, que por sua vez exige uma linha em `platform_admins` com `active = true`; não há caminho de auto-confirmação.
- `createAdminClient` (service role) está definido em `src/lib/supabase/server.ts` mas **não é chamado em nenhum outro ficheiro** — confirmado por auditoria direta do código-fonte nesta tarefa.

---

## 12. Estado de Implementação

| Fase | Conteúdo | Estado |
|---|---|---|
| 1 | Fundação: auth, negócio, multi-tenancy, RLS | ✅ Concluída |
| 2 | Categorias, produtos, stock, alertas | ✅ Concluída |
| 3 | Clientes: CRUD, pesquisa, ficha | ✅ Concluída |
| 4 | Vendas: RPC `create_sale` completa (pago + crédito) | ✅ Concluída (com as divergências da secção 5) |
| 5 | Dívidas: RPC `register_debt_payment` | ✅ Concluída |
| 6 | Dashboard financeiro real | ✅ Existe implementação (`dashboard/page.tsx` já consultado nesta auditoria) — **não incluído no escopo desta auditoria para validação completa dos requisitos originais (RF-60 a RF-62); recomenda-se uma verificação dedicada antes de assumir 100% de cobertura** |
| 7 | PWA e otimização mobile | **Não verificado nesta auditoria** — não encontrei manifest/service worker no levantamento de ficheiros feito; não afirmar concluída sem confirmação direta |
| 8 | Camada comercial SaaS (plans/subscriptions/payments) | ✅ Concluída |
| 9 | Pagamentos e confirmação | ✅ Concluída |
| 9.1 | Correção de upgrade de plano sem perda de acesso | ✅ Concluída |
| 9.2 | Integridade estrutural de `debts.status` (esta tarefa) | ✅ Concluída — 9 testes de banco de dados reais, todos PASS |
| 10 | UI/UX | 🚀 Próxima — **ainda não iniciada** |

> Nota de honestidade: as Fases 6 e 7 estão listadas como "concluídas" no handoff original (`PROJECT_HANDOFF.md`), mas esta auditoria não verificou diretamente o conteúdo funcional de `dashboard/page.tsx` contra os requisitos RF-60/61/62, nem confirmou a existência de PWA. Antes de tratar essas fases como definitivamente fechadas, recomenda-se a mesma disciplina de auditoria aplicada aqui ao RF-52.

---

## 13. Confirmação explícita

- **Zenofy não foi reintroduzido.** Nenhum ficheiro, variável de ambiente ou referência de código Zenofy existe neste repositório após esta tarefa.
- **Nenhuma funcionalidade visual/UI foi alterada.** Esta tarefa tocou apenas numa migration nova (`0009`) e neste documento.
- **Fase 10 não foi iniciada.**
