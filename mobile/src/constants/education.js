export const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Collecte Twitter',
    desc: 'Tweets liés à des entités (marques, événements). Chaque ligne : texte, entité, sentiment.',
    icon: 'cloud-download-outline',
  },
  {
    id: 2,
    title: 'Nettoyage du texte',
    desc: 'URLs, @mentions supprimés · hashtags convertis · minuscules · ponctuation retirée.',
    icon: 'brush-outline',
  },
  {
    id: 3,
    title: 'Vectorisation TF-IDF',
    desc: 'Transformation en vecteurs numériques (uni/bi-grammes, max 50k features).',
    icon: 'grid-outline',
  },
  {
    id: 4,
    title: 'Classification ML',
    desc: 'Linear SVC prédit Positive, Negative, Neutral ou Irrelevant (notebook).',
    icon: 'analytics-outline',
  },
];

export const CV_COLORS = ['#794BC4', '#1DA1F2', '#17BF63', '#F45D22', '#FFAD1F'];

export const PREPROCESSING_DETAILS = [
  { step: 'Minuscules', example: 'LOVE → love', icon: 'text-outline' },
  { step: 'URLs', example: 'https://t.co/xxx → ∅', icon: 'link-outline' },
  { step: 'Mentions', example: '@user → ∅', icon: 'at-outline' },
  { step: 'Hashtags', example: '#happy → happy', icon: 'pricetag-outline' },
  { step: 'Ponctuation', example: '!!! → espace', icon: 'remove-outline' },
];

export const CLASSES_DETAIL = [
  {
    name: 'Positive',
    icon: 'happy-outline',
    desc: 'Enthousiasme, satisfaction, recommandation.',
    examples: ['love this product', 'amazing service', 'highly recommend'],
  },
  {
    name: 'Negative',
    icon: 'sad-outline',
    desc: 'Plainte, déception, colère.',
    examples: ['terrible experience', 'waste of money', 'awful support'],
  },
  {
    name: 'Neutral',
    icon: 'remove-circle-outline',
    desc: 'Information factuelle sans émotion marquée.',
    examples: ['flight departs at 8am', 'price is 49 dollars'],
  },
  {
    name: 'Irrelevant',
    icon: 'shuffle-outline',
    desc: 'Hors sujet, spam, contenu non lié.',
    examples: ['check this link', 'random joke tweet'],
  },
];

export const TWEET_EXAMPLES = [
  'I absolutely love the new update! Best app ever.',
  'Worst customer service I have ever experienced.',
  'The package will arrive on Tuesday morning.',
  'Click here for free followers!!!',
];

export const SENTIMENT_ICONS = {
  Positive: 'happy-outline',
  Negative: 'sad-outline',
  Neutral: 'remove-circle-outline',
  Irrelevant: 'shuffle-outline',
};
