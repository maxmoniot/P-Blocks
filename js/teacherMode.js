// ============================================
// MODULE: TEACHER MODE
// Description: Mode professeur - création et édition de niveaux
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: cursusData, currentCursus, lastLoadedLevel, createdVariables
//   - Fonctions: clearProgram(), clearGrid(), extractBlockData(), getGridState()
//                getPaintedCellsData(), loadPaintedCells(), showResult(), 
//                saveToStorage(), markAsModified(), incrementVersion()
// Fonctions EXPORTÉES (vers window):
//   - loadTeacherLevels(), loadTeacherLevel(), saveLevel()
//   - addOrSaveLevel(), overwriteSelectedLevel()
// ============================================

(function() {
    'use strict';
    
    
// Mode professeur
function loadTeacherLevels() {
    const cursus = document.getElementById('teacher-cursus-select').value;
    const levelSelect = document.getElementById('teacher-level-select');
    
    // IMPORTANT : Désactiver temporairement l'événement onchange
    levelSelect.onchange = null;
    
    levelSelect.innerHTML = '<option value="new">+ Nouveau niveau</option>';
    
    const cursusInfo = cursusData[cursus];
    const levels = cursusInfo.levels || {};
    const levelKeys = Object.keys(levels).sort((a, b) => parseInt(a) - parseInt(b));
    const levelsPerWorld = cursusInfo.levelsPerWorld || 10;
    
    levelKeys.forEach((levelNum) => {
        const level = levels[levelNum];
        const levelIndex = parseInt(levelNum) - 1;
        const worldNum = Math.floor(levelIndex / levelsPerWorld) + 1;
        const levelInWorld = (levelIndex % levelsPerWorld) + 1;
        
        const option = document.createElement('option');
        option.value = levelNum;
        option.textContent = `Monde ${worldNum} - Niveau ${levelInWorld} - Blocs optimaux : ${level.blockCount}`;
        levelSelect.appendChild(option);
    });
    
    // Charger automatiquement le premier niveau s'il existe
    if (levelKeys.length > 0) {
        levelSelect.value = levelKeys[0];
        loadTeacherLevel();
    } else {
        // Aucun niveau : nettoyer l'interface et réinitialiser
        clearProgram();
        clearGrid();
        clearPaintedCells();
        lastLoadedLevel = null;
    }
    
    // Réactiver l'événement onchange
    levelSelect.onchange = saveCurrentAndLoadTeacherLevel;
}

function loadTeacherLevel() {
    const levelNum = document.getElementById('teacher-level-select').value;
    
    // Mémoriser le niveau qu'on charge
    lastLoadedLevel = levelNum;
    
    // Gérer l'état du bouton "Écraser niveau"
    const overwriteBtn = document.getElementById('overwrite-level-btn');
    if (levelNum === 'new') {
        overwriteBtn.disabled = true;
        overwriteBtn.style.opacity = '0.5';
        overwriteBtn.style.cursor = 'not-allowed';
    } else {
        overwriteBtn.disabled = false;
        overwriteBtn.style.opacity = '1';
        overwriteBtn.style.cursor = 'pointer';
    }
    
    clearProgram();
    clearGrid();
    
    if (levelNum === 'new') {
        clearPaintedCells();
        return;
    }
    
    const cursus = document.getElementById('teacher-cursus-select').value;
    const level = cursusData[cursus].levels[levelNum];
    
    if (level) {
        // Restaurer les variables si elles existent
        if (level.variables) {
            createdVariables = [...(level.variables.createdVariables || [])];
            variables = { ...(level.variables.variableValues || {}) };
            updateVariableDisplay();
        } else {
            // Pas de variables sauvegardées, réinitialiser
            createdVariables = [];
            variables = {};
            updateVariableDisplay();
        }
        
        // Charger les blocs sauvegardés
        const programArea = document.getElementById('program-blocks');
        level.blocks.forEach(blockData => {
            loadSavedBlock(blockData, programArea);
        });
        
        // Charger l'état de la grille si disponible
        if (level.gridState) {
            loadGridState(level.gridState);
        }
        
        // Charger les cellules peintes si disponibles
        if (level.paintedCells) {
            loadPaintedCells(level.paintedCells);
        } else {
            clearPaintedCells();
        }
        
        // Exécuter automatiquement le programme pour afficher le motif (pour tous les niveaux)
        setTimeout(() => {
            executeProgram();
            // Adapter les blocs à la taille d'écran
            if (typeof adaptBlocksToScreenSize === 'function') {
                adaptBlocksToScreenSize();
            }
        }, 100);
    }
}

// Variable globale : lastLoadedLevel (déclarée dans app-new.js)

// Écraser le niveau sélectionné avec les modifications actuelles
function overwriteSelectedLevel() {
    const levelNum = document.getElementById('teacher-level-select').value;
    
    if (levelNum === 'new') {
        alert('⚠️ Veuillez d\'abord sélectionner un niveau existant à écraser, ou utilisez le bouton "Ajouter" pour créer un nouveau niveau.');
        return;
    }
    
    const cursus = document.getElementById('teacher-cursus-select').value;
    
    // Récupérer les blocs du programme
    const programBlocks = document.getElementById('program-blocks');
    const blocks = programBlocks.querySelectorAll(':scope > .program-block');
    const savedBlocks = [];
    
    blocks.forEach(block => {
        const blockData = extractBlockData(block);
        savedBlocks.push(blockData);
    });
    
    if (savedBlocks.length === 0) {
        alert('⚠️ Veuillez créer un programme avec des blocs avant d\'écraser le niveau');
        return;
    }
    
    // Sauvegarder l'état de la grille
    const gridState = getGridState();
    
    // Sauvegarder les cellules peintes
    const paintedCellsData = getPaintedCellsData();
    
    const newLevel = {
        blocks: savedBlocks,
        blockCount: countTotalBlocks(blocks),
        gridState: gridState,
        paintedCells: paintedCellsData
    };
    
    // Sauvegarder les variables si elles existent
    if (createdVariables.length > 0) {
        newLevel.variables = {
            createdVariables: [...createdVariables],
            variableValues: { ...variables }
        };
    }
    
    // Écraser le niveau existant
    cursusData[cursus].levels[levelNum] = newLevel;
    
    saveToStorage();
    markAsModified(); // Marquer qu'il y a eu des modifications
    
    // Recharger le niveau pour confirmer les modifications
    // On désactive temporairement onchange pour éviter de recharger deux fois
    const levelSelect = document.getElementById('teacher-level-select');
    levelSelect.onchange = null;
    loadTeacherLevel();
    levelSelect.onchange = saveCurrentAndLoadTeacherLevel;
    
    showResult(`✅ Niveau ${levelNum} écrasé avec succès !`, true);
}

// Charger un niveau SANS sauvegarder automatiquement
function saveCurrentAndLoadTeacherLevel() {
    const levelSelect = document.getElementById('teacher-level-select');
    const newLevel = levelSelect.value;
    
    // NE PLUS sauvegarder automatiquement - l'utilisateur doit cliquer sur "Écraser niveau"
    // Simplement charger le nouveau niveau
    loadTeacherLevel();
}

function loadSavedBlock(blockData, container) {
    // Recréer le HTML du bloc
    let blockHTML = '';
    let blockClass = '';
    
    switch(blockData.type) {
        case 'color':
            blockClass = 'looks';
            // Mapping des couleurs en français
            const colorMap = {
                'red': 'ROUGE',
                'rouge': 'ROUGE',
                'yellow': 'JAUNE',
                'jaune': 'JAUNE',
                'green': 'VERT',
                'vert': 'VERT',
                'blue': 'BLEU',
                'bleu': 'BLEU',
                'pink': 'ROSE',
                'rose': 'ROSE',
                'black': 'NOIR',
                'noir': 'NOIR',
                'white': 'BLANC',
                'blanc': 'BLANC'
            };
            const colorText = colorMap[blockData.value.toLowerCase()] || blockData.value.toUpperCase();
            blockHTML = `<div class="block ${blockClass}" data-type="color" data-value="${blockData.value}">couleur ${colorText}</div>`;
            break;
        case 'forward':
            blockClass = 'motion';
            blockHTML = '<div class="block motion" data-type="forward">avancer</div>';
            break;
        case 'back':
            blockClass = 'motion';
            blockHTML = '<div class="block motion" data-type="back">reculer</div>';
            break;
        case 'right':
            blockClass = 'motion';
            blockHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
            break;
        case 'left':
            blockClass = 'motion';
            blockHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
            break;
        case 'repeat':
            blockClass = 'control';
            if (blockData.timesVar) {
                // Si une variable est utilisée, recréer le bloc avec le bloc variable
                blockHTML = `<div class="block control" data-type="repeat">
                    répéter 
                    <span class="value-slot filled" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                        <div class="block variables inline-block" data-type="var-value">
                            <select onclick="event.stopPropagation()" class="var-select">
                                <option value="">variable</option>
                            </select>
                        </div>
                    </span>
                    fois
                </div>`;
            } else {
                // Sinon, utiliser l'input number
                blockHTML = `<div class="block control" data-type="repeat">
                    répéter 
                    <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                        <input type="number" value="${blockData.times || 10}" min="1" max="100">
                    </span>
                    fois
                </div>`;
            }
            break;
        case 'variable':
            blockClass = 'variables';
            if (blockData.varValueVar) {
                // Si une variable est utilisée pour la valeur
                blockHTML = `<div class="block variables" data-type="variable">
                    mettre <select onclick="event.stopPropagation()" class="var-select"><option value="">nom</option></select> à 
                    <span class="value-slot filled" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                        <div class="block variables inline-block" data-type="var-value">
                            <select onclick="event.stopPropagation()" class="var-select">
                                <option value="">variable</option>
                            </select>
                        </div>
                    </span>
                </div>`;
            } else {
                // Sinon, utiliser l'input number
                blockHTML = `<div class="block variables" data-type="variable">
                    mettre <select onclick="event.stopPropagation()" class="var-select"><option value="">nom</option></select> à 
                    <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                        <input type="number" value="${blockData.varValue || 0}" onclick="event.stopPropagation()">
                    </span>
                </div>`;
            }
            break;
        case 'change-var':
            blockClass = 'variables';
            if (blockData.changeValueVar) {
                // Si une variable est utilisée pour la valeur
                blockHTML = `<div class="block variables" data-type="change-var">
                    ajouter 
                    <span class="value-slot filled" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                        <div class="block variables inline-block" data-type="var-value">
                            <select onclick="event.stopPropagation()" class="var-select">
                                <option value="">variable</option>
                            </select>
                        </div>
                    </span>
                    à <select onclick="event.stopPropagation()" class="var-select"><option value="">nom</option></select>
                </div>`;
            } else {
                // Sinon, utiliser l'input number
                blockHTML = `<div class="block variables" data-type="change-var">
                    ajouter 
                    <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                        <input type="number" value="${blockData.changeValue || 1}" onclick="event.stopPropagation()">
                    </span>
                    à <select onclick="event.stopPropagation()" class="var-select"><option value="">nom</option></select>
                </div>`;
            }
            break;
        case 'if':
            blockClass = 'sensing';
            blockHTML = `<div class="block sensing" data-type="if">
                si 
                <select class="var-select" onclick="event.stopPropagation()">
                    <option value="">variable</option>
                </select>
                <select class="compare-op" onclick="event.stopPropagation()">
                    <option value="<"${blockData.operator === '<' ? ' selected' : ''}>&lt;</option>
                    <option value=">"${blockData.operator === '>' ? ' selected' : ''}>&gt;</option>
                    <option value="="${blockData.operator === '=' ? ' selected' : ''}>=</option>
                    <option value="<="${blockData.operator === '<=' ? ' selected' : ''}>&le;</option>
                    <option value=">="${blockData.operator === '>=' ? ' selected' : ''}>&ge;</option>
                </select>
                <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)">
                    <input type="text" value="${blockData.compareValue || ''}" placeholder="valeur" onclick="event.stopPropagation()">
                </span>
                alors
            </div>`;
            break;
    }
    
    const blockElement = document.createElement('div');
    blockElement.className = 'program-block';
    
    if (blockData.type === 'repeat' || blockData.type === 'if') {
        blockElement.classList.add('block-capsule');
        blockElement.innerHTML = blockHTML;
        
        const block = blockElement.querySelector('.block');
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            blockElement.remove();
            updateBlockCount();
        };
        block.appendChild(removeBtn);
        
        // Pour le bloc if, remplir le sélecteur de variables
        if (blockData.type === 'if') {
            const varSelect = block.querySelector('.var-select');
            if (varSelect) {
                // Ajouter toutes les variables disponibles
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === blockData.varName) {
                        option.selected = true;
                    }
                    varSelect.appendChild(option);
                }
            }
        }
        
        // Pour le bloc repeat avec variable, remplir le sélecteur de variables
        if (blockData.type === 'repeat' && blockData.timesVar) {
            const varSelect = block.querySelector('.var-select');
            if (varSelect) {
                // Ajouter toutes les variables disponibles
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === blockData.timesVar) {
                        option.selected = true;
                    }
                    varSelect.appendChild(option);
                }
            }
        }
        
        // Pour le bloc variable, remplir les sélecteurs
        if (blockData.type === 'variable') {
            // Remplir le premier sélecteur (nom de la variable à créer)
            const varSelects = block.querySelectorAll('.var-select');
            if (varSelects[0]) {
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === blockData.varName) {
                        option.selected = true;
                    }
                    varSelects[0].appendChild(option);
                }
            }
            
            // Si une variable est utilisée pour la valeur, remplir le deuxième sélecteur
            if (blockData.varValueVar && varSelects[1]) {
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === blockData.varValueVar) {
                        option.selected = true;
                    }
                    varSelects[1].appendChild(option);
                }
            }
        }
        
        // Pour le bloc change-var, remplir les sélecteurs
        if (blockData.type === 'change-var') {
            const varSelects = block.querySelectorAll('.var-select');
            
            // Si une variable est utilisée pour la valeur de changement, remplir le premier sélecteur
            if (blockData.changeValueVar && varSelects[0]) {
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === blockData.changeValueVar) {
                        option.selected = true;
                    }
                    varSelects[0].appendChild(option);
                }
            }
            
            // Remplir le dernier sélecteur (nom de la variable à modifier)
            const lastSelect = varSelects[varSelects.length - 1];
            if (lastSelect) {
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === blockData.varName) {
                        option.selected = true;
                    }
                    lastSelect.appendChild(option);
                }
            }
        }
        
        // Ajouter zone pour les blocs imbriqués
        const nestedArea = document.createElement('div');
        nestedArea.className = 'nested-blocks';
        if (!blockData.nested || blockData.nested.length === 0) {
            nestedArea.classList.add('empty');
        }
        nestedArea.ondrop = function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            const dataText = e.dataTransfer.getData('text');
            if (!dataText) return;
            
            let nestedData;
            try {
                nestedData = JSON.parse(dataText);
            } catch (err) {
                return;
            }
            
            addNestedBlock(nestedData, nestedArea);
            nestedArea.classList.remove('empty');
        };
        nestedArea.ondragover = function(e) { 
            e.preventDefault(); 
            e.stopPropagation();
        };
        blockElement.appendChild(nestedArea);
        
        // Charger les blocs imbriqués
        if (blockData.nested && blockData.nested.length > 0) {
            blockData.nested.forEach(nested => {
                loadSavedBlock(nested, nestedArea);
            });
        }
        
        // Ajouter le bas de la capsule
        const capsuleBottom = document.createElement('div');
        capsuleBottom.className = 'block-capsule-bottom';
        capsuleBottom.style.background = getComputedStyle(block).background;
        blockElement.appendChild(capsuleBottom);
    } else {
        blockElement.innerHTML = blockHTML;
        
        const block = blockElement.querySelector('.block');
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            blockElement.remove();
            updateBlockCount();
        };
        block.appendChild(removeBtn);
    }
    
    // Rendre le bloc déplaçable
    blockElement.draggable = true;
    blockElement.ondragstart = function(e) {
        console.log('ondragstart appelé sur bloc rechargé');
        e.stopPropagation();
        blockElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };
    
    blockElement.ondragend = function() {
        blockElement.classList.remove('dragging');
        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    };
    
    container.appendChild(blockElement);
    
    // Initialiser le drag tactile pour ce bloc (support mobile)
    if (typeof initSingleBlockDrag === 'function') {
        initSingleBlockDrag(blockElement);
    }
    
    // NETTOYER les styles inline qui peuvent persister depuis mobile
    const innerBlocks = blockElement.querySelectorAll('.block');
    innerBlocks.forEach(innerBlock => {
        innerBlock.style.removeProperty('min-height');
        innerBlock.style.removeProperty('font-size');
        innerBlock.style.removeProperty('padding');
    });
    
    // IMPORTANT: Peupler tous les selects de variables avec createdVariables
    const varSelects = blockElement.querySelectorAll('.var-select, select.var-select');
    varSelects.forEach(select => {
        // Sauvegarder la valeur à sélectionner
        let valueToSelect = select.value || select.getAttribute('data-value');
        
        // Si c'est dans un repeat et qu'on a timesVar
        const parentBlock = select.closest('.block[data-type="repeat"]');
        if (parentBlock && blockData.type === 'repeat' && blockData.timesVar) {
            valueToSelect = blockData.timesVar;
        }
        
        // Si c'est dans un variable et qu'on a varName
        const varBlock = select.closest('.block[data-type="variable"]');
        if (varBlock && blockData.type === 'variable' && blockData.varName) {
            // C'est le premier select (nom de la variable)
            if (select.classList.contains('var-select') && !select.closest('.value-slot')) {
                valueToSelect = blockData.varName;
            }
            // C'est le second select (valeur variable)
            else if (blockData.varValueVar) {
                valueToSelect = blockData.varValueVar;
            }
        }
        
        // Si c'est dans un change-var
        const changeVarBlock = select.closest('.block[data-type="change-var"]');
        if (changeVarBlock && blockData.type === 'change-var') {
            if (blockData.varName && !select.closest('.value-slot')) {
                valueToSelect = blockData.varName;
            } else if (blockData.changeValueVar) {
                valueToSelect = blockData.changeValueVar;
            }
        }
        
        // Si c'est dans un if
        const ifBlock = select.closest('.block[data-type="if"]');
        if (ifBlock && blockData.type === 'if' && blockData.varName) {
            if (select.classList.contains('var-select')) {
                valueToSelect = blockData.varName;
            }
        }
        
        // Peupler le select avec les variables disponibles
        select.innerHTML = '<option value="">choisir...</option>';
        createdVariables.forEach(varName => {
            const option = document.createElement('option');
            option.value = varName;
            option.textContent = varName;
            if (varName === valueToSelect) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Si aucune variable ne correspond, ajouter une option pour la valeur
        if (valueToSelect && !createdVariables.includes(valueToSelect)) {
            const option = document.createElement('option');
            option.value = valueToSelect;
            option.textContent = valueToSelect;
            option.selected = true;
            select.appendChild(option);
        }
    });
}

function loadGridState(gridState) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gridState[y] && gridState[y][x]) {
                paintCell(x, y, gridState[y][x]);
            }
        }
    }
}

