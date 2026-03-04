

## Diagnóstico: Por que as landing pages geradas são inferiores

Após analisar o código, identifiquei **3 problemas fundamentais** — e o prompt é apenas um deles:

### Problema 1: Modelo fraco para a tarefa
O edge function usa `google/gemini-2.5-flash` — um modelo otimizado para velocidade, não qualidade criativa. Para copywriting de alto nível, precisamos de `google/gemini-2.5-pro` ou `openai/gpt-5`.

### Problema 2: Componentes visuais simplistas
Comparando as landing pages hardcoded (GoldenView) com os componentes dinâmicos:
- **GoldenView Hero**: Background com imagem real, overlay com gradiente, badge animado com pulse, tipografia serif, parceiros lado a lado, layout rico
- **Dynamic Hero**: Gradiente sólido sem imagem, tipografia genérica sans-serif, layout básico centralizado

Os componentes dinâmicos não têm a **riqueza visual** das páginas artesanais: sem imagens de fundo no hero, sem layouts 2-colunas com imagem (como GVFeatures), sem variação de layout entre seções, sem tipografia serif/italic para luxo.

### Problema 3: Estrutura JSON rígida demais
O schema do tool calling força uma estrutura fixa que não permite a flexibilidade que as páginas artesanais têm. Por exemplo:
- Não há campo para hero background image
- Features não suportam layout 2-colunas com imagem lateral
- Não há como definir tipografia (serif vs sans-serif)
- Não há seção de "parceiros" ou "depoimentos" como estrutura nativa

---

## Plano de Melhoria

### 1. Trocar o modelo para `google/gemini-2.5-pro`
Mais caro, mas dramaticamente melhor em criatividade e aderência às instruções de refinamento.

### 2. Expandir o schema `LandingContent` com campos visuais
Adicionar ao schema:
- `hero.backgroundImageUrl` — permitir imagem de fundo no hero
- `hero.layout` — "centered" | "split" (texto + imagem lado a lado)
- `theme.fontFamily` — "serif" | "sans-serif" para controle tipográfico
- `features.layout` — "grid" | "list-with-image" (permitir imagem lateral como GoldenView)
- `features.closingText` — texto de fechamento italic após os items
- Seção `partners` opcional com nomes/logos

### 3. Melhorar os componentes visuais
- **DynamicHero**: Suportar background image com overlay, layout split, tipografia serif
- **DynamicFeatures**: Suportar layout com imagem lateral (2 colunas), icones em círculos com fundo, texto de fechamento
- **DynamicUrgency**: Background dinâmico baseado no theme (não hardcoded `#fff8f0`)
- Todos: Adicionar mais variações visuais (bordas decorativas, blurs, gradientes contextuais)

### 4. Melhorar o prompt de refinamento
O prompt atual para alterações é muito curto. Precisa instruir a IA a:
- Retornar o JSON COMPLETO (não parcial)
- Manter a identidade visual ao fazer ajustes pontuais
- Entender comandos em português naturalmente ("mais agressivo", "muda a cor", "adiciona mapa")

### 5. Enviar histórico de chat para contexto
Atualmente cada refinamento envia apenas o JSON atual + 1 mensagem. Enviar o histórico completo de refinamentos para a IA ter contexto das iterações anteriores.

---

## Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-landing/index.ts` | Trocar modelo para `gemini-2.5-pro`, expandir schema com novos campos, melhorar prompt de refinamento, receber histórico de chat |
| `src/types/project.ts` | Adicionar novos campos ao `LandingContent` (backgroundImageUrl, layout, fontFamily, etc.) |
| `src/components/landing/DynamicHero.tsx` | Suportar background image, layout split, tipografia serif |
| `src/components/landing/DynamicFeatures.tsx` | Suportar layout com imagem lateral, closing text, ícones em círculos |
| `src/components/landing/DynamicUrgency.tsx` | Background dinâmico baseado no theme |
| `src/components/landing/DynamicAbout.tsx` | Layout mais rico com variação visual |
| `src/components/landing/DynamicBenefits.tsx` | Melhorar cards visuais |
| `src/components/admin/ProjectWizard.tsx` | Enviar histórico de chat completo nos refinamentos |

### Detalhes técnicos do schema expandido

```typescript
hero: {
  // campos existentes...
  backgroundImageUrl?: string;  // URL de imagem uploaded
  layout?: "centered" | "split"; // split = texto + imagem
}
theme: {
  // campos existentes...
  fontFamily?: "serif" | "sans-serif";
}
features: {
  // campos existentes...
  layout?: "grid" | "list-with-image";
  imageUrl?: string;  // imagem lateral
  closingText?: string;
}
```

Os componentes renderizarão condicionalmente com base nesses campos, mantendo retrocompatibilidade com o conteúdo já gerado.

