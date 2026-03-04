

## Plano: Wizard Interativo para Criação/Edição do Copiloto

### Problema Atual
A tela de criação/edição do Copiloto é um formulário longo com cards técnicos empilhados. Isso intimida corretores leigos e reduz a taxa de configuração completa.

### Solução
Substituir o formulário por um **Wizard de 5 passos** com barra de progresso, cards visuais selecionáveis, microcopy explicativo e linguagem simples. A experiência será semelhante a um onboarding de SaaS moderno.

### Novo campo no banco: `copilot_mode`
Adicionar coluna `copilot_mode` (`text`, default `'assistente'`) à tabela `copilot_configs` para armazenar a escolha do corretor entre:
- **"assistente"** → O Copiloto age como assistente do corretor (sugere respostas, o corretor revisa e envia)
- **"autonomo"** → O Copiloto age em nome do corretor (responde diretamente como se fosse o corretor)

Essa escolha será injetada no prompt: no modo "assistente", o prompt instrui a IA a sugerir respostas para o corretor revisar; no modo "autonomo", o prompt instrui a IA a responder diretamente ao cliente como se fosse o corretor.

### Estrutura do Wizard (5 passos)

**Passo 1 — Modo de Atuação** (novo!)
- Pergunta central: "Como seu Copiloto deve atuar?"
- Dois cards grandes com ícones e descrições:
  - 🤝 **Meu Assistente** — "Ele sugere respostas e eu decido o que enviar. Tenho controle total."
  - 🚀 **Agir em Meu Nome** — "Ele responde diretamente aos clientes como se fosse eu. Ideal para quem quer automação total."
- Microcopy: "Você pode mudar isso a qualquer momento."

**Passo 2 — Identidade e Personalidade**
- Nome do Copiloto (input com placeholder: "Ex: Max, Luna, Atlas...")
- Personalidade: 5 cards visuais selecionáveis (Consultivo, Formal, Agressivo, Técnico, Premium) com ícone + descrição curta
- Switches: Emojis, Gatilhos mentais

**Passo 3 — Estilo de Comunicação**
- Slider de Persuasão (com labels: "Sutil" ↔ "Direto") 
- Slider de Objetividade ("Detalhista" ↔ "Objetivo")
- Tipo de imóvel predominante (cards visuais)

**Passo 4 — Estratégia Comercial**
- Prioridade comercial (cards: Agendamento, Proposta, Qualificação, Fechamento)
- Switches: Incentivar visita, Incentivar chamada, Follow-up automático
- Nível de autonomia (Select, visível apenas no modo "autonomo")

**Passo 5 — Personalização Avançada (opcional)**
- Região, público-alvo, posicionamento de marca
- Prompt editável (textarea colapsável com "Editar prompt avançado")
- Botão "Restaurar padrão"

### Barra de Progresso
- Progress bar horizontal no topo com labels dos passos
- Navegação: botões "Voltar" e "Próximo" (ou "Criar Copiloto" no último passo)

### Impacto no Prompt (Edge Function)
No `copilot-ai/index.ts` e `whatsapp-webhook/index.ts`, ler o campo `copilot_mode`:
- Se `"assistente"`: adicionar instrução "Você está sugerindo uma resposta para o corretor revisar. Escreva como se fosse o corretor falando, mas saiba que ele vai revisar antes de enviar."
- Se `"autonomo"`: adicionar instrução "Você está respondendo diretamente ao cliente em nome do corretor {nome}. O cliente não sabe que é uma IA. Aja naturalmente como se fosse o próprio corretor."

### Arquivos a Alterar

1. **Migration SQL** — Adicionar `copilot_mode text default 'assistente'` à `copilot_configs`
2. **`src/hooks/use-copilot.ts`** — Adicionar `copilot_mode` ao tipo `CopilotConfig`
3. **`src/components/inbox/CopilotConfigPage.tsx`** — Reescrever o formulário de criação/edição como Wizard de 5 passos (manter o `CopilotSummary` hero card como está)
4. **`supabase/functions/copilot-ai/index.ts`** — Injetar instrução de modo no prompt
5. **`supabase/functions/whatsapp-webhook/index.ts`** — Injetar instrução de modo no prompt

### UX Details
- Dark theme consistente com o restante (`bg-card`, `border-border`, `text-foreground`)
- Animações suaves de transição entre passos
- Cards selecionáveis com borda `border-primary` e fundo `bg-primary/10` quando ativos
- Microcopy em `text-muted-foreground text-xs` abaixo de cada seção
- Mobile-first: cards em coluna no mobile, grid no desktop

