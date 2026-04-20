# Painel de Controle — Dashboard Sebrae PR

Dashboard web com login corporativo, alimentado em tempo real pela planilha
hospedada no SharePoint/OneDrive, com geração de relatórios em PDF sob demanda.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn-style UI components
- **Recharts** (gráficos)
- **NextAuth.js** (autenticação via credenciais)
- **Prisma + PostgreSQL** (SQLite em dev é possível trocando o provider)
- **Microsoft Graph API** (leitura da planilha do SharePoint/OneDrive)
- **jsPDF + jsPDF-autoTable** (relatórios PDF)
- **React Query** (polling + cache)

## Pré-requisitos

- Node.js 18.18+ (ou 20+)
- npm 9+
- PostgreSQL (local via Docker, ou um banco remoto gratuito no [Neon](https://neon.tech)/[Supabase](https://supabase.com))
- (Opcional para dados reais) App registrado no Entra ID (Azure AD)

## Setup rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# edite .env.local com seus valores (veja seção "Azure" abaixo)

# 3. Criar o banco e rodar as migrations
npx prisma db push

# 4. Criar o usuário administrador inicial
npm run db:seed

# 5. Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000 — você será direcionado ao login.

**Credenciais iniciais:** as definidas em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
no `.env.local` (padrão: `juliano.lima@sebrae.com.br` / `ChangeMe@123`). **Troque
a senha no primeiro acesso** pela página de Usuários.

## Modo mock (sem Azure)

Com `USE_MOCK_DATA="true"` no `.env.local`, o sistema usa dados sintéticos de
28 projetos de exemplo. Útil para validar a UI antes de configurar o Graph.

## Conectando à planilha real (Microsoft Graph)

1. Acesse https://portal.azure.com → **Entra ID** → **App registrations** → **New registration**
2. Em **Certificates & secrets** → **New client secret**. Anote o valor.
3. Em **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions**
   - `Files.Read.All`
   - `Sites.Read.All`
4. Clique em **Grant admin consent** (requer um admin do tenant).
5. Copie `Directory (tenant) ID`, `Application (client) ID` e o secret para o `.env.local`:
   ```
   AZURE_TENANT_ID="..."
   AZURE_CLIENT_ID="..."
   AZURE_CLIENT_SECRET="..."
   SHAREPOINT_USER_UPN="rdsiqueira@pr.sebrae.com.br"
   SHAREPOINT_FILE_PATH="/Documents/CaminhoDaPlanilha.xlsx"
   SHAREPOINT_WORKSHEET="Geral Projetos"
   USE_MOCK_DATA="false"
   ```
6. Faça uma sincronização manual chamando `POST /api/sync` ou apenas abra o
   dashboard (ele dispara o sync automaticamente no primeiro acesso).

### Como descobrir `SHAREPOINT_FILE_PATH`

Abra o OneDrive do usuário dono do arquivo e navegue até a planilha. O caminho
relativo à raiz do OneDrive é o que vai nessa variável (ex.:
`/Documents/Relatórios/Projetos 2025.xlsx`).

## Como funciona a "tempo real"

A UI usa React Query com `refetchInterval` (30s por padrão). Cada requisição
a `/api/data` verifica se a última sincronização com o Graph é mais antiga
que `SYNC_INTERVAL_SECONDS` (60s padrão) — se for, dispara um upsert no banco.
Assim:

- A UI é reativa a qualquer usuário com a aba aberta.
- O Graph só é chamado quando realmente precisa (respeitando limites de cota).
- Os dados ficam persistidos no banco, sobrevivendo a reinícios e restart do
  servidor.

Para um modo "tempo real verdadeiro" (websocket ou SSE), basta substituir o
polling por uma conexão persistente — a estrutura já está pronta.

## Estrutura

```
src/
├── app/
│   ├── api/            # rotas REST (auth, data, sync, users)
│   ├── login/          # tela de login pública
│   ├── (app)/          # área autenticada (layout com sidebar)
│   │   ├── dashboard/
│   │   ├── reports/
│   │   └── users/
│   └── layout.tsx
├── components/
│   ├── ui/             # botão, input, card, label
│   ├── dashboard/      # KPIs, gráficos, tabela, filtros
│   └── layout/         # sidebar
├── hooks/              # useProjectData (polling + React Query)
├── lib/
│   ├── auth.ts         # NextAuth options
│   ├── prisma.ts       # cliente Prisma singleton
│   ├── graph.ts        # cliente Microsoft Graph
│   ├── sync.ts         # lógica de upsert
│   ├── pdf.ts          # geração de relatório PDF
│   └── utils.ts
├── middleware.ts       # guarda de rotas
└── types/
```

## Scripts

| comando | descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npm run db:push` | Aplica o schema Prisma ao banco |
| `npm run db:seed` | Cria o usuário admin inicial |
| `npm run lint` | Linter |

## Deploy no Vercel

### 1. Criar o banco no Neon (grátis)

1. Acesse [console.neon.tech](https://console.neon.tech) e faça login com o GitHub.
2. Crie um projeto e copie a **Connection string** (formato `postgresql://user:senha@host/db?sslmode=require`).

### 2. Aplicar schema e seed no banco remoto (uma vez, do seu computador)

```bash
# Crie/edite .env.local com o DATABASE_URL do Neon
echo 'DATABASE_URL="postgresql://user:senha@host/db?sslmode=require"' >> .env.local

npx prisma db push
npm run db:seed
```

### 3. Importar o projeto no Vercel

1. [vercel.com/new](https://vercel.com/new) → selecione o repositório.
2. Em **Environment Variables → Import .env**, faça upload de um `.env` com:
   ```
   DATABASE_URL=<connection do Neon>
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://seu-projeto.vercel.app
   USE_MOCK_DATA=true
   SEED_ADMIN_EMAIL=juliano.lima@sebrae.com.br
   SEED_ADMIN_NAME=Juliano Lima
   SEED_ADMIN_PASSWORD=ChangeMe@123
   CRON_SECRET=<openssl rand -base64 32>
   ```
3. Clique em **Deploy**.

### 4. (Opcional) Conectar ao SharePoint real

Adicione as variáveis `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`,
`SHAREPOINT_USER_UPN`, `SHAREPOINT_FILE_PATH`, `SHAREPOINT_WORKSHEET` no Vercel,
mude `USE_MOCK_DATA=false` e faça **Redeploy**.

O arquivo `vercel.json` já registra um **Cron Job a cada 5 minutos** em
`/api/sync/cron`, que mantém o banco em dia com a planilha mesmo sem usuários
navegando no dashboard.

## Usando SQLite em dev (alternativa a Postgres local)

Em `prisma/schema.prisma`, troque:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
E no `.env.local`: `DATABASE_URL="file:./dev.db"`. Não esqueça de reverter antes
de fazer deploy em produção.

## Segurança

- Senhas são armazenadas com **bcrypt** (custo 12).
- JWT session com expiração de 8h.
- Middleware bloqueia todas as rotas autenticadas; rotas `/api/users` exigem
  perfil ADMIN.
- Log de auditoria em `AuditLog` para criação/edição/remoção de usuários.
- Recomenda-se rodar sob HTTPS e colocar `NEXTAUTH_SECRET` em um secret manager
  em produção.
