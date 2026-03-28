-- Run if you already applied schema.sql before app_state existed:
--   mysql -u root -p taskorbit < schema_app_state.sql

USE taskorbit;

CREATE TABLE IF NOT EXISTS app_state (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  payload JSON NOT NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);
