## Objetivo

Trazer para este projeto o recurso **Completar Cadastro** que existe no CRM - O Novo Condomínio: um botão na seção "Dados do Lead" (em `/corretor/lead/:leadId`) que abre um wizard multi-etapas para coletar todos os dados do comprador (PF e PJ), com upload de documentos e extração automática por IA.

## O que será replicado

1. **Página wizard** `/corretor/lead/:leadId/cadastro` com 6 etapas:
   - Comprador (dados pessoais + documento)
   - Estado civil
   - Cônjuge (condicional)
   - Residência (endereço + comprovante)
   - Pessoa Jurídica (opcional)
   - Revisão (com download em ZIP de todos os documentos)
2. **Botão "Completar Cadastro"** na seção *Dados do Lead* da página do lead.
3. **Upload de documentos** com extração automática via IA (CNH/RG → preenche nome, CPF, data nasc; comprovante de residência → preenche endereço; CNPJ → preenche dados PJ; etc.). Campos preenchidos pela IA recebem badge "IA · revisar".
4. **Auto-save** ao trocar de etapa + aviso ao sair com alterações pendentes.
5. **Barras de progresso** (campos preenchidos % + documentos enviados %).

## Mudanças técnicas

### Backend (migração SQL)
- Criar tabela `public.lead_cadastro_completo` (1 linha por lead, ~50 colunas: PF + cônjuge + endereço + PJ + `ai_filled_fields`, `ai_raw_responses`).
- Adicionar colunas em `lead_documents`: `file_path`, `file_name`, `mime_type`, `file_size`, `uploaded_by`, `ai_extracted` (jsonb), `is_active`, `updated_at`.
- Criar bucket de Storage privado `lead-documents` com policies por broker/líder/admin.
- RLS na nova tabela: admin (full), corretor (próprios leads), líder (leads da equipe via `brokers.lider_id`).
- Trigger `updated_at`.
- Trigger `BEFORE INSERT` para preencher `organization_id` automaticamente (padrão multi-tenant deste projeto), já que `lead_documents` aqui tem essa coluna e a tabela nova também deve respeitar isso.

### Edge Function
- Copiar `lead-document-extract` (usa Lovable AI Gateway / Gemini vision para OCR estruturado do documento). Sem segredo adicional necessário (LOVABLE_API_KEY já provisionado).

### Frontend
- `src/pages/LeadCadastroPage.tsx` (página wizard ~900 linhas).
- `src/hooks/use-lead-cadastro.ts` (CRUD + upload + extração).
- `src/components/crm/CadastroUploadField.tsx` (campo de upload com IA).
- `src/components/crm/CadastroProgressCharts.tsx` (cálculo de completude).
- `src/lib/br-validators.ts` (CPF, CNPJ, CEP, e-mail, telefone).
- Reuso de `PhoneField.tsx` (já existe neste projeto).
- Adicionar rota em `src/App.tsx`: `/corretor/lead/:leadId/cadastro` → `LeadCadastroPage`.
- Em `src/pages/LeadPage.tsx`, no header da seção *Dados do Lead* (linha ~706), inserir o botão amarelo/azul "Completar Cadastro" que navega para a nova rota.

### Dependências
- Adicionar `jszip` (para download em lote dos documentos na etapa Revisão).
- `react-helmet-async` — verificar se já está instalado; se não, adicionar.

## Pontos de atenção

- Estética idêntica ao original (tema dark `#0a0a0f` / acento `#FFFF00`), alinhada ao Dark Professional Theme já em uso aqui.
- Mobile-first (stepper compacto no header em telas pequenas).
- O wizard só atualiza `leads.name` se o usuário editar nome no cadastro completo — não toca em outros campos de `leads`.
- Líderes herdam acesso aos cadastros da equipe (consistente com regras de visibilidade já estabelecidas).

## Fora do escopo

- Geração de PDF do cadastro consolidado (apenas ZIP dos uploads).
- Sincronização do cadastro com `lead_documents` checklist legado — continuam coexistindo (a checklist atual marca recebimento; o wizard armazena os arquivos reais).
