

## Plano: Reformular aba "Empreendimentos" para Corretores

### Contexto Atual
- **Admin/Líder**: Cria empreendimentos via ProjectWizard (4 etapas com IA) → salva na tabela `projects`
- **Corretor**: Apenas adiciona projetos existentes (criados pelo admin) à sua carteira via `broker_projects`
- O Wizard gera landing pages persuasivas com IA (Gemini) e permite refinamento via chat

### O que será feito

**1. Banco de dados**
- Adicionar coluna `type` na tabela `projects` (`'empreendimento' | 'imovel'`, default `'empreendimento'`) para distinguir empreendimentos de imóveis avulsos
- Adicionar coluna `created_by_broker_id` (nullable, ref brokers) para identificar projetos criados por corretores
- Adicionar RLS policy permitindo brokers fazerem INSERT em `projects` (apenas com seu próprio `created_by_broker_id`)
- Adicionar RLS policy permitindo brokers fazerem UPDATE em projetos que eles criaram

**2. Adaptar ProjectWizard para uso do corretor**
- Criar uma prop `brokerMode` no `ProjectWizard` que simplifica o wizard:
  - Passo 0: Tipo (Empreendimento ou Imóvel) + Dados básicos (nome, cidade, slug)
  - Passo 1: Conteúdo + Mídia (igual ao atual)
  - Passo 2: IA + Preview (pula Config/webhook/ai_prompt que são para admin)
- No `handlePublish`, quando em `brokerMode`, salvar com `created_by_broker_id` e auto-criar o registro em `broker_projects`

**3. Reformular página BrokerProjects**
- Dividir em duas seções com tabs: **"Empreendimentos da Empresa"** (projetos do admin, fluxo atual de adicionar/remover) e **"Minha Carteira"** (projetos criados pelo próprio corretor)
- Na seção "Minha Carteira", botão **"+ Criar Empreendimento"** e **"+ Criar Imóvel"** que abrem o Wizard em `brokerMode`
- Cards de imóveis/empreendimentos criados pelo corretor terão botão de editar landing page (como o admin já tem)

**4. Ajustar hook `useBrokerProjects`**
- Separar projetos em dois grupos: `companyProjects` (criados por admin, sem `created_by_broker_id`) e `myProjects` (criados pelo próprio corretor)
- Adicionar função `createBrokerProject` que encapsula criação + auto-linkagem

**5. Rotas**
- Projetos criados por corretores usam a mesma rota dinâmica `/:citySlug/:projectSlug/:brokerSlug` que já existe, sem necessidade de novas rotas

### Arquivos a modificar/criar
- **Migration SQL**: adicionar `type` e `created_by_broker_id` + RLS policies
- `src/components/admin/ProjectWizard.tsx`: adicionar `brokerMode` prop com fluxo simplificado
- `src/pages/BrokerProjects.tsx`: reformular UI com tabs e botões de criação
- `src/hooks/use-broker-projects.ts`: separar projetos próprios vs empresa, adicionar criação
- `src/types/project.ts`: adicionar `type` e `created_by_broker_id` ao tipo `Project`

