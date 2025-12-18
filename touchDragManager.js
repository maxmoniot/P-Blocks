// ============================================
// MODULE: TOUCH & DRAG MANAGER
// Description: Gestion du drag & drop mobile et desktop
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: touchData, currentMode, createdVariables
//   - Fonctions: addBlockToProgram(), addNestedBlock(), validateNumericInput()
// Fonctions EXPORTÉES (vers window):
//   - initMobileTouchDrag(), populateMobileBlocks()
//   - handleDropInValueSlot(), setupNestedBlocksTouchDrag()
// ============================================

(function() {
    'use strict';
    
    
function initMobileTouchDrag() {
    const blocks = document.querySelectorAll('#mobile-blocks-list .block, #mobile-blocks-list .value-block, #mobile-blocks-list .operator-block');
    
    blocks.forEach(block => {
        block.addEventListener('touchstart', handleTouchStart, { passive: false });
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    
    const touch = e.touches[0];
    touchDragState.startX = touch.clientX;
    touchDragState.startY = touch.clientY;
    touchDragState.sourceBlock = e.currentTarget;
    touchDragState.active = true;
    
    // Créer le bloc fantôme
    createGhostBlock(e.currentTarget, touch.clientX, touch.clientY);
    
    // Fermer le menu mobile
    setTimeout(() => closeMobileMenu(), 50);
    
    // Ajouter les listeners de mouvement
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
}

function createGhostBlock(sourceBlock, x, y) {
    // Créer un clone visuel
    const ghost = sourceBlock.cloneNode(true);
    ghost.id = 'touch-drag-ghost';
    ghost.style.cssText = `
        position: fixed;
        left: ${x - 50}px;
        top: ${y - 25}px;
        z-index: 9999;
        opacity: 0.8;
        pointer-events: none;
        transform: rotate(3deg);
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(ghost);
    touchDragState.ghost = ghost;
}

function handleTouchMove(e) {
    if (!touchDragState.active) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    touchDragState.currentX = touch.clientX;
    touchDragState.currentY = touch.clientY;
    
    // Déplacer le bloc fantôme (toujours fluide)
    if (touchDragState.ghost) {
        touchDragState.ghost.style.left = (touch.clientX - 50) + 'px';
        touchDragState.ghost.style.top = (touch.clientY - 25) + 'px';
    }
    
    // THROTTLING : ne repositionner le placeholder que toutes les 50ms
    const now = Date.now();
    if (now - touchDragState.lastMoveTime < touchDragState.moveThreshold) {
        return; // Trop tôt, on attend
    }
    touchDragState.lastMoveTime = now;
    
    // Créer le placeholder s'il n'existe pas
    if (!touchDragState.placeholder) {
        touchDragState.placeholder = document.createElement('div');
        touchDragState.placeholder.id = 'menu-drag-placeholder';
        touchDragState.placeholder.style.cssText = `
            height: 60px;
            border: 2px dashed #4CAF50;
            border-radius: 6px;
            margin-bottom: 10px;
            background: rgba(76, 175, 80, 0.1);
        `;
    }
    
    // Trouver l'élément sous le doigt (en cachant le fantôme)
    touchDragState.ghost.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    touchDragState.ghost.style.display = 'block';
    
    if (!elementBelow) return;
    
    // Récupérer le type de bloc source pour vérifier les restrictions
    const sourceBlockType = touchDragState.sourceBlock.dataset.type;
    
    // 1. Vérifier si on survole un value-slot
    const valueSlot = elementBelow.closest('.value-slot');
    if (valueSlot && (sourceBlockType === 'var-value' || sourceBlockType === 'operator')) {
        // Pas de placeholder pour value-slots, juste un changement visuel
        valueSlot.style.background = 'rgba(76, 175, 80, 0.2)';
        // Enlever le placeholder s'il était affiché ailleurs
        if (touchDragState.placeholder.parentNode) {
            touchDragState.placeholder.remove();
        }
        // Nettoyer les autres value-slots
        document.querySelectorAll('.value-slot').forEach(slot => {
            if (slot !== valueSlot) {
                slot.style.background = '';
            }
        });
        return;
    } else {
        // Nettoyer tous les value-slots
        document.querySelectorAll('.value-slot').forEach(slot => {
            slot.style.background = '';
        });
    }
    
    // Les blocs var-value et operator ne peuvent pas aller ailleurs
    if (sourceBlockType === 'var-value' || sourceBlockType === 'operator') {
        if (touchDragState.placeholder.parentNode) {
            touchDragState.placeholder.remove();
        }
        return;
    }
    
    // 2. Vérifier si on survole une zone nested-blocks
    const nestedBlocks = elementBelow.closest('.nested-blocks');
    if (nestedBlocks) {
        const blocksInNested = Array.from(nestedBlocks.querySelectorAll(':scope > .program-block'));
        const targetBlockInNested = blocksInNested.find(block => {
            const rect = block.getBoundingClientRect();
            return touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        });
        
        if (targetBlockInNested) {
            const rect = targetBlockInNested.getBoundingClientRect();
            const middle = rect.top + rect.height / 2;
            
            let newPosition;
            
            // Si c'est un NOUVEAU bloc, décider immédiatement
            if (targetBlockInNested !== touchDragState.lastTargetBlock) {
                newPosition = touch.clientY < middle ? 'before' : 'after';
            } else {
                // Même bloc : zone morte pour stabilité
                const deadZone = rect.height * 0.2;
                const upperThreshold = middle - deadZone;
                const lowerThreshold = middle + deadZone;
                
                if (touch.clientY < upperThreshold) {
                    newPosition = 'before';
                } else if (touch.clientY > lowerThreshold) {
                    newPosition = 'after';
                } else {
                    newPosition = touchDragState.lastPosition;
                }
            }
            
            // Ne déplacer que si changement
            if (targetBlockInNested !== touchDragState.lastTargetBlock || newPosition !== touchDragState.lastPosition) {
                let targetSibling;
                if (newPosition === 'before') {
                    targetSibling = targetBlockInNested;
                } else {
                    targetSibling = targetBlockInNested.nextSibling;
                }
                
                // Vérifier si le placeholder n'est pas déjà au bon endroit
                if (touchDragState.placeholder.nextSibling !== targetSibling) {
                    nestedBlocks.insertBefore(touchDragState.placeholder, targetSibling);
                }
                
                touchDragState.lastTargetBlock = targetBlockInNested;
                touchDragState.lastPosition = newPosition;
            }
        } else {
            // Vérifier si le placeholder n'est pas déjà à la fin
            if (touchDragState.placeholder.parentNode !== nestedBlocks || touchDragState.placeholder.nextSibling !== null) {
                nestedBlocks.appendChild(touchDragState.placeholder);
            }
            touchDragState.lastTargetBlock = null;
            touchDragState.lastPosition = null;
        }
        return;
    }
    
    // 3. Vérifier si on survole le programme principal
    const programBlocks = document.getElementById('program-blocks');
    const programArea = elementBelow.closest('.program-area');
    
    if ((programBlocks && (elementBelow === programBlocks || programBlocks.contains(elementBelow))) || programArea) {
        // Si on survole la zone program-area (titre "Mon Programme") ou le conteneur vide
        if (programArea && !programBlocks.contains(elementBelow) && elementBelow !== programBlocks) {
            // On est sur le titre ou la zone autour, pas sur un bloc
            // Ajouter au DÉBUT du programme
            if (programBlocks.children.length > 0) {
                // Il y a déjà des blocs, insérer au début
                const firstBlock = programBlocks.firstElementChild;
                if (touchDragState.placeholder.nextSibling !== firstBlock || touchDragState.placeholder.parentNode !== programBlocks) {
                    programBlocks.insertBefore(touchDragState.placeholder, firstBlock);
                }
            } else {
                // Programme vide
                if (touchDragState.placeholder.parentNode !== programBlocks || touchDragState.placeholder.nextSibling !== null) {
                    programBlocks.appendChild(touchDragState.placeholder);
                }
            }
            touchDragState.lastTargetBlock = null;
            touchDragState.lastPosition = 'beginning';
            return;
        }
        
        // Trouver le bloc le plus proche MAIS ignorer le placeholder
        let targetBlock = elementBelow.closest('.program-block');
        
        // Si on a cliqué sur le placeholder lui-même, NE RIEN FAIRE
        if (elementBelow === touchDragState.placeholder || touchDragState.placeholder.contains(elementBelow)) {
            return; // SORTIR sans rien changer !
        }
        
        if (targetBlock) {
            const rect = targetBlock.getBoundingClientRect();
            const middle = rect.top + rect.height / 2;
            
            
            let newPosition;
            
            // Si c'est un NOUVEAU bloc (changement de bloc cible), décider immédiatement sans zone morte
            if (targetBlock !== touchDragState.lastTargetBlock) {
                newPosition = touch.clientY < middle ? 'before' : 'after';
            } else {
                // Même bloc : utiliser la zone morte pour éviter les oscillations
                const deadZone = rect.height * 0.25; // 25% encore plus large
                const upperThreshold = middle - deadZone;
                const lowerThreshold = middle + deadZone;
                
                if (touch.clientY < upperThreshold) {
                    newPosition = 'before';
                } else if (touch.clientY > lowerThreshold) {
                    newPosition = 'after';
                } else {
                    // Dans la zone morte, garder la position actuelle
                    newPosition = touchDragState.lastPosition;
                }
            }
            
            // Ne déplacer le placeholder que si la position change VRAIMENT
            if (newPosition && (targetBlock !== touchDragState.lastTargetBlock || newPosition !== touchDragState.lastPosition)) {
                let targetSibling;
                if (newPosition === 'before') {
                    targetSibling = targetBlock;
                } else {
                    targetSibling = targetBlock.nextSibling;
                }
                
                // Vérifier si le placeholder n'est pas déjà au bon endroit
                const needsMove = touchDragState.placeholder.nextSibling !== targetSibling || 
                                 touchDragState.placeholder.parentNode !== targetBlock.parentNode;
                
                
                if (needsMove) {
                    targetBlock.parentNode.insertBefore(touchDragState.placeholder, targetSibling);
                } else {
                }
                
                touchDragState.lastTargetBlock = targetBlock;
                touchDragState.lastPosition = newPosition;
            } else {
            }
        } else {
            // Zone vide du programme, ajouter à la fin
            // Vérifier si pas déjà à la fin
            if (touchDragState.placeholder.parentNode !== programBlocks || touchDragState.placeholder.nextSibling !== null) {
                programBlocks.appendChild(touchDragState.placeholder);
            }
            touchDragState.lastTargetBlock = null;
            touchDragState.lastPosition = null;
        }
        return;
    }
    
    // Si on n'est sur aucune zone valide, retirer le placeholder
    if (touchDragState.placeholder.parentNode) {
        touchDragState.placeholder.remove();
    }
}

function handleTouchEnd(e) {
    if (!touchDragState.active) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const dropX = touch.clientX;
    const dropY = touch.clientY;
    
    // Trouver l'élément sous le doigt
    if (touchDragState.ghost) {
        touchDragState.ghost.style.display = 'none';
    }
    
    const elementBelow = document.elementFromPoint(dropX, dropY);
    
    if (!elementBelow) {
        cleanupTouchDrag();
        return;
    }
    
    // Récupérer le type de bloc source
    const sourceBlockType = touchDragState.sourceBlock.dataset.type;
    
    // 1. Vérifier si on dépose dans un VALUE-SLOT
    const valueSlot = elementBelow.closest('.value-slot');
    if (valueSlot) {
        // Seuls les blocs var-value et operator peuvent aller dans value-slot
        if (sourceBlockType === 'var-value' || sourceBlockType === 'operator') {
            handleDropInValueSlot(touchDragState.sourceBlock, valueSlot);
        } else {
        }
        cleanupTouchDrag();
        return;
    }
    
    // 2. Vérifier si on dépose dans un NESTED-BLOCKS (bloc répéter)
    const nestedBlocks = elementBelow.closest('.nested-blocks');
    if (nestedBlocks) {
        // Les blocs var-value et operator NE PEUVENT PAS aller dans nested-blocks
        if (sourceBlockType === 'var-value' || sourceBlockType === 'operator') {
        } else {
            addBlockToProgramFromTouch(touchDragState.sourceBlock, nestedBlocks, elementBelow, dropY);
        }
        cleanupTouchDrag();
        return;
    }
    
    // 3. Vérifier si on dépose dans la ZONE PROGRAMME PRINCIPALE ou program-area
    const programBlocks = document.getElementById('program-blocks');
    const programArea = elementBelow.closest('.program-area');
    
    if ((programBlocks && (elementBelow === programBlocks || programBlocks.contains(elementBelow))) || programArea) {
        // Les blocs var-value et operator NE PEUVENT PAS aller dans le programme principal
        if (sourceBlockType === 'var-value' || sourceBlockType === 'operator') {
        } else {
            addBlockToProgramFromTouch(touchDragState.sourceBlock, programBlocks, elementBelow, dropY);
        }
    }
    
    // Nettoyer
    cleanupTouchDrag();
}

// Nouvelle fonction pour gérer le drop dans les value-slots
function handleDropInValueSlot(sourceBlock, valueSlot) {
    
    // Récupérer les données du bloc
    const blockData = {
        type: sourceBlock.dataset.type,
        html: sourceBlock.outerHTML,
        selectValues: []
    };
    
    // Récupérer les valeurs des selects
    const selects = sourceBlock.querySelectorAll('select');
    selects.forEach(select => {
        blockData.selectValues.push(select.value);
    });
    
    // Sauvegarder l'input original pour pouvoir le restaurer
    const originalInput = valueSlot.querySelector('input');
    let inputHTML = '<input type="text" inputmode="numeric" pattern="[0-9]*" value="0" onclick="event.stopPropagation()">';
    
    if (originalInput) {
        const inputType = originalInput.type;
        const inputValue = originalInput.value;
        const placeholder = originalInput.placeholder;
        
        if (placeholder) {
            inputHTML = `<input type="text" placeholder="${placeholder}" onclick="event.stopPropagation()">`;
        } else {
            inputHTML = `<input type="text" inputmode="numeric" pattern="[0-9]*" value="${inputValue || '0'}" onclick="event.stopPropagation()">`;
        }
    }
    
    // Remplacer le contenu du value-slot
    valueSlot.innerHTML = blockData.html;
    valueSlot.classList.add('filled');
    
    // Modifier le bloc inséré
    const block = valueSlot.querySelector('.block, .value-block, .operator-block');
    if (block) {
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        block.classList.add('inline-block');
        block.style.display = 'inline-flex';
        block.style.margin = '0';
        
        // Convertir les inputs en text pour mobile
        if (window.innerWidth <= 768) {
            const inputs = block.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.type === 'number') {
                    input.type = 'text';
                    input.inputMode = 'numeric';
                    input.pattern = '[0-9]*';
                }
            });
        }
        
        // Ajouter bouton de suppression
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.style.fontSize = '16px';
        removeBtn.style.padding = '4px 8px';
        removeBtn.onclick = function(e) {
            e.stopPropagation();
            valueSlot.innerHTML = inputHTML;
            valueSlot.classList.remove('filled');
        };
        block.appendChild(removeBtn);
        
        // Si c'est un bloc variable, mettre à jour le select
        if (blockData.type === 'var-value') {
            const select = block.querySelector('.var-select');
            if (select) {
                const selectedValue = blockData.selectValues && blockData.selectValues.length > 0 ? blockData.selectValues[0] : '';
                
                select.innerHTML = '<option value="">choisir...</option>';
                createdVariables.forEach(varName => {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    select.appendChild(option);
                });
                
                if (selectedValue && createdVariables.includes(selectedValue)) {
                    select.value = selectedValue;
                }
            }
        }
        
        // Si c'est un opérateur, gérer les value-slots internes
        if (blockData.type === 'operator') {
            const innerValueSlots = block.querySelectorAll('.value-slot');
            innerValueSlots.forEach(slot => {
                if (blockData.selectValues) {
                    const innerSelects = slot.querySelectorAll('select');
                    innerSelects.forEach((select, index) => {
                        if (blockData.selectValues[index]) {
                            select.value = blockData.selectValues[index];
                        }
                    });
                }
            });
        }
        
        // IMPORTANT : Appliquer la validation sur le bloc inséré
        setupNumericInputValidation(block);
        
        // ÉGALEMENT : Réinitialiser la validation sur le bloc parent
        const parentProgramBlock = valueSlot.closest('.program-block');
        if (parentProgramBlock) {
            setupNumericInputValidation(parentProgramBlock);
        }
    }
    
}

function addBlockToProgramFromTouch(sourceBlock, container, targetElement, dropY) {
    // Récupérer les données du bloc comme le fait drag()
    
    // IMPORTANT : Nettoyer le HTML des styles inline de la palette mobile
    const cleanBlock = sourceBlock.cloneNode(true);
    
    // Fonction récursive pour nettoyer TOUS les éléments
    function cleanAllStyles(element) {
        if (element.style) {
            element.style.removeProperty('min-height');
            element.style.removeProperty('font-size');
            element.style.removeProperty('padding');
            element.style.removeProperty('margin-bottom');
            element.style.removeProperty('cursor');
        }
        // Nettoyer récursivement tous les enfants
        if (element.children) {
            Array.from(element.children).forEach(child => cleanAllStyles(child));
        }
    }
    
    cleanAllStyles(cleanBlock);
    
    
    const blockData = {
        type: sourceBlock.dataset.type,
        html: cleanBlock.outerHTML,  // HTML nettoyé sans styles inline
        selectValues: []
    };
    
    // Récupérer les valeurs des select s'il y en a
    const selects = sourceBlock.querySelectorAll('select');
    selects.forEach(select => {
        blockData.selectValues.push(select.value);
    });
    
    // Utiliser la fonction NATIVE addBlockToProgram
    addBlockToProgram(blockData);
    
    // Le bloc est ajouté à #program-blocks par défaut
    const programBlocks = document.getElementById('program-blocks');
    const newBlock = programBlocks.lastElementChild;
    
    if (!newBlock) {
        return;
    }
    
    // Initialiser le drag tactile sur ce nouveau bloc
    if (window.innerWidth <= 768) {
        newBlock.addEventListener('touchstart', handleProgramBlockTouchStart, { passive: false });
        
        // Les styles de taille sont gérés par CSS responsive (media query)
        // Pas besoin d'ajouter des styles inline qui persistent
        
        // Convertir les input number en text pour mobile
        const numberInputs = newBlock.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.type = 'text';
            input.inputMode = 'numeric';
            input.pattern = '[0-9]*';
        });
        
        // Si c'est un bloc répéter, initialiser le drag tactile sur nested-blocks
        const nestedBlocks = newBlock.querySelector('.nested-blocks');
        if (nestedBlocks) {
            setupNestedBlocksTouchDrag(nestedBlocks);
        }
    }
    
    // DÉPLACER le bloc au bon endroit
    
    // Cas 1 : Drop dans nested-blocks (bloc répéter)
    if (container.classList && container.classList.contains('nested-blocks')) {
        container.appendChild(newBlock);
        container.classList.remove('empty');
        
        // IMPORTANT : Ajouter le listener tactile sur ce bloc imbriqué
        if (window.innerWidth <= 768) {
            newBlock.addEventListener('touchstart', handleProgramBlockTouchStart, { passive: false });
        }
        
        updateBlockCount();
        return;
    }
    
    // Cas 2 : Utiliser la position du placeholder s'il existe
    if (touchDragState.placeholder && touchDragState.placeholder.parentNode) {
        const placeholderParent = touchDragState.placeholder.parentNode;
        const placeholderNextSibling = touchDragState.placeholder.nextSibling;
        
        // Insérer le nouveau bloc à la place du placeholder
        placeholderParent.insertBefore(newBlock, placeholderNextSibling);
    } else {
        // Cas 3 : Fallback - trouver la position avec dropY
        const targetBlock = targetElement.closest('.program-block');
        
        if (targetBlock && targetBlock !== newBlock && programBlocks.contains(targetBlock)) {
            // On a trouvé un bloc cible dans le programme principal
            const rect = targetBlock.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (dropY < midpoint) {
                // Insérer AVANT le bloc cible
                programBlocks.insertBefore(newBlock, targetBlock);
            } else {
                // Insérer APRÈS le bloc cible
                if (targetBlock.nextSibling) {
                    programBlocks.insertBefore(newBlock, targetBlock.nextSibling);
                }
            }
        } else {
            // Pas de cible spécifique, reste à la fin
        }
    }
    
    // Mettre à jour le compteur
    updateBlockCount();
}

// Nouvelle fonction pour configurer le drag tactile sur nested-blocks
function setupNestedBlocksTouchDrag(nestedArea) {
    // Rendre la zone tactile réactive
    nestedArea.addEventListener('touchstart', function(e) {
        // Ne rien faire - on laisse le touchstart du bloc se propager
    }, { passive: true });
    
}

// Cette fonction n'est plus utilisée - on utilise addBlockToProgram natif
function createProgramBlockFromSource_UNUSED(sourceBlock) {
    return null;
}

function cleanupTouchDrag() {
    // Supprimer le bloc fantôme
    if (touchDragState.ghost) {
        touchDragState.ghost.remove();
    }
    
    // Supprimer le placeholder
    if (touchDragState.placeholder) {
        touchDragState.placeholder.remove();
    }
    
    // Nettoyer les backgrounds des value-slots
    document.querySelectorAll('.value-slot').forEach(slot => {
        slot.style.background = '';
    });
    
    // Réinitialiser l'état
    touchDragState.active = false;
    touchDragState.ghost = null;
    touchDragState.sourceBlock = null;
    touchDragState.placeholder = null;
    touchDragState.lastTargetBlock = null;
    touchDragState.lastPosition = null;
    
    // Retirer les listeners de la palette (handleTouchMove, handleTouchEnd)
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    // Ne PAS retirer handleProgramBlockTouchMove/touchEnd car ils sont attachés en permanence
}

// ============================================
// DRAG TACTILE POUR RÉORGANISER LES BLOCS DU PROGRAMME
// ============================================

let programDragState = {
    active: false,
    ghost: null,
    sourceBlock: null,
    placeholder: null,
    startX: 0,
    startY: 0
};

function handleProgramBlockTouchStart(e) {
    
    // Ne pas démarrer le drag si on touche un bouton, un input ou un SELECT
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        return;
    }
    
    e.preventDefault();
    
    // NETTOYAGE PRÉVENTIF : supprimer tout fantôme résiduel
    document.querySelectorAll('#program-drag-ghost').forEach(g => g.remove());
    document.querySelectorAll('#program-drag-placeholder').forEach(p => p.remove());
    
    const touch = e.touches[0];
    
    // IMPORTANT : Trouver le bloc le PLUS PROCHE du point de touche
    // Pas e.currentTarget qui peut être le parent (bloc répéter)
    const clickedBlock = e.target.closest('.program-block');
    
    if (!clickedBlock) {
        return;
    }
    
    
    programDragState.startX = touch.clientX;
    programDragState.startY = touch.clientY;
    programDragState.sourceBlock = clickedBlock;  // Le bloc cliqué, pas currentTarget
    programDragState.active = true;
    
    // Créer le bloc fantôme
    const ghost = programDragState.sourceBlock.cloneNode(true);
    ghost.id = 'program-drag-ghost';
    ghost.style.cssText = `
        position: fixed;
        left: ${touch.clientX - 100}px;
        top: ${touch.clientY - 30}px;
        width: ${programDragState.sourceBlock.offsetWidth}px;
        z-index: 9999;
        opacity: 0.8;
        pointer-events: none;
        transform: rotate(2deg);
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(ghost);
    programDragState.ghost = ghost;
    
    // Créer un placeholder
    const placeholder = document.createElement('div');
    placeholder.id = 'program-drag-placeholder';
    placeholder.style.cssText = `
        height: ${programDragState.sourceBlock.offsetHeight}px;
        border: 2px dashed #999;
        border-radius: 6px;
        margin-bottom: 10px;
        background: rgba(0,0,0,0.05);
    `;
    programDragState.sourceBlock.style.opacity = '0.3';
    programDragState.sourceBlock.parentNode.insertBefore(placeholder, programDragState.sourceBlock);
    programDragState.placeholder = placeholder;
    
    // Les listeners touchmove/touchend sont déjà attachés au document au chargement
    // Pas besoin de les ajouter ici
    
}

function handleProgramBlockTouchMove(e) {
    
    // Ne bloquer le scroll QUE si on est en train de dragger
    if (!programDragState.active) return;
    
    // Bloquer le scroll seulement pendant le drag actif
    e.preventDefault();
    
    const touch = e.touches[0];
    
    // Déplacer le fantôme
    if (programDragState.ghost) {
        programDragState.ghost.style.left = (touch.clientX - 100) + 'px';
        programDragState.ghost.style.top = (touch.clientY - 30) + 'px';
    }
    
    // Trouver l'élément sous le doigt
    programDragState.ghost.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    programDragState.ghost.style.display = 'block';
    
    if (!elementBelow) return;
    
    // 1. Vérifier si on est sur une zone nested-blocks
    const nestedBlocks = elementBelow.closest('.nested-blocks');
    if (nestedBlocks && !nestedBlocks.contains(programDragState.sourceBlock)) {
        // On survole une zone nested-blocks (et le bloc source n'y est pas déjà)
        // Trouver un bloc dans cette zone pour positionner le placeholder
        const blocksInNested = Array.from(nestedBlocks.querySelectorAll(':scope > .program-block'));
        const targetBlockInNested = blocksInNested.find(block => {
            const rect = block.getBoundingClientRect();
            return touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        });
        
        if (targetBlockInNested && targetBlockInNested !== programDragState.sourceBlock) {
            const rect = targetBlockInNested.getBoundingClientRect();
            const middle = rect.top + rect.height / 2;
            
            if (touch.clientY < middle) {
                nestedBlocks.insertBefore(programDragState.placeholder, targetBlockInNested);
            } else {
                nestedBlocks.insertBefore(programDragState.placeholder, targetBlockInNested.nextSibling);
            }
        } else if (blocksInNested.length === 0) {
            // Zone vide, ajouter à la fin
            nestedBlocks.appendChild(programDragState.placeholder);
        } else {
            // Ajouter à la fin de la zone
            nestedBlocks.appendChild(programDragState.placeholder);
        }
        return;
    }
    
    // 2. Sinon, détecter un bloc dans le programme principal
    const programBlock = elementBelow.closest('.program-block');
    if (programBlock && programBlock !== programDragState.sourceBlock) {
        // Déterminer si on insère avant ou après
        const rect = programBlock.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        
        if (touch.clientY < middle) {
            // Insérer avant
            programBlock.parentNode.insertBefore(programDragState.placeholder, programBlock);
        } else {
            // Insérer après
            if (programBlock.nextSibling) {
                programBlock.parentNode.insertBefore(programDragState.placeholder, programBlock.nextSibling);
            } else {
                programBlock.parentNode.appendChild(programDragState.placeholder);
            }
        }
    }
}

function handleProgramBlockTouchEnd(e) {
    if (!programDragState.active) return;
    e.preventDefault();
    
    // Sauvegarder l'ancien parent pour vérifier s'il devient vide
    const oldParent = programDragState.sourceBlock ? programDragState.sourceBlock.parentNode : null;
    
    // Replacer le bloc à la position du placeholder
    if (programDragState.placeholder && programDragState.sourceBlock) {
        programDragState.placeholder.parentNode.insertBefore(
            programDragState.sourceBlock,
            programDragState.placeholder
        );
        programDragState.sourceBlock.style.opacity = '1';
        
        // Si le nouveau parent est un nested-blocks, le marquer comme non-vide
        const newParent = programDragState.sourceBlock.parentNode;
        if (newParent && newParent.classList.contains('nested-blocks')) {
            newParent.classList.remove('empty');
        }
        
        // Si l'ancien parent est un nested-blocks et devient vide, le marquer
        if (oldParent && oldParent.classList.contains('nested-blocks')) {
            const remainingBlocks = oldParent.querySelectorAll(':scope > .program-block');
            if (remainingBlocks.length === 0) {
                oldParent.classList.add('empty');
            }
        }
    }
    
    // Nettoyer le fantôme
    if (programDragState.ghost) {
        programDragState.ghost.remove();
    }
    if (programDragState.placeholder) {
        programDragState.placeholder.remove();
    }
    
    // NETTOYAGE DE SÉCURITÉ : supprimer TOUS les ghosts possibles
    const allGhosts = document.querySelectorAll('#program-drag-ghost');
    allGhosts.forEach(ghost => ghost.remove());
    
    const allPlaceholders = document.querySelectorAll('#program-drag-placeholder');
    allPlaceholders.forEach(placeholder => placeholder.remove());
    
    // Restaurer l'opacité de TOUS les blocs au cas où
    document.querySelectorAll('.program-block[style*="opacity"]').forEach(block => {
        if (block.style.opacity === '0.3') {
            block.style.opacity = '1';
        }
    });
    
    programDragState.active = false;
    programDragState.ghost = null;
    programDragState.sourceBlock = null;
    programDragState.placeholder = null;
    
    // Ne PAS retirer les listeners car ils sont attachés en permanence au document
    
}

// Initialiser le drag sur les blocs existants (y compris imbriqués)
function initProgramBlocksDrag() {
    // Récupérer TOUS les program-block, même ceux dans nested-blocks
    const blocks = document.querySelectorAll('#program-blocks .program-block');
    blocks.forEach(block => {
        initSingleBlockDrag(block);
        
        // NETTOYER les styles inline des blocs (qui peuvent persister depuis mobile)
        const innerBlock = block.querySelector('.block');
        if (innerBlock) {
            // Retirer les styles inline problématiques
            innerBlock.style.removeProperty('min-height');
            innerBlock.style.removeProperty('font-size');
            innerBlock.style.removeProperty('padding');
        }
    });
}

// Fonction pour initialiser le drag d'UN SEUL bloc ET ses blocs imbriqués (appelée après ajout)
function initSingleBlockDrag(block) {
    
    // Initialiser le bloc lui-même
    block.removeEventListener('touchstart', handleProgramBlockTouchStart);
    block.addEventListener('touchstart', handleProgramBlockTouchStart, { passive: false });
    
    // Initialiser AUSSI tous les blocs imbriqués à l'intérieur
    const nestedBlocks = block.querySelectorAll('.nested-blocks .program-block');
    if (nestedBlocks.length > 0) {
    }
    nestedBlocks.forEach(nestedBlock => {
        nestedBlock.removeEventListener('touchstart', handleProgramBlockTouchStart);
        nestedBlock.addEventListener('touchstart', handleProgramBlockTouchStart, { passive: false });
    });
}

// Appeler au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Attacher les événements touchmove et touchend de manière PERMANENTE
    // (au lieu de les attacher dans touchstart, ce qui est trop tard)
    document.addEventListener('touchmove', handleProgramBlockTouchMove, { passive: false });
    document.addEventListener('touchend', handleProgramBlockTouchEnd, { passive: false });
    
    setTimeout(() => {
        initProgramBlocksDrag();
    }, 1000);
});

// ============================================
// FIN DRAG TACTILE PROGRAMME
// ============================================

// ============================================
// FIN SYSTÈME DE DRAG TACTILE
// ============================================

// ============================================
// GESTION DU MENU MOBILE
// ============================================

function toggleMobileMenu() {
    const panel = document.getElementById('mobile-blocks-panel');
    const overlay = document.getElementById('mobile-overlay');
    const modePanel = document.getElementById('mobile-mode-panel');
    
    // Fermer le menu mode si ouvert
    modePanel.classList.remove('active');
    
    // Toggle le menu blocs
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Peupler le panneau avec les blocs disponibles
    if (panel.classList.contains('active')) {
        populateMobileBlocks();
    }
}

function toggleMobileMode() {
    const panel = document.getElementById('mobile-mode-panel');
    const overlay = document.getElementById('mobile-overlay');
    const blocksPanel = document.getElementById('mobile-blocks-panel');
    
    
    // Fermer le menu blocs si ouvert
    blocksPanel.classList.remove('active');
    
    // Toggle le menu mode
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    
    
    // Si le menu s'ouvre, synchroniser les boutons
    if (panel.classList.contains('active')) {
        // Mettre à jour l'affichage des boutons mode
        updateMobileModeButtons();
        // D'abord mettre à jour les boutons conditionnels (Copier/Supprimer)
        updateCopyLinkButton();
        // Puis synchroniser les boutons en ligne (Sauvegarder/Charger)
        syncMobileTeacherButtons();
    }
}

function closeMobileMenus() {
    const blocksPanel = document.getElementById('mobile-blocks-panel');
    const modePanel = document.getElementById('mobile-mode-panel');
    const overlay = document.getElementById('mobile-overlay');
    
    blocksPanel.classList.remove('active');
    modePanel.classList.remove('active');
    overlay.classList.remove('active');
}

function closeMobileMenu() {
    const panel = document.getElementById('mobile-blocks-panel');
    const overlay = document.getElementById('mobile-overlay');
    
    panel.classList.remove('active');
    
    // Ne fermer l'overlay que si le mode panel est aussi fermé
    const modePanel = document.getElementById('mobile-mode-panel');
    if (!modePanel.classList.contains('active')) {
        overlay.classList.remove('active');
    }
}

function switchModeAndClose(mode) {
    // Utiliser la fonction switchMode existante
    switchMode(mode);
    
    // Gérer l'affichage des boutons dans le menu mobile
    updateMobileModeButtons();
    
    // Fermer le menu
    closeMobileMenus();
}

function updateMobileModeButtons() {
    const mobileTeacherButtons = document.getElementById('mobile-teacher-buttons');
    const mobileStudentModeBtn = document.getElementById('mobile-student-mode-btn');
    const mobileTeacherModeBtn = document.getElementById('mobile-teacher-mode-btn');
    
    // Si on est en mode chargement élève (lien prof), cacher les boutons de mode
    if (window.isStudentLoadMode) {
        
        // Cacher les boutons de mode avec !important
        if (mobileStudentModeBtn) {
            mobileStudentModeBtn.style.setProperty('display', 'none', 'important');
        }
        if (mobileTeacherModeBtn) {
            mobileTeacherModeBtn.style.setProperty('display', 'none', 'important');
        }
        
        // Cacher les boutons professeur
        if (mobileTeacherButtons) {
            mobileTeacherButtons.style.setProperty('display', 'none', 'important');
        }
        
        // Afficher les boutons ÉLÈVE (sauvegarde/chargement avec code)
        const mobileStudentButtons = document.getElementById('mobile-student-buttons');
        if (mobileStudentButtons) {
            mobileStudentButtons.style.setProperty('display', 'block', 'important');
        }
        
        return; // Ne pas continuer
    }
    
    if (currentMode === 'teacher') {
        // Mode professeur / création de niveaux
        if (mobileTeacherButtons) mobileTeacherButtons.style.display = 'block';
        
        // GÉRER LA VISIBILITÉ : afficher "Aperçu mode élève", cacher "Création de niveaux"
        if (mobileStudentModeBtn) {
            mobileStudentModeBtn.style.display = 'block';
            mobileStudentModeBtn.classList.remove('active');
            mobileStudentModeBtn.style.background = '';
            mobileStudentModeBtn.style.color = '#2196F3';
        }
        if (mobileTeacherModeBtn) {
            mobileTeacherModeBtn.style.display = 'none'; // CACHER en mode professeur
        }
        
        // Synchroniser tous les boutons avec les versions PC
        syncMobileTeacherButtons();
    } else {
        // Mode élève / aperçu
        if (mobileTeacherButtons) mobileTeacherButtons.style.display = 'none';
        
        // GÉRER LA VISIBILITÉ : cacher "Aperçu mode élève", afficher "Création de niveaux"
        if (mobileStudentModeBtn) {
            mobileStudentModeBtn.style.display = 'none'; // CACHER en mode élève
        }
        if (mobileTeacherModeBtn) {
            mobileTeacherModeBtn.style.display = 'block';
            mobileTeacherModeBtn.classList.remove('active');
            mobileTeacherModeBtn.style.background = '';
            mobileTeacherModeBtn.style.color = '#2196F3';
        }
    }
}

function syncMobileTeacherButtons() {
    // En mode chargement élève, ne pas synchroniser (les boutons mobiles sont gérés manuellement)
    if (window.isStudentLoadMode) {
        return;
    }
    
    // Synchroniser UNIQUEMENT les boutons Sauvegarder/Charger en ligne
    // Les boutons Copier/Supprimer sont gérés par updateCopyLinkButton()
    const pcSaveOnlineBtn = document.getElementById('save-online-btn');
    const pcLoadLevelsBtn = document.getElementById('load-levels-btn');
    
    const mobileSaveOnlineBtn = document.getElementById('mobile-save-online-btn');
    const mobileLoadLevelsBtn = document.getElementById('mobile-load-levels-btn');
    
    // Sauvegarder en ligne (convertir inline-block en block pour mobile)
    if (mobileSaveOnlineBtn && pcSaveOnlineBtn) {
        const pcDisplay = pcSaveOnlineBtn.style.display;
        mobileSaveOnlineBtn.style.display = (pcDisplay === 'inline-block' || pcDisplay === 'block') ? 'block' : 'none';
    }
    
    // Charger niveaux en ligne (convertir inline-block en block pour mobile)
    if (mobileLoadLevelsBtn && pcLoadLevelsBtn) {
        const pcDisplay = pcLoadLevelsBtn.style.display;
        mobileLoadLevelsBtn.style.display = (pcDisplay === 'inline-block' || pcDisplay === 'block') ? 'block' : 'none';
    }
}

function saveLevelBeforeOnlineMobile() {
    // Appeler la fonction PC
    saveLevelBeforeOnline();
    // Fermer le menu après
    closeMobileMenus();
}

function openLoadOnlineModalMobile() {
    // Appeler la fonction PC
    openLoadOnlineModal();
    // Le menu se ferme automatiquement (modal ouverte)
}

// === FONCTIONS WRAPPER POUR BOUTONS ÉLÈVE MOBILE ===
function generateStudentCodeMobile() {
    // Appeler la fonction PC
    generateStudentCode();
    // Le menu reste ouvert (modal de code affichée)
}

function openLoadProgressModalMobile() {
    // Appeler la fonction PC
    openLoadProgressModal();
    // Le menu reste ouvert (modal de chargement affichée)
}

function copyStudentLinkMobile() {
    // Appeler la fonction PC
    copyStudentLink();
    // Fermer le menu après
    closeMobileMenus();
}

function openDeleteOnlineModalMobile() {
    // Appeler la fonction PC
    openDeleteOnlineModal();
    // Le menu se ferme automatiquement (modal ouverte)
}

function generateTeacherCodeMobile() {
    // En mode professeur, la sauvegarde locale = sauvegarder les niveaux créés
    generateStudentCode(); // Réutilise la même fonction
    // Fermer le menu après
    closeMobileMenus();
}

function openLoadTeacherProgressModalMobile() {
    // En mode professeur, charger = charger les niveaux créés
    openLoadProgressModal(); // Réutilise la même fonction
    // Le menu se ferme automatiquement car on ouvre une modal
}

function populateMobileBlocks() {
    const container = document.getElementById('mobile-blocks-list');
    if (!container) {
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Récupérer toutes les catégories de blocs
    const categories = document.querySelectorAll('.blocks-palette .blocks-category');
    
    if (categories.length === 0) {
        return;
    }
    
    
    let isFirstCategory = true;
    
    categories.forEach((category) => {
        // Créer le header de catégorie
        const categoryHeader = category.querySelector('.category-header');
        if (categoryHeader) {
            const headerClone = document.createElement('div');
            headerClone.className = 'mobile-category-header';
            headerClone.innerHTML = categoryHeader.innerHTML;
            
            // Style différent pour la première catégorie
            if (isFirstCategory) {
                headerClone.style.cssText = `
                    font-size: 14px;
                    font-weight: bold;
                    padding: 10px;
                    margin: 5px 0 8px 65px;
                    background: #f0f0f0;
                    border-radius: 6px;
                    color: #333;
                `;
                isFirstCategory = false;
            } else {
                headerClone.style.cssText = `
                    font-size: 14px;
                    font-weight: bold;
                    padding: 10px;
                    margin: 15px 0 8px 0;
                    background: #f0f0f0;
                    border-radius: 6px;
                    color: #333;
                `;
            }
            container.appendChild(headerClone);
        }
        
        // Récupérer les blocs de cette catégorie
        const categoryBlocks = category.querySelector('.category-blocks');
        
        // SPECIAL : Section Variables
        const isVariableSection = categoryHeader && categoryHeader.textContent.includes('Variables');
        
        if (isVariableSection) {
            
            // Ajouter le bouton "+ Créer une variable"
            const varButton = categoryBlocks.querySelector('button[onclick*="createNewVariable"]');
            if (varButton) {
                const mobileVarButton = varButton.cloneNode(true);
                mobileVarButton.style.cssText = `
                    width: 100%;
                    margin: 0 0 12px 0;
                    min-height: 44px;
                    font-size: 14px;
                    padding: 10px;
                    background: #FF8C1A;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                `;
                container.appendChild(mobileVarButton);
            }
            
            // Vérifier si le div #variable-blocks est visible
            const variableBlocksDiv = categoryBlocks.querySelector('#variable-blocks');
            
            if (variableBlocksDiv) {
                const computedStyle = window.getComputedStyle(variableBlocksDiv);
                const displayValue = computedStyle.display;
                
                const isVisible = displayValue !== 'none';
                
                // Si pas visible OU aucune variable créée, NE PAS afficher les blocs
                if (!isVisible || createdVariables.length === 0) {
                    return; // Sortir de CE forEach, passer à la catégorie suivante
                }
                
                
                // Sinon, récupérer les blocs DANS #variable-blocks
                const varBlocks = variableBlocksDiv.querySelectorAll('.block');
                
                varBlocks.forEach((block) => {
                    const mobileBlock = block.cloneNode(true);
                    
                    mobileBlock.style.minHeight = '44px';
                    mobileBlock.style.fontSize = '14px';
                    mobileBlock.style.padding = '10px';
                    mobileBlock.style.marginBottom = '8px';
                    mobileBlock.style.cursor = 'grab';
                    mobileBlock.draggable = true;
                    
                    if (block.dataset) {
                        Object.keys(block.dataset).forEach(key => {
                            mobileBlock.dataset[key] = block.dataset[key];
                        });
                    }
                    
                    // Mettre à jour les selects de variables avec la dernière variable créée
                    if (createdVariables.length > 0) {
                        const varSelects = mobileBlock.querySelectorAll('.var-select');
                        varSelects.forEach(select => {
                            // Vider et remplir avec toutes les variables
                            select.innerHTML = '';
                            createdVariables.forEach(varName => {
                                const option = document.createElement('option');
                                option.value = varName;
                                option.textContent = varName;
                                select.appendChild(option);
                            });
                            // Sélectionner la dernière variable créée
                            const lastVar = createdVariables[createdVariables.length - 1];
                            select.value = lastVar;
                        });
                    }
                    
                    // Convertir input number en text DANS LE HTML
                    if (window.innerWidth <= 768) {
                        // Remplacer dans le HTML directement
                        mobileBlock.innerHTML = mobileBlock.innerHTML.replace(/type="number"/g, 'type="text" inputmode="numeric" pattern="[0-9]*"');
                        
                        // Augmenter la taille des inputs ET forcer sans spinner
                        const allInputs = mobileBlock.querySelectorAll('input');
                        allInputs.forEach(input => {
                            input.style.fontSize = '16px';
                            input.style.padding = '8px';
                            input.style.minWidth = '60px';
                            input.style.minHeight = '40px';
                            input.style.webkitAppearance = 'none';
                            input.style.mozAppearance = 'textfield';
                            input.style.appearance = 'none';
                        });
                    }
                    
                    mobileBlock.ondragstart = function(e) {
                        drag(e);
                        setTimeout(() => closeMobileMenu(), 100);
                    };
                    
                    container.appendChild(mobileBlock);
                });
            }
            return; // On a traité la section Variables, passer à la suivante
        }
        
        // Pour les autres sections, récupérer les blocs normalement
        const blocks = categoryBlocks.querySelectorAll('.block:not(#variable-blocks .block), .value-block, .operator-block');
        
        blocks.forEach((block) => {
            // Créer un clone EXACT du bloc
            const mobileBlock = block.cloneNode(true);
            
            // Style réduit et espacé
            mobileBlock.style.minHeight = '44px';
            mobileBlock.style.fontSize = '14px';
            mobileBlock.style.padding = '10px';
            mobileBlock.style.marginBottom = '8px';
            mobileBlock.style.cursor = 'grab';
            mobileBlock.draggable = true;
            
            // Copier TOUS les attributs data-
            if (block.dataset) {
                Object.keys(block.dataset).forEach(key => {
                    mobileBlock.dataset[key] = block.dataset[key];
                });
            }
            
            // Sur mobile : remplacer input type="number" par type="text" DANS LE HTML
            if (window.innerWidth <= 768) {
                // Remplacer dans le HTML directement
                mobileBlock.innerHTML = mobileBlock.innerHTML.replace(/type="number"/g, 'type="text" inputmode="numeric" pattern="[0-9]*"');
                
                // Augmenter la taille des inputs ET forcer sans spinner
                const allInputs = mobileBlock.querySelectorAll('input');
                allInputs.forEach(input => {
                    input.style.fontSize = '16px';
                    input.style.padding = '8px';
                    input.style.minWidth = '60px';
                    input.style.minHeight = '40px';
                    input.style.webkitAppearance = 'none';
                    input.style.mozAppearance = 'textfield';
                    input.style.appearance = 'none';
                });
            }
            
            // Handler drag desktop
            mobileBlock.ondragstart = function(e) {
                drag(e);
                setTimeout(() => closeMobileMenu(), 100);
            };
            
            container.appendChild(mobileBlock);
        });
    });
    
    // Initialiser le drag tactile
    initMobileTouchDrag();
    
}

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.initMobileTouchDrag = initMobileTouchDrag;
    window.handleTouchStart = handleTouchStart;
    window.createGhostBlock = createGhostBlock;
    window.handleTouchMove = handleTouchMove;
    window.handleTouchEnd = handleTouchEnd;
    window.handleDropInValueSlot = handleDropInValueSlot;
    window.addBlockToProgramFromTouch = addBlockToProgramFromTouch;
    window.setupNestedBlocksTouchDrag = setupNestedBlocksTouchDrag;
    window.cleanupTouchDrag = cleanupTouchDrag;
    window.handleProgramBlockTouchStart = handleProgramBlockTouchStart;
    window.handleProgramBlockTouchMove = handleProgramBlockTouchMove;
    window.handleProgramBlockTouchEnd = handleProgramBlockTouchEnd;
    window.initProgramBlocksDrag = initProgramBlocksDrag;
    window.initSingleBlockDrag = initSingleBlockDrag;
    window.toggleMobileMenu = toggleMobileMenu;
    window.toggleMobileMode = toggleMobileMode;
    window.closeMobileMenus = closeMobileMenus;
    window.closeMobileMenu = closeMobileMenu;
    window.switchModeAndClose = switchModeAndClose;
    window.updateMobileModeButtons = updateMobileModeButtons;
    window.syncMobileTeacherButtons = syncMobileTeacherButtons;
    window.saveLevelBeforeOnlineMobile = saveLevelBeforeOnlineMobile;
    window.openLoadOnlineModalMobile = openLoadOnlineModalMobile;
    window.generateStudentCodeMobile = generateStudentCodeMobile;
    window.openLoadProgressModalMobile = openLoadProgressModalMobile;
    window.copyStudentLinkMobile = copyStudentLinkMobile;
    window.openDeleteOnlineModalMobile = openDeleteOnlineModalMobile;
    window.generateTeacherCodeMobile = generateTeacherCodeMobile;
    window.openLoadTeacherProgressModalMobile = openLoadTeacherProgressModalMobile;
    window.populateMobileBlocks = populateMobileBlocks;
    
    
})();
