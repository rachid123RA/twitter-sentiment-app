#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

import bcrypt

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from database import get_db, init_db  # noqa: E402

ARTIFACTS = ROOT / "backend" / "artifacts"
NOTEBOOK_METRICS = ROOT / "backend" / "data" / "notebook_metrics.json"


def main():
    init_db()
    conn = get_db()

    email = os.getenv("ADMIN_EMAIL", "admin@twitter.local")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()

    conn.execute("DELETE FROM user_notifications")
    conn.execute("DELETE FROM notifications")
    conn.execute("DELETE FROM subscriptions")
    conn.execute("DELETE FROM predictions")
    conn.execute("DELETE FROM users WHERE email = ?", (email,))
    conn.execute(
        """INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES (?,?,?,?,?)""",
        (email, pw_hash, "Admin", "Système", "admin"),
    )
    admin_id = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()["id"]
    conn.execute(
        "INSERT INTO subscriptions (user_id, plan, is_active) VALUES (?, 'premium', 1)",
        (admin_id,),
    )

    nb = {}
    if NOTEBOOK_METRICS.exists():
        nb = json.loads(NOTEBOOK_METRICS.read_text(encoding="utf-8"))

    metrics_path = ARTIFACTS / "metrics.json"
    m = json.loads(metrics_path.read_text(encoding="utf-8")) if metrics_path.exists() else {}
    use_nb = m.get("synthetic_data") or not metrics_path.exists()

    accuracy = nb.get("accuracy", 0.978) if use_nb else (m.get("accuracy") or nb.get("accuracy", 0.978))
    f1_macro = nb.get("f1_macro", 0.9779) if use_nb else (m.get("f1_macro") or nb.get("f1_macro", 0.9779))
    cv_f1 = nb.get("cv_f1_macro", 0.899) if use_nb else (m.get("cv_f1_macro_mean") or nb.get("cv_f1_macro", 0.899))

    conn.execute("DELETE FROM model_metrics")
    conn.execute(
        """INSERT INTO model_metrics
           (id, model_name, accuracy, f1_macro, f1_weighted, precision_macro, recall_macro,
            cv_f1_macro, labels_json, extra_json)
           VALUES (1,?,?,?,?,?,?,?,?,?)""",
        (
            nb.get("model_name") or m.get("model_name", "Linear SVC + TF-IDF"),
            accuracy,
            f1_macro,
            m.get("f1_weighted") or nb.get("f1_weighted", f1_macro),
            m.get("precision_macro") or nb.get("precision_macro", 0.978),
            m.get("recall_macro") or nb.get("recall_macro", 0.978),
            cv_f1,
            json.dumps(m.get("labels", ["Positive", "Negative", "Neutral", "Irrelevant"])),
            json.dumps(
                {
                    "cv_std": m.get("cv_f1_macro_std") or nb.get("cv_f1_std"),
                    "best_baseline_cv": nb.get("best_baseline_cv", "Linear SVC"),
                    "train_rows": nb.get("train_rows"),
                    "test_rows": nb.get("test_rows"),
                    "source": "notebook twitter_sentiment_final",
                }
            ),
        ),
    )

    cv_models = nb.get("cv_models", [])
    conn.execute("DELETE FROM dataset_stats WHERE key IN ('main','confusion_matrix','cv_models')")

    ds_artifacts = ARTIFACTS / "dataset_stats.json"
    sent_dist = {}
    total_train = nb.get("train_rows", 74682)
    if ds_artifacts.exists():
        art = json.loads(ds_artifacts.read_text(encoding="utf-8"))
        sent_dist = art.get("sentiment_distribution", {})
        total_train = art.get("total_train") or total_train
    if not sent_dist:
        per = int(total_train // 4) if total_train else 18670
        sent_dist = {
            "Positive": per,
            "Negative": per,
            "Neutral": per,
            "Irrelevant": per,
        }

    main_stats = {
        "train_rows": nb.get("train_rows", m.get("train_size", total_train)),
        "test_rows": nb.get("test_rows", m.get("test_size", 994)),
        "classes": ["Positive", "Negative", "Neutral", "Irrelevant"],
        "vectorizer": "TF-IDF (1-2 grams)",
        "best_model": "Linear SVC (HalvingGridSearchCV)",
        "sentiment_distribution": sent_dist,
        "total_train": total_train,
    }
    conn.execute(
        "INSERT INTO dataset_stats (key, value_json) VALUES (?,?)",
        ("main", json.dumps(main_stats)),
    )
    conn.execute(
        "INSERT INTO dataset_stats (key, value_json) VALUES (?,?)",
        ("cv_models", json.dumps(cv_models)),
    )

    cm_path = ARTIFACTS / "confusion_matrix.json"
    if cm_path.exists():
        conn.execute(
            "INSERT INTO dataset_stats (key, value_json) VALUES (?,?)",
            ("confusion_matrix", cm_path.read_text(encoding="utf-8")),
        )

    cur = conn.execute(
        """INSERT INTO notifications (title, message, created_by, is_active)
           VALUES (?,?,?,1)""",
        (
            "Bienvenue sur Twitter Sentiment",
            "Classifiez vos tweets en 4 sentiments grâce au modèle Linear SVC du notebook.",
            admin_id,
        ),
    )
    nid = cur.lastrowid
    for u in conn.execute("SELECT id FROM users").fetchall():
        conn.execute(
            "INSERT OR IGNORE INTO user_notifications (user_id, notification_id) VALUES (?,?)",
            (u["id"], nid),
        )

    conn.commit()
    conn.close()
    print(f"Seed OK — {email} / {password}")


if __name__ == "__main__":
    main()
