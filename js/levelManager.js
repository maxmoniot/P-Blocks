// ============================================
// MODULE: LEVEL MANAGER
// Description: Gestion des niveaux et mondes (popup de configuration)
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: cursusData, lastLoadedLevel, createdVariables, variables
//   - Fonctions: extractBlockData(), getGridState(), getPaintedCellsData(), countTotalBlocks()
//                loadTeacherLevels(), saveCursusData(), createLevelPreview()
// Fonctions EXPORTÉES (vers window):
//   - openLevelManagerModal(), closeLevelManagerModal()
//   - updateWorldsConfig(), updateLevelsList()
// ============================================

(function() {
    'use strict';
    
    
// ===== GESTION DES NIVEAUX ET MONDES =====
// Variables globales : tempWorldsConfig, tempLevelsData (déclarées dans app-new.js)

function openLevelManagerModal() {
    // IMPORTANT : Sauvegarder le niveau en cours avant d'ouvrir la modal
    if (lastLoadedLevel && lastLoadedLevel !== 'new') {
        const programBlocks = document.getElementById('program-blocks');
        const blocks = programBlocks.querySelectorAll(':scope > .program-block');
        
        if (blocks.length > 0) {
            const cursus = document.getElementById('teacher-cursus-select').value;
            
            const savedBlocks = [];
            blocks.forEach(block => {
                const blockData = extractBlockData(block);
                savedBlocks.push(blockData);
            });
            
            const gridState = getGridState();
            const paintedCellsData = getPaintedCellsData();
            
            const levelData = {
                blocks: savedBlocks,
                blockCount: countTotalBlocks(blocks),
                gridState: gridState,
                paintedCells: paintedCellsData
            };
            
            if (createdVariables.length > 0) {
                levelData.variables = {
                    createdVariables: [...createdVariables],
                    variableValues: { ...variables }
                };
            }
            
            cursusData[cursus].levels[lastLoadedLevel] = levelData;
        }
    }
    
    const modal = document.getElementById('level-manager-modal');
    const cursus = document.getElementById('teacher-cursus-select').value;
    
    // Synchroniser le select de cursus dans la modal
    document.getElementById('modal-cursus-select').value = cursus;
    
    // Charger la configuration actuelle
    if (!cursusData[cursus]) {
        cursusData[cursus] = { worlds: 1, levelsPerWorld: 10, pointsPerWorld: [0], levels: {} };
    }
    
    // Initialiser les variables temporaires
    tempWorldsConfig = {
        worlds: cursusData[cursus].worlds || 1,
        levelsPerWorld: cursusData[cursus].levelsPerWorld || 10,
        pointsPerWorld: [...(cursusData[cursus].pointsPerWorld || [0])]
    };
    
    // Copier les données des niveaux (indexées par position)
    tempLevelsData = {};
    Object.keys(cursusData[cursus].levels || {}).forEach(levelNum => {
        tempLevelsData[levelNum] = { ...cursusData[cursus].levels[levelNum] };
    });
    
    // Afficher la configuration
    document.getElementById('num-worlds').value = tempWorldsConfig.worlds;
    document.getElementById('levels-per-world').value = tempWorldsConfig.levelsPerWorld;
    
    // Générer l'interface (sans sauvegarder, on charge juste)
    updateWorldsConfig(false);
    updateLevelsList();
    
    modal.classList.add('active');
    
    // Ajouter la sélection automatique sur tous les inputs number de la modal
    setTimeout(() => {
        const numberInputs = modal.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.select();
            });
        });
    }, 100);
}

