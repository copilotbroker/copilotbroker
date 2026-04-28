## Objetivo

Restaurar o backup `backup-leads-enove-13corretores.sql` (523 leads + 2300 interações + 100 documentos + 517 atribuições) garantindo que **100% dos leads** sejam vinculados ao corretor e projeto corretos.

## Diagnóstico

**Corretores** — todos os 13 existem no destino, mas 3 com emails divergentes:

| Backup espera | Banco real |
|---|---|
| `pedrorocha.enove@gmail.com` | `pedro.enove@gmail.com` (Pedro Rocha) |
| `vinibrito.enove@gmail.com` | `vinicius.enove@gmail.com` (Vinicius de Brito Machado) |
| `jaqueline.enove@gmail.com` | `jaqueline.enove@hotmail.com` (Jaqueline Panigo) |

**Projetos** — apenas 2 dos 6 existem (`estanciavelha`, `mauriciocardoso`). Faltam 4:
- `goldenview`
- `prontos`
- `casa-a-venda-em-estancia-velha-floresta-com-3-suites-com-135-m`
- `oportunidade-casa-a-venda-em-campo-bom-firenze-com-3-suites-com-243-7-m`

## Etapas de execução

### 1. Criar os 4 projetos faltantes (migration)

Inserir registros mínimos em `public.projects` com os 4 slugs exatos esperados pelo backup, vinculados à organização Enove Select (`088e6667-b1d8-4544-8100-beca431e2c75`). Campos preenchidos: `name`, `slug`, `city`, `city_slug`, `organization_id`, `is_active=true`. Demais campos ficam com defaults / nulos para edição posterior no painel.

### 2. Patch no SQL antes de rodar

Editar `/tmp/backup-leads.sql` em memória trocando os 3 emails divergentes pelos emails reais do banco (busca-e-substitui literal). Isso faz o `_broker_map` resolver os 3 corretores corretamente sem mexer no resto do script.

### 3. Suprimir triggers durante a importação

Descomentar `SET session_replication_role = replica;` e `SET session_replication_role = origin;` no script. Isso evita:
- Disparo em massa de `notify_new_lead` (criaria 523 notificações para cada admin)
- Trigger `trigger_roleta_distribuir` chamando edge function 523 vezes
- `auto_create_conversation_for_lead` criando 523 conversations
- `update_lead_last_interaction` em cada uma das 2300 interações

Os dados originais já trazem `created_at`, `broker_id`, `status`, `last_interaction_at`, etc. — não precisamos dos triggers para reconstituir o estado.

### 4. Executar via psql

Rodar o script patcheado dentro de uma transação. Capturar as mensagens NOTICE finais que reportam quantos leads/interações/docs/attribution foram inseridos.

### 5. Validação pós-importação

Executar 4 queries de conferência:
- Total de leads inseridos = 523
- Leads com `broker_id IS NULL` = 0 (todos vinculados)
- Leads com `project_id IS NULL` agrupado por projeto esperado = 0
- Contagem de leads por corretor (13 linhas, todas com totais > 0 esperados conforme distribuição original)

Se algum lead ficar sem broker ou projeto, rollback e investigação.

### 6. Reabilitar manualmente o que importa

Após a importação, opcionalmente disparar `auto_create_conversation_for_lead` para os leads importados que tenham broker + WhatsApp, em batch único — ou deixar para criação sob demanda quando o lead receber mensagem. Recomendado: **não** recriar conversations agora (evita poluir Inbox com 523 threads vazias).

## Detalhes técnicos

- **Migration tool** (etapa 1): cria os 4 projetos.
- **Insert tool** (etapas 2-4): script INSERT em massa via `supabase--insert` com o SQL patcheado.
- **read_query** (etapa 5): validações.

## Risco e reversibilidade

O backup usa `ON CONFLICT (id) DO NOTHING` em todas as tabelas, então re-executar é seguro (idempotente). Se algo der errado a transação inteira é revertida com `ROLLBACK`.

## Aprovação necessária

Confirme para eu prosseguir. Posso também, se preferir, primeiro só criar os projetos e te mostrar o resultado antes de rodar a importação dos 523 leads.