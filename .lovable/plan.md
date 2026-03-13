

# Wizard Inteligente de Criação Assistida por IA

## Visão Geral

Adicionar uma tela inicial no ProjectWizard com duas opções: **"Importar de um Link"** (novo) e **"Criar do Zero"** (fluxo atual). A opção de link usa uma nova edge function para extrair conteúdo da página, depois alimenta o `generate-landing` existente com os dados extraídos, gerando a landing page automaticamente.

## Arquitetura

```text
┌─────────────────────────────────┐
│  Step 0: Escolha do Método      │
│  ┌───────────┐ ┌──────────────┐ │
│  │ Importar  │ │ Criar do     │ │
│  │ de Link   │ │ Zero         │ │
│  └─────┬─────┘ └──────┬───────┘ │
│        │               │        │
│        ▼               ▼        │
│  LinkImportStep    stepDados    │
│  (scrape+IA)      (fluxo atual)│
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Edge Function: scrape-url      │
│  fetch(url) → HTML → parse      │
│  Extrai: título, descrição,     │
│  imagens, vídeos, dados         │
└──────────┬──────────────────────┘
           ▼
┌─────────────────────────────────┐
│  generate-landing (existente)   │
│  Recebe scrapedContent como     │
│  campo extra no projectData     │
└─────────────────────────────────┘
```

## Componentes a Criar/Modificar

### 1. Nova Edge Function: `supabase/functions/scrape-url/index.ts`
- Recebe `{ url }` no body
- Faz `fetch(url)` com User-Agent de navegador para evitar bloqueios
- Extrai via regex/parsing do HTML: título, meta description, textos relevantes, URLs de imagens (og:image, `<img src>`), URLs de vídeos
- Retorna JSON estruturado: `{ title, description, images[], videos[], rawText, url }`
- Sem dependência externa (Firecrawl não está conectado)

### 2. Novo componente: `src/components/admin/WizardMethodSelector.tsx`
- Tela premium com duas opções em cards grandes:
  - **"Importar de um Link"** — ícone de link/sparkles, texto explicativo sobre a IA capturar dados automaticamente
  - **"Criar do Zero"** — ícone de edição, texto sobre preenchimento manual
- Design dark luxury consistente com o sistema (#FFFF00 accent)

### 3. Novo componente: `src/components/admin/LinkImportStep.tsx`
- Campo de URL com validação
- Botão "Analisar com IA"
- Estados de progresso animados sequenciais:
  1. "Lendo link..." (com ícone animado)
  2. "Extraindo informações..." 
  3. "Organizando fotos..."
  4. "Montando apresentação..."
- Após extração, mostra resumo dos dados encontrados (título, nº de fotos, dados extraídos)
- Botão "Continuar" que preenche automaticamente os campos do wizard (name, city, description, mediaFiles) e pula para o step de IA+Preview
- Mensagem amigável se o scraping falhar, com opção de continuar manualmente

### 4. Modificar `src/components/admin/ProjectWizard.tsx`
- Adicionar step -1 (method selector) como tela inicial para novos projetos
- Novo state: `importMode: "link" | "manual" | null`
- Quando `importMode === "link"`: mostrar LinkImportStep
- Quando link importado com sucesso: preencher `data` automaticamente, popular `mediaFiles` com imagens extraídas, avançar para step de IA+Preview
- Ajustar `STEP_LABELS` dinamicamente
- Ajustar `progress` para incluir o step inicial

### 5. Modificar `supabase/functions/generate-landing/index.ts`
- Aceitar campo `scrapedContent` no `projectData`
- Quando presente, incluir no prompt: dados brutos do scraping para a IA transformar em copy persuasiva
- Instrução explícita: "Transforme a descrição original em copywriting comercial persuasivo e de alta conversão"

### 6. Atualizar `supabase/config.toml`
- Adicionar entrada `[functions.scrape-url]` com `verify_jwt = false`

## Fluxo do Usuário (Link Import)

1. Usuário abre wizard → vê tela com 2 opções
2. Clica "Importar de um Link"
3. Cola a URL do anúncio
4. Clica "Analisar"
5. Vê animação de progresso com 4 estados
6. Vê resumo: "Encontramos: 8 fotos, título, descrição, localização"
7. Dados preenchem automaticamente nome, cidade, descrição, fotos
8. Usuário pode revisar/editar dados básicos
9. IA gera landing page com copy persuasiva baseada nos dados extraídos
10. Usuário refina via chat e publica

## Tratamento de Erros
- URL inválida: validação client-side antes de enviar
- Site bloqueou scraping: mensagem "Não foi possível acessar este link. Tente outro ou crie manualmente."
- Poucas informações extraídas: sinalizar ao usuário quais campos precisam ser complementados
- Timeout: limite de 30s na edge function

## Detalhes Técnicos

- A edge function `scrape-url` faz parsing de HTML puro (sem headless browser), extraindo `<title>`, `<meta>`, `<img>`, texto de `<p>`/`<h1>`-`<h6>`, Open Graph tags
- Imagens extraídas são URLs externas (não são baixadas/re-uploaded) — a IA usa como `backgroundImageUrl` e gallery items
- O componente LinkImportStep gerencia os estados de loading com `setTimeout` progressivo para dar sensação de etapas
- Mobile-first: toda a interface usa tipografia e espaçamentos responsivos

