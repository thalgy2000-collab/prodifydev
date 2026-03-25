

## Melhorias no App: Sidebar, Pesquisa, Dark Mode, Nome no Cadastro e Logout

### Resumo

Cinco melhorias interconectadas: nova sidebar para o PortfolioPage, pesquisa de produtos, dark mode refinado, campo de nome no cadastro, e logout com toast.

---

### 1. Campo "Nome completo" no Cadastro

**Arquivo:** `src/pages/AuthPage.tsx`

- Adicionar campo "Nome completo" no formulário de cadastro (visivel apenas quando `!isLogin`)
- Schema de signup atualizado com `fullName: z.string().min(3).regex(/^[a-zA-ZÀ-ú\s]+$/)`
- Passar o nome via `options.data.display_name` no `signUp()` do Supabase
- O trigger `handle_new_user` já salva `display_name` na tabela `profiles`

### 2. Nova Sidebar Global para Páginas Autenticadas

**Arquivos:** `src/components/GlobalSidebar.tsx` (novo), `src/App.tsx`

A sidebar atual (`AppSidebar`) funciona apenas quando um produto está ativo. Criar uma `GlobalSidebar` que envolve todas as rotas autenticadas (incluindo PortfolioPage):

- **Topo:** Avatar com inicial do nome (círculo colorido), nome completo e e-mail do usuário (buscados da tabela `profiles`)
- **Itens de navegação:** Inicio, Meus Produtos, Pesquisar Produto, Configurações
- Quando um produto está ativo, exibir o menu atual de produto abaixo
- **Rodapé:** Toggle dark mode (lua/sol animado) e botão "Sair" (vermelho ao hover)
- Em mobile (<768px): sidebar colapsável via hamburguer no header (usar shadcn Sheet/Drawer)

**Mudança no layout:** O `ProtectedRoutes` vai renderizar a `GlobalSidebar` + conteudo, e o `AppLayout` existente passa a ser usado apenas para as rotas de produto (sem duplicar sidebar).

### 3. Pesquisa de Produto

**Arquivos:** `src/pages/PortfolioPage.tsx`, `src/components/GlobalSidebar.tsx`

- Campo de busca na sidebar (item "Pesquisar Produto" abre input inline)
- Campo de busca no topo da PortfolioPage, acima do grid de produtos
- Filtro em tempo real pelo nome do produto (`products.filter(p => p.name.toLowerCase().includes(query))`)
- Botão X para limpar busca
- Mensagem "Nenhum produto encontrado" quando lista filtrada está vazia

### 4. Dark Mode Refinado

**Arquivo:** `src/index.css`

- Atualizar variáveis CSS do dark mode para usar a paleta solicitada (#0F0F0F fundo, #1A1A1A cards, #F5F5F5 texto)
- Atualizar variáveis CSS do light mode (#F8F8F8 fundo, #FFFFFF cards, #1A1A1A texto)
- Adicionar `transition-colors duration-300` ao body via CSS base layer
- O `useTheme` hook existente já persiste no localStorage e aplica a classe `dark`

### 5. Logout com Toast

**Arquivo:** `src/components/GlobalSidebar.tsx`

- Botão "Sair" chama `signOut()` do AuthContext (já implementado com `supabase.auth.signOut()`)
- Após logout, exibir `toast.success('Você saiu da sua conta')`
- Redirecionamento automático para `/login` já acontece via `ProtectedRoutes` (quando `user` é null)

---

### Detalhes Técnicos

- Buscar dados do perfil (nome, email) via query à tabela `profiles` usando `user.id`
- Avatar: gerar inicial do `display_name`, cor de fundo derivada do hash do nome
- Reutilizar componentes shadcn existentes (Sheet para mobile drawer, Button, Input)
- Manter a `AppSidebar` existente para navegação intra-produto, a `GlobalSidebar` fica como wrapper externo
- Nenhuma migração de banco necessária (tabela `profiles` já tem `display_name`)

