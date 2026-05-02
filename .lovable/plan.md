## Diagnóstico

O botão de check-in da roleta é renderizado pelo componente `BrokerRoletas` (em `src/components/broker/BrokerRoletas.tsx`). Hoje ele desaparece por **dois motivos combinados**:

### Causa 1 — A roleta "Plantão" não tem membros cadastrados
Consulta no banco:

```text
roletas: 1 ativa ("Plantão")
roletas_membros (ativos para essa roleta): 0
brokers ativos: 15+
```

O componente faz:
```ts
.from("roletas_membros").select("*").eq("corretor_id", brokerId).eq("ativo", true)
```
Como nenhum corretor está vinculado à roleta, o resultado é vazio e o componente faz `return null` — o botão simplesmente não existe na DOM. Esta é a causa principal/imediata.

### Causa 2 — Mesmo com membros, o botão só aparece em um lugar muito restrito
Hoje `BrokerRoletas` só é renderizado em `BrokerAdmin.tsx` (rotas `/corretor/crm` e `/corretor/leads`):
- **Desktop (lg+)**: só no modo Kanban, num bloco `hidden lg:block`.
- **Mobile**: dentro do `collapsibleContent`, oculto até o corretor tocar no chevron/lupa para expandir o cabeçalho.
- **Outras rotas** (`Dashboard`, `Inbox`, `Plantão`, `Projects`, `Profile`, `CopilotConfig`): o componente nem é montado, então o botão não aparece em nenhuma dessas telas.

Resultado: corretores que entram direto em Inbox / Plantão / Dashboard nunca veem o botão; e mesmo no CRM, no mobile, ele fica escondido atrás do chevron.

---

## Plano de correção

### 1. Popular `roletas_membros` com os corretores ativos (migração)
Criar uma migração SQL que insere todos os `brokers` ativos como membros da roleta "Plantão", em ordem alfabética, marcados como `ativo=true` e `status_checkin=false` (cada um faz check-in quando quiser entrar na fila).

```sql
INSERT INTO roletas_membros (roleta_id, corretor_id, ordem, status_checkin, ativo)
SELECT
  (SELECT id FROM roletas WHERE nome = 'Plantão' LIMIT 1),
  b.id,
  ROW_NUMBER() OVER (ORDER BY b.name),
  false,
  true
FROM brokers b
WHERE b.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM roletas_membros rm
    WHERE rm.corretor_id = b.id
      AND rm.roleta_id = (SELECT id FROM roletas WHERE nome = 'Plantão' LIMIT 1)
  );
```

Isso resolve a causa principal — todos os corretores passam a ver o card da roleta "Plantão" com o botão In/Out.

### 2. Tornar o botão visível em todas as rotas do corretor
Mover a montagem do `BrokerRoletas` do `BrokerAdmin.tsx` para o `BrokerLayout.tsx`, de modo que apareça em qualquer página do corretor (Dashboard, CRM, Inbox, Plantão, Projects, Profile, CopilotConfig). Layout proposto:

- **Desktop**: card compacto fixo logo abaixo do `BrokerHeader` (largura total da área de conteúdo, acima do `<main>`), sempre visível.
- **Mobile**: manter o `BrokerRoletaStatusCompact` no header (já existe) e adicionar o `BrokerRoletas` completo dentro do collapsible, agora montado sempre que houver `brokerId`, não só quando a página passar `collapsibleContent`. Assim o corretor consegue expandir e fazer check-in em qualquer tela.

Remover as duas montagens redundantes hoje no `BrokerAdmin.tsx` (linhas 184 e 202) para evitar duplicação.

### 3. (Opcional, mas recomendado) Tornar o card mais óbvio quando o corretor está OFFLINE
Hoje o componente é silencioso. Quando o corretor está com `status_checkin = false` em uma roleta ativa, mostrar uma faixa/ícone de aviso discreto ("Você está fora da roleta — Fazer check-in") para deixar claro que existe uma ação a tomar. Ajuste pequeno no `BrokerRoletas.tsx`.

---

## Arquivos a alterar

- **Nova migração** `supabase/migrations/<timestamp>_seed_roleta_plantao_membros.sql` — popular `roletas_membros`.
- `src/components/broker/BrokerLayout.tsx` — montar `BrokerRoletas` para desktop e como fallback no collapsible mobile.
- `src/components/broker/BrokerHeader.tsx` — garantir que o collapsible mobile sempre exista quando houver `brokerId` (mesmo sem `collapsibleContent` da página).
- `src/pages/BrokerAdmin.tsx` — remover as duas montagens duplicadas de `BrokerRoletas`.
- `src/components/broker/BrokerRoletas.tsx` — pequeno destaque visual quando o corretor está offline (opcional).

## Como validar depois

1. Logar como corretor → o card "Plantão" com botão verde **In** aparece em qualquer página (Dashboard, CRM, Inbox, Plantão).
2. Clicar **In** → status muda para online (bolinha verde), botão vira **Out** vermelho, `roletas_membros.checkin_em` é preenchido no banco.
3. Em outro navegador como segundo corretor, clicar **In** também → o primeiro vê em tempo real o segundo aparecer na lista expandida (realtime já está implementado).
4. SQL de verificação:
   ```sql
   SELECT b.name, rm.status_checkin, rm.checkin_em
   FROM roletas_membros rm JOIN brokers b ON b.id = rm.corretor_id
   WHERE rm.roleta_id = (SELECT id FROM roletas WHERE nome='Plantão')
   ORDER BY rm.ordem;
   ```