async function deleteLevel() {
    const levelNum = document.getElementById('teacher-level-select').value;
    if (levelNum === 'new') {
        alert('Aucun niveau sélectionné à supprimer');
        return;
    }
    
    const cursus = document.getElementById('teacher-cursus-select').value;
    const level = cursusData[cursus].levels[levelNum];
    
    if (!level) {
        alert('Niveau introuvable');
        return;
    }
    
    // Afficher la popup de confirmation personnalisée
    const confirmed = await customConfirm(`⚠️ Supprimer le niveau ${levelNum} ?\n\nCette action est irréversible.`);
    
    if (confirmed) {
        // Supprimer le niveau
        delete cursusData[cursus].levels[levelNum];
        
        // INCRÉMENTER LA VERSION du cursus modifié AVANT de sauvegarder
        incrementVersion(cursus);
        
        // Sauvegarder
        saveToStorage();
        
        markAsModified(); // Marquer qu'il y a eu des modifications
        
        // Recharger l'interface
        loadTeacherLevels();
        
        alert('✅ Niveau supprimé !');
    }
}

function addOrSaveLevel() {
    // TOUJOURS ajouter un nouveau niveau (ignorer le niveau sélectionné)
    const cursus = document.getElementById('teacher-cursus-select').value;
    
    // Vérifier le nombre total de niveaux dans TOUS les cursus
    let totalLevels = 0;
    for (let cursusName in cursusData) {
        totalLevels += Object.keys(cursusData[cursusName].levels).length;
    }
    
    if (totalLevels >= MAX_TOTAL_LEVELS) {
        alert('❌ Limite atteinte : vous avez déjà ${MAX_TOTAL_LEVELS} niveaux au total (tous cursus confondus). Impossible d\'en ajouter davantage.');
        return;
    }
    
    // Récupérer les blocs du programme
    const programBlocks = document.getElementById('program-blocks');
    const blocks = programBlocks.querySelectorAll(':scope > .program-block');
    const savedBlocks = [];
    
    blocks.forEach(block => {
        const blockData = extractBlockData(block);
        savedBlocks.push(blockData);
    });
    
    if (savedBlocks.length === 0) {
        alert('Veuillez créer un programme avec des blocs avant d\'ajouter');
        return;
    }
    
    // Sauvegarder l'état de la grille
    const gridState = getGridState();
    
    // Sauvegarder les cellules peintes
    const paintedCellsData = getPaintedCellsData();
    
    const newLevel = {
        blocks: savedBlocks,
        blockCount: countTotalBlocks(blocks),
        gridState: gridState,
        paintedCells: paintedCellsData
    };
    
    // Calculer le nombre total de niveaux possibles selon la configuration
    const levelsPerWorld = cursusData[cursus].levelsPerWorld || 10;
    const numWorlds = cursusData[cursus].worlds || 1;
    const totalPossibleLevels = numWorlds * levelsPerWorld;
    
    // Obtenir les niveaux existants triés
    const existingLevels = Object.keys(cursusData[cursus].levels).map(n => parseInt(n)).sort((a, b) => a - b);
    
    let nextLevelNum = 1;
    
    // Chercher le premier trou dans TOUS les niveaux possibles
    for (let i = 1; i <= totalPossibleLevels; i++) {
        if (!existingLevels.includes(i)) {
            // Trou trouvé !
            nextLevelNum = i;
            break;
        }
    }
    
    // Si tous les niveaux sont remplis, ajouter après le dernier
    if (existingLevels.includes(nextLevelNum) || nextLevelNum > totalPossibleLevels) {
        if (existingLevels.length > 0) {
            nextLevelNum = Math.max(...existingLevels) + 1;
        } else {
            nextLevelNum = 1;
        }
    }
    
    // Sauvegarder les variables si elles existent
    if (createdVariables.length > 0) {
        newLevel.variables = {
            createdVariables: [...createdVariables],
            variableValues: { ...variables }
        };
    }
    
    cursusData[cursus].levels[nextLevelNum.toString()] = newLevel;
    
    // Calculer le nombre de mondes nécessaires
    const requiredWorlds = Math.ceil(nextLevelNum / levelsPerWorld);
    
    // Mettre à jour le nombre de mondes si nécessaire
    if (!cursusData[cursus].worlds || cursusData[cursus].worlds < requiredWorlds) {
        cursusData[cursus].worlds = requiredWorlds;
        
        // Ajuster aussi pointsPerWorld
        if (!cursusData[cursus].pointsPerWorld) {
            cursusData[cursus].pointsPerWorld = [0];
        }
        while (cursusData[cursus].pointsPerWorld.length < requiredWorlds) {
            cursusData[cursus].pointsPerWorld.push(0);
        }
    }
    
    // INCRÉMENTER LA VERSION du cursus modifié AVANT de sauvegarder
    incrementVersion(cursus);
    
    saveToStorage();
    markAsModified(); // Marquer qu'il y a eu des modifications
    loadTeacherLevels();
    
    // Sélectionner le niveau ajouté
    const levelSelect = document.getElementById('teacher-level-select');
    levelSelect.value = nextLevelNum.toString();
    
    // Charger ce niveau
    if (nextLevelNum.toString() !== levelSelect.options[1]?.value) {
        levelSelect.onchange = null;
        loadTeacherLevel();
        levelSelect.onchange = saveCurrentAndLoadTeacherLevel;
    }
    
    const worldNum = Math.floor((nextLevelNum - 1) / levelsPerWorld) + 1;
    const levelInWorld = ((nextLevelNum - 1) % levelsPerWorld) + 1;
    showResult(`✅ Niveau créé : Monde ${worldNum}, Niveau ${levelInWorld} !`, true);
}

