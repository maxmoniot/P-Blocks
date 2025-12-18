// ============================================
// MODULE: HELP SYSTEM
// Description: Système d'aide progressive pour les élèves bloqués
// ============================================

(function() {
    'use strict';
    
    // État du système d'aide
    let helpState = {
        currentLevel: null,
        startTime: null,
        activeTime: 0, // Temps réellement passé actif sur le niveau
        lastActivityTime: Date.now(),
        timerInterval: null,
        helpStage: 'none' // 'none', 'partial', 'full'
    };
    
    const PARTIAL_HELP_TIME = 10 * 60 * 1000; // 10 minutes en millisecondes
    const FULL_HELP_TIME = 20 * 60 * 1000; // 20 minutes en millisecondes
    const INACTIVITY_THRESHOLD = 30 * 1000; // 30 secondes d'inactivité = pause du timer
    
    // ========================================
    // DÉTECTION D'ACTIVITÉ
    // ========================================
    
    function initActivityDetection() {
        // Événements qui indiquent que l'élève est actif
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                helpState.lastActivityTime = Date.now();
            }, { passive: true });
        });
        
        // Détecter quand l'onglet devient visible/invisible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // L'onglet est caché, arrêter le timer
                stopTimer();
            } else {
                // L'onglet redevient visible, redémarrer le timer si on est sur un niveau
                if (helpState.currentLevel) {
                    startTimer();
                }
            }
        });
    }
    
    // ========================================
    // GESTION DU TIMER
    // ========================================
    
    function startTimer() {
        if (helpState.timerInterval) return; // Déjà démarré
        
        helpState.timerInterval = setInterval(() => {
            const now = Date.now();
            const timeSinceActivity = now - helpState.lastActivityTime;
            
            // Si l'élève est inactif depuis plus de 30 secondes, ne pas compter le temps
            if (timeSinceActivity > INACTIVITY_THRESHOLD) {
                return;
            }
            
            // Incrémenter le temps actif
            helpState.activeTime += 1000; // +1 seconde
            
            // Vérifier si on doit afficher l'aide
            updateHelpButton();
            
        }, 1000); // Vérifier chaque seconde
    }
    
    function stopTimer() {
        if (helpState.timerInterval) {
            clearInterval(helpState.timerInterval);
            helpState.timerInterval = null;
        }
    }
    
    function updateHelpButton() {
        const helpBtn = document.getElementById('help-me-btn');
        if (!helpBtn) return;
        
        if (helpState.activeTime >= FULL_HELP_TIME || helpState.helpStage === 'full') {
            // 20 minutes : Solution complète
            if (helpState.helpStage !== 'full') {
                helpState.helpStage = 'full';
            }
            helpBtn.textContent = '💡 Voir la solution';
            helpBtn.style.background = '#FF9800'; // Orange
            helpBtn.style.display = 'block';
        } else if (helpState.activeTime >= PARTIAL_HELP_TIME || helpState.helpStage === 'partial') {
            // 10 minutes : Aide partielle
            if (helpState.helpStage !== 'partial') {
                helpState.helpStage = 'partial';
            }
            helpBtn.textContent = '❓ Aidez-moi !';
            helpBtn.style.background = '#2196F3'; // Bleu
            helpBtn.style.display = 'block';
        } else {
            // Pas encore de bouton
            helpBtn.style.display = 'none';
        }
    }
    
    // ========================================
    // GESTION DES NIVEAUX
    // ========================================
    
    function startLevel(cursus, levelNum) {
        const levelKey = `${cursus}-${levelNum}`;
        
        // Si on est déjà sur un niveau, le stopper d'abord
        if (helpState.currentLevel && helpState.currentLevel !== levelKey) {
            stopLevel();
        }
        
        // Charger l'état sauvegardé pour ce niveau
        const savedState = loadLevelState(levelKey);
        
        if (savedState) {
            // Restaurer l'état précédent
            helpState.currentLevel = levelKey;
            helpState.activeTime = savedState.activeTime;
            helpState.helpStage = savedState.helpStage;
            helpState.lastActivityTime = Date.now();
        } else {
            // Nouveau niveau
            helpState.currentLevel = levelKey;
            helpState.activeTime = 0;
            helpState.helpStage = 'none';
            helpState.lastActivityTime = Date.now();
        }
        
        // Afficher le bouton si nécessaire
        updateHelpButton();
        
        // Démarrer le timer
        startTimer();
    }
    
    function stopLevel() {
        // Sauvegarder l'état avant de quitter
        if (helpState.currentLevel) {
            saveLevelState(helpState.currentLevel, {
                activeTime: helpState.activeTime,
                helpStage: helpState.helpStage
            });
        }
        
        stopTimer();
        
        // TOUJOURS cacher le bouton d'aide quand on quitte un niveau
        const helpBtn = document.getElementById('help-me-btn');
        if (helpBtn) {
            helpBtn.style.display = 'none';
        }
        
        // Réinitialiser l'état en mémoire (sera rechargé au prochain startLevel)
        helpState.currentLevel = null;
        helpState.activeTime = 0;
        helpState.helpStage = 'none';
    }
    
    function levelCompleted(cursus, levelNum) {
        const levelKey = `${cursus}-${levelNum}`;
        
        // Supprimer l'état sauvegardé puisque le niveau est résolu
        localStorage.removeItem(`_help_${levelKey}`);
        
        // Réinitialiser l'état
        helpState.activeTime = 0;
        helpState.helpStage = 'none';
        
        // Cacher le bouton
        const helpBtn = document.getElementById('help-me-btn');
        if (helpBtn) {
            helpBtn.style.display = 'none';
        }
    }
    
    // ========================================
    // SAUVEGARDE / CHARGEMENT
    // ========================================
    
    function saveLevelState(levelKey, state) {
        try {
            localStorage.setItem(`_help_${levelKey}`, JSON.stringify(state));
        } catch (e) {
            console.error('Erreur sauvegarde état aide:', e);
        }
    }
    
    function loadLevelState(levelKey) {
        try {
            const saved = localStorage.getItem(`_help_${levelKey}`);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }
    
    // ========================================
    // AFFICHAGE DE L'AIDE
    // ========================================
    
    function showHelp() {
        if (!helpState.currentLevel) return;
        
        // Récupérer le niveau actuel
        const levelNum = document.getElementById('level-select').value;
        const level = cursusData[currentCursus].levels[levelNum];
        
        if (!level || !level.blocks) {
            alert('Aucune solution disponible pour ce niveau.');
            return;
        }
        
        // Créer la popup
        const modal = document.createElement('div');
        modal.className = 'modal simple-popup active';
        modal.id = 'help-solution-modal';
        
        const isPartial = helpState.helpStage === 'partial';
        const title = isPartial ? '❓ Début de la solution' : '💡 Solution complète';
        const subtitle = isPartial ? 'Voici le début du programme. La suite est cachée pour que tu puisses réfléchir !' : 'Voici la solution complète du niveau.';
        
        modal.innerHTML = `
            <div class="simple-popup-wrapper" style="max-width: 700px;">
                <span class="modal-close" onclick="closeHelpModal()">&times;</span>
                <div class="modal-content">
                    <h2 style="font-size: 24px; margin-bottom: 15px;">${title}</h2>
                    <p style="font-size: 16px; color: #666; margin-bottom: 20px;">${subtitle}</p>
                    <div id="help-program-display" style="background: #f5f5f5; padding: 20px; border-radius: 8px; max-height: 400px; overflow-y: auto;">
                    </div>
                    <button onclick="closeHelpModal()" style="margin-top: 20px; padding: 10px 30px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                        J'ai compris !
                    </button>
                </div>
            </div>
            <style>
                #help-program-display input[type="number"]::-webkit-inner-spin-button,
                #help-program-display input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                #help-program-display input[type="number"] {
                    -moz-appearance: textfield;
                    appearance: textfield;
                }
            </style>
        `;
        
        document.body.appendChild(modal);
        
        // Afficher le programme
        displaySolutionBlocks(level.blocks, isPartial);
    }
    
    function displaySolutionBlocks(blocks, isPartial) {
        const container = document.getElementById('help-program-display');
        if (!container) return;
        
        // Créer un container temporaire pour les blocs
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'pointer-events: none;'; // Empêcher toute interaction
        
        // Compter le nombre TOTAL de blocs (incluant imbriqués à TOUS les niveaux)
        function countAllBlocks(blocksList, depth = 0) {
            let count = 0;
            blocksList.forEach(block => {
                count++; // Le bloc lui-même
                if (block.nested && Array.isArray(block.nested) && block.nested.length > 0) {
                    const nestedCount = countAllBlocks(block.nested, depth + 1); // Récursif
                    count += nestedCount;
                }
            });
            return count;
        }
        
        const totalBlocks = countAllBlocks(blocks);
        const targetVisible = isPartial ? Math.ceil(totalBlocks / 2) : totalBlocks;
        
        let currentCount = 0;
        
        // Charger les blocs de PREMIER NIVEAU uniquement
        // loadSavedBlock s'occupe de charger les blocs imbriqués automatiquement
        blocks.forEach((blockData) => {
            // Compter ce bloc et tous ses enfants
            const thisBlockCount = 1 + (blockData.nested ? countAllBlocks(blockData.nested) : 0);
            
            // Créer un wrapper pour chaque bloc
            const blockWrapper = document.createElement('div');
            blockWrapper.style.cssText = 'margin: 8px 0; position: relative;';
            
            // Charger le bloc avec loadSavedBlock (qui charge aussi les imbriqués)
            if (typeof loadSavedBlock === 'function') {
                loadSavedBlock(blockData, blockWrapper);
            }
            
            // Déterminer si ce bloc et ses enfants doivent être floutés
            const shouldBlur = isPartial && (currentCount + 1) > targetVisible;
            
            if (shouldBlur) {
                blockWrapper.style.filter = 'blur(8px)';
                blockWrapper.style.opacity = '0.5';
            }
            
            // Forcer le style desktop sur tous les blocs
            const allBlocks = blockWrapper.querySelectorAll('.block');
            allBlocks.forEach(block => {
                block.style.boxSizing = 'border-box';
                block.style.padding = '8px 12px';
                block.classList.remove('mobile-block');
            });
            
            // Masquer les flèches des inputs number
            const inputs = blockWrapper.querySelectorAll('input[type="number"]');
            inputs.forEach(input => {
                input.style.appearance = 'textfield';
                input.style.MozAppearance = 'textfield';
                input.style.width = '60px';
            });
            
            // Élargir les champs de texte
            const textInputs = blockWrapper.querySelectorAll('input[type="text"]');
            textInputs.forEach(input => {
                input.style.width = '60px';
            });
            
            tempContainer.appendChild(blockWrapper);
            
            // Incrémenter le compteur avec ce bloc et tous ses enfants
            currentCount += thisBlockCount;
        });
        
        container.appendChild(tempContainer);
        
        // Ajouter un message si partiel
        if (isPartial) {
            const visibleCount = Math.min(currentCount, targetVisible);
            const hiddenCount = Math.max(0, totalBlocks - visibleCount);
            const hiddenMessage = document.createElement('div');
            hiddenMessage.style.cssText = 'text-align: center; padding: 20px; color: #666; font-style: italic;';
            hiddenMessage.textContent = `🔒 ${hiddenCount} bloc(s) masqué(s)`;
            container.appendChild(hiddenMessage);
        }
    }
    
    function closeHelpModal() {
        const modal = document.getElementById('help-solution-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    function init() {
        // Initialiser la détection d'activité
        initActivityDetection();
    }
    
    // Initialiser au chargement de la page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.helpSystem = {
        startLevel: startLevel,
        stopLevel: stopLevel,
        levelCompleted: levelCompleted
    };
    window.showHelpSolution = showHelp;
    window.closeHelpModal = closeHelpModal;
    
})();
