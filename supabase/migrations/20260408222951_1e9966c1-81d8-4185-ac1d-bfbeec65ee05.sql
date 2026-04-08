
-- Step 1: Merge duplicate global conversations
-- For each duplicate pair, keep the one with lead_id (or oldest), migrate messages, delete the other

-- Duplicate 1: phone 5551996669337
-- Keep: 4f54ed9b (has lead), Delete: 9a19cb1a (no lead)
UPDATE conversation_messages SET conversation_id = '4f54ed9b-bab4-48a2-bb9f-cfe6476d16ec'
WHERE conversation_id = '9a19cb1a-5d49-4434-92a3-4a728963f7a5';
DELETE FROM conversations WHERE id = '9a19cb1a-5d49-4434-92a3-4a728963f7a5';

-- Duplicate 2: phone 5551998956360
-- Both have leads - keep oldest (16557381), migrate messages, delete def1f4cd
UPDATE conversation_messages SET conversation_id = '16557381-4bf8-4d19-99f4-8379152da7df'
WHERE conversation_id = 'def1f4cd-b843-4d6a-a311-cfd323efc51a';
-- Unlink the lead from deleted conv so it doesn't orphan
UPDATE conversations SET lead_id = COALESCE(lead_id, 'c2fbb16a-95b3-4862-940e-eac71dd09802')
WHERE id = '16557381-4bf8-4d19-99f4-8379152da7df';
DELETE FROM conversations WHERE id = 'def1f4cd-b843-4d6a-a311-cfd323efc51a';

-- Duplicate 3: phone 5551996601187
-- Keep: 0045b4f1 (has lead), Delete: 54899a40 (no lead)
UPDATE conversation_messages SET conversation_id = '0045b4f1-6403-4a89-b360-91327f24fabe'
WHERE conversation_id = '54899a40-a657-4289-904f-939b23c18625';
DELETE FROM conversations WHERE id = '54899a40-a657-4289-904f-939b23c18625';

-- Step 2: Create partial unique index to prevent future duplicates
CREATE UNIQUE INDEX idx_conversations_global_phone_unique 
ON public.conversations (phone_normalized)
WHERE source_instance = 'global';