function switchModalCursus() {
    const newCursus = document.getElementById('modal-cursus-select').value;
    const oldCursus = document.getElementById('teacher-cursus-select').value;
    
    // Ne rien faire si on sélectionne le même cursus
    if (oldCursus === newCursus) {
        return;
    }
    
    // Sauvegarder les changements du cursus actuel avant de changer
    
    // Sauvegarder l'ancien cursus
    cursusData[oldCursus].worlds = tempWorldsConfig.worlds;
    cursusData[oldCursus].levelsPerWorld = tempWorldsConfig.levelsPerWorld;
    cursusData[oldCursus].pointsPerWorld = [...tempWorldsConfig.pointsPerWorld];
    cursusData[oldCursus].levels = { ...tempLevelsData };
    saveToStorage();
    
    // Changer le cursus dans le select principal
    document.getElementById('teacher-cursus-select').value = newCursus;
    
    // Charger les données du nouveau cursus
    const cursus = newCursus;
    
    if (!cursusData[cursus]) {
        cursusData[cursus] = { worlds: 1, levelsPerWorld: 10, pointsPerWorld: [0], levels: {} };
    }
    
    // Réinitialiser les variables temporaires avec les données du nouveau cursus
    tempWorldsConfig = {
        worlds: cursusData[cursus].worlds || 1,
        levelsPerWorld: cursusData[cursus].levelsPerWorld || 10,
        pointsPerWorld: [...(cursusData[cursus].pointsPerWorld || [0])]
    };
    
    tempLevelsData = {};
    Object.keys(cursusData[cursus].levels || {}).forEach(levelNum => {
        tempLevelsData[levelNum] = { ...cursusData[cursus].levels[levelNum] };
    });
    
    
    // Afficher la configuration du nouveau cursus
    document.getElementById('num-worlds').value = tempWorldsConfig.worlds;
    document.getElementById('levels-per-world').value = tempWorldsConfig.levelsPerWorld;
    
    // Régénérer l'interface avec les données du nouveau cursus (sans sauvegarder, on charge juste)
    updateWorldsConfig(false);
    updateLevelsList();
    
    // Recharger aussi l'interface principale
    loadTeacherLevels();
}

