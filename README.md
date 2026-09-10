# Codeflow

Gestão de tarefas com padrão estruturado de branches:

```
{tipo}/{num-task}-{slug}
```

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (troque `DATABASE_URL` para Postgres quando quiser)

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## Scripts úteis

- `npm run test:branch` — testes do domínio de nomenclatura
- `npm run db:seed` — DataTrade, PrimiciaFlex e tarefas de exemplo

## Seção 10 coberta

- Tipos de branch + tabela de referência
- `generateSlug` centralizado
- Sugestão de tipo (IA heurística) sem impor escolha
- Formato global/por projeto
- Validação, edição manual, copiar branch, timeline e memória técnica
