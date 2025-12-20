// ============================================
// MODULE: STUDENT PROGRAM STORAGE
// Description: Gestion de la sauvegarde et du chargement des programmes élèves
// Dépendances ENTRANTES (doivent exister dans app-core.js):
//   - Variables globales: currentMode, currentCursus
//   - Variables window: window.isPreviewMode, window.isStudentLoadMode
//   - Fonctions: updateBlockCount(), setupNestedAreaDrop(), setupNumericInputValidation()
// Fonctions EXPORTÉES (vers window):
//   - saveStudentProgram()
//   - loadStudentProgram()
//   - removeBlockAndSave()
//   - removeNestedBlockAndSave()
//   - clearAllStudentPrograms()
// ============================================

(function() {
    'use strict';
    
    
    // ========================================
    // SAUVEGARDE AUTOMATIQUE DES PROGRAMMES ÉLÈVES
    // ========================================
    
    // Obtenir le préfixe de clé selon le mode (preview ou URL élève)
    function getStoragePrefix() {
        if (window.isStudentLoadMode) {
            return '_sp_URL_'; // Mode URL élève (raccourci pour éviter blocage)
        } else if (window.isPreviewMode) {
            return '_sp_PREVIEW_'; // Mode Preview élève
        } else {
            return '_sp_PREVIEW_'; // Par défaut
        }
    }
    
    // Sauvegarder le programme de l'élève dans le localStorage
    function saveStudentProgram(cursus, levelNum) {
        try {
            const programBlocks = document.getElementById('program-blocks');
            
            // NETTOYER les placeholders de drag AVANT de sauvegarder
            programBlocks.querySelectorAll('#program-drag-placeholder').forEach(p => p.remove());
            programBlocks.querySelectorAll('#menu-drag-placeholder').forEach(p => p.remove());
            programBlocks.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
            
            // Supprimer tout div avec border dashed
            programBlocks.querySelectorAll(':scope > div').forEach(div => {
                const style = div.style.cssText || '';
                if (style.includes('dashed') && !div.classList.contains('program-block')) {
                    div.remove();
                }
            });
            
            // Nettoyer aussi les zones nested-blocks orphelines
            programBlocks.querySelectorAll('.nested-blocks').forEach(zone => {
                const parentCapsule = zone.closest('.block-capsule');
                if (!parentCapsule) {
                    zone.remove();
                }
            });
            
            // Avant de sauvegarder le HTML, copier les valeurs des inputs et selects dans les attributs
            saveInputValuesToAttributes(programBlocks);
            
            // Sauvegarder le HTML complet de la zone de programme
            const programHTML = programBlocks.innerHTML;
            
            // Créer une clé unique pour ce niveau selon le mode
            const prefix = getStoragePrefix();
            const storageKey = `${prefix}${cursus}_${levelNum}`;
            
            // Sauvegarder dans localStorage
            localStorage.setItem(storageKey, programHTML);
            
            const mode = window.isStudentLoadMode ? 'URL' : 'PREVIEW';
        } catch (error) {
        }
    }
    
    // Copier les valeurs des inputs et selects dans leurs attributs HTML
    function saveInputValuesToAttributes(container) {
        // Sauvegarder les valeurs des inputs
        const inputs = container.querySelectorAll('input[type="number"], input[type="text"]');
        inputs.forEach(input => {
            input.setAttribute('value', input.value);
        });
        
        // Sauvegarder les valeurs des selects
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            // Marquer l'option sélectionnée
            Array.from(select.options).forEach(option => {
                if (option.value === select.value) {
                    option.setAttribute('selected', 'selected');
                } else {
                    option.removeAttribute('selected');
                }
            });
        });
    }
    
    // Charger le programme de l'élève depuis le localStorage
    function loadStudentProgram(cursus, levelNum) {
        try {
            const prefix = getStoragePrefix();
            const storageKey = `${prefix}${cursus}_${levelNum}`;
            const savedHTML = localStorage.getItem(storageKey);
            
            if (!savedHTML) {
                const mode = window.isStudentLoadMode ? 'URL' : 'PREVIEW';
                return;
            }
            
            // Vérifier si c'est l'ancien format JSON (commence par [ ou {)
            if (savedHTML.trim().startsWith('[') || savedHTML.trim().startsWith('{')) {
                localStorage.removeItem(storageKey);
                return;
            }
            
            const mode = window.isStudentLoadMode ? 'URL' : 'PREVIEW';
            
            // Restaurer le HTML
            const programBlocks = document.getElementById('program-blocks');
            programBlocks.innerHTML = savedHTML;
            
            // Vérifier après 1 seconde si le HTML est toujours là
            setTimeout(() => {
                const checkBlocks = document.getElementById('program-blocks');
            }, 1000);
            
            // Réinitialiser les événements sur tous les blocs restaurés
            const blocks = programBlocks.querySelectorAll('.program-block');
            blocks.forEach(blockElement => {
                reinitializeBlockEvents(blockElement);
            });
            
            updateBlockCount();
        } catch (error) {
            // En cas d'erreur, nettoyer la sauvegarde corrompue
            const prefix = getStoragePrefix();
            const storageKey = `${prefix}${cursus}_${levelNum}`;
            localStorage.removeItem(storageKey);
        }
    }
    
    // Réinitialiser les événements sur un bloc restauré
    function reinitializeBlockEvents(blockElement) {
        // Rendre le bloc déplaçable
        blockElement.draggable = true;
        
        const programArea = document.getElementById('program-blocks');
        
        // Ajouter des listeners sur les inputs et selects pour sauvegarder automatiquement
        const inputs = blockElement.querySelectorAll('input[type="number"], input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
                    const levelNum = document.getElementById('level-select').value;
                    if (levelNum && currentCursus) {
                        saveStudentProgram(currentCursus, levelNum);
                    }
                }
            });
        });
        
        const selects = blockElement.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', function() {
                if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
                    const levelNum = document.getElementById('level-select').value;
                    if (levelNum && currentCursus) {
                        saveStudentProgram(currentCursus, levelNum);
                    }
                }
            });
        });
        
        blockElement.ondragstart = function(e) {
            e.stopPropagation();
            blockElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', blockElement.innerHTML);
            e.dataTransfer.setData('blockIndex', Array.from(programArea.children).indexOf(blockElement));
        };
        
        blockElement.ondragend = function() {
            blockElement.classList.remove('dragging');
            document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over');
            });
        };
        
        blockElement.ondragover = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const dragging = document.querySelector('.dragging');
            
            if ((!dragging || dragging !== blockElement)) {
                const rect = blockElement.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
                    el.classList.remove('drag-over-top', 'drag-over-bottom');
                });
                
                if (e.clientY < midpoint) {
                    blockElement.classList.add('drag-over-top');
                } else {
                    blockElement.classList.add('drag-over-bottom');
                }
            }
        };
        
        blockElement.ondrop = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dragging = document.querySelector('.dragging');
            if (!dragging || dragging === blockElement) return;
            
            const rect = blockElement.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                programArea.insertBefore(dragging, blockElement);
            } else {
                programArea.insertBefore(dragging, blockElement.nextSibling);
            }
            
            document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Sauvegarder après réorganisation
            if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
                const levelNum = document.getElementById('level-select').value;
                if (levelNum && currentCursus) {
                    saveStudentProgram(currentCursus, levelNum);
                }
            }
        };
        
        // Réinitialiser le bouton de suppression
        const removeBtn = blockElement.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.onclick = function(e) {
                e.stopPropagation();
                
                // Vérifier si c'est un bloc imbriqué ou un bloc principal
                const parentNestedArea = blockElement.parentElement;
                if (parentNestedArea && parentNestedArea.classList.contains('nested-blocks')) {
                    // Bloc imbriqué
                    removeNestedBlockAndSave(blockElement, parentNestedArea);
                } else {
                    // Bloc principal
                    removeBlockAndSave(blockElement);
                }
            };
        }
        
        // Réinitialiser les zones imbriquées
        const nestedArea = blockElement.querySelector('.nested-blocks');
        if (nestedArea) {
            setupNestedAreaDrop(nestedArea);
            
            // Réinitialiser récursivement les blocs imbriqués
            const nestedBlocks = nestedArea.querySelectorAll(':scope > .program-block');
            nestedBlocks.forEach(nestedBlock => {
                reinitializeBlockEvents(nestedBlock);
            });
        }
        
        // Réinitialiser la validation des inputs numériques
        setupNumericInputValidation(blockElement);
    }
    
    // Supprimer un bloc imbriqué et sauvegarder le programme
    function removeNestedBlockAndSave(blockElement, parentArea) {
        blockElement.remove();
        updateBlockCount();
        
        if (parentArea && parentArea.children.length === 0) {
            parentArea.classList.add('empty');
        }
        
        // Sauvegarder le programme de l'élève (si mode élève)
        if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
            const levelNum = document.getElementById('level-select').value;
            if (levelNum && currentCursus) {
                saveStudentProgram(currentCursus, levelNum);
            }
        }
    }
    
    // Supprimer un bloc et sauvegarder le programme
    function removeBlockAndSave(blockElement) {
        blockElement.remove();
        updateBlockCount();
        
        // Sauvegarder le programme de l'élève (si mode élève)
        if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
            const levelNum = document.getElementById('level-select').value;
            if (levelNum && currentCursus) {
                saveStudentProgram(currentCursus, levelNum);
            }
        }
    }
    
    // Nettoyer tous les programmes élèves sauvegardés
    function clearAllStudentPrograms() {
        const keysToRemove = [];
        
        // Parcourir toutes les clés du localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('studentProgram_') || key.startsWith('_sp_'))) {
                keysToRemove.push(key);
            }
        }
        
        // Supprimer toutes les sauvegardes de programmes
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        if (keysToRemove.length > 0) {
        }
    }
    
    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    // Rendre les fonctions accessibles globalement
    window.saveStudentProgram = saveStudentProgram;
    window.loadStudentProgram = loadStudentProgram;
    window.removeBlockAndSave = removeBlockAndSave;
    window.removeNestedBlockAndSave = removeNestedBlockAndSave;
    window.clearAllStudentPrograms = clearAllStudentPrograms;
    
    
})();
