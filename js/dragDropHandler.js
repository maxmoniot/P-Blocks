// ============================================
// MODULE: DRAG & DROP HANDLER
// Description: Gestion du drag & drop des blocs
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: aucune
//   - Fonctions: addBlockToProgram(), addNestedBlock(), updateBlockCount()
// Fonctions EXPORTÉES (vers window):
//   - allowDrop(), drag(), drop(), dropCondition()
//   - setupNestedAreaDrop()
// ============================================

(function() {
    'use strict';
    
    
function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) {
    if (ev.target.classList.contains('program-area')) {
        ev.target.classList.remove('drag-over');
    }
}

function drag(ev) {
    // Bloquer le scroll pendant le drag (mobile)
    if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
    
    const blockData = {
        type: ev.target.dataset.type,
        value: ev.target.dataset.value,
        op: ev.target.dataset.op,
        html: ev.target.outerHTML
    };
    
    // Capturer les valeurs des select pour les conserver
    const selects = ev.target.querySelectorAll('select');
    const selectValues = [];
    selects.forEach(select => {
        selectValues.push(select.value);
    });
    blockData.selectValues = selectValues;
    
    // Capturer les valeurs des inputs pour les conserver
    const inputs = ev.target.querySelectorAll('input[type="number"], input[type="text"]');
    const inputValues = [];
    inputs.forEach(input => {
        inputValues.push(input.value);
    });
    blockData.inputValues = inputValues;
    
    ev.dataTransfer.setData('text', JSON.stringify(blockData));
}

function drop(ev) {
    ev.preventDefault();
    ev.stopPropagation(); // Empêcher la propagation pour éviter les doublons
    ev.currentTarget.classList.remove('drag-over');
    
    // Réactiver le scroll (mobile)
    if (window.innerWidth <= 768) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }
    
    const dataText = ev.dataTransfer.getData('text');
    if (!dataText) return;
    
    let data;
    try {
        data = JSON.parse(dataText);
    } catch (e) {
        return;
    }
    
    // Empêcher le dépôt des blocs opérateurs et var-value dans la zone principale
    if (data.type === 'operator' || data.type === 'var-value') {
        return;
    }
    
    // Vérifier si on déplace un bloc existant ou si on en ajoute un nouveau depuis la palette
    const dragging = document.querySelector('.dragging');
    if (dragging) {
        // C'est un bloc existant qui est déplacé, ne rien faire ici
        // Le gestionnaire ondrop du bloc cible s'en occupe
        return;
    }
    
    // C'est un nouveau bloc depuis la palette
    const programArea = document.getElementById('program-blocks');
    const targetBlock = ev.target.closest('.program-block');
    
    // Créer le nouveau bloc
    addBlockToProgram(data);
    const newBlock = programArea.lastElementChild;
    
    // Si on a un bloc cible, insérer à la bonne position
    if (targetBlock && programArea.contains(targetBlock)) {
        const rect = targetBlock.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (ev.clientY < midpoint) {
            programArea.insertBefore(newBlock, targetBlock);
        } else {
            programArea.insertBefore(newBlock, targetBlock.nextSibling);
        }
    }
    // Sinon le bloc reste à la fin (comportement par défaut d'appendChild)
}

function dropCondition(ev) {
    // Cette fonction n'est plus utilisée car le bloc if intègre maintenant directement la condition
    ev.preventDefault();
    ev.stopPropagation();
}

function setupNestedAreaDrop(nestedArea) {
    // Fonction pour gérer le drop et trouver où insérer
    const handleDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // Trouver la vraie nested-area parente
        const actualNestedArea = e.currentTarget.closest ? e.currentTarget.closest('.nested-blocks') : nestedArea;
        if (!actualNestedArea) return;
        
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            // Déplacer un bloc existant
            const targetBlock = e.target.closest('.program-block');
            if (targetBlock && targetBlock !== dragging && actualNestedArea.contains(targetBlock)) {
                // Insérer avant ou après le bloc cible selon la position Y
                const rect = targetBlock.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    actualNestedArea.insertBefore(dragging, targetBlock);
                } else {
                    actualNestedArea.insertBefore(dragging, targetBlock.nextSibling);
                }
            } else {
                // Ajouter à la fin
                actualNestedArea.appendChild(dragging);
            }
        } else {
            // Ajouter un nouveau bloc depuis la palette
            const dataText = e.dataTransfer.getData('text');
            if (!dataText) return;
            
            let nestedData;
            try {
                nestedData = JSON.parse(dataText);
            } catch (err) {
                return;
            }
            
            // Empêcher le dépôt des blocs opérateurs et var-value dans les zones imbriquées
            if (nestedData.type === 'operator' || nestedData.type === 'var-value') {
                return;
            }
            
            // Trouver le bloc cible pour insertion
            const targetBlock = e.target.closest('.program-block');
            if (targetBlock && actualNestedArea.contains(targetBlock)) {
                const rect = targetBlock.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                // Créer le nouveau bloc d'abord
                addNestedBlock(nestedData, actualNestedArea);
                const newBlock = actualNestedArea.lastElementChild;
                
                // Puis le déplacer à la bonne position
                if (e.clientY < midpoint) {
                    actualNestedArea.insertBefore(newBlock, targetBlock);
                } else {
                    actualNestedArea.insertBefore(newBlock, targetBlock.nextSibling);
                }
            } else {
                // Ajouter à la fin
                addNestedBlock(nestedData, actualNestedArea);
            }
        }
        actualNestedArea.classList.remove('empty');
        actualNestedArea.classList.remove('drag-over');
        
        // Sauvegarder après ajout/déplacement dans zone imbriquée
        if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
            const levelNum = document.getElementById('level-select').value;
            if (levelNum && currentCursus) {
                saveStudentProgram(currentCursus, levelNum);
            }
        }
    };
    
    const handleDragOver = function(e) { 
        e.preventDefault(); 
        e.stopPropagation();
        const actualNestedArea = e.currentTarget.closest ? e.currentTarget.closest('.nested-blocks') : nestedArea;
        if (actualNestedArea) {
            actualNestedArea.classList.add('drag-over');
        }
    };
    
    const handleDragLeave = function(e) {
        if (e.target === nestedArea) {
            nestedArea.classList.remove('drag-over');
        }
    };
    
    // Ajouter les événements sur la zone elle-même
    nestedArea.ondrop = handleDrop;
    nestedArea.ondragover = handleDragOver;
    nestedArea.ondragleave = handleDragLeave;
    
    // Observer les nouveaux blocs ajoutés pour leur ajouter aussi les gestionnaires
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('program-block')) {
                    // Ajouter les gestionnaires sur le nouveau bloc
                    node.ondragover = handleDragOver;
                    node.ondrop = handleDrop;
                }
            });
        });
    });
    
    observer.observe(nestedArea, { childList: true });
}

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.allowDrop = allowDrop;
    window.dragLeave = dragLeave;
    window.drag = drag;
    window.drop = drop;
    window.dropCondition = dropCondition;
    window.setupNestedAreaDrop = setupNestedAreaDrop;
    
    // Sécurité : réactiver le scroll si le drag est annulé (dragend sans drop)
    document.addEventListener('dragend', function() {
        if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
    });
    
})();
