import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LANDING_PROMPT = `### Filosofia Visual
**"Dark Luxury Corporate"** — Cinematográfico, premium, diferenciado. Sem estética genérica de startup (gradientes roxos, azuis). Cada projeto deve ter personalidade visual própria.

---

### 🎨 Paleta de Cores (HSL)

#### Modo Claro (Light — Landing Pages)
| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| \`--background\` | \`45 20% 97%\` | \`#f8f6f1\` | Fundo creme suave |
| \`--card\` | \`0 0% 100%\` | \`#ffffff\` | Cards |
| \`--foreground\` | \`20 14% 15%\` | \`#252220\` | Texto principal |
| \`--border\` | \`40 15% 85%\` | \`#ddd8cd\` | Bordas leves |

#### Acentos
| Token | HSL | Hex | Uso |
|---|---|---|---|
| \`--primary\` | Definir por projeto | — | CTAs, destaques, botões |
| \`--primary-foreground\` | Contraste com primary | — | Texto sobre primary |
| \`--accent\` | Variação de primary | — | Gradientes, hovers |
| \`--destructive\` | \`0 84% 60%\` | \`#ef4444\` | Erros, exclusões |

#### Regras de Cor
- ❌ **NUNCA** usar preto puro \`#000\` ou branco puro \`#fff\`
- ❌ **NUNCA** usar cores hardcoded nos componentes — sempre tokens semânticos
- ✅ Todas as cores devem ser HSL no \`index.css\` e \`tailwind.config.ts\`
- ✅ Usar \`hsl(var(--token))\` em CSS e classes Tailwind configuradas

---

### 🔤 Tipografia

| Contexto | Fonte | Pesos |
|---|---|---|
| Títulos, Hero, Luxo | Fonte Serif do projeto (ex: \`Cormorant Garamond\`, \`Playfair Display\`) | 400–700 |
| UI funcional, corpo | Fonte Sans-serif do projeto (ex: \`Inter\`, \`DM Sans\`) | 300–700 |

#### Hierarquia Tipográfica
| Elemento | Classe |
|---|---|
| Hero Title | \`font-serif text-4xl md:text-6xl font-semibold\` |
| Section Title | \`font-serif text-3xl md:text-5xl font-semibold\` |
| Body | \`font-sans text-sm md:text-base\` |
| Label/Meta | \`font-sans text-xs uppercase tracking-widest\` |

---

### 🧱 Componentes Padrão

#### Cards
\`\`\`
bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 md:p-8
hover:border-primary/30 hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)]
transition-all duration-500
\`\`\`

#### Botão Primário
\`\`\`
bg-primary text-primary-foreground px-8 py-4
text-sm font-semibold uppercase tracking-widest rounded-sm
hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-[1.02]
active:scale-[0.98] transition-all duration-300
\`\`\`

#### Botão Outline
\`\`\`
bg-transparent text-primary border-2 border-primary rounded-sm
px-8 py-4 text-sm font-semibold uppercase tracking-widest
hover:bg-primary hover:text-primary-foreground
hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
\`\`\`

#### Floating CTA
\`\`\`
fixed bottom-6 left-1/2 -translate-x-1/2 z-50
px-6 py-4 bg-primary text-primary-foreground
font-semibold uppercase tracking-wider text-sm rounded-full
shadow-[0_10px_40px_hsl(var(--primary)/0.4)]
hover:shadow-[0_15px_50px_hsl(var(--primary)/0.6)] hover:scale-105
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
| \`fade-in-left/right\` | 0.8s | cubic-bezier | Slides laterais |
| \`slide-up\` | 0.9s | cubic-bezier | Hero elements |
| \`scale-in\` | 0.6s | cubic-bezier | Cards, modais |
| \`float\` | 3s loop | ease-in-out | CTAs flutuantes |
| \`glow\` | 2s loop | ease-in-out | Destaque primary |
| \`shimmer\` | 2s linear loop | — | Loading states |

**Delays escalonados:** \`delay-100\` a \`delay-800\` (100ms increments)

---

### 🌗 Gradientes & Sombras

\`\`\`css
/* Gradientes — adaptar com cores do projeto */
--gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)));
--gradient-dark: linear-gradient(180deg, hsl(var(--background)), hsl(var(--card)));

/* Sombras */
--shadow-primary: 0 0 40px hsl(var(--primary) / 0.2);
--shadow-elegant: 0 25px 50px -12px rgba(0,0,0,0.15);
\`\`\`

---

### 📜 Scrollbars (Landing Pages)
| Largura | Cor |
|---|---|
| 8px | Primary com opacidade (\`--primary / 0.3\`) sobre fundo escuro |

---

### ⛔ Regras de Ouro
1. **Tokens sempre** — Nunca \`text-white\`, \`bg-black\` direto em componentes
2. **HSL sempre** — Nunca hex direto no CSS
3. **Sem gradientes genéricos** — Nada de roxo/azul "AI startup"
4. **Sem fontes genéricas** — Escolher fontes com personalidade para cada projeto
5. **Contrast check** — Garantir contraste WCAG sobre cores de destaque
6. **Mobile-first** — Responsive com breakpoints Tailwind padrão
7. **Safe areas** — \`pt-safe\`, \`pb-safe\` para PWA/mobile`;

