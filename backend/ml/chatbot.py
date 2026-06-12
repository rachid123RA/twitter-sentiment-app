"""Chatbot NLP rule-based — réponses en français basées sur le contexte d'analyse."""
from __future__ import annotations

import re
from typing import Any, Dict, Optional

from ml.preprocess import clean_tweet
from ml.predictor import predict_text
from ml.explain import build_explanation

SUGGESTIONS = [
    "Pourquoi ce sentiment ?",
    "Quels mots ont influencé la décision ?",
    "Montre le prétraitement NLP",
    "Quelles sont les probabilités ?",
    "Comment fonctionne le modèle TF-IDF ?",
]


def _norm(msg: str) -> str:
    return re.sub(r"\s+", " ", (msg or "").strip().lower())


def _ctx_label(ctx: dict) -> str:
    return ctx.get("label") or ""


def _ctx_probs(ctx: dict) -> dict:
    return ctx.get("probabilities") or {}


def _ctx_nlp(ctx: dict) -> dict:
    return ctx.get("nlp") or {}


def answer(message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Répond à une question utilisateur.
    context : tweet_raw, tweet_clean, label, probabilities, nlp (optionnel)
    """
    q = _norm(message)
    if not q:
        return {
            "reply": "Posez une question sur l'analyse NLP ou le sentiment détecté.",
            "suggestions": SUGGESTIONS,
        }

    if not context or not context.get("label"):
        if len(q.split()) >= 3 and not any(
            k in q for k in ("pourquoi", "comment", "quel", "quelle", "probabilit", "modèle", "modele")
        ):
            try:
                cleaned = clean_tweet(message)
                if not cleaned:
                    return {
                        "reply": "Le texte est vide après nettoyage. Saisissez un tweet à analyser d'abord.",
                        "suggestions": ["Analyser : I love this product!"],
                    }
                pred = predict_text(cleaned)
                nlp = build_explanation(message, cleaned, pred["label"], pred["probabilities"])
                return {
                    "reply": (
                        f"Analyse : sentiment **{pred['label']}** "
                        f"({pred['probabilities'].get(pred['label'], 0)*100:.1f} %). "
                        f"{nlp['summary_fr']}"
                    ),
                    "context": {
                        "tweet_raw": message,
                        "tweet_clean": cleaned,
                        "label": pred["label"],
                        "probabilities": pred["probabilities"],
                        "nlp": nlp,
                    },
                    "suggestions": SUGGESTIONS,
                }
            except Exception as e:
                return {"reply": f"Impossible d'analyser : {e}", "suggestions": SUGGESTIONS}

        return {
            "reply": (
                "Analysez d'abord un tweet avec le bouton « Classifier », puis posez vos questions ici "
                "(ex. : « Pourquoi Positive ? », « Quels mots ont influencé ? »)."
            ),
            "suggestions": SUGGESTIONS,
        }

    label = _ctx_label(context)
    probs = _ctx_probs(context)
    nlp = _ctx_nlp(context)
    if not nlp and context.get("tweet_raw") and context.get("tweet_clean"):
        nlp = build_explanation(
            context["tweet_raw"],
            context["tweet_clean"],
            label,
            probs,
        )

    if any(w in q for w in ("bonjour", "salut", "hello", "aide", "help")):
        return {
            "reply": (
                f"Je suis l'assistant NLP. Sentiment actuel : **{label}**. "
                "Vous pouvez demander pourquoi ce sentiment, quels mots comptent, "
                "ou le détail du prétraitement."
            ),
            "suggestions": SUGGESTIONS,
        }

    if any(w in q for w in ("pourquoi", "raison", "explique", "explication")):
        summary = nlp.get("summary_fr") or "Pas de détail disponible."
        return {
            "reply": f"**Pourquoi {label} ?**\n\n{summary}",
            "suggestions": ["Quels mots ont influencé ?", "Montre le prétraitement NLP"],
        }

    if any(
        w in q
        for w in (
            "mot",
            "mots",
            "terme",
            "termes",
            "token",
            "lexique",
            "influenc",
            "feature",
            "tf-idf",
            "tfidf",
        )
    ):
        parts = []
        hits = (nlp.get("tokens") or {}).get("lexicon_hits") or {}
        if hits.get(label):
            parts.append(f"Mots lexique « {label} » : {', '.join(hits[label])}.")
        feats = nlp.get("top_features") or []
        if feats:
            lines = [
                f"• {f['term']} (contribution {f['contribution']:+.3f}, poids TF-IDF {f['tfidf_weight']})"
                for f in feats[:8]
            ]
            parts.append("Termes TF-IDF les plus influents pour cette classe :\n" + "\n".join(lines))
        if not parts:
            parts.append("Peu de termes saillants — texte court ou neutre.")
        return {
            "reply": "\n\n".join(parts),
            "suggestions": ["Pourquoi ce sentiment ?", "Quelles sont les probabilités ?"],
        }

    if any(w in q for w in ("prétrait", "pretrait", "nettoy", "pipeline", "étape", "etape", "nlp")):
        steps = nlp.get("preprocessing") or []
        if not steps:
            return {"reply": "Aucune trace de prétraitement.", "suggestions": SUGGESTIONS}
        lines = [f"**{s['step']}** : {s['detail'][:120]}{'…' if len(s['detail'])>120 else ''}" for s in steps]
        return {
            "reply": "**Pipeline NLP (notebook)**\n\n" + "\n\n".join(lines),
            "suggestions": ["Quels mots ont influencé ?"],
        }

    if any(w in q for w in ("probabilit", "score", "confiance", "classe", "distribution")):
        lines = [f"• **{k}** : {v*100:.1f} %" for k, v in sorted(probs.items(), key=lambda x: -x[1])]
        return {
            "reply": "**Probabilités du modèle :**\n\n" + "\n".join(lines),
            "suggestions": ["Pourquoi ce sentiment ?"],
        }

    if any(w in q for w in ("modèle", "modele", "sgd", "classif", "vector", "tf-idf", "comment ça marche", "comment ca marche")):
        info = nlp.get("model_info") or {}
        return {
            "reply": (
                "**Modèle utilisé**\n\n"
                f"• Vectorisation : {info.get('vectorizer', 'TF-IDF')}\n"
                f"• Classifieur : {info.get('classifier', 'SGDClassifier')}\n"
                f"• Classes : {', '.join(info.get('classes', []))}\n\n"
                "Le tweet est nettoyé, transformé en vecteur TF-IDF, puis classé par SGD. "
                "Les probabilités viennent de predict_proba (loss modified_huber)."
            ),
            "suggestions": SUGGESTIONS,
        }

    if any(w in q for w in ("tweet", "texte", "original", "brut")):
        raw = context.get("tweet_raw", "")
        clean = context.get("tweet_clean", "")
        return {
            "reply": f"**Tweet brut :** {raw}\n\n**Après NLP :** {clean}",
            "suggestions": ["Montre le prétraitement NLP"],
        }

    if label.lower() in q or any(
        c in q for c in ("positive", "negative", "neutral", "irrelevant", "positif", "négatif", "neutre")
    ):
        return {
            "reply": nlp.get("summary_fr") or f"Sentiment prédit : {label}.",
            "suggestions": SUGGESTIONS,
        }

    return {
        "reply": (
            f"Sentiment actuel : **{label}**. "
            f"{nlp.get('summary_fr', '')}\n\n"
            "Essayez : « Pourquoi ce sentiment ? », « Quels mots ont influencé ? », "
            "« Montre le prétraitement »."
        ),
        "suggestions": SUGGESTIONS,
    }
