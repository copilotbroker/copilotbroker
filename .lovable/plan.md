# Primeiro CTA do gerador rola para a seção de baixo

## Comportamento atual
No gerador de landing pages, o botão principal do Hero (acima da dobra) já rola direto para o formulário no fim da página (`#formulario`), pulando todo o conteúdo do site.

## Comportamento desejado
O **primeiro CTA** (botão do Hero) passa a rolar para a **seção logo abaixo** — a seção "Sobre" (`#sobre`), que é a primeira após o Hero em todos os estilos. Os demais CTAs (botão flutuante, CTA intermediário antes do formulário, botões secundários) continuam levando para o formulário.

## Onde mudar
Apenas o `onClick` do botão principal de cada Hero. Tudo nas 5 famílias de estilo:

1. `src/components/landing/DynamicHero.tsx` — Hero legacy/fallback
2. `src/components/landing/styles/luxury-noir.tsx` — Hero (já tem `scrollDown` pronto)
3. `src/components/landing/styles/editorial.tsx` — Hero
4. `src/components/landing/styles/modern-glass.tsx` — Hero
5. `src/components/landing/styles/nature-organic.tsx` — Hero

Em cada arquivo:
- Adicionar (ou reutilizar) `scrollDown = () => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })`
- Trocar o `onClick={scrollToForm}` do botão principal do Hero por `onClick={scrollDown}`
- Manter inalterados: `DynamicCTA.tsx`, `FloatingCTA`, segundos botões, e as outras seções dentro de cada arquivo de estilo (CTA intermediário etc.) — continuam rolando para `#formulario`.

## Detalhe técnico
Todas as seções "Sobre" já expõem `id="sobre"` (verificado em `DynamicAbout.tsx` e nos 4 estilos), então não precisa criar âncoras novas. Se um projeto não tiver About (caso raro), o scroll simplesmente não move — fallback aceitável.

## Fora do escopo
Sem mudanças no editor do gerador (`ProjectWizard`), no schema de `landing_content`, nem nos demais CTAs da página.