const CRM_PROMPT = `### Filosofia Visual
**"Dark Luxury Corporate"** — Interface funcional premium, dark mode como padrão, alto contraste com amarelo institucional (#FFFF00) usado de forma estratégica. Prioridade em clareza, velocidade e consistência visual.

---

### 🎨 Paleta de Cores (HSL)

#### Dashboard / Admin / Auth
| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| \`--background\` | \`240 6% 4%\` | \`#0a0a0f\` | Fundo principal |
| \`--card\` | \`240 6% 9%\` | \`#15151a\` | Cards, sheets, modais |
| \`--foreground\` | \`45 30% 96%\` | \`#f7f4ed\` | Texto principal |
| \`--secondary\` | \`220 8% 15%\` | \`#23252a\` | Superfícies secundárias |
| \`--muted\` | \`220 8% 18%\` | \`#2a2d33\` | Fundos neutros |
| \`--muted-foreground\` | \`220 10% 55%\` | \`#838a96\` | Texto auxiliar |
| \`--border\` | \`220 8% 18%\` | \`#2a2d33\` | Bordas e divisórias |
| \`--primary\` | \`60 100% 50%\` | \`#ffff00\` | CTA, foco, destaque |
| \`--primary-foreground\` | \`240 6% 4%\` | \`#0a0a0f\` | Texto sobre primary |
| \`--destructive\` | \`0 62.8% 30.6%\` | \`#7f1d1d\` | Perdas, exclusões |

#### Regras de Cor
- ✅ Usar apenas tokens semânticos do tema
- ✅ \`primary\` é o destaque principal do CRM/Admin
- ✅ \`secondary\` e \`muted\` organizam densidade e hierarquia
- ❌ Não criar paletas paralelas por feature
- ❌ Não usar classes hardcoded como azul/verde/roxo por ação

---

### 🔤 Tipografia Dashboard

| Contexto | Fonte | Classe |
|---|---|---|
| Toda a UI | Sans-serif do projeto | \`font-sans\` |
| Heading | Sans-serif | \`text-xl font-bold\` |
| Card Title | Sans-serif | \`text-lg font-semibold\` |
| Body | Sans-serif | \`text-sm\` |
| Meta / Labels | Sans-serif | \`text-xs text-muted-foreground\` |

⚠️ **Sans-serif only** no dashboard. Serif apenas em contextos editoriais/landing ou, se necessário, no branding da auth.

---

### 🔐 Tela de Login / Auth

#### Layout
- Desktop: split layout com painel visual + formulário
- Mobile: formulário-first com branding compacto

#### Card de Auth
\`\`\`
bg-card border border-border rounded-2xl p-8
shadow-2xl shadow-black/50
\`\`\`

#### Inputs
\`\`\`
bg-background border border-input rounded-lg
text-foreground placeholder:text-muted-foreground
focus:border-primary focus:ring-1 focus:ring-primary/20
\`\`\`

#### Botão principal
\`\`\`
bg-primary text-primary-foreground
hover:bg-primary/90
hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
\`\`\`

---

### 📋 Boards / Listas

#### Cards de item
\`\`\`
bg-card border border-border rounded-xl
hover:border-primary/50
transition-[border-color,transform,opacity] duration-200 ease-out
\`\`\`

#### Elementos do card
| Elemento | Estilo |
|---|---|
| Avatar | \`bg-muted text-foreground\` |
| Título | \`text-sm font-medium text-foreground\` |
| Subtítulo | \`text-xs text-muted-foreground\` |
| Badge destaque | \`bg-primary/10 text-primary border-primary/30\` |
| Badge neutra | \`bg-muted/40 text-muted-foreground border-border\` |
| Item stale | \`opacity-60\` |
| Item novo / automação | destaque com \`primary\` |

#### Botões de ação
\`\`\`
Ações principais: variant default
Ações secundárias: variant secondary ou outline
Ações destrutivas: variant destructive
\`\`\`

---

### 📊 Layout Admin

#### Estrutura
\`\`\`
Sidebar fixa à esquerda (desktop)
Bottom nav no mobile
bg-background com classe admin-scrollbar
\`\`\`

#### Sidebar
\`\`\`
bg-card border-r border-border
item hover:bg-secondary
item ativo text-primary
\`\`\`

---

### 🗂️ Sheets / Modais / Drawers

\`\`\`
bg-card border-border
ScrollArea interna com scrollbar-subtle
Seções separadas com border-border
Header com backdrop-blur
\`\`\`

---

### ⛔ Regras Dashboard
1. **Tokens semânticos sempre**
2. **HSL sempre**
3. **Dashboard dark fixo**
4. **Primary amarelo usado com intenção, não em excesso**
5. **Sem paleta semântica paralela por ação**
6. **Hover/focus consistentes**
7. **Mobile-first**
8. **Safe areas** com \`pt-safe\` e \`pb-safe\``;

