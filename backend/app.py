"""API Flask — Twitter Sentiment."""
import json
import os
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS

from database import get_db, init_db
from ml.chatbot import answer as chat_answer
from ml.preprocess import clean_tweet
from ml.predictor import predict_text

load_dotenv(Path(__file__).parent / ".env")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

JWT_SECRET = os.getenv("JWT_SECRET", "twitter-sentiment-dev-secret-32chars!!")
JWT_HOURS = int(os.getenv("JWT_HOURS", "8"))


def user_dict(row):
    return {
        "id": row["id"],
        "email": row["email"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "role": row["role"],
        "full_name": f"{row['first_name']} {row['last_name']}".strip() or row["email"],
    }


def make_token(user):
    return jwt.encode(
        {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "exp": datetime.utcnow() + timedelta(hours=JWT_HOURS),
        },
        JWT_SECRET,
        algorithm="HS256",
    )


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Token manquant"}), 401
        try:
            g.user = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalide"}), 401
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.user.get("role") != "admin":
            return jsonify({"error": "Accès administrateur requis"}), 403
        return f(*args, **kwargs)

    return decorated


@app.get("/api/health")
def health():
    artifacts = Path(__file__).parent / "artifacts" / "model.pkl"
    return jsonify({"api": "ok", "model": artifacts.exists()})


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm = data.get("password_confirm") or data.get("confirm_password") or ""
    if not all([first_name, last_name, email, password]):
        return jsonify({"error": "Tous les champs sont requis"}), 400
    if password != confirm:
        return jsonify({"error": "Les mots de passe ne correspondent pas"}), 400
    if len(password) < 6:
        return jsonify({"error": "Mot de passe : 6 caractères minimum"}), 400
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?,?,?,?,?)",
            (email, pw_hash, first_name, last_name, "user"),
        )
        conn.execute(
            "INSERT INTO subscriptions (user_id, plan, is_active) VALUES (last_insert_rowid(), 'free', 1)"
        )
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.commit()
    except Exception:
        conn.close()
        return jsonify({"error": "Cet email est déjà utilisé"}), 409
    conn.close()
    u = user_dict(user)
    return jsonify({"token": make_token(user), "user": u}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401
    u = user_dict(user)
    return jsonify({"token": make_token(user), "user": u})


@app.get("/api/auth/me")
@token_required
def me():
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (g.user["id"],)).fetchone()
    unread = conn.execute(
        """SELECT COUNT(*) as c FROM user_notifications un
           JOIN notifications n ON n.id = un.notification_id
           WHERE un.user_id = ? AND un.is_read = 0 AND n.is_active = 1""",
        (g.user["id"],),
    ).fetchone()["c"]
    conn.close()
    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404
    return jsonify({**user_dict(user), "unread_notifications": unread})


