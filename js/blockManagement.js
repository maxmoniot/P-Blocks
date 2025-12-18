// ============================================
// MODULE: BLOCK MANAGEMENT
// Description: Gestion des blocs de programmation (ajout, imbrication, extraction)
// Dépendances ENTRANTES (doivent exister dans app-new.js ou modules):
//   - Variables globales: currentMode
//   - Fonctions: setupNumericInputValidation(), validateNumericInput()
//                saveStudentProgram(), updateBlockCount()
// Fonctions EXPORTÉES (vers window):
//   - addBlockToProgram(), addNestedBlock()
//   - extractBlockData(), countTotalBlocks()
//   - setupNestedAreaDrop()
// ============================================

(function() {
    'use strict';
    
    // Gestion du scroll pendant le drag (mobile)
    let isDraggingBlock = false;
    
    function disableBodyScroll() {
        if (window.innerWidth <= 768) {
            isDraggingBlock = true;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
    }
    
    function enableBodyScroll() {
        if (isDraggingBlock) {
            isDraggingBlock = false;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
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

function addBlockToProgram(blockData) {
    const programArea = document.getElementById('program-blocks');
    const blockElement = document.createElement('div');
    blockElement.className = 'program-block';
    
    // Si c'est un bloc "répéter" ou "si", créer une capsule
    if (blockData.type === 'repeat' || blockData.type === 'if') {
        blockElement.classList.add('block-capsule');
        blockElement.innerHTML = blockData.html;
        
        const block = blockElement.querySelector('.block');
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        
        // Restaurer les valeurs des select
        if (blockData.selectValues && blockData.selectValues.length > 0) {
            const selects = block.querySelectorAll('select');
            selects.forEach((select, index) => {
                if (blockData.selectValues[index]) {
                    select.value = blockData.selectValues[index];
                }
            });
        }
        
        // Restaurer les valeurs des inputs
        if (blockData.inputValues && blockData.inputValues.length > 0) {
            const inputs = block.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach((input, index) => {
                if (blockData.inputValues[index] !== undefined) {
                    input.value = blockData.inputValues[index];
                }
            });
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            removeBlockAndSave(blockElement);
        };
        block.appendChild(removeBtn);
        
        // Ajouter zone pour les blocs imbriqués
        const nestedArea = document.createElement('div');
        nestedArea.className = 'nested-blocks empty';
        setupNestedAreaDrop(nestedArea);
        blockElement.appendChild(nestedArea);
        
        // Ajouter le bas de la capsule
        const capsuleBottom = document.createElement('div');
        capsuleBottom.className = 'block-capsule-bottom';
        capsuleBottom.style.background = getComputedStyle(block).background;
        blockElement.appendChild(capsuleBottom);
    } else {
        blockElement.innerHTML = blockData.html;
        
        const block = blockElement.querySelector('.block');
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        
        // Restaurer les valeurs des select
        if (blockData.selectValues && blockData.selectValues.length > 0) {
            const selects = block.querySelectorAll('select');
            selects.forEach((select, index) => {
                if (blockData.selectValues[index]) {
                    select.value = blockData.selectValues[index];
                }
            });
        }
        
        // Restaurer les valeurs des inputs
        if (blockData.inputValues && blockData.inputValues.length > 0) {
            const inputs = block.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach((input, index) => {
                if (blockData.inputValues[index] !== undefined) {
                    input.value = blockData.inputValues[index];
                }
            });
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            removeBlockAndSave(blockElement);
        };
        block.appendChild(removeBtn);
    }
    
    // IMPORTANT: Initialiser la validation des inputs numériques
    setupNumericInputValidation(blockElement);
    
    // Ajouter des listeners pour sauvegarder automatiquement quand les valeurs changent
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
    
    // Rendre le bloc déplaçable dans la zone de programmation
    blockElement.draggable = true;
    blockElement.ondragstart = function(e) {
        e.stopPropagation();
        blockElement.classList.add('dragging');
        disableBodyScroll(); // Bloquer le scroll pendant le drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', blockElement.innerHTML);
        e.dataTransfer.setData('blockIndex', Array.from(programArea.children).indexOf(blockElement));
    };
    
    blockElement.ondragend = function() {
        blockElement.classList.remove('dragging');
        enableBodyScroll(); // Réactiver le scroll après le drag
        document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over');
        });
    };
    
    blockElement.ondragover = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const dragging = document.querySelector('.dragging');
        
        // Afficher l'indicateur pour les blocs existants OU pour les nouveaux blocs depuis la palette
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
        
        if (dragging && dragging !== blockElement) {
            // C'est un bloc existant qu'on déplace
            const rect = blockElement.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                programArea.insertBefore(dragging, blockElement);
            } else {
                programArea.insertBefore(dragging, blockElement.nextSibling);
            }
        } else if (!dragging) {
            // C'est un nouveau bloc depuis la palette
            const dataText = e.dataTransfer.getData('text');
            if (!dataText) return;
            
            let data;
            try {
                data = JSON.parse(dataText);
            } catch (err) {
                return;
            }
            
            // Empêcher le dépôt des blocs opérateurs et var-value
            if (data.type === 'operator' || data.type === 'var-value') {
                return;
            }
            
            // Créer le nouveau bloc
            addBlockToProgram(data);
            const newBlock = programArea.lastElementChild;
            
            // Insérer à la bonne position
            const rect = blockElement.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                programArea.insertBefore(newBlock, blockElement);
            } else {
                programArea.insertBefore(newBlock, blockElement.nextSibling);
            }
        }
        
        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    };
    
    programArea.appendChild(blockElement);
    updateBlockCount();
    
    // Adapter les blocs à la taille d'écran
    if (typeof adaptBlocksToScreenSize === 'function') {
        adaptBlocksToScreenSize();
    }
    
    // Initialiser le drag tactile pour ce bloc (support mobile)
    if (typeof initSingleBlockDrag === 'function') {
        initSingleBlockDrag(blockElement);
    }
    
    // Sauvegarder le programme de l'élève (si mode élève)
    if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
        const levelNum = document.getElementById('level-select').value;
        if (levelNum && currentCursus) {
            saveStudentProgram(currentCursus, levelNum);
        }
    }
}

