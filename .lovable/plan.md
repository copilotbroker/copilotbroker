

## Problema Identificado

O bucket `project-media` tem políticas de segurança (RLS) que permitem upload e delete **apenas para admins**. O usuário logado tem role `broker`, por isso todas as fotos falham ao enviar.

## Solução

Criar uma migration SQL que adiciona políticas de INSERT e DELETE para brokers no bucket `project-media`:

```sql
-- Allow brokers to upload to project-media
CREATE POLICY "Brokers can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND has_role(auth.uid(), 'broker'::app_role)
);

-- Allow brokers to delete their own uploads from project-media
CREATE POLICY "Brokers can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media'
  AND has_role(auth.uid(), 'broker'::app_role)
);
```

Tambem adicionar para `leader`:

```sql
CREATE POLICY "Leaders can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND has_role(auth.uid(), 'leader'::app_role)
);

CREATE POLICY "Leaders can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media'
  AND has_role(auth.uid(), 'leader'::app_role)
);
```

### Arquivo alterado
- **1 migration SQL** adicionando 4 novas RLS policies no storage.objects para brokers e leaders

Nenhuma alteração de código frontend necessaria. O problema e exclusivamente de permissao no banco.