@app.get("/api/notifications")
@token_required
def list_notifications():
    conn = get_db()
    rows = conn.execute(
        """SELECT n.id, n.title, n.message, n.created_at, un.is_read
           FROM notifications n
           JOIN user_notifications un ON un.notification_id = n.id
           WHERE un.user_id = ? AND n.is_active = 1
           ORDER BY n.created_at DESC LIMIT 50""",
        (g.user["id"],),
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.post("/api/notifications/<int:nid>/read")
@token_required
def mark_read(nid):
    conn = get_db()
    conn.execute(
        "UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND notification_id = ?",
        (g.user["id"], nid),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.post("/api/predictions")
@token_required
def create_prediction():
    data = request.get_json(silent=True) or {}
    tweet = (data.get("tweet") or data.get("tweet_content") or "").strip()
    if not tweet:
        return jsonify({"error": "Le texte du tweet est requis"}), 400
    cleaned = clean_tweet(tweet)
    if not cleaned:
        return jsonify({"error": "Tweet vide après nettoyage"}), 400
    try:
        result = predict_text(cleaned, raw_text=tweet)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        app.logger.exception("predict_text failed")
        return jsonify({"error": f"Erreur modèle : {e}"}), 500
    probs = result["probabilities"]
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO predictions
           (user_id, tweet_raw, tweet_clean, entity, label,
            prob_positive, prob_negative, prob_neutral, prob_irrelevant, probabilities_json)
           VALUES (?,?,?,NULL,?,?,?,?,?,?)""",
        (
            g.user["id"],
            tweet,
            cleaned,
            result["label"],
            probs.get("Positive", 0),
            probs.get("Negative", 0),
            probs.get("Neutral", 0),
            probs.get("Irrelevant", 0),
            json.dumps(probs),
        ),
    )
    conn.commit()
    pid = cur.lastrowid
    conn.close()
    return jsonify(
        {"id": pid, "tweet_raw": tweet, "tweet_clean": cleaned, **result}
    ), 201


@app.post("/api/chat")
@token_required
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Message requis"}), 400
    context = data.get("context")
    try:
        out = chat_answer(message, context)
    except Exception as e:
        app.logger.exception("chat failed")
        return jsonify({"error": str(e)}), 500
    reply = out.get("reply", "").replace("**", "")
    return jsonify(
        {
            "reply": reply,
            "suggestions": out.get("suggestions", []),
            "context": out.get("context"),
        }
    )


@app.get("/api/predictions")
@token_required
def list_predictions():
    page = max(1, int(request.args.get("page", 1)))
    limit = min(500, max(1, int(request.args.get("limit", 200))))
    offset = (page - 1) * limit
    conn = get_db()
    rows = conn.execute(
        """SELECT id, tweet_raw, tweet_clean, label,
                  prob_positive, prob_negative, prob_neutral, prob_irrelevant,
                  probabilities_json, created_at
           FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?""",
        (g.user["id"], limit, offset),
    ).fetchall()
    total = conn.execute(
        "SELECT COUNT(*) as c FROM predictions WHERE user_id = ?", (g.user["id"],)
    ).fetchone()["c"]
    conn.close()
    data = []
    for r in rows:
        item = dict(r)
        raw_json = item.pop("probabilities_json", None) or "{}"
        try:
            item["probabilities"] = json.loads(raw_json) if raw_json else {}
        except (json.JSONDecodeError, TypeError):
            item["probabilities"] = {}
        if not item["probabilities"]:
            item["probabilities"] = {
                "Positive": float(item.get("prob_positive") or 0),
                "Negative": float(item.get("prob_negative") or 0),
                "Neutral": float(item.get("prob_neutral") or 0),
                "Irrelevant": float(item.get("prob_irrelevant") or 0),
            }
        conf = item["probabilities"].get(item["label"], 0)
        item["confidence"] = round(float(conf) * 100, 1)
        data.append(item)
    return jsonify({"data": data, "page": page, "limit": limit, "total": total})


@app.get("/api/dashboard/summary")
@token_required
def dashboard_summary():
    conn = get_db()
    model = conn.execute("SELECT * FROM model_metrics WHERE id = 1").fetchone()
    ds = conn.execute("SELECT value_json FROM dataset_stats WHERE key = 'main'").fetchone()
    cv = conn.execute("SELECT value_json FROM dataset_stats WHERE key = 'cv_models'").fetchone()
    pred_stats = conn.execute(
        """SELECT COUNT(*) as total,
                  SUM(CASE WHEN label = 'Positive' THEN 1 ELSE 0 END) as positive,
                  SUM(CASE WHEN label = 'Negative' THEN 1 ELSE 0 END) as negative,
                  SUM(CASE WHEN label = 'Neutral' THEN 1 ELSE 0 END) as neutral,
                  SUM(CASE WHEN label = 'Irrelevant' THEN 1 ELSE 0 END) as irrelevant
           FROM predictions WHERE user_id = ?""",
        (g.user["id"],),
    ).fetchone()
    conn.close()
    extra = {}
    if model and model["extra_json"]:
        try:
            extra = json.loads(model["extra_json"])
        except json.JSONDecodeError:
            pass
    dataset = json.loads(ds["value_json"]) if ds else {}
    ds_artifacts = Path(__file__).resolve().parent / "artifacts" / "dataset_stats.json"
    if not dataset.get("sentiment_distribution") and ds_artifacts.exists():
        art = json.loads(ds_artifacts.read_text(encoding="utf-8"))
        dataset.setdefault("sentiment_distribution", art.get("sentiment_distribution", {}))
        dataset.setdefault("total_train", art.get("total_train"))

    model_out = None
    if model:
        model_out = {
            "model_name": model["model_name"],
            "accuracy": model["accuracy"],
            "f1_macro": model["f1_macro"],
            "f1_weighted": model["f1_weighted"],
            "precision_macro": model["precision_macro"],
            "recall_macro": model["recall_macro"],
            "cv_f1_macro": model["cv_f1_macro"],
        }

    return jsonify(
        {
            "model": model_out,
            "model_extra": extra,
            "dataset": dataset,
            "cv_models": json.loads(cv["value_json"]) if cv else [],
            "predictions": dict(pred_stats) if pred_stats else {"total": 0},
        }
    )


@app.get("/api/analysis/detailed")
@token_required
def analysis_detailed():
    conn = get_db()
    model = conn.execute("SELECT * FROM model_metrics WHERE id = 1").fetchone()
    cm_row = conn.execute(
        "SELECT value_json FROM dataset_stats WHERE key = 'confusion_matrix'"
    ).fetchone()
    main_row = conn.execute("SELECT value_json FROM dataset_stats WHERE key = 'main'").fetchone()
    cv_row = conn.execute("SELECT value_json FROM dataset_stats WHERE key = 'cv_models'").fetchone()
    pred_by_label = conn.execute(
        """SELECT label, COUNT(*) as count FROM predictions WHERE user_id = ? GROUP BY label""",
        (g.user["id"],),
    ).fetchall()
    conn.close()
    cm = json.loads(cm_row["value_json"]) if cm_row else None
    per_class = []
    if cm and cm.get("report"):
        for label in cm.get("labels", []):
            r = cm["report"].get(label, {})
            if isinstance(r, dict) and "f1-score" in r:
                per_class.append(
                    {
                        "label": label,
                        "precision": r.get("precision", 0),
                        "recall": r.get("recall", 0),
                        "f1": r.get("f1-score", 0),
                        "support": r.get("support", 0),
                    }
                )
    return jsonify(
        {
            "model": dict(model) if model else None,
            "confusion_matrix": cm,
            "dataset": json.loads(main_row["value_json"]) if main_row else {},
            "cv_models": json.loads(cv_row["value_json"]) if cv_row else [],
            "per_class": per_class,
            "user_predictions_by_label": [dict(r) for r in pred_by_label],
        }
    )


# ——— Admin ———
@app.get("/api/admin/users")
@admin_required
def admin_users():
    conn = get_db()
    rows = conn.execute(
        """SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                  (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id) as prediction_count
           FROM users u ORDER BY u.created_at DESC"""
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.get("/api/admin/predictions")
@admin_required
def admin_all_predictions():
    conn = get_db()
    rows = conn.execute(
        """SELECT p.id, p.tweet_raw, p.label, p.created_at,
                  u.email, u.first_name, u.last_name
           FROM predictions p JOIN users u ON u.id = p.user_id
           ORDER BY p.created_at DESC LIMIT 200"""
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.get("/api/admin/notifications")
@admin_required
def admin_notifications():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100"
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.post("/api/admin/notifications")
@admin_required
def admin_create_notification():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    message = (data.get("message") or "").strip()
    if not title or not message:
        return jsonify({"error": "Titre et message requis"}), 400
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO notifications (title, message, created_by) VALUES (?,?,?)",
        (title, message, g.user["id"]),
    )
    nid = cur.lastrowid
    users = conn.execute("SELECT id FROM users").fetchall()
    for u in users:
        conn.execute(
            "INSERT OR IGNORE INTO user_notifications (user_id, notification_id) VALUES (?,?)",
            (u["id"], nid),
        )
    conn.commit()
    conn.close()
    return jsonify({"id": nid, "title": title}), 201


@app.get("/api/admin/subscriptions")
@admin_required
def admin_subscriptions():
    conn = get_db()
    rows = conn.execute(
        """SELECT s.*, u.email, u.first_name, u.last_name
           FROM subscriptions s JOIN users u ON u.id = s.user_id ORDER BY s.updated_at DESC"""
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.put("/api/admin/subscriptions/<int:uid>")
@admin_required
def admin_update_subscription(uid):
    data = request.get_json(silent=True) or {}
    conn = get_db()
    conn.execute(
        """UPDATE subscriptions SET plan = ?, is_active = ?, updated_at = datetime('now')
           WHERE user_id = ?""",
        (data.get("plan", "free"), 1 if data.get("is_active", True) else 0, uid),
    )
    if conn.total_changes == 0:
        conn.execute(
            "INSERT INTO subscriptions (user_id, plan, is_active) VALUES (?,?,?)",
            (uid, data.get("plan", "premium"), 1),
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.get("/api/variables")
@token_required
def variables():
    return jsonify(
        [
            {
                "key": "tweet_content",
                "label_fr": "Contenu du tweet",
                "description_fr": "Texte brut classifié par le pipeline TF-IDF + Linear SVC.",
                "type": "text",
            },
            {
                "key": "sentiment",
                "label_fr": "Sentiment (cible)",
                "description_fr": "Positive, Negative, Neutral, Irrelevant — F1-Macro optimisé en CV.",
                "type": "multiclass",
            },
        ]
    )


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5055")), debug=True)
