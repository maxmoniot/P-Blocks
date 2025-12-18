# Nettoyage Automatique des Niveaux

## 🗑️ Résumé

L'application supprime automatiquement les niveaux qui n'ont **pas été ouverts depuis plus d'un an**.

## ⏰ Quand le nettoyage s'effectue

Le nettoyage automatique se déclenche **à chaque fois qu'un professeur ouvre le mode professeur** (après avoir entré le mot de passe).

✅ Cela garantit que la liste des niveaux sauvegardés en ligne est toujours à jour
✅ Suppression silencieuse en arrière-plan (aucun message pour l'utilisateur)

**Exemple de scénario :**
1. Professeur ouvre l'application
2. Entre le mot de passe pour accéder au mode professeur
3. → Nettoyage automatique exécuté en arrière-plan
4. Affichage du mode professeur avec la liste à jour

## 📅 Mise à jour de la date d'accès

La date `last_access` est mise à jour automatiquement quand :

✅ Un professeur **sauvegarde** ses niveaux
✅ Un professeur **charge** ses niveaux  
✅ Un élève **accède** aux niveaux via l'URL publique

**Exemple :**
- Prof "Dupont" sauvegarde des niveaux → `last_access` = 28/11/2025
- 6 mois plus tard, un élève accède aux niveaux → `last_access` = 28/05/2026
- Le fichier reste actif, pas de suppression

## 🔧 Configuration

**Fichier :** `api.php`, ligne 15

```php
define('CLEANUP_DAYS', 365); // 1 an
```

**Pour changer la durée :**
```php
define('CLEANUP_DAYS', 730);  // 2 ans
define('CLEANUP_DAYS', 180);  // 6 mois
```

## 📊 Fonctionnement technique

### Flux d'exécution

```
Professeur entre le mot de passe
    ↓
Mode professeur activé
    ↓
Appel automatique à api.php?action=cleanup
    ↓
Fonction cleanupOldFiles() vérifie tous les fichiers
    ↓
Suppression des fichiers avec last_access > 365 jours
    ↓
Retour du nombre de fichiers supprimés (en console)
    ↓
Affichage du mode professeur
```

### Code JavaScript (index.html)

```javascript
async function cleanupOldLevels() {
    try {
        const response = await fetch('api.php?action=cleanup');
        const result = await response.json();
        if (result.success && result.cleaned > 0) {
            console.log(`✓ Nettoyage : ${result.cleaned} fichier(s) supprimé(s)`);
        }
    } catch (error) {
        console.error('Erreur nettoyage:', error);
    }
}
```

### Code PHP (api.php)

```php
case 'cleanup':
    $cleaned = cleanupOldFiles();
    echo json_encode([
        'success' => true,
        'cleaned' => $cleaned,
        'message' => $cleaned > 0 ? "$cleaned fichier(s) supprimé(s)" : "Aucun fichier à nettoyer"
    ]);
    break;
```

### Structure du fichier JSON

```json
{
  "prof": "Dupont",
  "password_hash": "...",
  "created": "2024-11-28 14:00:00",
  "last_access": "2025-11-28 14:00:00",  ← Cette date est comparée
  "cursusData": {...}
}
```

### Logique de suppression

```
Fichier last_access = 2023-11-28
Date actuelle        = 2025-11-28
Différence          = 730 jours (2 ans)

Si différence > 365 jours → ❌ SUPPRESSION
Si différence ≤ 365 jours → ✅ CONSERVÉ
```

## ✅ Avantages

1. **Espace serveur optimisé** - Pas d'accumulation de fichiers
2. **Maintenance automatique** - Aucune intervention manuelle
3. **Protection des fichiers actifs** - Seuls les fichiers vraiment inactifs sont supprimés
4. **Transparent** - Les professeurs n'ont rien à faire

## 🚨 Cas d'usage

### Scénario 1 : Professeur régulier
- Prof "Martin" utilise l'application chaque semaine
- `last_access` est mis à jour régulièrement
- Fichier **JAMAIS supprimé** ✅

### Scénario 2 : Professeur occasionnel
- Prof "Durand" utilise l'application 1 fois par an
- `last_access` mis à jour lors de cette utilisation
- Fichier **conservé** pour l'année suivante ✅

### Scénario 3 : Professeur qui a quitté l'école
- Prof "Leclerc" n'utilise plus l'application
- Dernier accès : 01/12/2023
- Date actuelle : 28/11/2025 (> 1 an)
- Fichier **supprimé automatiquement** ❌

### Scénario 4 : Professeur avec élèves actifs
- Prof "Bernard" ne charge plus ses niveaux
- Mais ses élèves utilisent l'URL publique chaque semaine
- `last_access` mis à jour par les élèves
- Fichier **conservé** ✅

## 📝 Logs

Le nettoyage ne génère pas de logs visibles pour l'utilisateur, mais la fonction retourne le nombre de fichiers supprimés :

```php
$cleaned = cleanupOldFiles();
// $cleaned contient le nombre de fichiers supprimés
```

## ⚠️ Important

**Les fichiers supprimés ne sont PAS récupérables !**

Si un professeur a besoin de conserver ses niveaux sur le long terme sans y accéder, il doit :
1. Se connecter au moins une fois par an, OU
2. Demander aux élèves d'utiliser les niveaux, OU
3. Augmenter `CLEANUP_DAYS` dans la configuration

## 🔄 Modification du délai

Si tu veux changer le délai de 1 an à une autre valeur :

**2 ans (recommandé pour les lycées) :**
```php
define('CLEANUP_DAYS', 730);
```

**6 mois (si espace limité) :**
```php
define('CLEANUP_DAYS', 180);
```

**Jamais nettoyer (non recommandé) :**
```php
define('CLEANUP_DAYS', 99999);
```

## 🎯 Recommandation

**365 jours (1 an)** est un bon compromis :
- ✅ Assez long pour les professeurs occasionnels
- ✅ Pas trop long pour éviter l'accumulation
- ✅ Les élèves peuvent maintenir le fichier actif

Si l'espace serveur devient critique, tu peux descendre à **180 jours (6 mois)**.
