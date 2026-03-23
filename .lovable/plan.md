
Implementar uma conexão mobile-first por código numérico, mantendo o QR Code como alternativa.

1. Diagnóstico do problema
- Hoje o componente `QRCodeDisplay` já sabe exibir `pairingCode`, mas isso só acontece se o código vier do hook.
- No fluxo do corretor, o `useWhatsAppInstance` recebe `pairingCode` apenas quando o backend devolve esse campo.
- No fluxo global/admin, o suporte está incompleto: `useWhatsAppGlobalInstance` não armazena `pairingCode` e `GlobalConnectionTab` passa `pairingCode={null}` sempre.
- Resultado: no mobile, a UI até está preparada, mas na prática quase sempre só existe QR Code disponível.

2. O que vou ajustar
- Garantir que o backend busque e retorne também o código numérico de pareamento, não só o QR.
- Propagar esse `pairingCode` nos hooks de conexão.
- Exibir no mobile o código numérico como método principal, com botão para alternar para QR Code.
- Manter QR Code como fallback quando o provedor não retornar código numérico.

3. Arquivos a ajustar
- `supabase/functions/whatsapp-instance-manager/index.ts`
  - reforçar a extração de `pairingCode` nas respostas do provedor;
  - se necessário, consultar endpoint alternativo de conexão/pareamento quando o QR vier sem código.
- `supabase/functions/whatsapp-global-instance-manager/index.ts`
  - adicionar suporte completo a `pairingCode` no `/init` e `/qrcode`;
  - retornar `{ qrCode, pairingCode }` em vez de apenas QR.
- `src/hooks/use-whatsapp-instance.ts`
  - preservar e atualizar `pairingCode` junto com `qrCode`;
  - limpar ambos apenas quando realmente conectar.
- `src/hooks/use-whatsapp-global-instance.ts`
  - adicionar estado `pairingCode`;
  - preencher esse estado nas chamadas de init/refresh/qrcode.
- `src/components/whatsapp/GlobalConnectionTab.tsx`
  - passar o `pairingCode` real para `QRCodeDisplay`.
- `src/components/whatsapp/QRCodeDisplay.tsx`
  - reforçar o comportamento mobile:
    - abrir já em “Código de Pareamento”;
    - deixar o botão de troca entre código e QR bem visível;
    - mostrar mensagem clara quando só houver QR disponível.

4. UX esperada depois
- No celular:
  - método padrão = “Código de Pareamento”;
  - usuário vê instruções curtas + código copiável/selecionável;
  - QR Code fica como opção secundária.
- No desktop:
  - QR Code continua sendo o padrão;
  - código numérico aparece como alternativa quando disponível.
- Se o provedor não gerar código numérico:
  - a tela informa isso claramente e mantém o QR como fallback.

5. Detalhe técnico importante
- O problema não parece ser o `useIsMobile`.
- O bloqueio principal é de dados: o frontend só consegue mostrar código numérico quando o backend realmente o entrega.
- Por isso a correção precisa ser feita em cadeia: backend → hook → componente.

6. Validação após implementação
- Testar em `/corretor/copiloto` com viewport mobile.
- Confirmar que “Código de Pareamento” aparece sem depender de segundo dispositivo.
- Validar reconexão após logout/desconexão.
- Validar também o fluxo global/admin para não ficar inconsistente com o fluxo do corretor.
