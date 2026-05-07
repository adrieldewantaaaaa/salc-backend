-- ============================================================
-- SALC Database Schema
-- Smart Adaptive Learning Companion
-- ============================================================

CREATE DATABASE IF NOT EXISTS salc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salc_db;

-- ============================================================
-- TABEL: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
  avatar_url  VARCHAR(255)  DEFAULT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABEL: materials
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(200)  NOT NULL,
  subject     VARCHAR(100)  NOT NULL,
  content     TEXT          DEFAULT NULL,
  difficulty  ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  order_index INT           NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by  INT           DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABEL: progress
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT   NOT NULL,
  material_id INT   NOT NULL,
  score       FLOAT NOT NULL DEFAULT 0,
  status      ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  attempts    INT   NOT NULL DEFAULT 0,
  time_spent  INT   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (user_id, material_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL: quiz_answers
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT     NOT NULL,
  material_id INT     NOT NULL,
  question    TEXT    NOT NULL,
  answer      TEXT    NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  score       FLOAT   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL: predictions
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT   NOT NULL,
  question_id     INT   DEFAULT NULL,
  answer          TEXT  NOT NULL,
  category        ENUM('baik', 'cukup', 'kurang') NOT NULL DEFAULT 'cukup',
  score           FLOAT NOT NULL DEFAULT 0,
  feedback        TEXT  DEFAULT NULL,
  recommendation  TEXT  DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL: early_warnings
-- ============================================================
CREATE TABLE IF NOT EXISTS early_warnings (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT   NOT NULL,
  is_at_risk  BOOLEAN NOT NULL DEFAULT FALSE,
  risk_level  ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  risk_score  FLOAT DEFAULT NULL,
  message     TEXT  DEFAULT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL: recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  material_id INT NOT NULL,
  reason      TEXT DEFAULT NULL,
  priority    INT  NOT NULL DEFAULT 1,
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEX untuk performa query
-- ============================================================
CREATE INDEX idx_progress_user        ON progress(user_id);
CREATE INDEX idx_progress_material    ON progress(material_id);
CREATE INDEX idx_quiz_user            ON quiz_answers(user_id);
CREATE INDEX idx_predictions_user     ON predictions(user_id);
CREATE INDEX idx_warnings_user        ON early_warnings(user_id);
CREATE INDEX idx_recommendations_user ON recommendations(user_id);

-- ============================================================
-- SAMPLE DATA (development & testing)
-- password: admin123
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
('Admin SALC', 'admin@salc.id', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', 'admin');

INSERT INTO materials (title, subject, difficulty, order_index, created_by) VALUES
('Pengenalan Algoritma',      'Pemrograman Dasar', 'easy',   1, 1),
('Variabel dan Tipe Data',    'Pemrograman Dasar', 'easy',   2, 1),
('Array dan List',            'Struktur Data',     'medium', 3, 1),
('Fungsi dan Rekursi',        'Pemrograman Dasar', 'medium', 4, 1),
('Machine Learning Basics',   'AI & ML',           'hard',   5, 1),
('Pengenalan Neural Network', 'AI & ML',           'hard',   6, 1);
