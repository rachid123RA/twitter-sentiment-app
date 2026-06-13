# Analyse de Sentiment sur Twitter — Classification Multi-Classes

Application mobile complète d'analyse de sentiment de tweets, classés en **4 catégories** :
**Positive · Negative · Neutral · Irrelevant**.

Le modèle d'apprentissage automatique (**TF-IDF + classifieur linéaire**) est entraîné dans le
notebook, sérialisé, puis exposé par une **API REST** consommée par une **application mobile**.

**Auteur :** — Master 1 IA/OC

---

## Sommaire

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation (première fois)](#installation-première-fois)
- [Lancer le projet](#lancer-le-projet)
- [Connexion](#connexion)
- [Tester depuis un téléphone](#tester-depuis-un-téléphone)
- [Fonctionnalités](#fonctionnalités)
- [Dépannage (FAQ)](#dépannage-faq)

---

## Architecture

| Couche | Technologie |
|--------|-------------|
| Application mobile | **React Native / Expo (SDK 54)** |
| API REST | **Flask** + authentification **JWT** |
| Base de données | **SQLite** |
| Modèle ML | **TF-IDF + classifieur linéaire** (scikit-learn) |

```
app m1/
├── backend/        API Flask + modèle ML
│   ├── app.py            Point d'entrée de l'API (port 5055)
│   ├── database.py       Connexion SQLite
│   ├── ml/               Prédiction, prétraitement, assistant
│   ├── scripts/          export_model.py + seed.py
│   ├── artifacts/        Modèle sérialisé (model.pkl)
│   └── requirements.txt  Dépendances Python
├── mobile/         Application Expo (React Native)
│   ├── App.js
│   └── src/              Écrans, composants, API
├── data/           Base SQLite (générée)
└── notebook/       Notebook Jupyter d'entraînement
```

---

## Prérequis

Avant de commencer, installez :

| Outil | Version conseillée | Vérifier avec |
|-------|--------------------|---------------|
| **Python** | 3.9 ou plus | `python3 --version` |
| **Node.js** | 18 ou plus | `node --version` |
| **npm** | livré avec Node | `npm --version` |
| **Expo Go** | dernière version | App Store / Google Play (sur le téléphone) |

> Le PC et le téléphone doivent être sur le **même réseau Wi-Fi**.

---

## Installation (première fois)

### 1. Récupérer le projet

```bash
git clone <URL_DU_DEPOT>
cd "app m1"
```

### 2. Backend — environnement Python

```bash
# Créer l'environnement virtuel
python3 -m venv .venv

# L'activer
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows (PowerShell)

# Installer les dépendances
pip install -r backend/requirements.txt
```

### 3. Générer le modèle et la base de données

```bash
# Crée le modèle sérialisé (artifacts/model.pkl)
python backend/scripts/export_model.py

# Crée et remplit la base SQLite (compte admin + métriques)
python backend/scripts/seed.py
```

> ✅ À la fin, le terminal doit afficher : `Seed OK — admin@twitter.local / admin123`

### 4. Application mobile — dépendances

```bash
cd mobile
npm install
cd ..
```

---

## Lancer le projet

L'application a besoin de **deux terminaux** ouverts en même temps.

### Terminal 1 — API Flask (backend)

```bash
source .venv/bin/activate          # macOS / Linux
cd backend
python app.py
```

➡️ L'API démarre sur **http://0.0.0.0:5055**

### Terminal 2 — Application mobile (Expo)

```bash
cd mobile
npx expo start
```

➡️ Un **QR code** s'affiche. Scannez-le avec l'application **Expo Go** sur votre téléphone.

---

## Connexion

| Champ | Valeur |
|-------|--------|
| Email | `admin@twitter.local` |
| Mot de passe | `admin123` |

Un compte utilisateur standard peut aussi être créé depuis l'écran d'inscription.

---

## Tester depuis un téléphone

L'URL de l'API est détectée automatiquement. Si besoin, vous pouvez la forcer :

```bash
# Récupérer l'IP locale du PC (macOS)
ipconfig getifaddr en0

# Lancer Expo avec l'URL explicite
EXPO_PUBLIC_API_URL=http://192.168.X.X:5055 npx expo start
```

- **Simulateur iOS** : `http://127.0.0.1:5055`
- **Émulateur Android** : `http://10.0.2.2:5055`

---

## Fonctionnalités

- Authentification (connexion / inscription) sécurisée par **JWT**
- Analyse de sentiment d'un tweet avec **score de confiance** (4 classes)
- **Tableau de bord** : métriques du modèle et statistiques du jeu de données
- **Historique** des analyses (persisté en base SQLite)
- **Analyse détaillée** : matrice de confusion et métriques par classe
- **Assistant explicatif** : comprendre pourquoi tel sentiment a été prédit
- Espace **administrateur** : gestion des utilisateurs et des abonnements

---

## Dépannage (FAQ)

**❓ Erreur 500 lors de « Classifier le sentiment »**
La base affichait l'erreur `database is locked`. C'est corrigé (mode **WAL**). Si cela
réapparaît, **redémarrez** le serveur Flask (`Ctrl+C` puis `python app.py`).

**❓ Les métriques affichées semblent fausses ou anciennes**
Rechargez la base avec les vraies valeurs, puis redémarrez l'API :
```bash
python backend/scripts/seed.py
```

**❓ `ModuleNotFoundError` au lancement de l'API**
L'environnement virtuel n'est pas activé. Faites `source .venv/bin/activate` avant `python app.py`.

**❓ Le téléphone ne se connecte pas à l'API**
Vérifiez que le PC et le téléphone sont sur le **même Wi-Fi**, puis forcez l'URL avec
`EXPO_PUBLIC_API_URL` (voir [Tester depuis un téléphone](#tester-depuis-un-téléphone)).

**❓ `model.pkl` introuvable**
Relancez `python backend/scripts/export_model.py`.
