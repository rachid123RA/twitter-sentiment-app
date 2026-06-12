"""Explication NLP : prétraitement, tokens, mots-clés, contributions TF-IDF."""
from __future__ import annotations

import re
from typing import Any

import numpy as np

from ml.predictor import _load

# Lexiques indicatifs (complément au modèle ML)
LEXICON = {
    "Positive": {
        "love", "loved", "amazing", "great", "good", "best", "happy", "excellent",
        "wonderful", "recommend", "awesome", "fantastic", "perfect", "beautiful",
        "thanks", "thank", "like", "enjoy", "brilliant", "super", "nice",
    },
    "Negative": {
        "hate", "terrible", "awful", "bad", "worst", "horrible", "poor", "disappointed",
        "angry", "sucks", "broken", "waste", "never", "rude", "useless", "disgusting",
        "fail", "failed", "annoying", "slow",
    },
    "Neutral": {
        "today", "tomorrow", "price", "cost", "schedule", "arrive", "package",
        "meeting", "order", "delivery", "available", "version", "update", "report",
    },
    "Irrelevant": {
        "click", "follow", "free", "link", "http", "subscribe", "giveaway", "lol",
        "haha", "game", "play", "random",
    },
}


def preprocessing_trace(raw: str) -> list[dict[str, str]]:
    """Trace étape par étape du nettoyage (comme le notebook)."""
    text = str(raw)
    trace = [{"step": "Texte brut", "detail": text[:500]}]
    text = text.lower()
    trace.append({"step": "Minuscules", "detail": text[:500]})
    no_url = re.sub(r"http\S+|www\.\S+", "", text)
    if no_url != text:
        trace.append({"step": "Suppression URLs", "detail": no_url[:500]})
    text = no_url
    no_mention = re.sub(r"@\w+", "", text)
    if no_mention != text:
        trace.append({"step": "Suppression @mentions", "detail": no_mention[:500]})
    text = no_mention
    hashtags = re.sub(r"#(\w+)", r"\1", text)
    if hashtags != text:
        trace.append({"step": "Hashtags → mots", "detail": hashtags[:500]})
    text = hashtags
    no_punct = re.sub(r"[^a-z0-9\s]", " ", text)
    if no_punct != text:
        trace.append({"step": "Ponctuation retirée", "detail": no_punct[:500]})
    text = no_punct
    final = re.sub(r"\s+", " ", text).strip()
    trace.append({"step": "Texte nettoyé (entrée TF-IDF)", "detail": final})
    return trace


def detect_tokens(clean_text: str) -> dict[str, Any]:
    words = clean_text.split()
    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]
    detected = {label: [] for label in LEXICON}
    for w in words:
        for label, lex in LEXICON.items():
            if w in lex:
                detected[label].append(w)
    for bg in bigrams:
        for label, lex in LEXICON.items():
            if bg in lex:
                detected[label].append(bg)
    return {
        "tokens": words,
        "token_count": len(words),
        "bigrams": bigrams[:15],
        "lexicon_hits": {k: v for k, v in detected.items() if v},
    }


def _top_tfidf_features(clean_text: str, label: str, top_n: int = 12) -> list[dict]:
    _load()
    from ml.predictor import _encoder, _pipeline

    vec = _pipeline.named_steps["tfidf"]
    clf = _pipeline.named_steps["clf"]
    labels = [str(x) for x in _encoder.classes_]
    if label not in labels:
        return []
    class_idx = labels.index(label)

    X = vec.transform([clean_text])
    feature_names = np.array(vec.get_feature_names_out())

    if not hasattr(clf, "coef_"):
        return []

    coef = clf.coef_[class_idx]
    if hasattr(X, "toarray"):
        row = X.toarray().ravel()
    else:
        row = np.asarray(X.todense()).ravel()

    scores = row * coef
    active = np.where((row > 0) & (scores != 0))[0]
    if len(active) == 0:
        active = np.where(row > 0)[0]
    if len(active) == 0:
        return []

    idx_sorted = active[np.argsort(scores[active])[::-1][:top_n]]
    out = []
    for i in idx_sorted:
        out.append(
            {
                "term": str(feature_names[i]),
                "tfidf_weight": round(float(row[i]), 4),
                "contribution": round(float(scores[i]), 4),
                "direction": "favorise" if scores[i] > 0 else "contre",
            }
        )
    return out


def build_explanation(raw: str, clean_text: str, label: str, probabilities: dict) -> dict:
    tokens_info = detect_tokens(clean_text)
    top_features = _top_tfidf_features(clean_text, label)
    hits = tokens_info.get("lexicon_hits", {})
    label_hits = hits.get(label, [])

    reasons = []
    if label_hits:
        reasons.append(
            f"Mots détectés typiques de « {label} » : {', '.join(label_hits[:8])}."
        )
    if top_features:
        terms = ", ".join(f["term"] for f in top_features[:5])
        reasons.append(
            f"Le modèle TF-IDF + SGD s'appuie surtout sur : {terms}."
        )
    prob_pct = (probabilities.get(label, 0) or 0) * 100
    reasons.append(
        f"Probabilité {label} : {prob_pct:.1f} % — classe la plus probable selon le classifieur entraîné."
    )

    alt = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
    if len(alt) > 1:
        second = alt[1]
        reasons.append(
            f"Alternative : {second[0]} ({second[1]*100:.1f} %)."
        )

    return {
        "preprocessing": preprocessing_trace(raw),
        "tokens": tokens_info,
        "top_features": top_features,
        "summary_fr": " ".join(reasons),
        "reasons": reasons,
        "model_info": {
            "vectorizer": "TF-IDF (1-2 grams, max 50k features)",
            "classifier": "SGDClassifier (modified_huber)",
            "classes": list(LEXICON.keys()),
        },
    }
