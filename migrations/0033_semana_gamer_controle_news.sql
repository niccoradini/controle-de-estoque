-- Campanha Semana Gamer do Vivo Controle publicada em 11/08/2026.
-- O texto estruturado preserva as regras e os valores da comunicação original.
-- o gerente pode ocultar ou republicar a notícia pela interface.

INSERT INTO news_items
  (id, title, body, category, validity_label, image_path, image_alt, active, created_at, updated_at)
VALUES
  (
    'campaign-semana-gamer-controle-2026-08',
    'Semana Gamer: 30GB de bônus no Vivo Controle',
    '## Benefício
• 30GB de bônus de internet móvel por 12 meses
• Dados ilimitados para assistir YouTube por 2 meses
• Campanha cumulativa com o bônus de débito automático (+3GB)

## Quem participa
• Clientes que realizarem Alta, Portabilidade, Migração ou Upgrade
• Planos Vivo Controle Fatura, com ou sem Serviços Digitais
• Inclusão automática do bônus na linha do cliente em até 15 dias úteis

## Planos exibidos na campanha
• 15GB + 30GB de bônus = 45GB — R$ 62
• 20GB + 30GB de bônus = 50GB — R$ 75
• 20GB com YouTube Premium Lite + 30GB = 50GB — R$ 85
• 20GB com Apple Music + 30GB = 50GB — R$ 85
• 20GB com Vale Saúde Sempre Individual + 30GB = 50GB — R$ 85
• 20GB com serviço digital + 30GB = 50GB — R$ 85
• 20GB com Netflix Padrão com anúncios + 30GB = 50GB — R$ 90
• 20GB com Vivo TV Inicial + 30GB = 50GB — R$ 105

! Não participam os planos Controle Cartão, Vivo Pós Individual, Vivo Pós Família, Vivo V e Vivo Total. Bônus válido por 12 meses; oferta sujeita às regras e à vigência da campanha.',
    'promotion',
    '11 a 31/08/2026',
    '/news/semana-gamer-controle-2026-08.webp',
    'Campanha Semana Gamer do Vivo Controle com 30GB de bônus por 12 meses.',
    1,
    '2026-08-11T08:00:00.000Z',
    '2026-08-11T08:00:00.000Z'
  );

CREATE TABLE _migration_0033_news_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0033_news_guard (valid)
SELECT CASE
  WHEN COUNT(*) = 1
   AND MAX(active) = 1
   AND MAX(validity_label) = '11 a 31/08/2026'
  THEN 1 ELSE 0
END
FROM news_items
WHERE id = 'campaign-semana-gamer-controle-2026-08';

DROP TABLE _migration_0033_news_guard;
