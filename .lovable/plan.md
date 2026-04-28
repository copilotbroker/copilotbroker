
# Cadastro de Imobiliárias com Aprovação + Link de Corretores

## Respostas diretas

**Hoje não existe** página pública de cadastro de imobiliária. Apenas o super admin cria via botão "Nova imobiliária" no painel Master. Vou criar:

1. **Página pública de cadastro de imobiliária:** `/imobiliaria/cadastro`
2. **Link de convite por imobiliária para corretores:** `/imobiliaria/{slug}/cadastro` (link único por imobiliária — aparece pra ela copiar dentro do painel admin dela)

## O que vai mudar

### 1. Página pública `/imobiliaria/cadastro`
Formulário público que o dono de uma imobiliária preenche:
- Nome da imobiliária + nome do responsável
- Email + senha + telefone
- CNPJ (opcional)
- Cidade/Estado

Ao enviar:
- Cria a `organization` com `status = 'pending_approval'` (novo status)
- Cria a conta do dono no auth e vincula como `owner` em `organization_members` (mas com `is_active = false` enquanto pendente)
- Mostra tela "Cadastro recebido — aguardando aprovação do Enove"
- Não permite login enquanto não aprovado

### 2. Aba "Imobiliárias" do Super Admin
- **Nova seção no topo**: "Solicitações pendentes" com badge de quantidade
- Cada solicitação mostra: nome, responsável, email, CNPJ, data, e botões **Aprovar** / **Recusar**
- **Aprovar**: muda `status` para `active`, ativa o membro `owner`, cria assinatura no plano default (configurável), envia email "sua conta foi aprovada"
- **Recusar**: muda `status` para `rejected`, opcionalmente envia email com motivo
- A tabela principal segue mostrando apenas imobiliárias `active/trial/suspended/canceled` (pendentes ficam só na seção de aprovação)

### 3. Link de cadastro de corretores (por imobiliária)
- Cada `organization` ganha uma página pública `/imobiliaria/:slug/cadastro` (ex.: `/imobiliaria/enove-select/cadastro`)
- Formulário simples: nome, email, senha, WhatsApp
- Ao enviar: cria conta, cria registro em `brokers` vinculado à `organization_id` daquele slug, cria `organization_members` com role `broker`
- Só aceita cadastro se a imobiliária estiver `active`
- No painel **Admin da Imobiliária** (página existente `AdminOrganization`), adicionar card "Link para corretores se cadastrarem" com a URL pronta + botão **Copiar**

## Fluxo visual

```text
Dono da imobiliária                Super Admin                      Corretor da imobiliária
─────────────────                  ───────────                      ────────────────────────
/imobiliaria/cadastro       →      /master/imobiliarias            
   (pending_approval)              (aba Solicitações)         
                                       ↓ Aprovar
                                   status = active                  /imobiliaria/{slug}/cadastro
                                                                       (vinculado à org)
                                   Owner pode logar                 Broker pode logar
```

## Detalhes técnicos

**Migração SQL:**
- Adicionar `'pending_approval'` e `'rejected'` ao CHECK do `organizations.status`
- Adicionar coluna `requested_by_user_id`, `responsible_name`, `responsible_phone` em `organizations` (ou guardar em `metadata`)
- Adicionar coluna `default_plan_id` opcional, ou usar o primeiro plano com `sort_order` mais baixo

**Edge functions novas:**
- `org-public-signup`: cria org pendente + usuário owner inativo (service role, sem JWT)
- `org-broker-public-signup`: cria broker vinculado a uma org ativa via slug
- `master-approve-organization`: super_admin aprova/recusa, ativa membro, cria subscription
- Reusar lógica do `master-update-subscription` corrigido

**Componentes:**
- `src/pages/OrgSignup.tsx` (cadastro público de imobiliária)
- `src/pages/OrgBrokerSignup.tsx` (cadastro de corretor por slug da org)
- `src/components/master/PendingOrganizationsList.tsx` (lista de aprovação no topo de `MasterOrganizations`)
- Card "Link de cadastro de corretores" em `AdminOrganization.tsx`

**Rotas em `App.tsx`:**
- `/imobiliaria/cadastro` → `OrgSignup`
- `/imobiliaria/:slug/cadastro` → `OrgBrokerSignup`

**Bloqueio de login:** ajustar `Auth.tsx` para barrar usuário cuja única org esteja `pending_approval` ou `rejected`, com mensagem clara.

## Perguntas para confirmar antes de construir

1. Ao aprovar uma imobiliária, qual plano deve ser atribuído por padrão? (posso usar o "Starter" ou pedir pra você selecionar plano na hora da aprovação)
2. O link de cadastro de corretor deve exigir aprovação do admin da imobiliária, ou o corretor entra direto ativo?
3. Precisa de email de notificação (para você quando chega solicitação, e para o dono quando é aprovado/recusado)?