function addNestedBlock(blockData, parentArea) {
    const blockElement = document.createElement('div');
    blockElement.className = 'program-block';
    
    // Si c'est un bloc "répéter" ou "si", créer une capsule même pour les blocs imbriqués
    if (blockData.type === 'repeat' || blockData.type === 'if') {
        blockElement.classList.add('block-capsule');
        blockElement.innerHTML = blockData.html;
        
        const block = blockElement.querySelector('.block');
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        
        // Restaurer les valeurs des select
        if (blockData.selectValues && blockData.selectValues.length > 0) {
            const selects = block.querySelectorAll('select');
            selects.forEach((select, index) => {
                if (blockData.selectValues[index]) {
                    select.value = blockData.selectValues[index];
                }
            });
        }
        
        // Restaurer les valeurs des inputs
        if (blockData.inputValues && blockData.inputValues.length > 0) {
            const inputs = block.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach((input, index) => {
                if (blockData.inputValues[index] !== undefined) {
                    input.value = blockData.inputValues[index];
                }
            });
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            removeNestedBlockAndSave(blockElement, parentArea);
        };
        block.appendChild(removeBtn);
        
        // Ajouter zone pour les blocs doublement imbriqués
        const nestedArea = document.createElement('div');
        nestedArea.className = 'nested-blocks empty';
        setupNestedAreaDrop(nestedArea);
        blockElement.appendChild(nestedArea);
        
        // Ajouter le bas de la capsule
        const capsuleBottom = document.createElement('div');
        capsuleBottom.className = 'block-capsule-bottom';
        capsuleBottom.style.background = getComputedStyle(block).background;
        blockElement.appendChild(capsuleBottom);
    } else {
        blockElement.innerHTML = blockData.html;
        
        const block = blockElement.querySelector('.block');
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        
        // Restaurer les valeurs des select
        if (blockData.selectValues && blockData.selectValues.length > 0) {
            const selects = block.querySelectorAll('select');
            selects.forEach((select, index) => {
                if (blockData.selectValues[index]) {
                    select.value = blockData.selectValues[index];
                }
            });
        }
        
        // Restaurer les valeurs des inputs
        if (blockData.inputValues && blockData.inputValues.length > 0) {
            const inputs = block.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach((input, index) => {
                if (blockData.inputValues[index] !== undefined) {
                    input.value = blockData.inputValues[index];
                }
            });
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            removeNestedBlockAndSave(blockElement, parentArea);
        };
        block.appendChild(removeBtn);
    }
    
    // IMPORTANT: Initialiser la validation des inputs numériques
    setupNumericInputValidation(blockElement);
    
    // Ajouter des listeners pour sauvegarder automatiquement quand les valeurs changent
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
    
    // Rendre le bloc déplaçable même s'il est imbriqué
    blockElement.draggable = true;
    blockElement.ondragstart = function(e) {
        e.stopPropagation();
        blockElement.classList.add('dragging');
        disableBodyScroll(); // Bloquer le scroll pendant le drag
        e.dataTransfer.effectAllowed = 'move';
    };
    
    blockElement.ondragend = function() {
        blockElement.classList.remove('dragging');
        enableBodyScroll(); // Réactiver le scroll après le drag
        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    };
    
    blockElement.ondragover = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const dragging = document.querySelector('.dragging');
        if (dragging && dragging !== blockElement) {
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
        if (dragging && dragging !== blockElement) {
            const rect = blockElement.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (e.clientY < midpoint) {
                parentArea.insertBefore(dragging, blockElement);
            } else {
                parentArea.insertBefore(dragging, blockElement.nextSibling);
            }
        }
        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    };
    
    parentArea.appendChild(blockElement);
    updateBlockCount();
    
    // Adapter les blocs à la taille d'écran
    if (typeof adaptBlocksToScreenSize === 'function') {
        adaptBlocksToScreenSize();
    }
    
    // Initialiser le drag tactile pour ce bloc (support mobile)
    if (typeof initSingleBlockDrag === 'function') {
        initSingleBlockDrag(blockElement);
    }
    
    // Sauvegarder le programme de l'élève (si mode élève)
    if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
        const levelNum = document.getElementById('level-select').value;
        if (levelNum && currentCursus) {
            saveStudentProgram(currentCursus, levelNum);
        }
    }
}