function updateWorldsConfig(autoSave = true) {
    const numWorlds = parseInt(document.getElementById('num-worlds').value);
    const levelsPerWorld = parseInt(document.getElementById('levels-per-world').value);
    const levelsPerWorldInput = document.getElementById('levels-per-world');
    
    // Sauvegarder les anciennes valeurs AVANT toute modification
    const oldLevelsPerWorld = tempWorldsConfig.levelsPerWorld;
    const oldNumWorlds = tempWorldsConfig.worlds;
    
    // Obtenir les niveaux existants
    const existingLevels = Object.keys(tempLevelsData).map(n => parseInt(n)).sort((a, b) => a - b);
    const maxExistingLevel = existingLevels.length > 0 ? Math.max(...existingLevels) : 0;
    
    
    // VÉRIFICATION 1 : Si on réduit les niveaux par monde ou le nombre de mondes
    if (levelsPerWorld < oldLevelsPerWorld || numWorlds < oldNumWorlds) {
        const newTotalSlots = numWorlds * levelsPerWorld;
        
        
        // Vérifier si on a assez de place pour tous les niveaux existants
        if (existingLevels.length > newTotalSlots) {
            // Pas assez de place, bloquer
            levelsPerWorldInput.style.border = '2px solid #FF0000';
            levelsPerWorldInput.style.background = '#FFE0E0';
            alert(`❌ Impossible de réduire : ${existingLevels.length} niveaux existants mais seulement ${newTotalSlots} emplacements disponibles.\n\nSupprimez d'abord ${existingLevels.length - newTotalSlots} niveau(x) avec la poubelle 🗑️`);
            document.getElementById('levels-per-world').value = oldLevelsPerWorld;
            document.getElementById('num-worlds').value = oldNumWorlds;
            return;
        }
        
        // Assez de place : réorganiser les niveaux pour combler les trous
        if (maxExistingLevel > newTotalSlots) {
            
            // Créer un nouveau mapping : ancien numéro -> nouveau numéro
            const newTempLevelsData = {};
            existingLevels.forEach((oldNum, index) => {
                const newNum = index + 1; // Numérotation consécutive à partir de 1
                newTempLevelsData[newNum.toString()] = tempLevelsData[oldNum.toString()];
            });
            
            // Remplacer tempLevelsData
            tempLevelsData = newTempLevelsData;
            
            alert(`ℹ️ Les niveaux ont été réorganisés pour combler les emplacements vides.`);
        }
        
        // Réinitialiser le style
        levelsPerWorldInput.style.border = '2px solid #E0E0E0';
        levelsPerWorldInput.style.background = 'white';
    } else {
        // Réinitialiser le style
        levelsPerWorldInput.style.border = '2px solid #E0E0E0';
        levelsPerWorldInput.style.background = 'white';
    }
    
    // VÉRIFICATION 2 : Si on réduit le nombre de mondes, ajuster levelsPerWorld pour garder tous les niveaux
    if (numWorlds < oldNumWorlds && existingLevels.length > 0) {
        // Calculer le nombre minimum de niveaux par monde nécessaire
        const minLevelsPerWorld = Math.ceil(existingLevels.length / numWorlds);
        
        if (levelsPerWorld < minLevelsPerWorld) {
            // Ajuster automatiquement levelsPerWorld
            document.getElementById('levels-per-world').value = minLevelsPerWorld;
            alert(`ℹ️ Le nombre de niveaux par monde a été ajusté à ${minLevelsPerWorld} pour conserver tous les niveaux existants.`);
            // Rappeler la fonction avec les nouvelles valeurs
            updateWorldsConfig(autoSave);
            return;
        }
    }
    
    tempWorldsConfig.worlds = numWorlds;
    tempWorldsConfig.levelsPerWorld = levelsPerWorld;
    
    // Ajuster le tableau des points
    while (tempWorldsConfig.pointsPerWorld.length < numWorlds) {
        tempWorldsConfig.pointsPerWorld.push(0);
    }
    tempWorldsConfig.pointsPerWorld = tempWorldsConfig.pointsPerWorld.slice(0, numWorlds);
    
    // Générer l'interface
    const worldsConfigDiv = document.getElementById('worlds-config');
    worldsConfigDiv.innerHTML = '';
    
    for (let i = 0; i < numWorlds; i++) {
        const worldDiv = document.createElement('div');
        worldDiv.className = 'world-config-item';
        worldDiv.style.cssText = 'margin-bottom: 8px; padding: 8px 12px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;';
        
        const startLevel = i * levelsPerWorld + 1;
        const endLevel = (i + 1) * levelsPerWorld;
        
        // Partie gauche : Nom du monde
        const worldLabel = document.createElement('span');
        worldLabel.style.cssText = 'font-weight: bold; font-size: 12px; min-width: 180px;';
        worldLabel.textContent = `Monde ${i + 1} (Niveaux ${startLevel}-${endLevel}):`;
        
        // Partie droite : Points requis
        const pointsDiv = document.createElement('div');
        pointsDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        
        const pointsLabel = document.createElement('span');
        pointsLabel.style.cssText = 'font-size: 12px;';
        pointsLabel.textContent = i === 0 ? 'Points requis:' : 'Points pour débloquer:';
        
        const pointsInput = document.createElement('input');
        pointsInput.type = 'number';
        pointsInput.min = '0';
        pointsInput.max = '10000';
        pointsInput.value = tempWorldsConfig.pointsPerWorld[i] || 0;
        pointsInput.style.cssText = 'width: 80px; padding: 4px; border: 2px solid #E0E0E0; border-radius: 4px; font-size: 12px;';
        pointsInput.disabled = i === 0;
        
        // Ajouter la sélection automatique au focus
        pointsInput.addEventListener('focus', function() {
            this.select();
        });
        
        pointsInput.onchange = () => {
            const newPoints = parseInt(pointsInput.value) || 0;
            
            // Vérifier que les points sont atteignables (seulement pour monde 2+)
            if (i > 0) {
                // Calculer le maximum de points disponibles dans les mondes précédents
                const previousLevels = i * levelsPerWorld;
                const maxPointsAvailable = previousLevels * 2; // 2 points max par niveau
                
                if (newPoints > maxPointsAvailable) {
                    pointsInput.style.border = '2px solid #FF0000';
                    pointsInput.style.background = '#FFE0E0';
                    alert(`❌ Impossible !\n\nPour débloquer le Monde ${i + 1}, vous demandez ${newPoints} points.\n\nMais les ${previousLevels} niveaux des mondes précédents donnent au maximum ${maxPointsAvailable} points (${previousLevels} × 2).\n\nLe maximum atteignable est ${maxPointsAvailable} points.`);
                    pointsInput.value = tempWorldsConfig.pointsPerWorld[i];
                    return;
                }
                
                // Réinitialiser le style si OK
                pointsInput.style.border = '2px solid #E0E0E0';
                pointsInput.style.background = 'white';
            }
            
            tempWorldsConfig.pointsPerWorld[i] = newPoints;
            // Sauvegarder automatiquement
            autoSaveLevelManagerChanges();
        };
        
        pointsDiv.appendChild(pointsLabel);
        pointsDiv.appendChild(pointsInput);
        
        if (i === 0) {
            const note = document.createElement('span');
            note.style.cssText = 'font-size: 11px; color: #999;';
            note.textContent = '(toujours accessible)';
            pointsDiv.appendChild(note);
        }
        
        worldDiv.appendChild(worldLabel);
        worldDiv.appendChild(pointsDiv);
        worldsConfigDiv.appendChild(worldDiv);
    }
    
    // Mettre à jour la liste des niveaux si elle existe
    updateLevelsList();
    
    // Sauvegarder automatiquement seulement si demandé
    if (autoSave) {
        autoSaveLevelManagerChanges();
    }
}

