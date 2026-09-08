# ContaCerta

O seu negócio. Sob controlo.

SaaS de gestão de vendas, stock, clientes e dívidas para pequenos negócios em Moçambique.

**Estado atual: Fase 2 — Produtos, Stock e Alertas concluída.** Fase 1 (Auth, negócio, multi-tenancy, RLS) e Fase 2 (categorias, produtos, entradas/ajustes de stock, alertas de stock baixo/esgotado) prontas. As restantes fases (Clientes, Vendas, Dívidas, Dashboard, PWA, Monetização) seguem o plano em `docs/ARCHITECTURE.md`.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Auth + PostgreSQL + RLS)
- Tailwind CSS
- PWA (a partir da Fase 7)

## Pré-requisitos

- Node.js 20+
- Uma conta e projeto Supabase (gratuito é suficiente para desenvolvimento)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional, mas recomendado para correr migrations localmente)

## Instalação

```bash
npm install
cp .env.example .env.local
```

Preenche `.env.local` com os dados do teu projeto Supabase (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

## Base de dados (migrations)

As migrations vivem em `supabase/migrations/`. Para aplicar:

**Opção A — Supabase CLI (recomendado):**
```bash
npx supabase login
npx supabase link --project-ref <o-teu-project-ref>
npx supabase db push
```

**Opção B — manual:** copia o conteúdo de `supabase/migrations/0001_fase1_fundacao.sql` e corre no SQL Editor do painel Supabase.

Depois de aplicar as migrations, gera os tipos TypeScript reais (substitui os tipos manuais em `src/lib/types/database.types.ts`):

```bash
npx supabase gen types typescript --project-id <o-teu-project-ref> > src/lib/types/database.types.ts
```

## Correr localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Deve redirecionar para `/login`.

Fluxo de teste manual da Fase 1:
1. Criar conta em `/signup`
2. É redirecionado para `/onboarding` — criar o negócio
3. É redirecionado para `/dashboard` — deve mostrar saudação com o nome e o nome do negócio no topo

Fluxo de teste manual da Fase 2 (como admin):
1. Ir a `/dashboard/produtos/categorias`, criar uma categoria
2. Ir a `/dashboard/produtos/novo`, criar um produto com stock inicial > 0
3. Confirmar que aparece na lista `/dashboard/produtos` com o stock correto
4. Abrir o produto, registar uma "Entrada" de stock — confirmar que o stock aumenta e aparece no histórico
5. Registar um "Ajuste" negativo maior que o stock disponível — deve ser rejeitado com mensagem de erro
6. Reduzir o `low_stock_threshold` para um valor abaixo do stock atual, ou fazer ajustes até o stock chegar a 0 — confirmar que aparecem os badges "Stock baixo" / "Esgotado"

## Verificações

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # build de produção
```

Todas as três passam sem erros no estado atual do repositório.

## Estrutura

Ver `docs/ARCHITECTURE.md` para a visão geral da arquitetura e `docs/DATABASE.md` para o schema. `docs/TRACEABILITY.md` liga cada requisito do PRD à sua implementação.
