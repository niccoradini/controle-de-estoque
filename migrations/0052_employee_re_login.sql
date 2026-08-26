PRAGMA foreign_keys = ON;

-- Código RE opcional e exclusivo para entrada alternativa no sistema.
ALTER TABLE users ADD COLUMN employee_re TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_re_unique
ON users (employee_re)
WHERE employee_re IS NOT NULL;

UPDATE users SET employee_re = '81037247'
WHERE role = 'seller' AND deleted_at IS NULL AND employee_re IS NULL
  AND (name LIKE 'ANA %' COLLATE NOCASE OR name = 'ANA' COLLATE NOCASE);
UPDATE users SET employee_re = '80846625'
WHERE role = 'seller' AND deleted_at IS NULL AND employee_re IS NULL
  AND (name LIKE 'JOICE%' COLLATE NOCASE);
UPDATE users SET employee_re = '81034297'
WHERE role = 'seller' AND deleted_at IS NULL AND employee_re IS NULL
  AND (name LIKE 'THALIA%' COLLATE NOCASE);
UPDATE users SET employee_re = '81079201'
WHERE role = 'seller' AND deleted_at IS NULL AND employee_re IS NULL
  AND (name LIKE 'LUIZ%' COLLATE NOCASE);
UPDATE users SET employee_re = '81077112'
WHERE role = 'seller' AND deleted_at IS NULL AND employee_re IS NULL
  AND (name LIKE 'PEDRO%' COLLATE NOCASE);
UPDATE users SET employee_re = '81079202'
WHERE role = 'seller' AND deleted_at IS NULL AND employee_re IS NULL
  AND (name LIKE 'JULIA%' COLLATE NOCASE OR name LIKE 'Júlia%');
