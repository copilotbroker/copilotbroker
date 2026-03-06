import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DESIGN_PROMPT = `## 🎨 Design System Prompt

### Filosofia Visual
**"Dark Luxury Corporate"** — Elegância minimalista no admin, cinematográfico nas landing pages. Sem estética genérica de startup (gradientes roxos, azuis). Premium, sóbrio, diferenciado.

---

### 🎨 Paleta de Cores (HSL)

#### Modo Escuro (Dark — Padrão Admin/CRM)
| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| \`--background\` | \`240 6% 4%\` | \`#0a0a0f\` | Fundo principal |
| \`--card\` | \`240 6% 9%\` | \`#151519\` | Cards, painéis |
| \`--foreground\` | \`45 30% 96%\` | \`#f7f4ed\` | Texto principal |
| \`--border\` | \`220 8% 18%\` | \`#2a2a2e\` | Bordas sutis |
| \`--muted\` | \`220 8% 18%\` | \`#2a2a2e\` | Áreas secundárias |
| \`--muted-foreground\` | \`220 10% 55%\` | \`#838a96\` | Texto secundário |
| \`--secondary\` | \`220 8% 15%\` | \`#232328\` | Botões secundários |

#### Modo Claro (Light — Landing Pages)
| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| \`--background\` | \`45 20% 97%\` | \`#f8f6f1\` | Fundo creme suave |
| \`--card\` | \`0 0% 100%\` | \`#ffffff\` | Cards |
| \`--foreground\` | \`20 14% 15%\` | \`#252220\` | Texto principal |
| \`--border\` | \`40 15% 85%\` | \`#ddd8cd\` | Bordas leves |

#### Acentos (ambos modos)
| Token | HSL | Hex | Uso |
|---|---|---|---|
| \`--primary\` | \`60 100% 50%\` | \`#FFFF00\` | CTAs, destaques, botões |
| \`--primary-foreground\` | dark: \`240 6% 4%\` / light: \`20 14% 4%\` | — | Texto sobre primary |
| \`--gold\` | \`60 100% 50%\` | \`#FFFF00\` | Gradientes dourados |
| \`--gold-light\` | \`48 90% 65%\` | \`#f5d44a\` | Gradiente secundário |
| \`--gold-dark\` | \`40 85% 40%\` | \`#bc8c0a\` | Sombras douradas |
| \`--enove-yellow\` | \`60 100% 50%\` | \`#FFFF00\` | Brand mark oficial |
| \`--destructive\` | \`0 84% 60%\` | \`#ef4444\` | Erros, exclusões |
| WhatsApp Green | — | \`#25D366\` | Botões WhatsApp |

#### Regras de Cor
- ❌ **NUNCA** usar preto puro \`#000\` ou branco puro \`#fff\`
- ❌ **NUNCA** usar cores hardcoded nos componentes — sempre tokens semânticos
- ✅ Todas as cores devem ser HSL no \`index.css\` e \`tailwind.config.ts\`
- ✅ Usar \`hsl(var(--token))\` em CSS e classes Tailwind configuradas

---

### 🔤 Tipografia

| Contexto | Fonte | Pesos |
|---|---|---|
| Títulos, Hero, Luxo | \`Cormorant Garamond\` (Serif) | 400, 500, 600, 700 |
| UI funcional, CRM, Admin | \`Inter\` (Sans-serif) | 300, 400, 500, 600, 700 |

\`\`\`css
font-family:
  serif: ["Cormorant Garamond", "Georgia", "serif"]
  sans: ["Inter", "system-ui", "sans-serif"]
\`\`\`

#### Hierarquia Tipográfica
| Elemento | Classe | Exemplo |
|---|---|---|
| Hero Title | \`font-serif text-4xl md:text-6xl font-semibold\` | Landing page H1 |
| Section Title | \`font-serif text-3xl md:text-5xl font-semibold\` | Seções de conteúdo |
| Card Title | \`font-sans text-lg font-semibold\` | Dashboard cards |
| Body | \`font-sans text-sm md:text-base\` | Textos gerais |
| Label/Meta | \`font-sans text-xs uppercase tracking-widest\` | Tags, badges |

---

### 📐 Layout & Espaçamento

| Propriedade | Valor |
|---|---|
| Container max-width | \`1400px\` |
| Container padding | \`1.5rem\` |
| Border radius (base) | \`0.5rem\` |
| Border radius (lg) | \`0.5rem\` |
| Border radius (md) | \`calc(0.5rem - 2px)\` |
| Border radius (sm) | \`calc(0.5rem - 4px)\` |

---

### 🧱 Componentes Padrão

#### Cards
\`\`\`
bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 md:p-8
hover:border-primary/30 hover:shadow-[0_0_40px_hsl(var(--gold)/0.1)]
transition-all duration-500
\`\`\`

#### Botão Primário
\`\`\`
bg-primary text-primary-foreground px-8 py-4
text-sm font-semibold uppercase tracking-widest rounded-sm
hover:shadow-[0_0_30px_hsl(var(--gold)/0.5)] hover:scale-[1.02]
active:scale-[0.98] transition-all duration-300
\`\`\`

#### Botão Outline
\`\`\`
bg-transparent text-primary border-2 border-primary rounded-sm
px-8 py-4 text-sm font-semibold uppercase tracking-widest
hover:bg-primary hover:text-primary-foreground
hover:shadow-[0_0_30px_hsl(var(--gold)/0.4)]
\`\`\`

#### Floating CTA
\`\`\`
fixed bottom-6 left-1/2 -translate-x-1/2 z-50
px-6 py-4 bg-primary text-primary-foreground
font-semibold uppercase tracking-wider text-sm rounded-full
shadow-[0_10px_40px_hsl(var(--gold)/0.4)]
hover:shadow-[0_15px_50px_hsl(var(--gold)/0.6)] hover:scale-105
animate-float
\`\`\`

#### Divider
\`\`\`
w-20 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent
\`\`\`

---

### ✨ Animações

| Nome | Duração | Easing | Uso |
|---|---|---|---|
| \`fade-up\` | 0.8s | \`cubic-bezier(0.22, 1, 0.36, 1)\` | Entrada de seções |
| \`fade-in\` | 0.8s | \`ease-out\` | Elementos gerais |
| \`fade-in-left\` | 0.8s | cubic-bezier | Slide da esquerda |
| \`fade-in-right\` | 0.8s | cubic-bezier | Slide da direita |
| \`slide-up\` | 0.9s | cubic-bezier | Hero elements |
| \`scale-in\` | 0.6s | cubic-bezier | Cards, modais |
| \`float\` | 3s loop | ease-in-out | CTAs flutuantes |
| \`glow\` | 2s loop | ease-in-out | Destaque primary |
| \`shimmer\` | 2s linear loop | — | Loading states |
| \`blur\` | 0.8s | ease-out | Revelação suave |

**Delays escalonados:** \`delay-100\` a \`delay-800\` (100ms increments)

---

### 🌗 Gradientes & Sombras

\`\`\`css
/* Gradientes */
--gradient-gold: linear-gradient(135deg, hsl(60 100% 50%), hsl(48 90% 65%), hsl(60 100% 50%));
--gradient-dark: linear-gradient(180deg, hsl(var(--background)), hsl(var(--card)));

/* Sombras */
--shadow-gold: 0 0 40px hsl(var(--gold) / 0.2);      /* light */
--shadow-gold: 0 0 40px hsl(var(--gold) / 0.3);      /* dark */
--shadow-elegant: 0 25px 50px -12px rgba(0,0,0,0.15); /* light */
--shadow-elegant: 0 25px 50px -12px rgba(0,0,0,0.5);  /* dark */
\`\`\`

---

### 📜 Scrollbars

| Contexto | Largura | Cor |
|---|---|---|
| Landing Pages | 8px | Dourado (\`--gold / 0.3\`) sobre carvão |
| Admin/CRM | 4px | Slate (\`rgba(100,116,139, 0.3)\`) sobre transparente |

---

### 🏗️ Contextos de Aplicação

#### Landing Pages (Luxo)
- Tipografia Serif nos títulos
- Gradientes dourados, \`animate-fade-up\`, parallax
- Sequência: Localização → Diferenciais → Urgência → Investimento
- Background cinematográfico com overlays

#### Admin/CRM (Funcional)
- Tipografia Sans exclusivamente
- Alta densidade de informação
- Cards com \`bg-card border-border\` sem efeitos de luxo
- Paleta Slate/Indigo para status e indicadores
- Scrollbars ultra-finos (4px)

#### Inbox/WhatsApp
- Paleta profissional Slate/Indigo
- Botões WhatsApp com \`#25D366\`
- Sem elementos de luxo — foco em usabilidade

---

### ⛔ Regras de Ouro

1. **Tokens sempre** — Nunca \`text-white\`, \`bg-black\`, \`text-gray-500\` direto
2. **HSL sempre** — Nunca hex no \`index.css\`
3. **Sem gradientes genéricos** — Nada de roxo/azul "AI startup"
4. **Sem fontes genéricas** — Nada de Poppins, Montserrat como default
5. **Dark mode first** — Admin é dark por padrão
6. **Contrast check** — Texto sobre \`--primary\` (#FFFF00) deve ser escuro
7. **Mobile-first** — Responsive com breakpoints Tailwind padrão
8. **Safe areas** — Usar \`pt-safe\`, \`pb-safe\` para PWA/mobile`;

const DesignSystem = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DESIGN_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = DESIGN_PROMPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="font-serif text-lg font-semibold">Enove Design System</h1>
          <Button
            onClick={handleCopy}
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Prompt
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-3">
            Design System <span className="text-primary">Prompt</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Copie este prompt e cole na seção <strong>Knowledge</strong> dos seus projetos Lovable para manter consistência visual.
          </p>
        </div>

        {/* Prompt display */}
        <div className="relative group">
          <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative rounded-lg border border-border bg-card p-6 md:p-10">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 break-words">
              {DESIGN_PROMPT}
            </pre>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <Button onClick={handleCopy} size="lg" className="gap-2 px-8">
            {copied ? (
              <>
                <Check className="h-5 w-5" />
                Prompt Copiado!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Copiar Prompt Completo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DesignSystem;
