#!/usr/bin/env python3
"""Export du pipeline sklearn (notebook Twitter Sentiment)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
ARTIFACTS = ROOT / "backend" / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

COLS = ["tweet_id", "entity", "sentiment", "tweet_content"]
SEED = 42
LABEL_ORDER = ["Positive", "Negative", "Neutral", "Irrelevant"]

sys.path.insert(0, str(ROOT / "backend"))
from ml.preprocess import clean_tweet  # noqa: E402


def load_data():
    train_p = DATA / "twitter_training.csv"
    test_p = DATA / "twitter_validation.csv"
    if train_p.exists() and test_p.exists():
        train = pd.read_csv(
            train_p, header=None, names=COLS, encoding="utf-8", on_bad_lines="skip"
        )
        test = pd.read_csv(
            test_p, header=None, names=COLS, encoding="utf-8", on_bad_lines="skip"
        )
        return train, test, False
    print("CSV absents — génération de données synthétiques")
    samples = {
        "Positive": [
            "love this product amazing quality",
            "great service highly recommend",
            "best experience ever so happy",
        ],
        "Negative": [
            "terrible worst experience hate it",
            "awful customer service very disappointed",
            "broken product waste of money",
        ],
        "Neutral": [
            "received the package today",
            "meeting scheduled for next week",
            "price is fifty dollars",
        ],
        "Irrelevant": [
            "check out this link lol",
            "random tweet about weather",
            "who wants to play games tonight",
        ],
    }
    rows = []
    tid = 1
    for label, templates in samples.items():
        for i in range(500):
            t = templates[i % len(templates)]
            rows.append(
                {
                    "tweet_id": tid,
                    "entity": f"Entity_{i % 10}",
                    "sentiment": label,
                    "tweet_content": f"{t} variant {i}",
                }
            )
            tid += 1
    df = pd.DataFrame(rows)
    train, test = train_test_split(
        df, test_size=0.15, random_state=SEED, stratify=df["sentiment"]
    )
    return train.reset_index(drop=True), test.reset_index(drop=True), True


def prepare(train_raw, test_raw):
    train = train_raw.dropna(subset=["tweet_content", "sentiment"]).copy()
    test = test_raw.dropna(subset=["tweet_content", "sentiment"]).copy()
    train["clean_text"] = train["tweet_content"].apply(clean_tweet)
    test["clean_text"] = test["tweet_content"].apply(clean_tweet)
    train = train[train["clean_text"].str.len() > 0]
    test = test[test["clean_text"].str.len() > 0]
    le = LabelEncoder()
    le.fit(LABEL_ORDER)
    train["label"] = le.transform(train["sentiment"])
    test["label"] = le.transform(test["sentiment"])
    return train, test, le


def main():
    train_raw, test_raw, synthetic = load_data()
    train, test, le = prepare(train_raw, test_raw)
    X_train, y_train = train["clean_text"], train["label"]
    X_test, y_test = test["clean_text"], test["label"]

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=50_000,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=2,
                ),
            ),
            (
                "clf",
                SGDClassifier(
                    loss="modified_huber",
                    max_iter=1000,
                    random_state=SEED,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    cv_scores = cross_val_score(
        pipeline, X_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(
        y_test,
        y_pred,
        labels=list(range(len(le.classes_))),
        target_names=le.classes_,
        output_dict=True,
        zero_division=0,
    )

    sent_dist = (
        train_raw["sentiment"].value_counts().reindex(LABEL_ORDER, fill_value=0).to_dict()
    )
    top_entities = (
        train_raw["entity"].value_counts().head(15).to_dict()
        if "entity" in train_raw.columns
        else {}
    )

    metrics = {
        "model_name": "SGD Classifier + TF-IDF",
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "f1_macro": float(f1_score(y_test, y_pred, average="macro")),
        "f1_weighted": float(f1_score(y_test, y_pred, average="weighted")),
        "precision_macro": float(precision_score(y_test, y_pred, average="macro")),
        "recall_macro": float(recall_score(y_test, y_pred, average="macro")),
        "cv_f1_macro_mean": float(cv_scores.mean()),
        "cv_f1_macro_std": float(cv_scores.std()),
        "labels": list(le.classes_),
        "synthetic_data": synthetic,
        "train_rows": len(X_train),
        "test_rows": len(X_test),
    }

    joblib.dump(pipeline, ARTIFACTS / "model.pkl")
    joblib.dump(le, ARTIFACTS / "label_encoder.pkl")
    (ARTIFACTS / "metrics.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )
    (ARTIFACTS / "confusion_matrix.json").write_text(
        json.dumps(
            {"labels": list(le.classes_), "matrix": cm, "report": report},
            indent=2,
        ),
        encoding="utf-8",
    )
    (ARTIFACTS / "dataset_stats.json").write_text(
        json.dumps(
            {
                "sentiment_distribution": sent_dist,
                "top_entities": top_entities,
                "total_train": int(len(train_raw)),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps(metrics, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
