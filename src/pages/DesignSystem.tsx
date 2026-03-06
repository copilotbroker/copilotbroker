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
**"Dark Professional"** — Interface funcional de alta densidade, dark mode padrão. Foco em produtividade, clareza de informação e ações rápidas. Sem elementos decorativos desnecessários.

---

### 🎨 Paleta de Cores (HSL)

#### Dark Mode (Padrão Dashboard)
| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| Background | \`240 6% 4%\` | \`#0a0a0f\` | Fundo da aplicação |
| Layout bg | \`240 5% 7%\` | \`#0f0f12\` | Background do layout |
| Surfaces | \`240 4% 12%\` | \`#1e1e22\` | Cards, modais, painéis |
| Borders | \`220 8% 18%\` | \`#2a2a2e\` | Bordas e separadores |
| Muted | \`220 10% 55%\` | \`#838a96\` | Texto secundário |
| Foreground | \`45 30% 96%\` | \`#f7f4ed\` | Texto principal |

#### Cores Funcionais
| Contexto | Cor | Uso |
|---|---|---|
| Sucesso | \`bg-emerald-500\` | Ações positivas, confirmações |
| Alerta | \`bg-orange-500\` | Avisos, pendências |
| Info | \`bg-blue-500\` | Informações, estados neutros |
| Perigo | \`bg-red-500\` | Erros, exclusões, alertas |
| Neutro | \`bg-slate-400\` | Estados inativos, finalizados |
| Primary | \`hsl(var(--primary))\` | CTAs, seleção, foco |

#### Badges / Tags (Dark Theme)
| Variante | Padrão de Classes |
|---|---|
| Tipo A | \`bg-purple-500/20 text-purple-300 border-purple-500/40\` |
| Tipo B | \`bg-emerald-500/20 text-emerald-300 border-emerald-500/40\` |
| Tipo C | \`bg-blue-500/20 text-blue-300 border-blue-500/40\` |
| Tipo D | \`bg-yellow-500/20 text-yellow-300 border-yellow-500/40\` |
| Default | \`bg-slate-500/20 text-slate-400 border-slate-500/40\` |

---

### 🔤 Tipografia Dashboard

| Contexto | Fonte | Classe |
|---|---|---|
| **Toda a UI** | Sans-serif do projeto | \`font-sans\` |
| Card Title | \`font-sans text-lg font-semibold\` | Headers de cards |
| Body | \`font-sans text-sm\` | Textos gerais |
| Label/Meta | \`font-sans text-xs text-muted-foreground\` | Labels, timestamps |
| Heading | \`font-sans text-xl font-bold\` | Títulos de seção |

⚠️ **Sans-serif only** — Nunca usar \`font-serif\` no dashboard (exceção: tela de login).

---

### 🔐 Tela de Login / Auth

#### Layout
- Desktop: Split \`3/5\` painel visual + \`2/5\` formulário
- Mobile: Formulário-only com header compacto

#### Painel Visual (Desktop)
\`\`\`
bg-gradient-to-br from-[background] via-[layout-bg] to-[surface]
Pattern sutil com linhas de primary em baixa opacidade
Central glow: bg-primary/5 rounded-full blur-3xl
\`\`\`

#### Card de Auth
\`\`\`
bg-[surface] border border-[border] rounded-2xl p-8
shadow-2xl shadow-black/50
\`\`\`

#### Inputs
\`\`\`
bg-[background-darker] border border-[border] rounded-lg
text-foreground placeholder:text-muted-foreground
focus:border-primary focus:ring-1 focus:ring-primary/20
pl-10 (com ícone à esquerda)
\`\`\`

#### Botão de Auth
\`\`\`
w-full py-3 bg-primary text-primary-foreground rounded-lg
font-semibold uppercase tracking-wider text-sm
hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:scale-[1.02]
disabled:opacity-50
\`\`\`

#### Loading Spinner
\`\`\`
border-2 border-primary border-t-transparent rounded-full animate-spin
\`\`\`

#### Animações Auth
| Elemento | Animação | Delay |
|---|---|---|
| Logo | \`animate-fade-in-down\` | 0ms |
| Título | \`animate-fade-in-left\` | 200ms |
| Divider | \`animate-expand-width\` | 400ms |
| Descrição | \`animate-fade-up\` | 500ms |
| Card | \`animate-scale-in\` | 300ms (mobile) / 500ms (desktop) |
| Inputs | \`animate-fade-up\` | 400-600ms escalonado |

---

### 📋 Boards / Listas (Kanban, Tabelas)

#### Cards de Item
\`\`\`
bg-[surface] border border-[border] rounded-xl
hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
transition-[border-color,transform,opacity] duration-200 ease-out
\`\`\`

#### Elementos do Card
| Elemento | Estilo |
|---|---|
| Avatar | \`bg-slate-700/50 text-slate-400\` com iniciais |
| Título | \`text-sm font-medium text-foreground truncate\` |
| Subtítulo | \`text-xs text-muted-foreground\` |
| Badge | Usar padrão de badges (ver tabela acima) |
| Progress Bar | \`h-0.5\` com cor contextual |
| Item "stale" | \`opacity-60\` para itens sem interação >48h |
| Item novo | \`ring-pulse\` animation com glow |

#### Botões de Ação Contextual
\`\`\`
Cores variam por contexto/status:
- Positivo: bg-emerald-500/90 hover:bg-emerald-500
- Neutro: bg-blue-500/90 hover:bg-blue-500
- Alerta: bg-orange-500/90 hover:bg-orange-500
- Destaque: bg-violet-500/90 hover:bg-violet-500
Todos com text-white, text-xs, rounded-md, px-2 py-1
\`\`\`

---

### 📊 Layout Admin

#### Estrutura
\`\`\`
Sidebar fixa à esquerda (hidden mobile)
Bottom Nav no mobile (5 itens máximo)
bg-[layout-bg] com classe admin-scrollbar
\`\`\`

#### Sidebar
\`\`\`
bg-[layout-bg] border-r border-[border]
Items: hover:bg-[surface] rounded-lg
Item ativo: bg-[surface] text-primary
\`\`\`

#### Scrollbar Admin
\`\`\`
width: 4px
thumb: rgba(100, 116, 139, 0.3) → hover: 0.5
track: transparent
\`\`\`

---

### 🗂️ Sheets / Modais / Drawers

\`\`\`
Background: bg-[surface] border-[border]
ScrollArea interna com scrollbar-subtle
Seções separadas por border-b border-[border]
Header sticky com backdrop-blur
\`\`\`

#### Categorias de Tags/Chips
\`\`\`
Padrão: bg-[cor]/20 text-[cor]-300 border-[cor]/40
Selecionado: ring-2 ring-primary ring-offset-1 ring-offset-[surface]
Hover: opacity aumentada
\`\`\`

---

### ⛔ Regras Dashboard

1. **Sans-serif only** — Nunca \`font-serif\` no dashboard (exceção: auth hero)
2. **Tokens semânticos** — Usar variáveis CSS, não hex direto
3. **Dark mode fixo** — Dashboard sempre dark, sem toggle
4. **Densidade alta** — Padding compacto (\`p-2\` a \`p-4\`), text-sm como base
5. **Scrollbars finas** — 4px em todo o admin
6. **Feedback visual** — Hover states em todos os elementos interativos
7. **Status = Cor** — Cada status tem cor fixa e consistente
8. **Mobile-first** — Bottom nav no mobile, sidebar no desktop
9. **Safe areas** — \`pt-safe\`, \`pb-safe\` para PWA/mobile
10. **Loading states** — Skeleton com \`animate-shimmer\`, spinners com primary color`;

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
      <div className="container mx-auto max-w-4xl px-6 py-12">
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
            <div className="flex justify-end mb-4">
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
