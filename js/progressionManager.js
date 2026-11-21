// ============================================
// MODULE: PROGRESSION MANAGER
// Description: Gestion du reset sélectif de la progression élève
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: completedLevels, cursusData, score
//   - Fonctions: _updateScoreDisplay(), saveScore(), saveCompletedLevels()
// Fonctions EXPORTÉES (vers window):
//   - getLevelHash() - Calculer hash d'un niveau
//   - cleanupModifiedLevels() - Nettoyer progression
// ============================================

(function() {
    'use strict';
    
    
    // ========================================
    // RESET SÉLECTIF DE LA PROGRESSION
    // ========================================
    
    // Calculer un hash simple d'un niveau basé sur son contenu
    function getLevelHash(levelData) {
        if (!levelData) return null;
        
        // Créer une représentation string du niveau
        const content = JSON.stringify({
            blocks: levelData.blocks,
            gridState: levelData.gridState,
            paintedCells: levelData.paintedCells,
            variables: levelData.variables
        });
        
        // Hash simple (même algo que _h mais sans clé)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    // Nettoyer la progression des niveaux modifiés ou supprimés
    function cleanupModifiedLevels() {
        
        let pointsRemoved = 0;
        const levelsToRemove = [];
        
        // Parcourir tous les niveaux complétés
        for (let levelKey in completedLevels) {
            const [cursusName, levelNum] = levelKey.split('-');
            const levelData = completedLevels[levelKey];
            
            // Extraire les points (rétrocompatibilité)
            const levelPoints = typeof levelData === 'object' ? levelData.points : levelData;
            
            // Vérifier si le niveau existe encore
            if (!cursusData[cursusName] || !cursusData[cursusName].levels[levelNum]) {
                levelsToRemove.push(levelKey);
                pointsRemoved += levelPoints;
                continue;
            }
            
            // Si ancien format (pas d'objet), impossible de comparer, on garde
            if (typeof levelData !== 'object' || !levelData.hash) {
                continue;
            }
            
            // Calculer le hash actuel du niveau
            const currentHash = getLevelHash(cursusData[cursusName].levels[levelNum]);
            
            // Récupérer le hash stocké
            const storedHash = levelData.hash;
            
            // Si le hash a changé, le niveau a été modifié
            if (currentHash !== storedHash) {
                levelsToRemove.push(levelKey);
                pointsRemoved += levelPoints;
            }
        }
        
        // Supprimer les niveaux modifiés/supprimés de la progression
        levelsToRemove.forEach(key => {
            delete completedLevels[key];
        });
        
        // Mettre à jour le score
        if (pointsRemoved > 0) {
            score = Math.max(0, score - pointsRemoved);
            _updateScoreDisplay();
            saveScore();
            saveCompletedLevels();
        } else {
        }
    }
    
    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.getLevelHash = getLevelHash;
    window.cleanupModifiedLevels = cleanupModifiedLevels;
    
    
})();
