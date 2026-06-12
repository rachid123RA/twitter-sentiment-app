CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tweet_raw TEXT NOT NULL,
  tweet_clean TEXT NOT NULL,
  entity TEXT,
  label TEXT NOT NULL,
  prob_positive REAL,
  prob_negative REAL,
  prob_neutral REAL,
  prob_irrelevant REAL,
  probabilities_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);

CREATE TABLE IF NOT EXISTS model_metrics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  model_name TEXT,
  accuracy REAL,
  f1_macro REAL,
  f1_weighted REAL,
  precision_macro REAL,
  recall_macro REAL,
  cv_f1_macro REAL,
  labels_json TEXT,
  extra_json TEXT
);

CREATE TABLE IF NOT EXISTS dataset_stats (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notification_id INTEGER NOT NULL REFERENCES notifications(id),
  is_read INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, notification_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL DEFAULT 'free',
  is_active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