const FULL_PROMPT = `${LANDING_PROMPT}\n\n---\n\n${CRM_PROMPT}`;

const DesignSystem = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const CopyButton = ({ text, label, copyKey }: { text: string; label: string; copyKey: string }) => (
    <Button onClick={() => handleCopy(text, copyKey)} size="sm" className="gap-2">
      {copied === copyKey ? (
        <>
          <Check className="h-4 w-4" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );

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
          <h1 className="font-serif text-lg font-semibold">Design System</h1>
          <CopyButton text={FULL_PROMPT} label="Copiar Tudo" copyKey="full" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-3">
            Design System <span className="text-primary">Prompt</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Prompts genéricos para manter consistência visual em qualquer projeto. Cole na seção <strong>Knowledge</strong> do Lovable.
          </p>
        </div>

        <Tabs defaultValue="landing" className="w-full">
          <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1 mb-6">
            <TabsTrigger value="landing" className="flex-1 min-w-[100px] text-xs sm:text-sm">Landing Pages</TabsTrigger>
            <TabsTrigger value="crm" className="flex-1 min-w-[100px] text-xs sm:text-sm">Dashboard / Admin</TabsTrigger>
            <TabsTrigger value="full" className="flex-1 min-w-[100px] text-xs sm:text-sm">Prompt Completo</TabsTrigger>
          </TabsList>

          <TabsContent value="landing">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-serif text-xl sm:text-2xl font-semibold">🎨 Design System — Landing Pages</h3>
              <CopyButton text={LANDING_PROMPT} label="Copiar Landing" copyKey="landing" />
            </div>
            <div className="relative group">
              <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative rounded-lg border border-border bg-card p-6 md:p-10">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 break-words">
                  {LANDING_PROMPT}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-serif text-xl sm:text-2xl font-semibold">🖥️ Design System — Dashboard / Admin / Auth</h3>
              <CopyButton text={CRM_PROMPT} label="Copiar Dashboard" copyKey="crm" />
            </div>
            <div className="relative group">
              <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative rounded-lg border border-border bg-card p-6 md:p-10">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 break-words">
                  {CRM_PROMPT}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="full">
            <div className="flex justify-end mb-4">
              <CopyButton text={FULL_PROMPT} label="Copiar Tudo" copyKey="full-tab" />
            </div>
            <div className="relative group">
              <div className="absolute -inset-px rounded-lg bg-gradient-to-b from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative rounded-lg border border-border bg-card p-6 md:p-10">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 break-words">
                  {FULL_PROMPT}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignSystem;
