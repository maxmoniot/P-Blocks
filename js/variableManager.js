// ============================================
// MODULE: VARIABLE MANAGER
// Description: Gestion des variables (création, sélecteurs, drop)
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: createdVariables, variables
//   - Fonctions: showResult(), populateMobileBlocks(), setupNumericInputValidation()
// Fonctions EXPORTÉES (vers window):
//   - createNewVariable(), confirmCreateVariable()
//   - updateAllVariableSelectors(), dropVariable(), dropValueOrOperator()
// ============================================

(function() {
    'use strict';
    
    
function createNewVariable() {
    document.getElementById('variable-modal').classList.add('active');
    document.getElementById('variable-name').value = '';
    setTimeout(() => document.getElementById('variable-name').focus(), 100);
}

function closeVariableModal() {
    document.getElementById('variable-modal').classList.remove('active');
}

function confirmCreateVariable() {
    const varName = document.getElementById('variable-name').value;
    if (varName && varName.trim() !== '') {
        const trimmedName = varName.trim();
        if (!createdVariables.includes(trimmedName)) {
            createdVariables.push(trimmedName);
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            
            // Sélectionner automatiquement la nouvelle variable UNIQUEMENT dans les sélecteurs de la palette
            const palette = document.querySelector('.middle-panel');
            if (palette) {
                const paletteSelects = palette.querySelectorAll('.var-select');
                paletteSelects.forEach(select => {
                    select.value = trimmedName;
                });
            }
            
            // Sauvegarder les variables créées pour ce mode APRÈS avoir mis à jour les sélections
            if (typeof saveCreatedVariables === 'function') {
                saveCreatedVariables();
            }
            
            // Recharger le menu mobile sur mobile
            if (window.innerWidth <= 768) {
                populateMobileBlocks();
            }
            
            showResult(`✅ Variable "${trimmedName}" créée avec succès !`, true);
            closeVariableModal();
        } else {
            alert('Cette variable existe déjà !');
        }
    }
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    levelToDelete = null;
}

function confirmDeleteLevel() {
    if (levelToDelete) {
        const { cursus, index } = levelToDelete;
        cursusData[cursus].splice(index, 1);
        saveToStorage();
        loadTeacherLevels();
        clearProgram();
        clearGrid();
        document.getElementById('teacher-consigne').value = '';
        document.getElementById('teacher-level-select').value = 'new';
        showResult('✅ Niveau supprimé avec succès !', true);
        closeDeleteModal();
    }
}

function updateAllVariableSelectors() {
    // Mettre à jour UNIQUEMENT les sélecteurs de variables dans la palette
    const palette = document.querySelector('.middle-panel');
    if (!palette) return;
    
    const paletteSelects = palette.querySelectorAll('.var-select');
    
    paletteSelects.forEach((select, index) => {
        const currentValue = select.value;
        
        // Récupérer la sélection sauvegardée pour ce select
        const blockParent = select.closest('.block');
        let savedSelection = null;
        if (blockParent && window.paletteSelections) {
            const blockType = blockParent.getAttribute('data-type') || blockParent.className;
            savedSelection = window.paletteSelections[`${blockType}_${index}`];
        }
        
        select.innerHTML = '<option value="">choisir...</option>';
        
        createdVariables.forEach(varName => {
            const option = document.createElement('option');
            option.value = varName;
            option.textContent = varName;
            
            // Priorité: 1) valeur actuelle, 2) valeur sauvegardée, 3) rien
            if (varName === currentValue || (savedSelection && varName === savedSelection)) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        // Ajouter un listener pour sauvegarder quand la sélection change
        select.removeEventListener('change', savePaletteSelection); // Éviter les doublons
        select.addEventListener('change', savePaletteSelection);
    });
}

function savePaletteSelection(event) {
    const select = event.target;
    const blockParent = select.closest('.block');
    if (!blockParent) return;
    
    // Récupérer l'index du select dans la palette
    const palette = document.querySelector('.middle-panel');
    if (!palette) return;
    
    const allSelects = palette.querySelectorAll('.var-select');
    const index = Array.from(allSelects).indexOf(select);
    
    const blockType = blockParent.getAttribute('data-type') || blockParent.className;
    
    if (!window.paletteSelections) {
        window.paletteSelections = {};
    }
    
    window.paletteSelections[`${blockType}_${index}`] = select.value;
    
    // Sauvegarder immédiatement
    if (typeof saveCreatedVariables === 'function') {
        saveCreatedVariables();
    }
}

function updateVariableBlocksVisibility() {
    const variableBlocks = document.getElementById('variable-blocks');
    if (variableBlocks) {
        variableBlocks.style.display = createdVariables.length > 0 ? 'block' : 'none';
    }
}

function dropVariable(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    
    const dataText = ev.dataTransfer.getData('text');
    if (!dataText) {
        return; // Pas de données, on sort
    }
    
    let data;
    try {
        data = JSON.parse(dataText);
    } catch (e) {
        return;
    }
    
    // Vérifier que c'est bien un bloc variable
    if (data.type !== 'var-value') {
        return;
    }
    
    const varSlot = ev.currentTarget;
    
    // Créer le bloc variable dans le slot
    varSlot.innerHTML = data.html;
    varSlot.classList.add('filled');
    
    // Retirer les attributs draggable du bloc dans le slot
    const block = varSlot.querySelector('.block');
    if (block) {
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        block.classList.add('inline-block');
        
        // Sauvegarder l'info sur l'input original avant de le remplacer
        const originalInput = varSlot.querySelector('input');
        let inputHTML = '<input type="number" value="0" onclick="event.stopPropagation()">';
        
        if (originalInput) {
            const inputType = originalInput.type;
            const inputValue = originalInput.value;
            const placeholder = originalInput.placeholder;
            
            if (inputType === 'text') {
                inputHTML = `<input type="text" placeholder="${placeholder || 'valeur'}" onclick="event.stopPropagation()">`;
            } else {
                inputHTML = `<input type="number" value="${inputValue || '0'}" onclick="event.stopPropagation()">`;
            }
        }
        
        // Ajouter un bouton de suppression
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function(e) {
            e.stopPropagation();
            // Vider le value-slot et restaurer l'input d'origine
            varSlot.innerHTML = inputHTML;
            varSlot.classList.remove('filled');
        };
        block.appendChild(removeBtn);
        
        // Mettre à jour le select avec les variables créées
        const select = block.querySelector('.var-select');
        if (select) {
            // Récupérer la valeur sélectionnée dans la palette (si elle existe)
            const selectedValue = data.selectValues && data.selectValues.length > 0 ? data.selectValues[0] : '';
            
            select.innerHTML = '<option value="">choisir...</option>';
            createdVariables.forEach(varName => {
                const option = document.createElement('option');
                option.value = varName;
                option.textContent = varName;
                select.appendChild(option);
            });
            
            // Restaurer la valeur qui était sélectionnée dans la palette
            if (selectedValue && createdVariables.includes(selectedValue)) {
                select.value = selectedValue;
            }
        }
    }
}

function dropValueOrOperator(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    
    const dataText = ev.dataTransfer.getData('text');
    if (!dataText) {
        return; // Pas de données, on sort
    }
    
    let data;
    try {
        data = JSON.parse(dataText);
    } catch (e) {
        return;
    }
    
    // Accepter les blocs variable ET opérateur
    if (data.type !== 'var-value' && data.type !== 'operator') {
        return;
    }
    
    const valueSlot = ev.currentTarget;
    
    // Créer le bloc dans le slot
    valueSlot.innerHTML = data.html;
    valueSlot.classList.add('filled');
    
    // Retirer les attributs draggable du bloc dans le slot
    const block = valueSlot.querySelector('.block');
    if (block) {
        block.removeAttribute('draggable');
        block.removeAttribute('ondragstart');
        block.classList.add('inline-block');
        
        // Sauvegarder l'info sur le type d'input original avant de le remplacer
        const originalInput = valueSlot.querySelector('input');
        let inputHTML = '<input type="number" value="0" onclick="event.stopPropagation()">';
        
        if (originalInput) {
            const inputType = originalInput.type;
            const inputValue = originalInput.value;
            const placeholder = originalInput.placeholder;
            
            if (inputType === 'text') {
                inputHTML = `<input type="text" placeholder="${placeholder || 'valeur'}" onclick="event.stopPropagation()">`;
            } else {
                inputHTML = `<input type="number" value="${inputValue || '0'}" onclick="event.stopPropagation()">`;
            }
        }
        
        // Ajouter un bouton de suppression
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function(e) {
            e.stopPropagation();
            // Vider le value-slot et restaurer l'input d'origine
            valueSlot.innerHTML = inputHTML;
            valueSlot.classList.remove('filled');
        };
        block.appendChild(removeBtn);
        
        // Si c'est un bloc variable, mettre à jour le select
        if (data.type === 'var-value') {
            const select = block.querySelector('.var-select');
            if (select) {
                // Récupérer la valeur sélectionnée dans la palette (si elle existe)
                const selectedValue = data.selectValues && data.selectValues.length > 0 ? data.selectValues[0] : '';
                
                select.innerHTML = '<option value="">choisir...</option>';
                createdVariables.forEach(varName => {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    select.appendChild(option);
                });
                
                // Restaurer la valeur qui était sélectionnée dans la palette
                if (selectedValue && createdVariables.includes(selectedValue)) {
                    select.value = selectedValue;
                }
            }
        }
        
        // Si c'est un bloc opérateur, mettre à jour les selects des value-slots internes
        if (data.type === 'operator') {
            const innerValueSlots = block.querySelectorAll('.value-slot');
            innerValueSlots.forEach(slot => {
                // Restaurer les valeurs des selects si nécessaire
                if (data.selectValues) {
                    const selects = slot.querySelectorAll('select');
                    selects.forEach((select, index) => {
                        if (data.selectValues[index]) {
                            select.value = data.selectValues[index];
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


    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.createNewVariable = createNewVariable;
    window.closeVariableModal = closeVariableModal;
    window.confirmCreateVariable = confirmCreateVariable;
    window.closeDeleteModal = closeDeleteModal;
    window.confirmDeleteLevel = confirmDeleteLevel;
    window.updateAllVariableSelectors = updateAllVariableSelectors;
    window.savePaletteSelection = savePaletteSelection;
    window.updateVariableBlocksVisibility = updateVariableBlocksVisibility;
    window.dropVariable = dropVariable;
    window.dropValueOrOperator = dropValueOrOperator;
    
    
})();
