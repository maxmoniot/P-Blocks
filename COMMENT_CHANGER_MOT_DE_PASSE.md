========================================
COMMENT CHANGER LE MOT DE PASSE PROFESSEUR
========================================

Le mot de passe actuel est : prof123

Pour changer le mot de passe :

1. Allez sur un site de calcul SHA-256, par exemple :
   https://emn178.github.io/online-tools/sha256.html
   ou
   https://www.tools4noobs.com/online_tools/hash/

2. Entrez votre nouveau mot de passe

3. Copiez le hash SHA-256 généré (c'est une chaîne de 64 caractères hexadécimaux)

4. Ouvrez le fichier js/app-new.js

5. Cherchez la ligne suivante (environ ligne 13) :
   const TEACHER_PASSWORD_HASH = '00624b02e1f9b996a3278f559d5d55313552ad2c0bafc82adfd975c12df61eaf';

6. Remplacez le hash entre guillemets par votre nouveau hash

7. Sauvegardez le fichier

Exemple :
Si votre nouveau mot de passe est "monSuperMotDePasse123"
Son hash SHA-256 sera : "a1b2c3d4e5f6..."
Remplacez donc :
const TEACHER_PASSWORD_HASH = 'a1b2c3d4e5f6...';

IMPORTANT :
- Le mot de passe lui-même n'est JAMAIS dans le code
- Seul son hash (empreinte cryptographique) est stocké
- Cela empêche les élèves de trouver facilement le mot de passe en lisant le code

========================================
SÉCURITÉ
========================================

Le hash actuel correspond à : prof123

Pour référence, voici quelques exemples de hash :
- "prof123" → 00624b02e1f9b996a3278f559d5d55313552ad2c0bafc82adfd975c12df61eaf
- "password" → 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
- "admin" → 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

Utilisez un mot de passe fort et unique !
