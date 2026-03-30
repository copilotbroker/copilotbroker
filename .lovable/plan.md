

# Gravação de Áudio na Inbox

## Resumo

Adicionar um botão de gravação de áudio (microfone) no composer da inbox, permitindo gravar e enviar áudios diretamente, estilo WhatsApp. O botão aparece quando o campo de texto está vazio; ao pressionar, inicia a gravação com `MediaRecorder API`, mostrando um timer e botões de cancelar/enviar.

## Comportamento

1. Quando o input de texto está vazio e não há arquivo pendente, o botão de enviar (Send) é substituído por um botão de microfone
2. Ao clicar no microfone, inicia gravação — o composer muda para um "modo gravação" com timer, botão cancelar (X) e botão enviar (check)
3. Ao confirmar, o áudio (webm/ogg) é enviado pelo mesmo pipeline de mídia existente (upload para `project-media` + `onSendMessage` com `messageType: "audio"`)
4. Ao cancelar, volta ao estado normal sem enviar nada

## Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/components/inbox/ConversationThread.tsx` | Adicionar estado de gravação (`isRecording`, `mediaRecorder`, `recordingDuration`), lógica de start/stop/cancel com `MediaRecorder`, timer visual, e trocar botão Send por Mic quando input vazio |

## Detalhes técnicos

- Usar `navigator.mediaDevices.getUserMedia({ audio: true })` para capturar áudio
- `MediaRecorder` com `mimeType: "audio/webm"` (fallback para `audio/ogg`)
- Timer incrementado via `setInterval` a cada segundo
- O áudio gravado vira um `File` que passa pelo mesmo fluxo de `pendingFile` → upload → `onSendMessage`
- Nenhuma mudança no backend — o edge function `inbox-send-message` já suporta envio de áudio via UAZAPI

