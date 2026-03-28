-- Run once (MySQL client or GUI) after creating the database:
--   mysql -u root -p < schema.sql
-- Or paste into TablePlus / Workbench against database `taskorbit`.

CREATE DATABASE IF NOT EXISTS taskorbit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskorbit;

CREATE TABLE IF NOT EXISTS boards (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) Not null,
  bg_type ENUM('gradient', 'solid') NOT NULL DEFAULT 'gradient',
  bg_value TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS lists (
  id VARCHAR(64) PRIMARY KEY,
  board_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(64) PRIMARY KEY,
  list_id VARCHAR(64) NOT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  due_date DATE NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  labels_json JSON NULL,
  checklist_json JSON NULL,
  member_ids_json JSON NULL,
  comments_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Full app snapshot (boards, lists, cards, labels, users, activities) for API sync
CREATE TABLE IF NOT EXISTS app_state (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  payload JSON NOT NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);