function saveLevel() {
    const cursus = document.getElementById('teacher-cursus-select').value;
    
    // Récupérer les blocs du programme
    const programBlocks = document.getElementById('program-blocks');
    const blocks = programBlocks.querySelectorAll(':scope > .program-block');
    const savedBlocks = [];
    
    blocks.forEach(block => {
        const blockData = extractBlockData(block);
        savedBlocks.push(blockData);
    });
    
    if (savedBlocks.length === 0) {
        alert('Veuillez créer un programme avec des blocs avant de sauvegarder');
        return;
    }
    
    // Sauvegarder l'état de la grille
    const gridState = getGridState();
    
    // Sauvegarder les cellules peintes
    const paintedCellsData = getPaintedCellsData();
    
    const newLevel = {
        blocks: savedBlocks,
        blockCount: countTotalBlocks(blocks),
        gridState: gridState,
        paintedCells: paintedCellsData
    };
    
    const levelNum = document.getElementById('teacher-level-select').value;
    let savedLevelNum; // Variable pour stocker le numéro du niveau sauvegardé
    
    if (levelNum === 'new') {
        // Calculer le nombre total de niveaux possibles selon la configuration
        const levelsPerWorld = cursusData[cursus].levelsPerWorld || 10;
        const numWorlds = cursusData[cursus].worlds || 1;
        const totalPossibleLevels = numWorlds * levelsPerWorld;
        
        // Obtenir les niveaux existants triés
        const existingLevels = Object.keys(cursusData[cursus].levels).map(n => parseInt(n)).sort((a, b) => a - b);
        
        let nextLevelNum = 1;
        
        // Chercher le premier trou dans TOUS les niveaux possibles (pas seulement jusqu'au dernier existant)
        for (let i = 1; i <= totalPossibleLevels; i++) {
            if (!existingLevels.includes(i)) {
                // Trou trouvé !
                nextLevelNum = i;
                break;
            }
        }
        
        // Si tous les niveaux sont remplis, ajouter après le dernier
        if (existingLevels.includes(nextLevelNum) || nextLevelNum > totalPossibleLevels) {
            if (existingLevels.length > 0) {
                nextLevelNum = Math.max(...existingLevels) + 1;
            } else {
                nextLevelNum = 1;
            }
        }
        
        // Sauvegarder les variables si elles existent
        if (createdVariables.length > 0) {
            newLevel.variables = {
                createdVariables: [...createdVariables],
                variableValues: { ...variables }
            };
        }
        
        cursusData[cursus].levels[nextLevelNum.toString()] = newLevel;
        savedLevelNum = nextLevelNum.toString(); // Stocker le numéro du nouveau niveau
        
        // Calculer le nombre de mondes nécessaires
        const requiredWorlds = Math.ceil(nextLevelNum / levelsPerWorld);
        
        // Mettre à jour le nombre de mondes si nécessaire
        if (!cursusData[cursus].worlds || cursusData[cursus].worlds < requiredWorlds) {
            cursusData[cursus].worlds = requiredWorlds;
            
            // Ajuster aussi pointsPerWorld
            if (!cursusData[cursus].pointsPerWorld) {
                cursusData[cursus].pointsPerWorld = [0];
            }
            while (cursusData[cursus].pointsPerWorld.length < requiredWorlds) {
                cursusData[cursus].pointsPerWorld.push(0);
            }
        }
        
        const worldNum = Math.floor((nextLevelNum - 1) / levelsPerWorld) + 1;
        const levelInWorld = ((nextLevelNum - 1) % levelsPerWorld) + 1;
        showResult(`✅ Niveau créé : Monde ${worldNum}, Niveau ${levelInWorld} !`, true);
    } else {
        // Sauvegarder les variables si elles existent
        if (createdVariables.length > 0) {
            newLevel.variables = {
                createdVariables: [...createdVariables],
                variableValues: { ...variables }
            };
        }
        
        cursusData[cursus].levels[levelNum] = newLevel;
        savedLevelNum = levelNum; // Stocker le numéro du niveau modifié
        showResult('✅ Niveau modifié avec succès !', true);
    }
    
    // INCRÉMENTER LA VERSION du cursus modifié AVANT de sauvegarder
    incrementVersion(cursus);
    
    saveToStorage();
    
    loadTeacherLevels();
    
    // Resélectionner le niveau qui vient d'être sauvegardé
    const levelSelect = document.getElementById('teacher-level-select');
    levelSelect.value = savedLevelNum;
    
    // Charger explicitement ce niveau (car loadTeacherLevels a déjà chargé le premier)
    if (savedLevelNum !== levelSelect.options[1]?.value) {
        // Désactiver temporairement onchange pour éviter double appel
        levelSelect.onchange = null;
        loadTeacherLevel();
        levelSelect.onchange = saveCurrentAndLoadTeacherLevel;
    }
}


    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.loadTeacherLevels = loadTeacherLevels;
    window.loadTeacherLevel = loadTeacherLevel;
    window.overwriteSelectedLevel = overwriteSelectedLevel;
    window.saveCurrentAndLoadTeacherLevel = saveCurrentAndLoadTeacherLevel;
    window.loadSavedBlock = loadSavedBlock;
    window.loadGridState = loadGridState;
    window.addOrSaveLevel = addOrSaveLevel;
    window.saveLevel = saveLevel;
    
    
})();
