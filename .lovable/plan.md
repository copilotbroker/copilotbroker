

# Limpeza de leads de teste — telefone (51) 997010323

## Situação atual

- **21 leads** encontrados com o WhatsApp `5551997010323` espalhados por vários corretores
- **2 conversas** vinculadas a esse número (uma no plantão global sem atendimento, outra atribuída)
- Registros dependentes existem em: `lead_interactions`, `lead_documents`, `lead_attribution`, `whatsapp_campaigns`, `conversations`, etc.

## O que será feito

Executar DELETE em cascata para limpar todos os dados de teste:

1. **Deletar registros dependentes** (na ordem correta para respeitar FKs):
   - `conversation_messages` das 2 conversas
   - `conversations` com esse telefone
   - `lead_documents`, `lead_interactions`, `lead_attribution`, `propostas`/`proposta_parcelas`, `whatsapp_campaigns`/`whatsapp_message_queue`, `notifications` vinculados aos 21 lead IDs
2. **Deletar os 21 leads** da tabela `leads`

## Nenhum arquivo de código será alterado

Apenas operações de DELETE no banco de dados.

