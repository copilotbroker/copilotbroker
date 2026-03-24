

# Tornar botão WhatsApp acessível no mobile na página do Lead

## Problema
O botão WhatsApp no header da página do lead tem a classe `hidden sm:inline-flex`, ficando invisível no mobile.

## Solução

### Arquivo: `src/pages/LeadPage.tsx`

Remover `hidden sm:inline-flex` do link WhatsApp (linha 429) e trocar por `inline-flex` para ficar visível em todos os tamanhos. Simplificar o botão no mobile (só ícone, sem texto) para economizar espaço:

- Mobile: ícone WhatsApp compacto (sem texto "WhatsApp")
- Desktop: ícone + texto como está hoje

```tsx
<a href={whatsappLink} target="_blank" rel="noopener noreferrer" 
   className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-all">
  <MessageCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
  <span className="hidden sm:inline">WhatsApp</span>
  <ExternalLink className="w-3 h-3 hidden sm:inline" />
</a>
```

Fazer o mesmo para o botão "Chat" (linha 422-428) que também tem `hidden sm:inline-flex` — torná-lo visível no mobile como ícone compacto.

Apenas 1 arquivo alterado.

