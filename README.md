# Analyse de Sentiment sur Twitter — Classification Multi-Classes

Application mobile complète d'analyse de sentiment de tweets, classés en **4 catégories** :
**Positive · Negative · Neutral · Irrelevant**.

Le modèle d'apprentissage automatique (TF-IDF + classifieur linéaire) est entraîné dans le
notebook `notebook/twitter_sentiment_final (1).ipynb`, sérialisé, puis exposé par une API REST
consommée par une application mobile.

**Auteur :** — Master 1 IA/OC

---

## Architecture

| Couche | Technologie |
|--------|-------------|
| Application mobile | **React Native / Expo (SDK 54)** |
| API REST | **Flask** + authentification **JWT** |
| Base de données | **SQLite** |
| Modèle ML | **TF-IDF + classifieur linéaire** (scikit-learn) |





## Fonctionnalités

- Authentification (connexion / inscription) sécurisée par JWT
- Analyse de sentiment d'un commentaire avec **score de confiance** (4 classes)
- Tableau de bord : métriques du modèle et statistiques du jeu de données
- Historique des analyses (persisté en base SQLite)
- Espace d'analyse détaillée (matrice de confusion, métriques par classe)
- Assistant conversationnel et aide à l'interprétation des résultats
- Espace administrateur : gestion des utilisateurs et des abonnements