function updateLevelsList() {
    const levelsListDiv = document.getElementById('levels-list');
    levelsListDiv.innerHTML = '';
    
    const numWorlds = tempWorldsConfig.worlds;
    const levelsPerWorld = tempWorldsConfig.levelsPerWorld;
    const totalLevels = numWorlds * levelsPerWorld;
    
    // Créer les sections par monde
    for (let worldIdx = 0; worldIdx < numWorlds; worldIdx++) {
        const worldSection = document.createElement('div');
        worldSection.style.cssText = 'margin-bottom: 15px;';
        
        const worldHeader = document.createElement('div');
        worldHeader.style.cssText = 'background: #1976D2; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-bottom: 8px;';
        worldHeader.textContent = `🌍 Monde ${worldIdx + 1}`;
        worldSection.appendChild(worldHeader);
        
        // Créer les niveaux de ce monde
        for (let levelInWorld = 0; levelInWorld < levelsPerWorld; levelInWorld++) {
            const levelNum = worldIdx * levelsPerWorld + levelInWorld + 1;
            const levelData = tempLevelsData[levelNum.toString()];
            
            const levelDiv = document.createElement('div');
            levelDiv.className = 'level-item';
            levelDiv.draggable = levelData != null; // Seulement si le niveau existe
            levelDiv.style.cssText = `
                background: ${levelData ? 'white' : '#f5f5f5'}; 
                padding: 10px; 
                margin-bottom: 5px; 
                border-radius: 4px; 
                border: 2px solid #E0E0E0; 
                display: flex; 
                align-items: center; 
                gap: 10px;
                cursor: ${levelData ? 'move' : 'default'};
                opacity: ${levelData ? '1' : '0.6'};
            `;
            levelDiv.dataset.levelNum = levelNum;
            
            // Numéro du niveau
            const levelNumber = document.createElement('div');
            levelNumber.style.cssText = 'font-weight: bold; font-size: 13px; min-width: 80px;';
            levelNumber.textContent = `Niveau ${levelNum}`;
            levelDiv.appendChild(levelNumber);
            
            if (levelData) {
                // Aperçu du motif (miniature de la grille)
                const preview = createLevelPreview(levelData);
                levelDiv.appendChild(preview);
                
                // Nombre de blocs optimaux
                const blocksInfo = document.createElement('div');
                blocksInfo.style.cssText = 'font-size: 12px; color: #666; min-width: 60px; flex-shrink: 0;';
                blocksInfo.textContent = `${levelData.blockCount} blocs`;
                levelDiv.appendChild(blocksInfo);
                
                // Bouton supprimer
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️';
                deleteBtn.className = 'level-delete-btn';
                deleteBtn.style.cssText = 'background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: auto; flex-shrink: 0;';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteLevelFromList(levelNum);
                };
                levelDiv.appendChild(deleteBtn);
                
                // Drag & Drop handlers
                levelDiv.ondragstart = (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', levelNum.toString());
                    levelDiv.style.opacity = '0.5';
                };
                
                levelDiv.ondragend = (e) => {
                    levelDiv.style.opacity = '1';
                };
            } else {
                // Niveau vide
                const emptyText = document.createElement('div');
                emptyText.style.cssText = 'font-size: 12px; color: #999; font-style: italic;';
                emptyText.textContent = 'Niveau vide';
                levelDiv.appendChild(emptyText);
            }
            
            // Handler de drop pour tous les niveaux
            levelDiv.ondragover = (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                levelDiv.style.borderColor = '#4CAF50';
                levelDiv.style.background = '#E8F5E9';
            };
            
            levelDiv.ondragleave = (e) => {
                levelDiv.style.borderColor = '#E0E0E0';
                levelDiv.style.background = levelData ? 'white' : '#f5f5f5';
            };
            
            levelDiv.ondrop = (e) => {
                e.preventDefault();
                levelDiv.style.borderColor = '#E0E0E0';
                levelDiv.style.background = levelData ? 'white' : '#f5f5f5';
                
                const draggedLevelNum = e.dataTransfer.getData('text/plain');
                const targetLevelNum = levelNum.toString();
                
                if (draggedLevelNum !== targetLevelNum) {
                    // Échanger le contenu des deux niveaux
                    const temp = tempLevelsData[draggedLevelNum];
                    tempLevelsData[draggedLevelNum] = tempLevelsData[targetLevelNum];
                    tempLevelsData[targetLevelNum] = temp;
                    
                    updateLevelsList();
                    
                    // Sauvegarder automatiquement
                    autoSaveLevelManagerChanges();
                }
            };
            
            worldSection.appendChild(levelDiv);
        }
        
        levelsListDiv.appendChild(worldSection);
    }
}

