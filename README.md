# 🎨 P-Blocks

Application web pédagogique pour apprendre la programmation visuelle avec des motifs géométriques.

## 📂 Structure du projet

```
jeumotif_optimise/
├── index.html              Application principale
├── css/
│   └── styles.css         Styles complets de l'application
├── js/                     Scripts JavaScript modulaires
│   ├── app-new.js         Application principale et gestion des modes
│   ├── blockExecution.js  Exécution des programmes
│   ├── blockManagement.js Gestion des blocs (ajout, imbrication, extraction)
│   ├── dragDropHandler.js Drag & drop des blocs de la palette
│   ├── touchDragManager.js Gestion tactile mobile
│   ├── teacherMode.js     Mode création de niveaux
│   ├── variableManager.js Gestion des variables
│   ├── patterns.js        Générateur de motifs automatiques
│   ├── profanity-filter.js Filtre de profanité
│   ├── helpSystem.js      Système d'aide progressive (10min/20min)
│   └── [autres modules]
├── images/                 Images et icônes
├── php/                    Backend PHP
│   ├── api.php            API principale
│   └── profanity-filter.php
├── data/                   Données serveur
├── documentation/          📚 Toute la documentation
└── test/                   🧪 Tests (optionnel)
    └── test.html          Test d'installation
```

## 🚀 Installation

1. Placer les fichiers sur un serveur web (Apache/Nginx)
2. S'assurer que PHP est activé
3. Ouvrir `index.html` dans un navigateur
4. (Optionnel) Tester l'API avec `test/test.html`

## 📚 Documentation

Toute la documentation se trouve dans le dossier `documentation/` :

- **COMMENT_CHANGER_MOT_DE_PASSE.md** - Pour entrer dans le mode "création de niveaux"
- **FILTRAGE_PROFANITE.md** - Système de filtrage
- **NETTOYAGE_AUTOMATIQUE.md** - Nettoyage des données

## 🎯 Fonctionnalités

### Mode Élève
- **Programmation par blocs** : Interface visuelle de type Scratch/Blockly
- **3 cursus** : 5ème, 4éme, 3ème
- **Système de progression** : 1 point pour motif identique, 2 point pour motif identique et programme optimisé
- **Sauvegarde/Chargement** : Code de progression pour sauvegarder localement
- **Système d'aide progressive** :
  - Bouton d'aide après 10 minutes : affiche la moitié de la solution (floutée)
  - Bouton solution après 20 minutes : affiche la solution complète
  - Timer intelligent : pause automatique sur inactivité ou changement d'onglet
  - État sauvegardé par niveau
- **Interface responsive** : Adaptation mobile avec menus hamburger et drag tactile optimisé
- **Blocs imbriqués** : Boucles répéter avec blocs à l'intérieur
- **Variables et opérateurs** : Manipulation de valeurs numériques
- **Validation automatique** : Vérification du motif créé

### Mode Création de niveaux
- **Création de niveaux personnalisés** :
  - Module pinceau pour dessiner les motifs cibles
  - Configuration de la taille de grille (5×5 à 20×20)
  - Attribution aux cursus (Débutant/Intermédiaire/Expert)
  - Numérotation automatique des niveaux
- **Création automatisée** :
  - Des centaines de motifs générés automatiquement
  - 15+ types de motifs avec utilisation de variables (spirales, zigzags, damiers, croix, diagonales, etc.)
  - Générateur de programmes optimaux
  - Niveaux de difficulté configurables
  - Génération en série (ex: 10 niveaux d'affilée)
- **Sauvegarde en ligne** :
  - URL dédiée par professeur (`?prof=nom`)
  - Code de sécurité pour protéger les niveaux
  - Partage direct avec les élèves via lien
  - Filtre anti-profanité sur les noms
- **Gestion des niveaux** :
  - Modification de niveaux existants (avec le code pour sauvergarder sur le même nom)
  - Suppression de niveaux (avec le code pour sauvegarder sur le même nom)
  - Réorganisation des numéros
- **Aperçu mode élève** : Test des niveaux avant publication

### Fonctionnalités techniques
- **Architecture modulaire** : Code organisé en modules indépendants
- **Gestion du scroll mobile** : Blocage intelligent pendant le drag uniquement
- **Adaptation responsive** : Blocs redimensionnés automatiquement (mobile/desktop)
- **Système de mémoire** : Sauvegarde automatique de la progression élève
- **Anti-triche** : Validation côté serveur des motifs
- **Nettoyage automatique** : Suppression des anciennes sauvegardes (>12 mois)

## 🎮 Types de blocs disponibles

### Blocs de mouvement
- Avancer
- Reculer
- Tourner à droite (↻)
- Tourner à gauche (↺)

### Blocs d'apparence
- Couleur (rouge, jaune, vert, bleu, noir)

### Blocs de contrôle
- Répéter N fois (avec zone imbriquée)
- Si... alors (conditions)

### Blocs de variables
- Créer/modifier des variables
- Valeurs de variables
- Opérateurs mathématiques (+, -, ×, ÷)

## 🔧 Technologies

- **Frontend** : HTML5 / CSS3 / JavaScript Vanilla
- **Backend** : PHP 7+
- **Stockage** :
  - LocalStorage (progression élève)
  - Fichiers JSON (niveaux professeurs sur serveur)
- **Drag & Drop** : API native HTML5 + gestion tactile personnalisée
- **Responsive** : Media queries et adaptation dynamique

## 📱 Support mobile

- Interface tactile complète
- Menus hamburger (blocs à gauche, modes à droite)
- Drag & drop tactile optimisé
- Scroll intelligent (bloqué uniquement pendant le drag)
- Adaptation automatique des tailles de blocs
- Popups adaptées au mobile

## 🎨 Générateur de motifs automatiques

Types de motifs disponibles :
- Spirales (carrées et rondes)
- Zigzags (horizontaux et verticaux)
- Damiers et quadrillages
- Croix et plus
- Diagonales
- Cadres et bordures
- Losanges
- Escaliers
- Vagues
- Grilles aléatoires
- et bien d'autres...

Chaque motif est généré avec :
- Programme optimal (moins de blocs possible)
- Algorithme de reconnaissance de patterns
- Optimisation via boucles imbriquées
- Adaptation intelligente à la taille de grille

## 👥 Remerciements

Un grand merci à tous les beta testeurs qui ont trouvé des bugs : 
**Samir**, **Jean**, **Hugo**, **Gaetan**, **Robin**, au collège Roquebleue les classes de **5A**, **4A**, **4B** et **3A**, et au collège Le Bocage la classe de 3A

**Application créée par Max, totalement programmée par Claude.ai**

## 📝 Licence

Projet éducatif - Libre d'utilisation pour l'enseignement
