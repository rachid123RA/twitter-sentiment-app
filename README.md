# Analyse de Sentiment sur Twitter — Classification Multi-Classes

Application mobile complète d'analyse de sentiment de tweets, classés en **4 catégories** :
**Positive · Negative · Neutral · Irrelevant**.

Le modèle d'apprentissage automatique (TF-IDF + classifieur linéaire) est entraîné dans le
notebook `notebook/twitter_sentiment_final (1).ipynb`, sérialisé, puis exposé par une API REST
consommée par une application mobile.

**Auteur :** Rachid Ait Aissa — Master 1 IA/OC

---

## Architecture

| Couche | Technologie |
|--------|-------------|
| Application mobile | **React Native / Expo (SDK 54)** |
| API REST | **Flask** + authentification **JWT** |
| Base de données | **SQLite** |
| Modèle ML | **TF-IDF + classifieur linéaire** (scikit-learn) |

```
backend/    API Flask + modèle ML
mobile/     Application Expo (React Native)
data/       Jeux de données et base SQLite (générés)
notebook/   Notebook Jupyter d'entraînement
```

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <URL_DU_DEPOT>
cd twitter-sentiment-app
```

### 2. Backend Python (API + modèle)

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Générer le modèle et la base de données

```bash
python backend/scripts/export_model.py
python backend/scripts/seed.py
```

> Les jeux de données `twitter_training.csv` et `twitter_validation.csv` peuvent être placés
> dans `data/`. En leur absence, des données synthétiques sont utilisées automatiquement.

### 4. Application mobile

```bash
cd mobile
npm install
```

---

## Lancer le projet

Deux terminaux sont nécessaires.

### Terminal 1 — API Flask

```bash
source .venv/bin/activate
cd backend
python app.py
```

→ L'API démarre sur **http://0.0.0.0:5055**

### Terminal 2 — Application mobile (Expo)

```bash
cd mobile
npx expo start
```

Scanner le QR code affiché avec l'application **Expo Go** sur un téléphone connecté au
**même réseau Wi-Fi** que l'ordinateur.

---

## Connexion administrateur

| Champ | Valeur |
|-------|--------|
| Email | `admin@twitter.local` |
| Mot de passe | `admin123` |

Un compte utilisateur standard peut également être créé depuis l'écran d'inscription.

---

## Accès depuis un téléphone physique

L'application détecte automatiquement l'adresse IP de l'ordinateur via Expo. En cas de besoin,
l'URL de l'API peut être forcée :

```bash
# Récupérer l'IP locale (macOS)
ipconfig getifaddr en0

# Lancer Expo avec l'URL explicite
EXPO_PUBLIC_API_URL=http://192.168.x.x:5055 npx expo start
```

- **Simulateur iOS** : `http://127.0.0.1:5055`
- **Émulateur Android** : `http://10.0.2.2:5055`

---

## Fonctionnalités

- Authentification (connexion / inscription) sécurisée par JWT
- Analyse de sentiment d'un commentaire avec **score de confiance** (4 classes)
- Tableau de bord : métriques du modèle et statistiques du jeu de données
- Historique des analyses (persisté en base SQLite)
- Espace d'analyse détaillée (matrice de confusion, métriques par classe)
- Assistant conversationnel et aide à l'interprétation des résultats
- Espace administrateur : gestion des utilisateurs et des abonnements
