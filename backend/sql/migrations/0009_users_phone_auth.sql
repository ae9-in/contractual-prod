SET @schema_name = DATABASE();

SET @stmt = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'phone'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER email'
  )
);
PREPARE s1 FROM @stmt;
EXECUTE s1;
DEALLOCATE PREPARE s1;

SET @stmt = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'users'
        AND INDEX_NAME = 'uq_users_phone'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone)'
  )
);
PREPARE s2 FROM @stmt;
EXECUTE s2;
DEALLOCATE PREPARE s2;

ALTER TABLE users MODIFY COLUMN email VARCHAR(190) NULL;
