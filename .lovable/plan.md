

## Plano: Adicionar Pareamento por Código (alternativa ao QR Code)

### Problema
Corretores que acessam o CRM pelo celular (via QR Code) não conseguem escanear outro QR Code na mesma tela para conectar o WhatsApp.

### Solução
WhatsApp oferece **pareamento por código numérico** (8 dígitos) como alternativa ao QR. O backend já retorna o `pairingCode` da UAZAPI — basta exibi-lo no frontend.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `src/hooks/use-whatsapp-instance.ts` | Armazenar `pairingCode` no estado (já vem na resposta do `/qrcode`). |
| `src/components/whatsapp/QRCodeDisplay.tsx` | Exibir o pairing code abaixo ou como alternativa ao QR. Botão "Usar código numérico" para alternar. |
| `src/components/whatsapp/ConnectionTab.tsx` | Passar `pairingCode` ao `QRCodeDisplay`. |

### UX proposta
- Manter o QR Code como padrão (funciona bem no desktop)
- Abaixo do QR, adicionar link "No celular? Use um código numérico"
- Ao clicar, exibe o código de 8 dígitos em destaque com instruções: "Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho → Vincular com número de telefone → Digite o código abaixo"
- Se `pairingCode` não estiver disponível (nem toda UAZAPI retorna), manter apenas o QR

### Detalhes técnicos

**Hook** — adicionar estado `pairingCode`:
```typescript
const [pairingCode, setPairingCode] = useState<string | null>(null);

// No fetchQRCode:
setPairingCode(data.pairingCode || null);
```

**QRCodeDisplay** — aceitar `pairingCode` prop e renderizar alternativa:
```typescript
interface QRCodeDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}
```
- Estado local `showCode` para alternar entre QR e código
- Código exibido com fonte mono grande, espaçado (ex: `1234-5678`)
- Instruções adaptadas para o fluxo de pareamento por código

