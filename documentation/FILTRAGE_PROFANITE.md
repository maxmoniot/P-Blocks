# Système de filtrage de profanité

## Vue d'ensemble

L'application intègre un système de filtrage des mots inappropriés pour garantir que les noms de sauvegarde restent respectueux dans un contexte scolaire.

## Architecture à deux niveaux

### 1️⃣ Validation côté client (JavaScript)

**Fichier :** `profanity-filter.js`

**Quand :** Au moment où l'utilisateur clique sur "Sauvegarder"

**Avantages :**
- ✅ Feedback immédiat (pas d'attente réseau)
- ✅ Meilleure expérience utilisateur
- ✅ Économise des requêtes serveur

**Limitation :** Peut être contournée par un utilisateur technique

### 2️⃣ Validation côté serveur (PHP)

**Fichier :** `profanity-filter.php`

**Quand :** Quand la requête arrive au serveur

**Avantages :**
- ✅ **IMPOSSIBLE à contourner** - sécurité garantie
- ✅ Protection contre les requêtes directes (curl, Postman, etc.)
- ✅ Dernière ligne de défense

**Limitation :** Légèrement plus lent (requête réseau)

## Fonctionnement

### Étapes de validation

```
Utilisateur entre un nom
    ↓
1. Vérification JavaScript
    ├─ OK → Envoie au serveur
    └─ KO → Message d'erreur (pas d'envoi)
    ↓
2. Vérification PHP
    ├─ OK → Sauvegarde en base
    └─ KO → Message d'erreur (pas de sauvegarde)
```

### Processus de normalisation

Le texte est normalisé pour détecter les variantes :

1. **Conversion en minuscules** : "MoT" → "mot"
2. **Retrait des accents** : "café" → "cafe"
3. **Retrait caractères spéciaux** : "m@t" → "mat"
4. **Normalisation espaces** : "m  o  t" → "m o t"

Cela permet de détecter : `MoT`, `m0t`, `môt`, `m@t`, etc.

### Détection avec limites de mots

Le système utilise des **limites de mots** (`\b` en regex) pour éviter les faux positifs.

**Exemple :**
- ❌ "assassin" ne sera PAS détecté même si contient "ass"
- ✅ "ass" seul sera détecté
- ✅ "un ass dehors" sera détecté

## Liste des mots interdits

La liste couvre plusieurs catégories :

- Insultes et vulgarités courantes
- Termes offensants
- Termes sexuels
- Termes discriminatoires
- Termes violents
- Drogues
- Variantes (leet speak : m3rd3, c0n, etc.)
- Termes problématiques (nazi, hitler, etc.)
- Contexte scolaire (certains termes trop négatifs)

**⚠️ Important :** Les listes sont identiques dans `profanity-filter.js` et `profanity-filter.php`

## Personnalisation

### Ajouter des mots interdits

**Dans profanity-filter.js :**
```javascript
blacklist: [
    // ... mots existants
    'nouveaumot', 'autremot'
],
```

**Dans profanity-filter.php :**
```php
private static $blacklist = [
    // ... mots existants
    'nouveaumot', 'autremot'
];
```

**⚠️ Pensez à ajouter dans les DEUX fichiers !**

### Retirer des mots

Même principe : supprimez le mot dans les deux fichiers.

## Intégration dans l'application

### Côté client (index.html)

```javascript
// Import du filtre
<script src="profanity-filter.js"></script>

// Utilisation dans confirmSaveOnline()
if (!PROFANITY_FILTER.isClean(profName)) {
    const errorMsg = PROFANITY_FILTER.getErrorMessage(profName);
    messageDiv.innerHTML = `<div class="error-message">⚠️ ${errorMsg}</div>`;
    return;
}
```

### Côté serveur (api.php)

```php
// Import du filtre
require_once 'profanity-filter.php';

// Utilisation dans case 'save'
if (!ProfanityFilter::isClean($profName)) {
    $errorMsg = ProfanityFilter::getErrorMessage($profName);
    echo json_encode(['success' => false, 'message' => $errorMsg]);
    exit;
}
```

## Messages d'erreur

**Message standard :**
> "Le nom contient des termes inappropriés pour un contexte scolaire. Veuillez choisir un nom respectueux."

Le message est volontairement générique pour ne pas révéler quels mots sont dans la liste noire.

## Tests

### Test client
1. Ouvrir l'application
2. Mode Professeur
3. "Sauvegarder en ligne"
4. Entrer un nom inapproprié
5. ✅ Devrait afficher le message d'erreur immédiatement

### Test serveur
1. Tenter de contourner le JS (désactiver JS ou requête curl)
2. Envoyer un nom inapproprié
3. ✅ Le serveur devrait rejeter la requête

**Exemple curl pour tester :**
```bash
curl -X POST https://votre-site.com/api.php \
  -d "action=save" \
  -d "profName=motinterdit" \
  -d "password=1234" \
  -d "captchaAnswer=5" \
  -d "captchaExpected=5" \
  -d "cursusData={}"
```

## Sécurité

### Pourquoi deux niveaux ?

**Scénario d'attaque :**
1. Utilisateur malveillant ouvre l'inspecteur de navigateur
2. Modifie `profanity-filter.js` pour retourner toujours `true`
3. **Sans validation serveur** → ❌ Contournement réussi
4. **Avec validation serveur** → ✅ Bloqué par PHP

### Protection contre les injections

La fonction `cleanProfName()` dans `api.php` protège déjà contre les injections en n'autorisant que : `[a-zA-Z0-9_-]`

Le filtre de profanité est une **couche supplémentaire** pour le contenu inapproprié.

## Maintenance

### Mise à jour de la liste

La liste devrait être revue périodiquement :

- Ajout de nouveaux termes problématiques
- Retrait de faux positifs signalés
- Adaptation au contexte local/régional

**Fréquence suggérée :** Tous les 6 mois ou si signalement

## Limitations connues

1. **Langue française uniquement** - Ne détecte pas les insultes dans d'autres langues
2. **Variantes créatives** - Les utilisateurs peuvent inventer des orthographes non couvertes
3. **Contexte** - Certains mots peuvent être appropriés dans certains contextes mais interdits ici

## Solution alternative : API externe

Si vous préférez utiliser une API de modération externe :

**Purgomalum API (gratuit) :**
```javascript
async function checkProfanity(text) {
    const response = await fetch(`https://www.purgomalum.com/service/json?text=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data.result === text; // Si inchangé = propre
}
```

**⚠️ Limites :**
- Principalement anglais
- Dépendance externe (doit être en ligne)
- Potentiellement plus lent

## Support

Pour toute question sur le système de filtrage :
- Vérifier que les deux fichiers (.js et .php) sont synchronisés
- Tester avec la console du navigateur (F12)
- Vérifier les logs du serveur PHP en cas d'erreur
