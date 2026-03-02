SET @schema_name = DATABASE();

SET @stmt = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'freelancer_profiles'
        AND COLUMN_NAME = 'contact_email'
    ),
    'SELECT 1',
    'ALTER TABLE freelancer_profiles ADD COLUMN contact_email VARCHAR(190) NULL AFTER organization_industry'
  )
);
PREPARE s1 FROM @stmt;
EXECUTE s1;
DEALLOCATE PREPARE s1;

SET @stmt = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @schema_name
        AND TABLE_NAME = 'freelancer_profiles'
        AND COLUMN_NAME = 'contact_phone'
    ),
    'SELECT 1',
    'ALTER TABLE freelancer_profiles ADD COLUMN contact_phone VARCHAR(30) NULL AFTER contact_email'
  )
);
PREPARE s2 FROM @stmt;
EXECUTE s2;
DEALLOCATE PREPARE s2;
