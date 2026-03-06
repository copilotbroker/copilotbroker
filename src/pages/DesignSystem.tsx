import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LANDING_PROMPT = `## 🎨 Design System — Landing Pages

### Filosofia Visual
**"Dark Luxury Corporate"** — Cinematográfico, premium, diferenciado. Sem estética genérica de startup (gradientes roxos, azuis).

---

### 🎨 Paleta de Cores (HSL)

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
| \`--destructive\` | \`0 84% 60%\` | \`#ef4444\` | Erros, exclusões |
| WhatsApp Green | — | \`#25D366\` | Botões WhatsApp |

---

### 🔤 Tipografia

| Contexto | Fonte | Pesos |
|---|---|---|
| Títulos, Hero, Luxo | \`Cormorant Garamond\` (Serif) | 400, 500, 600, 700 |
| UI funcional | \`Inter\` (Sans-serif) | 300, 400, 500, 600, 700 |

#### Hierarquia Tipográfica
| Elemento | Classe | Exemplo |
|---|---|---|
| Hero Title | \`font-serif text-4xl md:text-6xl font-semibold\` | Landing page H1 |
| Section Title | \`font-serif text-3xl md:text-5xl font-semibold\` | Seções de conteúdo |
| Body | \`font-sans text-sm md:text-base\` | Textos gerais |
| Label/Meta | \`font-sans text-xs uppercase tracking-widest\` | Tags, badges |

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
| \`slide-up\` | 0.9s | cubic-bezier | Hero elements |
| \`scale-in\` | 0.6s | cubic-bezier | Cards, modais |
| \`float\` | 3s loop | ease-in-out | CTAs flutuantes |
| \`glow\` | 2s loop | ease-in-out | Destaque primary |

**Delays escalonados:** \`delay-100\` a \`delay-800\` (100ms increments)

---

### 🌗 Gradientes & Sombras

\`\`\`css
--gradient-gold: linear-gradient(135deg, hsl(60 100% 50%), hsl(48 90% 65%), hsl(60 100% 50%));
--shadow-gold: 0 0 40px hsl(var(--gold) / 0.2);
--shadow-elegant: 0 25px 50px -12px rgba(0,0,0,0.15);
\`\`\`

---

### 📜 Scrollbars (Landing Pages)
| Largura | Cor |
|---|---|
| 8px | Dourado (\`--gold / 0.3\`) sobre carvão |

---

### 🏗️ Contexto de Aplicação
- Tipografia Serif nos títulos
- Gradientes dourados, \`animate-fade-up\`, parallax
- Sequência: Localização → Diferenciais → Urgência → Investimento
- Background cinematográfico com overlays

---

### ⛔ Regras de Ouro
1. **Tokens sempre** — Nunca \`text-white\`, \`bg-black\` direto
2. **HSL sempre** — Nunca hex no \`index.css\`
3. **Sem gradientes genéricos** — Nada de roxo/azul "AI startup"
4. **Dark mode first** — Admin é dark por padrão
5. **Contrast check** — Texto sobre \`--primary\` (#FFFF00) deve ser escuro
6. **Mobile-first** — Responsive com breakpoints Tailwind`;

