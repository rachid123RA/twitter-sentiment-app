/** Métriques de référence — notebook twitter_sentiment_final */
export const NOTEBOOK_METRICS = {
  model_name: 'Linear SVC + TF-IDF (HalvingGridSearchCV)',
  accuracy: 0.978,
  f1_macro: 0.9779,
  f1_weighted: 0.978,
  precision_macro: 0.978,
  recall_macro: 0.978,
  cv_f1_macro: 0.899,
  train_rows: 74682,
  test_rows: 994,
  sentiment_distribution: {
    Positive: 18670,
    Negative: 18670,
    Neutral: 18671,
    Irrelevant: 18671,
  },
  cv_models: [
    { name: 'Linear SVC', f1: 0.8973, color: '#794BC4' },
    { name: 'SGD', f1: 0.8372, color: '#1DA1F2' },
    { name: 'Log. Reg.', f1: 0.89, color: '#17BF63' },
    { name: 'Compl. NB', f1: 0.88, color: '#F45D22' },
    { name: 'Multin. NB', f1: 0.85, color: '#FFAD1F' },
  ],
};

export function mergeModelMetrics(apiModel) {
  const m = apiModel || {};
  return {
    model_name: m.model_name || NOTEBOOK_METRICS.model_name,
    accuracy: num(m.accuracy, NOTEBOOK_METRICS.accuracy),
    f1_macro: num(m.f1_macro, NOTEBOOK_METRICS.f1_macro),
    f1_weighted: num(m.f1_weighted, NOTEBOOK_METRICS.f1_weighted),
    precision_macro: num(m.precision_macro, NOTEBOOK_METRICS.precision_macro),
    recall_macro: num(m.recall_macro, NOTEBOOK_METRICS.recall_macro),
    cv_f1_macro: num(m.cv_f1_macro, NOTEBOOK_METRICS.cv_f1_macro),
  };
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function mergeDataset(dataset) {
  const d = dataset || {};
  const dist = d.sentiment_distribution || NOTEBOOK_METRICS.sentiment_distribution;
  return {
    ...d,
    train_rows: d.train_rows || NOTEBOOK_METRICS.train_rows,
    test_rows: d.test_rows || NOTEBOOK_METRICS.test_rows,
    sentiment_distribution: dist,
    total_train: d.total_train || d.train_rows || NOTEBOOK_METRICS.train_rows,
  };
}

export function mergeCvModels(cvModels) {
  if (cvModels?.length) {
    return cvModels.map((m, i) => ({
      ...m,
      color: m.color || NOTEBOOK_METRICS.cv_models[i]?.color || '#1DA1F2',
    }));
  }
  return NOTEBOOK_METRICS.cv_models;
}