function createLevelPreview(levelData) {
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = 'display: inline-block; border: 1px solid #ccc; background: white;';
    
    // Créer une mini grille 10x10
    const gridSize = 10;
    const cellSize = 8; // pixels
    
    const canvas = document.createElement('canvas');
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    canvas.style.cssText = 'display: block;';
    
    const ctx = canvas.getContext('2d');
    
    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la grille
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
    
    // Dessiner les cellules peintes
    const colorMap = {
        'red': '#dc3545',
        'yellow': '#ffc107',
        'green': '#28a745',
        'blue': '#007bff',
        'pink': '#FF69B4',
        'black': '#343a40'
    };
    
    let cellsToDraw = null;
    
    
    // Si le niveau a des paintedCells (difficulté 1 et 2), les utiliser directement
    if (levelData.paintedCells && Object.keys(levelData.paintedCells).length > 0) {
        cellsToDraw = levelData.paintedCells;
    } 
    // Sinon, si le niveau a des variables (difficulté 3), exécuter le programme pour obtenir le motif
    else if (levelData.variables && levelData.variables.createdVariables && levelData.variables.createdVariables.length > 0) {
        
        // Activer le mode aperçu pour désactiver drawTurtle
        window.isPreviewMode = true;
        
        // Sauvegarder l'état actuel de manière complète
        const savedGrid = grid ? grid.map(row => row ? [...row] : []) : [];
        const savedTurtle = turtle ? { ...turtle } : null;
        const savedVariables = variables ? { ...variables } : {};
        const savedCreatedVariables = createdVariables ? [...createdVariables] : [];
        
        try {
            // Créer une grille temporaire pour l'exécution
            grid = [];
            for (let y = 0; y < gridSize; y++) {
                grid[y] = [];
                for (let x = 0; x < gridSize; x++) {
                    grid[y][x] = { color: 'white' };
                }
            }
            
            // Restaurer les variables du niveau
            createdVariables = [...(levelData.variables.createdVariables || [])];
            variables = { ...(levelData.variables.variableValues || {}) };
            
            
            // Réinitialiser la tortue
            turtle = {
                x: 5,
                y: 9,
                direction: 0,
                color: 'red'
            };
            
            // Exécuter le programme
            executeSavedBlocks(levelData.blocks);
            
            // Capturer les cellules colorées
            cellsToDraw = {};
            let cellCount = 0;
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (grid[y] && grid[y][x] && grid[y][x].color !== 'white') {
                        cellsToDraw[`${y}-${x}`] = grid[y][x].color;
                        cellCount++;
                    }
                }
            }
        } catch (error) {
            // En cas d'erreur, au moins afficher une grille vide
            cellsToDraw = {};
        }
        
        // Restaurer l'état
        grid = savedGrid;
        turtle = savedTurtle;
        variables = savedVariables;
        createdVariables = savedCreatedVariables;
        
        // Désactiver le mode aperçu
        window.isPreviewMode = false;
        
    } else {
    }
    
    // Dessiner les cellules
    if (cellsToDraw) {
        Object.entries(cellsToDraw).forEach(([cellKey, color]) => {
            const [row, col] = cellKey.split('-').map(Number);
            ctx.fillStyle = colorMap[color] || color;
            ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        });
    }
    
    previewContainer.appendChild(canvas);
    return previewContainer;
}

