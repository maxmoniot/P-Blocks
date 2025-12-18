// ============================================
// MODULE: STORAGE MANAGER
// Description: Gestion de la sauvegarde/chargement du score et progression
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: score, completedLevels, cursusData
//   - Variables window: window.isStudentLoadMode
//   - Fonctions: _e(), _d(), _updateScoreDisplay(), saveLocalVersion()
// Fonctions EXPORTÉES (vers window):
//   - loadFromStorage() - Charger score et progression
//   - saveScore() - Sauvegarder le score
//   - saveCompletedLevels() - Sauvegarder les niveaux complétés
// ============================================

(function() {
    'use strict';
    
    
    // ========================================
    // GESTION DE LA SAUVEGARDE DU SCORE ET PROGRESSION
    // ========================================
    
    function loadFromStorage() {
        
        // Utiliser des clés différentes selon le mode
        const scoreKey = window.isStudentLoadMode ? '_s_URL' : '_s_PREVIEW';
        const levelsKey = window.isStudentLoadMode ? '_cl_URL' : '_cl_PREVIEW';
        const mode = window.isStudentLoadMode ? 'URL' : 'PREVIEW';
        
        
        // Charger les variables créées pour ce mode
        loadCreatedVariables();
        
        // Charger et déchiffrer le score
        const encryptedScore = localStorage.getItem(scoreKey);
        
        if (encryptedScore) {
            const decrypted = _d(encryptedScore);
            
            if (decrypted && typeof decrypted.score === 'number') {
                score = decrypted.score;
            } else {
                // Données corrompues - réinitialiser
                score = 0;
            }
        } else {
            // Pas de score sauvegardé
            score = 0;
        }
        
        // Mettre à jour l'affichage
        _updateScoreDisplay();
        
        // Charger et déchiffrer les niveaux complétés
        const encryptedLevels = localStorage.getItem(levelsKey);
        if (encryptedLevels) {
            const decrypted = _d(encryptedLevels);
            if (decrypted && decrypted.levels) {
                completedLevels = decrypted.levels;
            } else {
                // Données corrompues - réinitialiser
                completedLevels = {};
            }
        } else {
            completedLevels = {};
        }
        
        // Charger et déchiffrer cursusData (niveaux du prof)
        const encryptedCursusData = localStorage.getItem('_cd');
        if (encryptedCursusData) {
            const decrypted = _d(encryptedCursusData);
            if (decrypted && decrypted.cursusData) {
                cursusData = decrypted.cursusData;
                
                // Vérifier si des niveaux existent
                let hasAnyLevels = false;
                for (let cursus in cursusData) {
                    if (cursusData[cursus].levels && Object.keys(cursusData[cursus].levels).length > 0) {
                        hasAnyLevels = true;
                        break;
                    }
                }
                
                // Si aucun niveau n'existe, réinitialiser le score et la progression
                if (!hasAnyLevels) {
                    score = 0;
                    completedLevels = {};
                    _updateScoreDisplay();
                    saveScore();
                    saveCompletedLevels();
                }
                
                // Initialiser la version locale si elle n'existe pas
                if (!localStorage.getItem('version_local_preview')) {
                    saveLocalVersion();
                }
            } else {
            }
        } else {
            // Première utilisation - initialiser la version
            saveLocalVersion();
        }
        
        // Nettoyer les anciennes clés non chiffrées (migration)
        localStorage.removeItem('score');
        localStorage.removeItem('completedLevels');
        localStorage.removeItem('cursusData'); // Ancienne clé non chiffrée
        
    }
    
    function saveScore() {
        // Utiliser des clés différentes selon le mode
        const scoreKey = window.isStudentLoadMode ? '_s_URL' : '_s_PREVIEW';
        const encrypted = _e({ score: score, timestamp: Date.now() });
        localStorage.setItem(scoreKey, encrypted);
    }
    
    function saveCompletedLevels() {
        try {
            // Utiliser des clés différentes selon le mode
            const levelsKey = window.isStudentLoadMode ? '_cl_URL' : '_cl_PREVIEW';
            const encrypted = _e({ levels: completedLevels, timestamp: Date.now() });
            localStorage.setItem(levelsKey, encrypted);
        } catch (e) {
        }
    }
    
    function saveCreatedVariables() {
        try {
            // Utiliser des clés différentes selon le mode
            const variablesKey = window.isStudentLoadMode ? '_cv_URL' : (currentMode === 'student' ? '_cv_PREVIEW' : '_cv_TEACHER');
            
            // Sauvegarder aussi les valeurs sélectionnées dans la palette
            const paletteSelections = {};
            const palette = document.querySelector('.middle-panel');
            if (palette) {
                const selects = palette.querySelectorAll('.var-select');
                selects.forEach((select, index) => {
                    if (select.value) {
                        // Utiliser un identifiant unique basé sur le bloc parent
                        const blockParent = select.closest('.block');
                        if (blockParent) {
                            const blockType = blockParent.getAttribute('data-type') || blockParent.className;
                            paletteSelections[`${blockType}_${index}`] = select.value;
                        }
                    }
                });
            }
            
            const dataToSave = {
                variables: createdVariables,
                selections: paletteSelections
            };
            
            localStorage.setItem(variablesKey, JSON.stringify(dataToSave));
        } catch (e) {
        }
    }
    
    function loadCreatedVariables(forceMode) {
        // Déterminer quelle clé utiliser
        const mode = forceMode || (window.isStudentLoadMode ? 'URL' : (currentMode === 'student' ? 'PREVIEW' : 'TEACHER'));
        const variablesKey = `_cv_${mode}`;
        
        const savedVariables = localStorage.getItem(variablesKey);
        if (savedVariables) {
            try {
                const data = JSON.parse(savedVariables);
                // Support ancien format (array) et nouveau format (objet)
                if (Array.isArray(data)) {
                    createdVariables = data;
                    window.paletteSelections = {};
                } else if (data && typeof data === 'object') {
                    createdVariables = data.variables || [];
                    window.paletteSelections = data.selections || {};
                } else {
                    createdVariables = [];
                    window.paletteSelections = {};
                }
                
                if (!Array.isArray(createdVariables)) {
                    createdVariables = [];
                }
            } catch (e) {
                createdVariables = [];
                window.paletteSelections = {};
            }
        } else {
            createdVariables = [];
            window.paletteSelections = {};
        }
    }
    
    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.loadFromStorage = loadFromStorage;
    window.saveScore = saveScore;
    window.saveCompletedLevels = saveCompletedLevels;
    window.saveCreatedVariables = saveCreatedVariables;
    window.loadCreatedVariables = loadCreatedVariables;
    
    
})();
