
UPDATE conversations c
SET display_name = NULL, display_name_source = NULL
FROM brokers b
WHERE b.id = c.broker_id
  AND c.display_name = b.name
  AND c.display_name_source = 'sender_name';
