-- Gestão completa e exclusão segura de usuários.
-- O cadastro excluído é anonimizado para preservar pedidos e histórico.

ALTER TABLE users ADD COLUMN deleted_at TEXT;

CREATE INDEX idx_users_visible
ON users (deleted_at, active, role, name);

CREATE TRIGGER users_keep_active_manager
BEFORE UPDATE OF role, active, deleted_at ON users
FOR EACH ROW
WHEN OLD.role = 'manager'
  AND OLD.active = 1
  AND OLD.deleted_at IS NULL
  AND (
    NEW.role <> 'manager'
    OR NEW.active = 0
    OR NEW.deleted_at IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1
    FROM users
    WHERE id <> OLD.id
      AND role = 'manager'
      AND active = 1
      AND deleted_at IS NULL
  )
BEGIN
  SELECT RAISE(ABORT, 'LAST_ACTIVE_MANAGER');
END;