// Exécution du programme

// ===== EXÉCUTION DES BLOCS =====
// Ce module a été déplacé vers js/blockExecution.js
// Fonctions: executeProgram(), executeBlocks(), resetTurtle(), moveForward(), etc.


// ========================================
// TEACHER MODE
// ========================================
// Ce module a été déplacé vers js/teacherMode.js
// Fonctions: loadTeacherLevels(), loadTeacherLevel(), saveLevel(), etc.

function extractBlockData(blockElement) {
    const block = blockElement.querySelector('.block');
    const type = block.dataset.type;
    const blockData = { type };
    
    if (type === 'color') {
        blockData.value = block.dataset.value;
    } else if (type === 'repeat') {
        const valueSlot = block.querySelector('.value-slot');
        
        // Vérifier si un bloc variable a été déposé
        const varBlock = valueSlot ? valueSlot.querySelector('.block[data-type="var-value"]') : null;
        if (varBlock) {
            const varSelect = varBlock.querySelector('select');
            blockData.timesVar = varSelect ? varSelect.value : '';
        } else {
            const input = block.querySelector('input[type="number"]');
            blockData.times = input ? parseInt(input.value) : 10;
        }
        
        // Récupérer les blocs imbriqués
        const nestedArea = blockElement.querySelector('.nested-blocks');
        if (nestedArea) {
            const nestedBlocks = nestedArea.querySelectorAll(':scope > .program-block');
            blockData.nested = [];
            nestedBlocks.forEach(nested => {
                blockData.nested.push(extractBlockData(nested));
            });
        }
    } else if (type === 'variable') {
        const varSelect = block.querySelector('.var-select');
        blockData.varName = varSelect ? varSelect.value : '';
        
        // Récupérer la valeur depuis le value-slot
        const valueSlot = block.querySelector('.value-slot');
        if (valueSlot) {
            const varBlock = valueSlot.querySelector('.block[data-type="var-value"]');
            const operatorBlock = valueSlot.querySelector('.block[data-type="operator"]');
            
            if (varBlock) {
                const refVarSelect = varBlock.querySelector('select');
                blockData.varValueVar = refVarSelect ? refVarSelect.value : '';
            } else if (operatorBlock) {
                blockData.varValueOperator = extractBlockData(operatorBlock.parentElement);
            } else {
                const input = valueSlot.querySelector('input[type="number"]');
                blockData.varValue = input ? input.value : '0';
            }
        }
    } else if (type === 'change-var') {
        const varSelect = block.querySelector('select');
        blockData.varName = varSelect ? varSelect.value : '';
        
        // Récupérer la valeur depuis le value-slot
        const valueSlot = block.querySelector('.value-slot');
        if (valueSlot) {
            const varBlock = valueSlot.querySelector('.block[data-type="var-value"]');
            const operatorBlock = valueSlot.querySelector('.block[data-type="operator"]');
            
            if (varBlock) {
                const refVarSelect = varBlock.querySelector('select');
                blockData.changeValueVar = refVarSelect ? refVarSelect.value : '';
            } else if (operatorBlock) {
                blockData.changeValueOperator = extractBlockData(operatorBlock.parentElement);
            } else {
                const input = valueSlot.querySelector('input[type="number"]');
                blockData.changeValue = input ? input.value : '1';
            }
        }
    } else if (type === 'if') {
        const varSelect = block.querySelector('.var-select');
        const compareOp = block.querySelector('.compare-op');
        const valueSlot = block.querySelector('.value-slot');
        const valueInput = valueSlot ? valueSlot.querySelector('input[type="text"]') : null;
        
        blockData.varName = varSelect ? varSelect.value : '';
        blockData.operator = compareOp ? compareOp.value : '=';
        blockData.compareValue = valueInput ? valueInput.value : '';
        
        // Récupérer les blocs imbriqués
        const nestedArea = blockElement.querySelector('.nested-blocks');
        if (nestedArea) {
            const nestedBlocks = nestedArea.querySelectorAll(':scope > .program-block');
            blockData.nested = [];
            nestedBlocks.forEach(nested => {
                blockData.nested.push(extractBlockData(nested));
            });
        }
    } else if (type === 'operator') {
        const valueSlots = block.querySelectorAll('.value-slot');
        const select = block.querySelector('select');
        blockData.op = select ? select.value : block.dataset.op;
        
        // Premier emplacement (a)
        if (valueSlots[0]) {
            const varBlock = valueSlots[0].querySelector('.block[data-type="var-value"]');
            if (varBlock) {
                const varSelect = varBlock.querySelector('select');
                blockData.aVar = varSelect ? varSelect.value : '';
            } else {
                const input = valueSlots[0].querySelector('input[type="text"]');
                blockData.a = input ? input.value : '';
            }
        }
        
        // Deuxième emplacement (b)
        if (valueSlots[1]) {
            const varBlock = valueSlots[1].querySelector('.block[data-type="var-value"]');
            if (varBlock) {
                const varSelect = varBlock.querySelector('select');
                blockData.bVar = varSelect ? varSelect.value : '';
            } else {
                const input = valueSlots[1].querySelector('input[type="text"]');
                blockData.b = input ? input.value : '';
            }
        }
    }
    
    return blockData;
}

function countTotalBlocks(blocks) {
    let count = 0;
    blocks.forEach(block => {
        count++;
        const nestedArea = block.querySelector('.nested-blocks');
        if (nestedArea) {
            const nestedBlocks = nestedArea.querySelectorAll(':scope > .program-block');
            count += countTotalBlocks(nestedBlocks);
        }
    });
    return count;
}

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.setupNestedAreaDrop = setupNestedAreaDrop;
    window.addBlockToProgram = addBlockToProgram;
    window.addNestedBlock = addNestedBlock;
    window.extractBlockData = extractBlockData;
    window.countTotalBlocks = countTotalBlocks;
    
    
})();
