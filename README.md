# RachaConta — Frontend

Interface web do **RachaConta**, aplicação para divisão de contas e gestão de despesas compartilhadas com integração Pix (Copia e Cola e QR Code).

## Stack Tecnológica

- **Framework:** Next.js 16 (App Router, Turbopack, static export: `output: "export"`)
- **Linguagem:** TypeScript
- **Biblioteca de UI:** React 19
- **Estilização:** Tailwind CSS v4
- **Gerenciamento de Estado de Servidor / Cache:** TanStack Query v5 (`@tanstack/react-query`)
- **Testes:** Vitest + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`)
- **Ícones & Gráficos:** Lucide React, Recharts, QRCode.react

## Variáveis de Ambiente

As variáveis de ambiente do frontend são configuradas via `.env.local` (ou no ambiente de build):

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL base da API backend | `http://localhost:5080` |
| `NEXT_PUBLIC_BASE_PATH` | Caminho base para deploy estático (ex.: GitHub Pages) | `""` (vazio) |

### Executando com a API Local

A API backend roda por padrão em `http://localhost:5080`. Para apontar o frontend local para ela, crie ou edite `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5080
NEXT_PUBLIC_BASE_PATH=
```

## Scripts Disponíveis

```bash
# Inicia o servidor de desenvolvimento com Turbopack
npm run dev

# Valida tipos e gera o export estático em out/
npm run build

# Executa o linter ESLint
npm run lint

# Executa a suíte de testes com Vitest
npm test

# Executa os testes no modo watch interativo
npm run test:watch
```

## Estrutura do Projeto

```text
src/
├── app/                  # Rotas e convenções do Next.js App Router
│   ├── layout.tsx        # Layout raiz com tema e QueryProvider
│   ├── loading.tsx       # Estado de carregamento global da rota
│   ├── error.tsx         # Boundary de erro de rota (pt-BR)
│   ├── global-error.tsx  # Fallback crítico global (com <html> e <body>)
│   ├── page.tsx          # Landing page
│   ├── rachar/           # Criação e fluxo rápido de divisão (Módulo 1)
│   ├── r/                # Visualização pública e administração de splits
│   ├── despesas/         # Módulo de grupos e despesas recorrentes (Módulo 2)
│   ├── termos/           # Termos de uso
│   └── privacidade/      # Política de privacidade
├── components/           # Componentes reutilizáveis
│   ├── ui/               # Primitivas (Badge, Modal, Select, Skeleton, Toast, etc.)
│   ├── despesas/         # Componentes específicos de despesas e grupos
│   ├── splits/           # Modais e utilitários de divisão Pix
│   ├── Navbar.tsx        # Navegação principal
│   └── Footer.tsx        # Rodapé
├── lib/                  # Camada de lógica e integração
│   ├── api.ts            # Cliente HTTP tipado para a API backend
│   ├── storage.ts        # Helper seguro e SSR-safe para localStorage
│   ├── query/            # Camada de dados com TanStack Query
│   │   ├── provider.tsx  # Wrapper QueryProvider com defaults (no-retry em 4xx, staleTime)
│   │   ├── keys.ts       # Fábrica centralizada de query keys tipadas
│   │   ├── splits.ts     # Hooks e mutations para o domínio de splits
│   │   ├── groups.ts     # Hooks e mutations para grupos, despesas, saldos e membros
│   │   └── index.ts      # Re-export da camada de dados
│   ├── routes.ts         # Utilitários de roteamento e paths com base path
│   └── formatters.ts     # Formatadores de moeda (BRL), data e porcentagem
└── test/                 # Configurações e testes unitários/integração
    ├── setup.ts          # Setup do Vitest com @testing-library/jest-dom
    └── smoke.test.tsx    # Teste de fumaça de ambiente e componentes
```

## Camada de Dados (Data Layer)

A camada de dados está localizada em `src/lib/query/` e provê hooks tipados sobre o cliente HTTP (`src/lib/api.ts`).

### Configurações Padrão (`QueryProvider`)

- `staleTime: 60000` (1 minuto de cache fresco por padrão).
- Não repete requisições com falha 4xx (`ApiError.status >= 400 && < 500`).
- Sem refetch automático indesejado no foco de janela (`refetchOnWindowFocus: false`).
- Mutações sem retry automático (`retry: false`).

### Exemplos de Uso

#### Consultando dados de um grupo e despesas

```tsx
import { useGroup, useExpenses, useBalances } from '@/lib/query';

export function GroupOverview({ groupId }: { groupId: string }) {
  const { data: group, isPending: isGroupLoading } = useGroup(groupId);
  const { data: expenses } = useExpenses(groupId);
  const { data: balances } = useBalances(groupId);

  if (isGroupLoading) return <p>Carregando grupo...</p>;

  return (
    <div>
      <h1>{group?.name}</h1>
      <p>Total de despesas: {expenses?.length ?? 0}</p>
    </div>
  );
}
```

#### Executando mutações com invalidação automática de cache

```tsx
import { useCreateExpense } from '@/lib/query';

export function AddExpenseButton({ groupId }: { groupId: string }) {
  const createExpense = useCreateExpense({
    onSuccess: () => {
      // O cache de despesas, saldos e estatísticas do grupo é automaticamente invalidado!
    },
  });

  const handleAdd = () => {
    createExpense.mutate({
      groupId,
      data: {
        description: 'Almoço',
        amount: 80.0,
        date: '2026-10-21',
        category: 'Food',
        paidByMemberId: 'member-1',
        shareMode: 'Equal',
        shares: [{ memberId: 'member-1' }, { memberId: 'member-2' }],
      },
    });
  };

  return (
    <button onClick={handleAdd} disabled={createExpense.isPending}>
      {createExpense.isPending ? 'Salvando...' : 'Adicionar Despesa'}
    </button>
  );
}
```