function autoSaveLevelManagerChanges() {
    const cursus = document.getElementById('modal-cursus-select').value;
    
    // Sauvegarder la configuration des mondes
    cursusData[cursus].worlds = tempWorldsConfig.worlds;
    cursusData[cursus].levelsPerWorld = tempWorldsConfig.levelsPerWorld;
    cursusData[cursus].pointsPerWorld = [...tempWorldsConfig.pointsPerWorld];
    
    // Sauvegarder les niveaux (ils sont déjà dans le bon ordre/position)
    cursusData[cursus].levels = { ...tempLevelsData };
    
    // INCRÉMENTER LA VERSION du cursus modifié AVANT de sauvegarder
    incrementVersion(cursus);
    
    // Sauvegarder
    saveToStorage();
    markAsModified(); // Marquer qu'il y a eu des modifications
    
    // Recharger l'interface si c'est le cursus actuel
    if (cursus === document.getElementById('teacher-cursus-select').value) {
        // Vérifier si le niveau actuellement chargé existe encore
        const currentLevelStillExists = lastLoadedLevel && tempLevelsData[lastLoadedLevel];
        
        if (!currentLevelStillExists) {
            // Le niveau chargé a été supprimé OU aucun niveau chargé
            // Il faut recharger complètement
            lastLoadedLevel = null;
            loadTeacherLevels();
        } else {
            // Le niveau actuel existe encore, juste mettre à jour la liste sans recharger
            const levelSelect = document.getElementById('teacher-level-select');
            const currentValue = levelSelect.value; // Sauvegarder la sélection actuelle
            
            // Désactiver onchange temporairement
            levelSelect.onchange = null;
            
            // Reconstruire la liste
            levelSelect.innerHTML = '<option value="new">+ Nouveau niveau</option>';
            const levels = cursusData[cursus].levels || {};
            const levelKeys = Object.keys(levels).sort((a, b) => parseInt(a) - parseInt(b));
            const levelsPerWorld = cursusData[cursus].levelsPerWorld || 10;
            
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
            
            // Restaurer la sélection
            levelSelect.value = currentValue;
            
            // Réactiver onchange
            levelSelect.onchange = saveCurrentAndLoadTeacherLevel;
        }
        
        // NE PAS recharger loadCursusLevels() car ça nettoie la grille du prof !
        // loadCursusLevels sera appelé automatiquement quand l'utilisateur passera en mode élève
    }
}

function deleteLevelFromList(levelNum) {
    
    const levelKey = levelNum.toString();
    delete tempLevelsData[levelKey];
    updateLevelsList();
    // Sauvegarder automatiquement
    autoSaveLevelManagerChanges();
}

function saveLevelManagerChanges() {
    const cursus = document.getElementById('teacher-cursus-select').value;
    
    // Sauvegarder la configuration des mondes
    cursusData[cursus].worlds = tempWorldsConfig.worlds;
    cursusData[cursus].levelsPerWorld = tempWorldsConfig.levelsPerWorld;
    cursusData[cursus].pointsPerWorld = [...tempWorldsConfig.pointsPerWorld];
    
    // Sauvegarder les niveaux (ils sont déjà dans le bon ordre/position)
    cursusData[cursus].levels = { ...tempLevelsData };
    
    // INCRÉMENTER LA VERSION du cursus modifié AVANT de sauvegarder
    incrementVersion(cursus);
    
    // Sauvegarder
    saveToStorage();
    
    // Recharger l'interface
    loadTeacherLevels();
    
    closeLevelManagerModal();
    
    alert('✅ Modifications enregistrées !');
}

function closeLevelManagerModal() {
    document.getElementById('level-manager-modal').classList.remove('active');
    tempWorldsConfig = null;
    tempLevelsData = null;
}

// ===== CRÉATION AUTOMATISÉE =====

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    // Variables exportées
    window.tempWorldsConfig = null;
    window.tempLevelsData = null;
    
    // Fonctions exportées
    window.openLevelManagerModal = openLevelManagerModal;
    window.closeLevelManagerModal = closeLevelManagerModal;
    window.switchModalCursus = switchModalCursus;
    window.updateWorldsConfig = updateWorldsConfig;
    window.updateLevelsList = updateLevelsList;
    window.createLevelPreview = createLevelPreview;
    window.autoSaveLevelManagerChanges = autoSaveLevelManagerChanges;
    window.deleteLevelFromList = deleteLevelFromList;
    window.saveLevelManagerChanges = saveLevelManagerChanges;
    
    
})();
