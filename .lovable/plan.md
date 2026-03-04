

## Plano: Landing Page Builder com IA + Chat de Refinamento + Preview

### Conceito

Wizard de criação de empreendimento que, na etapa final, gera a landing page via IA e apresenta um **chat interativo** onde o admin pode pedir ajustes ("mude a cor para azul", "troque o título do hero", "adicione mais urgência"). Cada mensagem regenera o JSON parcialmente e atualiza o preview em tempo real. Só ao clicar "Publicar" o conteúdo é salvo no banco.

### Arquitetura

```text
┌──────────────────────────────────────────────────────┐
│  ProjectWizard (5 etapas)                            │
│  1. Dados básicos  2. Detalhes  3. Posicionamento    │
│  4. Imagens (opcional)                               │
│  5. Geração + Chat + Preview lado a lado             │
└──────────────────────────────────────────────────────┘
         │                              │
    Chat input                    Preview iframe
    "Mude o título..."            (componentes dinâmicos)
         │
         ▼
┌─────────────────────┐
│  Edge Function      │
│  generate-landing   │
│  Gemini Flash       │
│  tool_call →        │
│  LandingContent JSON│
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  projects.landing_  │
│  content (JSONB)    │
│  salvo ao Publicar  │
└─────────────────────┘
```

### 1. Migration: `landing_content` na tabela `projects`

```sql
ALTER TABLE public.projects ADD COLUMN landing_content jsonb DEFAULT NULL;
```

### 2. Tipo `LandingContent` (`src/types/project.ts`)

```typescript
export interface LandingContent {
  theme: { primaryColor: string; accentColor: string; style: "luxury" | "modern" | "nature" | "urban" };
  hero: { badge: string; title: string; subtitle: string; description: string; ctaText: string };
  about: { title: string; paragraphs: string[]; highlights: { icon: string; text: string }[] };
  features: { title: string; items: { icon: string; text: string }[] };
  urgency: { title: string; items: { icon: string; text: string }[]; warning: string };
  benefits: { title: string; items: { icon: string; text: string }[] };
  cta: { title: string; features: { icon: string; text: string }[]; quote: string; buttonText: string };
  footer: { companyName: string; disclaimer: string };
}
```

### 3. Edge Function: `generate-landing`

- Recebe: dados do wizard (nome, cidade, tipo, público, argumentos) + `landing_content` atual (se existir) + `user_message` (pedido de ajuste)
- Usa Lovable AI (Gemini Flash) com **tool calling** para retornar JSON estruturado `LandingContent`
- Na primeira geração: cria tudo do zero
- Em refinamentos: recebe o JSON atual + instrução do usuário → retorna JSON atualizado
- Prompt inclui instruções para copywriting persuasivo, variação entre projetos, e respeito ao posicionamento/público

### 4. Wizard (`src/components/admin/ProjectWizard.tsx`)

**Etapas 1-4**: Formulário sequencial (dados básicos, detalhes do empreendimento, público/posicionamento, imagens opcionais)

**Etapa 5 — Geração + Chat + Preview**:
- Layout split: esquerda = chat, direita = preview da landing page
- Ao entrar na etapa, dispara geração automática (primeira chamada ao `generate-landing`)
- O preview renderiza os componentes dinâmicos com o JSON retornado
- O chat permite digitar pedidos de alteração:
  - "Mude o tom para mais agressivo"
  - "Troque a cor principal para dourado"
  - "Adicione mais urgência no hero"
  - "O subtítulo deve mencionar a vista para o mar"
- Cada mensagem envia o JSON atual + pedido → recebe JSON atualizado → preview atualiza
- Botões: "Regenerar tudo" (nova geração do zero) e "Publicar" (salva no banco)
- Em mobile: tabs alternando entre Chat e Preview

### 5. Componentes dinâmicos (`src/components/landing/`)

7 componentes parametrizados que recebem dados do JSON e renderizam com a mesma qualidade visual das landing pages hardcoded:

- `DynamicHero` — Hero com badge, título, subtítulo, CTA, animações de entrada
- `DynamicAbout` — Seção sobre com parágrafos e grid de highlights com ícones
- `DynamicFeatures` — Grid de features com ícones e IntersectionObserver
- `DynamicUrgency` — Seção de urgência com items e warning final
- `DynamicBenefits` — Grid de benefícios com animações de scroll
- `DynamicCTA` — Call-to-action com features, quote e botão
- `DynamicFooter` — Footer com company name e disclaimer

Cada componente usa `IntersectionObserver` para animações de scroll, cores do theme via CSS custom properties, e ícones dinâmicos mapeados de um dicionário de ícones Lucide.

### 6. `ProjectLandingPage.tsx` — Renderização condicional

```typescript
if (project.landing_content) {
  return <DynamicLandingPage project={project} />;
}
// fallback: layout genérico atual
```

### 7. Atualizar `ProjectManagement.tsx`

- Botão "Novo Empreendimento" abre o Wizard (full-screen ou dialog grande) em vez do modal atual
- Card do projeto mostra badge "Landing IA" se `landing_content` existir
- Botão "Editar Landing" no card abre o Wizard na etapa 5 (chat + preview) para ajustes pós-publicação

### Arquivos a criar/editar

| Ação | Arquivo |
|------|---------|
| Migration | `add_landing_content_to_projects` |
| Criar | `supabase/functions/generate-landing/index.ts` |
| Criar | `src/components/admin/ProjectWizard.tsx` |
| Criar | `src/components/landing/DynamicLandingPage.tsx` |
| Criar | `src/components/landing/DynamicHero.tsx` |
| Criar | `src/components/landing/DynamicAbout.tsx` |
| Criar | `src/components/landing/DynamicFeatures.tsx` |
| Criar | `src/components/landing/DynamicUrgency.tsx` |
| Criar | `src/components/landing/DynamicBenefits.tsx` |
| Criar | `src/components/landing/DynamicCTA.tsx` |
| Criar | `src/components/landing/DynamicFooter.tsx` |
| Criar | `src/components/landing/iconMap.ts` |
| Editar | `src/types/project.ts` (adicionar `LandingContent`) |
| Editar | `src/pages/ProjectLandingPage.tsx` (renderização condicional) |
| Editar | `src/components/admin/ProjectManagement.tsx` (trocar modal por wizard) |
| Editar | `src/hooks/use-projects.ts` (suportar `landing_content`) |
| Editar | `supabase/config.toml` (registrar nova function) |