const CRM_PROMPT = `## 🖥️ Design System — CRM / Admin / Login

### Filosofia Visual
**"Dark Professional"** — Interface funcional de alta densidade, dark mode padrão. Sem elementos de luxo — foco em produtividade, clareza de informação e ações rápidas.

---

### 🎨 Paleta de Cores (HSL)

#### Dark Mode (Padrão CRM)
| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| \`--background\` | \`240 6% 4%\` | \`#0a0a0f\` | Fundo principal |
| Layout bg | — | \`#0f0f12\` | Background do layout admin |
| \`--card\` / Surfaces | — | \`#1e1e22\` | Cards, modais, painéis |
| \`--border\` | \`220 8% 18%\` | \`#2a2a2e\` | Bordas sutis |
| \`--muted\` | \`220 8% 18%\` | \`#2a2a2e\` | Áreas secundárias |
| \`--muted-foreground\` | \`220 10% 55%\` | \`#838a96\` | Texto secundário |
| \`--secondary\` | \`220 8% 15%\` | \`#232328\` | Botões secundários |
| \`--foreground\` | \`45 30% 96%\` | \`#f7f4ed\` | Texto principal |

#### Acentos CRM
| Token | Hex | Uso |
|---|---|---|
| \`--primary\` | \`#FFFF00\` (HSL 60 100% 50%) | CTAs, seleção, foco |
| Status: Novo | \`bg-blue-500\` | Coluna "Novo" |
| Status: Info Enviada | \`bg-enove-yellow\` | Coluna "Info Enviada" |
| Status: Agendamento | \`bg-orange-500\` | Coluna "Agendamento" |
| Status: Docs Recebidos | \`bg-emerald-500\` | Coluna "Docs Recebidos" |
| Status: Registrado | \`bg-slate-400\` | Coluna "Registrado" |
| Status: Inativo | \`bg-red-500\` | Coluna "Inativo" |
| WhatsApp | \`#25D366\` | Botões WhatsApp |

#### Cores de Origem (Kanban Cards)
| Tipo | Classes |
|---|---|
| Pago | \`bg-purple-500/20 text-purple-300 border-purple-500/40\` |
| Orgânico | \`bg-emerald-500/20 text-emerald-300 border-emerald-500/40\` |
| Indicação | \`bg-blue-500/20 text-blue-300 border-blue-500/40\` |
| Manual | \`bg-enove-yellow/20 text-enove-yellow border-enove-yellow/40\` |
| Desconhecido | \`bg-slate-500/20 text-slate-400 border-slate-500/40\` |

---

### 🔤 Tipografia CRM

| Contexto | Fonte | Classe |
|---|---|---|
| **Toda a UI** | \`Inter\` (Sans-serif) | \`font-sans\` |
| Card Title | \`font-sans text-lg font-semibold\` | Dashboard cards |
| Body | \`font-sans text-sm md:text-base\` | Textos gerais |
| Label/Meta | \`font-sans text-xs uppercase tracking-widest\` | Tags, badges |
| Exceção: Login H1 | \`font-serif text-5xl font-bold\` | Apenas no hero do login |

⚠️ **Sem Serif no CRM** — exceto título do painel visual de login.

---

### 🔐 Tela de Login

#### Layout
- Desktop: Split \`3/5\` visual + \`2/5\` form
- Mobile: Form-only com header compacto

#### Painel Visual (Desktop)
\`\`\`
bg-gradient-to-br from-[#0a0a0c] via-[#0f0f12] to-[#1a1a1e]
Grid pattern sutil: rgba(255,255,0,0.1) 1px lines, 60px gap
Central glow: bg-[#FFFF00]/5 rounded-full blur-3xl
\`\`\`

#### Card de Login
\`\`\`
bg-[#1e1e22] border border-[#2a2a2e] rounded-2xl p-8
shadow-2xl shadow-black/50
\`\`\`

#### Inputs
\`\`\`
bg-[#141417] border border-[#2a2a2e] rounded-lg
text-white placeholder:text-slate-500
focus:border-[#FFFF00] focus:ring-1 focus:ring-[#FFFF00]/20
pl-10 (com ícone à esquerda)
\`\`\`

#### Botão de Login
\`\`\`
w-full py-3 bg-[#FFFF00] text-[#0a0a0c] rounded-lg
font-semibold uppercase tracking-wider text-sm
hover:shadow-[0_0_30px_rgba(255,255,0,0.4)] hover:scale-[1.02]
disabled:opacity-50
\`\`\`

#### Loading Spinner
\`\`\`
border-2 border-[#FFFF00] border-t-transparent rounded-full animate-spin
\`\`\`

#### Animações Login
| Elemento | Animação | Delay |
|---|---|---|
| Logo | \`animate-fade-in-down\` | 0ms |
| Título | \`animate-fade-in-left\` | 200ms |
| Divider | \`animate-expand-width\` | 400ms |
| Descrição | \`animate-fade-up\` | 500ms |
| Card | \`animate-scale-in\` | 300ms (mobile) / 500ms (desktop) |
| Inputs | \`animate-fade-up\` | 400-600ms escalonado |

---

### 📋 Kanban Board

#### Layout
- Scroll horizontal com \`scrollbar-subtle\` (4px)
- Colunas lado a lado, virtualização com \`@tanstack/react-virtual\`

#### Coluna Kanban
\`\`\`
Header: Badge com cor do status + contagem
Background: bg-[#0f0f12] (mesmo que layout)
Scroll interno: overflow-y-auto com scrollbar-subtle
\`\`\`

#### Kanban Card
\`\`\`
bg-[#1e1e22] border border-[#2a2a2e] rounded-xl
hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
transition-[border-color,transform,opacity] duration-200 ease-out
\`\`\`

##### Elementos do Card
| Elemento | Estilo |
|---|---|
| Avatar | \`bg-slate-700/50 text-slate-400\` com iniciais |
| Nome do Lead | \`text-sm font-medium text-white truncate\` |
| Telefone | \`text-xs text-slate-400\` |
| Badge de Origem | Cores por tipo (ver tabela acima) |
| Barra de Progresso | 2px, cor varia por status |
| Botão de Ação | Cor contextual por status |
| Ícones de Comunicação | WhatsApp green, Phone slate |
| Card Stale (>48h) | \`opacity-60\` |
| Card Novo | \`ring-pulse\` animation + glow verde |

##### Botões de Ação por Status
| Status | Label | Cor |
|---|---|---|
| Novo | "Iniciar Atendimento" | \`bg-emerald-500/90\` |
| Info Enviada | "Agendar" | \`bg-orange-500/90\` |
| Agendamento | "Comparecimento" | \`bg-blue-500/90\` |
| Docs Recebidos | "Confirmar Venda" | \`bg-emerald-600/90\` |

---

### 📊 Admin Layout

#### Estrutura
\`\`\`
Sidebar fixa à esquerda (hidden mobile)
Bottom Nav no mobile
bg-[#0f0f12] admin-scrollbar
\`\`\`

#### Sidebar
\`\`\`
bg-[#0f0f12] border-r border-[#2a2a2e]
Items: hover:bg-[#1e1e22] rounded-lg
Item ativo: bg-[#1e1e22] text-primary
\`\`\`

#### Scrollbar Admin
\`\`\`
width: 4px
thumb: rgba(100, 116, 139, 0.3) → hover: 0.5
track: transparent
\`\`\`

---

### 🗂️ Sheets / Modais (Lead Detail)

\`\`\`
SheetContent: bg-[#1e1e22] border-[#2a2a2e]
ScrollArea interna com scrollbar-subtle
Seções separadas por border-b border-[#2a2a2e]
\`\`\`

#### Quick Notes (Observações Rápidas)
| Categoria | Cores |
|---|---|
| Contato | \`bg-slate-500/20 text-slate-300 border-slate-500/40\` |
| Interesse | \`bg-emerald-500/20 text-emerald-300 border-emerald-500/40\` |
| Documentos | \`bg-yellow-500/20 text-yellow-300 border-yellow-500/40\` |
| Financeiro | \`bg-purple-500/20 text-purple-300 border-purple-500/40\` |
| Selecionado | \`ring-2 ring-[#FFFF00] ring-offset-1 ring-offset-[#1e1e22]\` |

---

### ⛔ Regras CRM

1. **Sans-serif only** — Nunca usar \`font-serif\` no CRM (exceto login hero)
2. **Tokens semânticos** — Usar variáveis CSS, não hex direto
3. **Dark mode fixo** — CRM é sempre dark, sem toggle
4. **Densidade alta** — Padding compacto (\`p-2\` a \`p-4\`), text-sm como base
5. **Scrollbars finas** — \`admin-scrollbar\` (4px) em todo o admin
6. **Feedback visual** — Hover states em todos os elementos interativos
7. **Status = Cor** — Cada status do lead tem cor fixa, consistente em todo CRM
8. **Mobile-first** — Bottom nav no mobile, sidebar no desktop
9. **Safe areas** — \`pt-safe\`, \`pb-safe\` para PWA/mobile`;

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
            Copie estes prompts e cole na seção <strong>Knowledge</strong> dos seus projetos Lovable para manter consistência visual.
          </p>
        </div>

        <Tabs defaultValue="landing" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="landing">Landing Pages</TabsTrigger>
            <TabsTrigger value="crm">CRM / Admin</TabsTrigger>
            <TabsTrigger value="full">Prompt Completo</TabsTrigger>
          </TabsList>

          <TabsContent value="landing">
            <div className="flex justify-end mb-4">
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
              <CopyButton text={CRM_PROMPT} label="Copiar CRM" copyKey="crm" />
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
