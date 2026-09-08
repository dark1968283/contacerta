# Arquitetura — ContaCerta

## Visão geral

```
Browser (PWA, mobile-first)
        │
        ▼
Next.js App Router (Vercel ou similar)
   ├── Server Components  → leituras diretas via Supabase (RLS aplica-se sempre)
   ├── Server Actions      → escritas (formulários) — nunca API routes REST à parte
   ├── Middleware          → renovação de sessão + proteção de rotas autenticadas
        │
        ▼
Supabase
   ├── Auth                → gestão de utilizadores, sessão via cookies
   ├── PostgreSQL           → dados operacionais, RLS multi-tenant
   └── RPC (funções SQL)   → toda a lógica financeira atómica (create_sale, etc.)
```

## Princípio central

**Os dados corretos vêm primeiro.** Nenhuma lógica de negócio crítica (vendas, stock, dívidas) vive no frontend. O frontend recolhe input e chama uma função RPC; toda a validação e atomicidade acontece dentro do Postgres. Isto significa que mesmo um bug de UI não consegue corromper dados financeiros.

## Porquê Server Actions em vez de API Routes

Reduz uma camada de indireção — o formulário chama diretamente uma função assíncrona do servidor, sem necessidade de gerir endpoints REST, serialização manual, nem `fetch` do lado do cliente. O Next.js App Router trata disto nativamente com progressive enhancement (funciona mesmo com JS desativado, relevante para redes móveis instáveis).

## Autorização — três camadas, nunca confiar só numa

1. **Middleware** — bloqueia acesso a rotas `/dashboard/*` e `/onboarding` sem sessão válida. Isto é só uma otimização de UX (evita o "flash" de conteúdo protegido); não é a fonte de verdade de segurança.
2. **RLS no Postgres** — a fonte de verdade real. Cada tabela com `business_id` só é visível/editável por membros desse negócio (função `is_member_of_business`). Um pedido direto à API do Supabase, contornando o frontend, continua protegido.
3. **Funções auxiliares de papel** (`current_user_role`) — usadas dentro de policies e RPCs para distinguir `admin` de `funcionario` sem duplicar essa lógica em cada tabela.

## Multi-tenancy

Um "negócio" (`businesses`) é o tenant. `business_users` é a tabela de associação que liga `users` a `businesses` com um `role`. O MVP restringe um utilizador a um único negócio (função `create_business_with_admin` rejeita criar um segundo), mas o schema já suporta multi-negócio sem alterações estruturais — só a remoção dessa restrição, quando/se isso entrar em escopo.

## Estrutura de pastas

```
src/
  app/
    (auth)/          rotas públicas: login, signup, e as suas server actions
    (dashboard)/      rotas protegidas, com layout que verifica negócio + nav mobile
    onboarding/       fora do grupo (dashboard) de propósito — ver nota abaixo
  lib/
    supabase/         clientes Supabase (browser, server, admin) + tipos
    types/            tipos TypeScript da base de dados
  components/
    ui/               componentes de interface reutilizáveis e genéricos
    layout/            componentes de estrutura (navegação, cabeçalhos)
supabase/
  migrations/          uma migration por fase de implementação, numeradas
docs/                  esta pasta
```

**Nota de decisão:** `onboarding` está fora do grupo de rotas `(dashboard)` deliberadamente. O layout de `(dashboard)` verifica se o utilizador já tem negócio associado e redireciona para `/onboarding` se não tiver — se `onboarding` estivesse dentro desse grupo, herdaria o mesmo layout e criaria um ciclo de redirecionamento infinito para qualquer utilizador novo.

## Base de dados — estado atual (Fases 1 a 4)

Ver `docs/DATABASE.md` para o detalhe completo. Resumo: `users`, `businesses`, `business_users` (Fase 1), `categories`, `products`, `stock_movements` (Fase 2), `customers` (Fase 3), todas com RLS por `business_id`.

## Fases seguintes (ver PRD v1.2 para requisitos completos)

| Fase | Conteúdo | Estado |
|---|---|---|
| 1 | Fundação: auth, negócio, multi-tenancy, RLS | ✅ Concluída |
| 2 | Categorias, produtos, stock, alertas | ✅ Concluída |
| 3 | Clientes: CRUD, pesquisa, ficha | ✅ Concluída (ficha com estrutura pronta, dados de compras/dívida adiados) |
| 4 | Vendas: `sales`, `sale_items`, `debts`, RPC `create_sale` completa (pago + crédito), stock_movements tipo venda | ✅ Concluída |
| 5 | Dívidas: RPC `register_debt_payment`, estados calculados | pendente |
| 6 | Dashboard financeiro real (vendas do dia, a receber, lucro bruto) | pendente |
| 7 | PWA (manifest, service worker, cache de assets) e otimização mobile | pendente |
| 8 | Monetização do SaaS via Zenofy (camada isolada, `subscription_payments`) | pendente |
