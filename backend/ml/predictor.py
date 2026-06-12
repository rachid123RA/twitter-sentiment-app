from pathlib import Path
from typing import Optional

import joblib
import numpy as np

ARTIFACTS = Path(__file__).resolve().parents[1] / "artifacts"

_pipeline = None
_encoder = None


def _load():
    global _pipeline, _encoder
    model_path = ARTIFACTS / "model.pkl"
    enc_path = ARTIFACTS / "label_encoder.pkl"
    if not model_path.exists():
        raise RuntimeError("Modèle absent. Exécutez: python backend/scripts/export_model.py")
    mtime = model_path.stat().st_mtime
    if _pipeline is None or getattr(_load, "_mtime", None) != mtime:
        _pipeline = joblib.load(model_path)
        _encoder = joblib.load(enc_path)
        _load._mtime = mtime


def predict_text(clean_text: str, raw_text: Optional[str] = None) -> dict:
    _load()
    if not clean_text.strip():
        raise ValueError("Le tweet est vide après nettoyage")
    pred = int(_pipeline.predict([clean_text])[0])
    if hasattr(_pipeline.named_steps["clf"], "predict_proba"):
        proba = _pipeline.predict_proba([clean_text])[0]
    else:
        dec = _pipeline.decision_function([clean_text])[0]
        exp = np.exp(dec - np.max(dec))
        proba = exp / exp.sum()
    labels = [str(x) for x in _encoder.classes_]
    probabilities = {labels[i]: float(proba[i]) for i in range(len(labels))}
    label = labels[pred]
    top = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)[:3]
    from ml.explain import build_explanation

    nlp = build_explanation(raw_text or clean_text, clean_text, label, probabilities)
    return {
        "label": label,
        "probabilities": probabilities,
        "top_classes": [{"label": k, "probability": v} for k, v in top],
        "nlp": nlp,
        "top_factors": [
            {"feature": f["term"], "importance": abs(f["contribution"])}
            for f in (nlp.get("top_features") or [])[:8]
        ],
    }
