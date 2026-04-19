
Three changes to `src/pages/Canela.tsx`:

**1. Remove all em-dashes (—)**
Scan the entire file and replace `—` with appropriate punctuation (period, comma, or line break) preserving readability. Affected sections: hero subtitle, posicionamento, quem somos, o que entregamos, marketing quote, modelo de atuação cards, transição, problema, proposta, fechamento.

**2. New "Produção" section** (insert after Marketing/Corretores block, before Tecnologia e Dados — keeps the dark/light alternation)
- SectionLabel: "Produção"
- Title: "Renderização 3D e conteúdo audiovisual de **alto padrão**"
- Bullets: "Elaboração completa de renderização 3D", "Imagens ultra realistas, com vida", "Vídeos profissionais com narrativa de produto", "Conteúdo visual pronto para campanhas de mídia"
- Quote: "Imagem é o primeiro contrato emocional do cliente com o produto."

**3. New CTA section at the end** (replace current "Encerramento" with stronger closing + WhatsApp CTA, dark theme)
- Headline: "Lançamento estruturado concentra resultado."
- Subheadline: "Vamos lançar juntos?"
- Paragraph: "Se vocês buscam um parceiro preparado para:" + 4 bullets (Criar valor onde o mercado ainda não enxerga / Reposicionar um bairro / Maximizar velocidade de vendas / Conduzir o processo com segurança jurídica)
- Final line: "Estamos prontos."
- Button: gold-filled CTA "Falar no WhatsApp" linking to `https://wa.me/5551997010323?text=...` with `WhatsAppIcon` from `@/components/icons/WhatsAppIcon`, opens in new tab.

Footer remains unchanged.

No routing or other file changes needed.
