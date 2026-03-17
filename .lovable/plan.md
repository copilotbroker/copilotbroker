
Objetivo

Transformar a ação atual de “Cadência 10D” na página do lead em um fluxo mais flexível:
- botão passa a se chamar “+ Cadência”;
- o usuário pode escolher uma cadência já configurada pelo corretor;
- ou criar uma nova cadência a partir dali;
- “Cadência 10D” vira apenas o nome da cadência padrão pré-configurada.

O que encontrei no código

- A página do lead hoje abre diretamente `CadenciaSheet` por `cadenciaOpen`.
- `CadenciaSheet` é um editor/ativador fixo da cadência padrão:
  - usa `DEFAULT_STEPS`;
  - cria campanha com nome `Cadência 10D - {leadName}`;
  - título do sheet está hardcoded como `Cadência 10D™`.
- Já existe uma estrutura de regras reutilizáveis do corretor:
  - `broker_auto_cadencia_rules`
  - `auto_cadencia_steps`
  - hook `useAutoCadenciaRules()`
- Porém essa estrutura hoje foi pensada para automação por empreendimento, não para “escolher e aplicar no lead” dentro da página do lead.

Plano de implementação

1. Criar um novo seletor de cadências na página do lead
- Substituir a ação atual por um novo fluxo:
  - botão “+ Cadência”
  - abre um sheet/modal de seleção
- Esse seletor deve listar:
  - “Cadência 10D” como opção padrão
  - cadências já salvas do corretor
  - ação “Criar nova cadência”

2. Adaptar o fluxo de ativação manual para aceitar cadências salvas
- Evoluir `CadenciaSheet` para funcionar em dois modos:
  - modo padrão: carrega `DEFAULT_STEPS`
  - modo regra existente: carrega steps vindos de `auto_cadencia_steps`
- A campanha criada deve usar o nome da cadência escolhida, não mais um texto fixo.

3. Permitir criação rápida de nova cadência a partir da página do lead
- Reaproveitar o editor existente de regras como base conceitual, mas em contexto do lead.
- Fluxo esperado:
  - usuário clica “Criar nova cadência”
  - define etapas
  - escolhe se quer salvar como cadência reutilizável
  - já pode aplicar essa nova cadência no lead atual
- Se o save reutilizável complicar demais a primeira iteração, dá para separar em:
  - criar e aplicar agora
  - opcionalmente salvar como regra do corretor

4. Ajustar nomenclatura para modelo/preset
- “Cadência 10D” deixa de ser o nome do botão principal.
- Ela passa a ser exibida como:
  - preset padrão
  - nome inicial sugerido em novas cadências
- Revisar textos da UI dessa área para refletir isso.

5. Preservar as regras atuais de negócio
- Manter validações já existentes:
  - não permitir se já houver fluxo ativo conflitante
  - continuar salvando `lead_previous_status`
  - continuar movendo o lead para “Copiloto Ativo”
  - continuar registrando interação no timeline
- Só muda a forma de escolher/criar a cadência, não a segurança do fluxo.

Arquivos que eu alteraria

- `src/pages/LeadPage.tsx`
- `src/components/crm/CadenciaSheet.tsx`
- novo componente, algo como:
  - `src/components/crm/CadenciaPickerSheet.tsx`
- possivelmente reaproveitar lógica de:
  - `src/hooks/use-auto-cadencia-rules.ts`
  - `src/components/whatsapp/AutoCadenciaRuleEditor.tsx`

Detalhes técnicos

- Hoje falta no tipo `BrokerAutoCadenciaRule` um campo de nome visível da cadência; preciso confirmar no schema real se a tabela já possui esse campo. Se não possuir, será necessária uma pequena evolução de banco para armazenar nome/label da cadência reutilizável.
- A melhor arquitetura é separar:
  - “cadências reutilizáveis do corretor”
  - “ativar uma cadência em um lead”
- Assim a página do lead apenas consome uma cadência escolhida, em vez de manter tudo hardcoded no `CadenciaSheet`.

Resultado esperado

- O botão vira “+ Cadência”.
- Ao clicar, o corretor escolhe uma cadência pronta ou cria uma nova.
- “Cadência 10D” continua existindo, mas como preset/cadência padrão.
- A experiência fica extensível sem quebrar a lógica atual de ativação no lead.
