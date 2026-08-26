PRAGMA foreign_keys = ON;

-- O conteúdo dos QR Codes é gravado somente no D1 por uma rota gerencial
-- autenticada. Nenhum código pessoal faz parte dos arquivos públicos do site.
CREATE TABLE employee_point_qr (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  image_base64 TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

