# 🎨 P-Blocks

Application web pédagogique pour apprendre la programmation visuelle avec des motifs géométriques.

## 📂 Structure du projet

```
p-blocks/
├── index.html              Application principale
├── css/
│   └── styles.css         Styles complets de l'application
├── js/                     Scripts JavaScript modulaires
│   ├── app-new.js         Application principale et gestion des modes
│   ├── multiplayerManager.js  Gestion du mode multijoueur
│   ├── blockExecution.js  Exécution des programmes
│   ├── blockManagement.js Gestion des blocs (ajout, imbrication, extraction)
│   ├── dragDropHandler.js Drag & drop des blocs de la palette
│   ├── touchDragManager.js Gestion tactile mobile
│   ├── teacherMode.js     Mode création de niveaux
│   ├── variableManager.js Gestion des variables
│   ├── patterns.js        Générateur de motifs automatiques
│   ├── studentProgramStorage.js Sauvegarde des programmes élèves
│   ├── versionManager.js  Gestion des versions et chargement URL
│   ├── profanity-filter.js Filtre de profanité
│   ├── helpSystem.js      Système d'aide progressive
│   └── [autres modules]
├── images/                 Images et icônes
├── php/                    Backend PHP
│   ├── api.php            API principale (sauvegarde niveaux)
│   ├── game.php           API multijoueur (sessions de jeu)
│   └── profanity-filter.php
├── data/                   Données serveur
│   ├── levels/            Niveaux des professeurs
│   └── sessions/          Sessions multijoueur (nettoyées automatiquement)
└── documentation/          📚 Documentation
```

## 🚀 Installation

1. Placer les fichiers sur un serveur web (Apache/Nginx)
2. S'assurer que PHP est activé
3. Créer les dossiers `php/data/levels` et `php/data/sessions` avec droits d'écriture
4. Ouvrir `index.html` dans un navigateur

## 🎯 Fonctionnalités

### Page d'accueil
Au lancement, l'application propose 3 options :
- **🎮 Créer une partie** : Lancer une session multijoueur
- **🔗 Rejoindre une partie** : Rejoindre avec un code
- **Accès création de niveaux** : Mode professeur (protégé par mot de passe)

### Mode Multijoueur
- **Création de partie** : L'hôte crée une session avec un code à 4 lettres
- **Jusqu'à 30 joueurs** : Les élèves rejoignent avec le code
- **Niveaux aléatoires** : Motifs générés automatiquement à chaque niveau
- **Système de points** :
  - Points basés sur la rapidité de validation
  - Bonus pour les programmes optimisés
- **Classement en temps réel** : Top 3 affiché après chaque niveau
- **Podium final** : Classement complet avec animations
- **Avatars animaux** : Chaque joueur a un animal unique

### Mode Élève (URL professeur)
Accessible via `index.html?prof=NomDuProf`

- **Programmation par blocs** : Interface visuelle type Scratch
- **3 cursus** : 5ème, 4ème, 3ème (configurable par le professeur)
- **Système de progression** : 
  - 1 point pour motif reproduit
  - 2 points pour programme optimisé
- **Sauvegarde par fichier** :
  - Téléchargement d'un fichier `.pblocks`
  - Contient score, niveaux complétés et tous les programmes
  - Signature SHA-256 anti-triche (impossible de modifier le fichier)
- **Système d'aide progressive** :
  - Bouton aide après 10 minutes (solution partielle floutée)
  - Bouton solution après 20 minutes
- **Interface responsive** : Adaptation mobile complète

### Mode Création de niveaux
Protégé par mot de passe (voir `documentation/COMMENT_CHANGER_MOT_DE_PASSE.md`)

- **Création manuelle** :
  - Module pinceau pour dessiner les motifs
  - Configuration taille de grille (5×5 à 20×20)
  - Organisation en mondes et niveaux
- **Création automatisée** :
  - Génération de centaines de motifs automatiquement
  - 15+ types (spirales, zigzags, damiers, croix, diagonales, etc.)
  - Programmes optimaux générés automatiquement
- **Sauvegarde en ligne** :
  - URL dédiée par professeur
  - Code de sécurité pour protéger/modifier les niveaux
  - Lien à partager directement aux élèves
- **Gestion des niveaux** :
  - Modification et suppression
  - Réorganisation des numéros
  - Configuration des mondes

## 🎮 Types de blocs disponibles

### Mouvement
- Avancer / Reculer
- Tourner à droite (↻) / Tourner à gauche (↺)

### Apparence
- Couleurs : Rouge, Jaune, Vert, Bleu, Rose, Noir

### Contrôle
- Répéter N fois (avec zone imbriquée)
- Si... alors (conditions)

### Variables
- Créer/modifier des variables
- Opérateurs mathématiques (+, -, ×, ÷)

## 🔧 Technologies

- **Frontend** : HTML5 / CSS3 / JavaScript Vanilla
- **Backend** : PHP 7+
- **Stockage** :
  - LocalStorage (progression élève locale)
  - Fichiers JSON (niveaux professeurs, sessions multijoueur)
- **Sécurité** : SHA-256 pour signatures des sauvegardes élèves
- **Temps réel** : Server-Sent Events (SSE) pour le multijoueur

## 🧹 Nettoyage automatique

### Sessions multijoueur (`php/data/sessions/`)
Nettoyage automatique à chaque requête :
| Condition | Délai |
|-----------|-------|
| Partie terminée | 15 minutes |
| Partie sans joueurs | 5 minutes |
| Partie inactive | 2 heures |
| Toute session | 24 heures max |

### Niveaux professeurs (`php/data/levels/`)
- Suppression des comptes inactifs > 12 mois
- Nettoyage manuel via l'API

## 📱 Support mobile

- Interface tactile complète
- Menus hamburger adaptatifs
- Drag & drop tactile optimisé
- Scroll intelligent (bloqué pendant le drag)
- Popups et modales adaptées

## ❤️ Soutenir le projet

Si cette application vous plaît, vous pouvez soutenir le développement :
**https://fr.tipeee.com/maxtechno/**

## 👥 Remerciements

Merci aux beta testeurs : **Samir**, **Jean**, **Hugo**, **Gaëtan**, **Robin**,
et aux classes du collège Roquebleue (**5A**, **4A**, **4B**, **3A**) 
et du collège Le Bocage (**3A**).

## 📝 Crédits

**Application créée par Max, programmée avec Claude.ai**

## 📄 Licence

Projet éducatif - Libre d'utilisation pour l'enseignement
