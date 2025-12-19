// ============================================
// MODULE: BLOCK EXECUTION
// Description: Exécution des blocs de programmation (tortue)
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: turtle, grid, variables, currentMode, GRID_SIZE
//   - Fonctions: showResult(), getActiveGrid(), updateVariableDisplay(), paintCell()
// Fonctions EXPORTÉES (vers window):
//   - executeProgram(), executeBlocks(), executeSavedBlocks()
//   - resetTurtle(), moveForward(), turnRight(), turnLeft()
//   - drawTurtle(), clearGrid()
// ============================================

(function() {
    'use strict';
    
    // ============================================
    // VARIABLES GLOBALES DE VITESSE
    // ============================================
    
    // Vitesse d'exécution (0-100, 90 = très rapide par défaut)
    let executionSpeed = 90;
    
    // État de l'exécution
    let isExecuting = false;
    let isPaused = false;
    let pauseResolve = null;
    let shouldStop = false;  // Flag pour arrêter complètement
    
    /**
     * Calculer le délai en millisecondes basé sur la vitesse
     * @returns {number} Délai en ms (0 à 500ms)
     */
    function getExecutionDelay() {
        // Vitesse 100 → 0ms (instantané)
        // Vitesse 50 → 250ms
        // Vitesse 0 → 500ms
        return (100 - executionSpeed) * 5;
    }
    
    /**
     * Attendre le délai d'exécution
     */
    async function waitDelay() {
        // Vérifier si on doit arrêter
        if (shouldStop) {
            throw new Error('EXECUTION_STOPPED');
        }
        
        const delay = getExecutionDelay();
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Vérifier à nouveau après le délai
        if (shouldStop) {
            throw new Error('EXECUTION_STOPPED');
        }
        
        // Si en pause, attendre la reprise
        if (isPaused) {
            await new Promise(resolve => {
                pauseResolve = resolve;
            });
        }
        
        // Vérifier après la pause
        if (shouldStop) {
            throw new Error('EXECUTION_STOPPED');
        }
    }
    
    /**
     * Mettre à jour la vitesse d'exécution depuis le curseur
     */
    function updateExecutionSpeed(speed) {
        executionSpeed = speed;
    }
    
    /**
     * Surligner un bloc pendant son exécution
     */
    function highlightBlock(blockElement) {
        if (blockElement) {
            blockElement.classList.add('executing');
        }
    }
    
    /**
     * Retirer le surlignage d'un bloc
     */
    function unhighlightBlock(blockElement) {
        if (blockElement) {
            blockElement.classList.remove('executing');
        }
    }
    
    /**
     * Retirer tous les surlignages
     */
    function clearAllHighlights() {
        const allBlocks = document.querySelectorAll('.block.executing');
        allBlocks.forEach(block => block.classList.remove('executing'));
    }
    
    /**
     * Mettre en pause l'exécution
     */
    function pauseExecution() {
        isPaused = true;
        updateExecutionButton();
    }
    
    /**
     * Reprendre l'exécution
     */
    function resumeExecution() {
        isPaused = false;
        if (pauseResolve) {
            pauseResolve();
            pauseResolve = null;
        }
        updateExecutionButton();
    }
    
    /**
     * Arrêter complètement l'exécution (appelé depuis l'extérieur)
     */
    function stopExecution() {
        console.log('stopExecution appelé - isExecuting:', isExecuting, 'isPaused:', isPaused);
        
        // Lever le flag d'arrêt
        shouldStop = true;
        
        // Même si pas en cours, toujours nettoyer
        isExecuting = false;
        isPaused = false;
        
        // Débloquer si en pause (cela va relancer waitDelay qui verra shouldStop)
        if (pauseResolve) {
            console.log('Déblocage de la pause');
            pauseResolve();
            pauseResolve = null;
        }
        
        clearAllHighlights();
        updateExecutionButton();
        console.log('Exécution arrêtée - bouton mis à jour');
    }
    
    /**
     * Mettre à jour le texte du bouton selon l'état
     */
    function updateExecutionButton() {
        const buttons = [
            document.getElementById('run-btn'),
            document.querySelector('.teacher-action-buttons button[onclick*="executeProgram"]')
        ];
        
        buttons.forEach(button => {
            if (!button) return;
            
            if (isExecuting && !isPaused) {
                // En cours → Pause
                button.innerHTML = '⏸️<br>Pause';
                button.classList.remove('btn-primary');
                button.classList.add('btn-warning');
            } else if (isExecuting && isPaused) {
                // En pause → Reprendre
                button.innerHTML = '▶️<br>Reprendre';
                button.classList.remove('btn-warning');
                button.classList.add('btn-success');
            } else {
                // Arrêté → Tester
                button.innerHTML = '▶️<br>Tester';
                button.classList.remove('btn-warning', 'btn-success');
                button.classList.add('btn-primary');
            }
        });
    }
    
    
async function executeProgram() {
    console.log('executeProgram - isExecuting:', isExecuting, 'isPaused:', isPaused);
    
    // Si déjà en cours
    if (isExecuting) {
        if (isPaused) {
            // En pause → reprendre
            console.log('Reprendre exécution');
            resumeExecution();
        } else {
            // En cours → mettre en pause
            console.log('Mettre en pause');
            pauseExecution();
        }
        return;
    }
    
    // Récupérer les blocs du programme d'abord
    const blocks = document.getElementById('program-blocks').querySelectorAll(':scope > .program-block');
    console.log('Nombre de blocs:', blocks.length);
    
    // BLOQUER si le programme est vide (ne pas changer l'état)
    if (blocks.length === 0) {
        console.log('Programme vide - ne rien faire');
        if (currentMode === 'student') {
            showResult('❌ Ton programme est vide ! Ajoute des blocs avant de valider.', false);
        }
        return;
    }
    
    console.log('Démarrer exécution');
    // Démarrer une nouvelle exécution
    isExecuting = true;
    isPaused = false;
    shouldStop = false;  // Réinitialiser le flag
    
    // Effacer le message de résultat précédent
    clearResult();
    
    // Nettoyer tous les surlignages précédents
    clearAllHighlights();
    
    // Mettre à jour le bouton
    updateExecutionButton();
    
    // Toujours effacer la grille au début
    clearGrid();
    resetTurtle();
    variables = {};
    updateVariableDisplay();
    
    // Récupérer la grille active
    getActiveGrid();
    
    try {
        await executeBlocks(blocks);
    } catch (error) {
        // Ne pas afficher d'erreur si c'est un arrêt demandé
        if (error.message !== 'EXECUTION_STOPPED') {
            showResult('Erreur dans le programme: ' + error.message, false);
        }
    } finally {
        // Arrêter l'exécution à la fin
        isExecuting = false;
        isPaused = false;
        shouldStop = false;
        clearAllHighlights();
        updateExecutionButton();
    }
}

// Fonction utilitaire pour évaluer une valeur depuis un value-slot
function evaluateValueSlot(valueSlot) {
    if (!valueSlot) return 0;
    
    // Vérifier si un bloc opérateur a été déposé
    const operatorBlock = valueSlot.querySelector('.block[data-type="operator"]');
    if (operatorBlock) {
        const opValueSlots = operatorBlock.querySelectorAll('.value-slot');
        const opSelect = operatorBlock.querySelector(':scope > select');
        const operation = opSelect ? opSelect.value : '+';
        
        // Récupérer la première valeur (récursif pour gérer les opérateurs imbriqués)
        let val1 = 0;
        if (opValueSlots[0]) {
            val1 = evaluateValueSlot(opValueSlots[0]);
        }
        
        // Récupérer la deuxième valeur (récursif pour gérer les opérateurs imbriqués)
        let val2 = 0;
        if (opValueSlots[1]) {
            val2 = evaluateValueSlot(opValueSlots[1]);
        }
        
        // Calculer le résultat
        switch (operation) {
            case '+': return val1 + val2;
            case '-': return val1 - val2;
            case '*': return val1 * val2;
            case '/': return val2 !== 0 ? val1 / val2 : 0;
            default: return 0;
        }
    }
    
    // Vérifier si un bloc variable a été déposé
    const varBlock = valueSlot.querySelector('.block[data-type="var-value"]');
    if (varBlock) {
        const varName = varBlock.querySelector('select').value;
        return variables[varName] || 0;
    }
    
    // Sinon, récupérer la valeur de l'input
    const input = valueSlot.querySelector('input');
    if (input) {
        const inputVal = input.value;
        return !isNaN(inputVal) && inputVal !== '' ? parseFloat(inputVal) : 0;
    }
    
    return 0;
}

async function executeBlocks(blocks) {
    for (let block of blocks) {
        const blockElement = block.querySelector('.block');
        const type = blockElement.dataset.type;
        
        // Surligner le bloc en cours d'exécution
        highlightBlock(blockElement);
        
        switch(type) {
            case 'color':
                turtle.color = blockElement.dataset.value;
                // Colorier UNIQUEMENT la case actuelle, sans activer drawMode
                paintCell(turtle.x, turtle.y, turtle.color);
                await waitDelay();
                break;
            case 'forward':
                moveForward();
                await waitDelay();
                break;
            case 'back':
                moveBackward();
                await waitDelay();
                break;
            case 'right':
                turnRight();
                await waitDelay();
                break;
            case 'left':
                turnLeft();
                await waitDelay();
                break;
            case 'repeat':
                const valueSlotRepeat = blockElement.querySelector('.value-slot');
                let times = Math.round(evaluateValueSlot(valueSlotRepeat)) || 1;
                
                // S'assurer que times est au moins 1
                if (times < 1) times = 1;
                
                const nestedArea = block.querySelector('.nested-blocks');
                if (nestedArea) {
                    // CORRECTION: Sélectionner uniquement les enfants directs, pas tous les descendants
                    const nestedBlocks = Array.from(nestedArea.children).filter(child => child.classList.contains('program-block'));
                    for (let i = 0; i < times; i++) {
                        await executeBlocks(nestedBlocks);
                    }
                }
                break;
            case 'variable':
                const varSelect = blockElement.querySelector('select');
                const varName = varSelect ? varSelect.value : '';
                
                // Récupérer la valeur depuis le value-slot (peut être un nombre, une variable ou un opérateur)
                const valueSlotVar = blockElement.querySelector('.value-slot');
                const varValue = evaluateValueSlot(valueSlotVar);
                
                if (varName) {
                    // S'assurer que la variable est dans la liste des variables créées
                    if (!createdVariables.includes(varName)) {
                        createdVariables.push(varName);
                    }
                    variables[varName] = varValue;
                    updateVariableDisplay();
                }
                break;
            case 'change-var':
                const changeSelect = blockElement.querySelector('select');
                const changeVarName = changeSelect ? changeSelect.value : '';
                
                // Récupérer la valeur depuis le value-slot (peut être un nombre, une variable ou un opérateur)
                const valueSlotChange = blockElement.querySelector('.value-slot');
                const changeValue = evaluateValueSlot(valueSlotChange);
                
                if (changeVarName && variables.hasOwnProperty(changeVarName)) {
                    variables[changeVarName] += changeValue;
                    updateVariableDisplay();
                }
                break;
            case 'if':
                const ifVarSelect = blockElement.querySelector('.var-select');
                const compareOp = blockElement.querySelector('.compare-op');
                const valueSlot = blockElement.querySelector('.value-slot');
                
                if (ifVarSelect && compareOp && valueSlot) {
                    const ifVarName = ifVarSelect.value;
                    const operator = compareOp.value;
                    
                    // Récupérer la valeur (soit depuis un input, soit depuis un bloc variable ou opérateur déposé)
                    let compareValue;
                    const varBlock = valueSlot.querySelector('.block[data-type="var-value"]');
                    const operatorBlock = valueSlot.querySelector('.block[data-type="operator"]');
                    const valueInput = valueSlot.querySelector('input[type="text"]');
                    
                    if (operatorBlock) {
                        // Évaluer le bloc opérateur
                        const opValueSlots = operatorBlock.querySelectorAll('.value-slot');
                        const opSelect = operatorBlock.querySelector(':scope > select');
                        const operation = opSelect ? opSelect.value : '+';
                        
                        // Récupérer la première valeur
                        let val1 = 0;
                        if (opValueSlots[0]) {
                            const v1Block = opValueSlots[0].querySelector('.block[data-type="var-value"]');
                            if (v1Block) {
                                const v1Name = v1Block.querySelector('select').value;
                                val1 = variables[v1Name] || 0;
                            } else {
                                const v1Input = opValueSlots[0].querySelector('input');
                                if (v1Input) {
                                    const inputVal = v1Input.value;
                                    val1 = !isNaN(inputVal) && inputVal !== '' ? parseFloat(inputVal) : 0;
                                }
                            }
                        }
                        
                        // Récupérer la deuxième valeur
                        let val2 = 0;
                        if (opValueSlots[1]) {
                            const v2Block = opValueSlots[1].querySelector('.block[data-type="var-value"]');
                            if (v2Block) {
                                const v2Name = v2Block.querySelector('select').value;
                                val2 = variables[v2Name] || 0;
                            } else {
                                const v2Input = opValueSlots[1].querySelector('input');
                                if (v2Input) {
                                    const inputVal = v2Input.value;
                                    val2 = !isNaN(inputVal) && inputVal !== '' ? parseFloat(inputVal) : 0;
                                }
                            }
                        }
                        
                        // Calculer le résultat
                        switch (operation) {
                            case '+': compareValue = val1 + val2; break;
                            case '-': compareValue = val1 - val2; break;
                            case '*': compareValue = val1 * val2; break;
                            case '/': compareValue = val2 !== 0 ? val1 / val2 : 0; break;
                            default: compareValue = 0;
                        }
                    } else if (varBlock) {
                        const refVarName = varBlock.querySelector('select').value;
                        compareValue = variables[refVarName];
                    } else if (valueInput) {
                        compareValue = valueInput.value;
                        // Essayer de convertir en nombre si possible
                        if (!isNaN(compareValue) && compareValue !== '') {
                            compareValue = parseFloat(compareValue);
                        }
                    }
                    
                    // Évaluer la condition
                    const varValue = variables[ifVarName];
                    let conditionResult = false;
                    
                    if (varValue !== undefined && compareValue !== undefined) {
                        switch (operator) {
                            case '<':
                                conditionResult = varValue < compareValue;
                                break;
                            case '>':
                                conditionResult = varValue > compareValue;
                                break;
                            case '=':
                                conditionResult = varValue == compareValue;
                                break;
                            case '<=':
                                conditionResult = varValue <= compareValue;
                                break;
                            case '>=':
                                conditionResult = varValue >= compareValue;
                                break;
                            case '≠':
                            case '!=':
                                conditionResult = varValue != compareValue;
                                break;
                        }
                    }
                    
                    // Si la condition est vraie, exécuter les blocs imbriqués
                    if (conditionResult) {
                        const ifNestedArea = block.querySelector('.nested-blocks');
                        if (ifNestedArea) {
                            const ifNestedBlocks = ifNestedArea.querySelectorAll(':scope > .program-block');
                            await executeBlocks(ifNestedBlocks);
                        }
                    }
                }
                break;
            case 'operator':
                // Les opérateurs sont plutôt utilisés dans les conditions
                break;
        }
        
        // Retirer le surlignage après exécution du bloc
        unhighlightBlock(blockElement);
    }
}

function resetTurtle() {
    turtle = { x: 5, y: 9, direction: 0, color: 'black', drawMode: false, lastX: undefined, lastY: undefined };
    drawTurtle();
}

function moveForward() {
    const directions = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];
    const dir = directions[turtle.direction];
    
    turtle.x += dir.x;
    turtle.y += dir.y;
    
    if (turtle.x < 0) turtle.x = 0;
    if (turtle.x >= GRID_SIZE) turtle.x = GRID_SIZE - 1;
    if (turtle.y < 0) turtle.y = 0;
    if (turtle.y >= GRID_SIZE) turtle.y = GRID_SIZE - 1;
    
    drawTurtle();
}

function moveBackward() {
    turnRight();
    turnRight();
    moveForward();
    turnRight();
    turnRight();
}

function turnRight() {
    turtle.direction = (turtle.direction + 1) % 4;
    drawTurtle();
}

function turnLeft() {
    turtle.direction = (turtle.direction + 3) % 4;
    drawTurtle();
}

function paintCell(x, y, color) {
    if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
        grid[y][x].color = color;
        
        // Modifier le DOM si l'élément existe (même en mode aperçu pour afficher le motif)
        if (grid[y][x].element) {
            const colorMap = {
                'red': '#dc3545',
                'yellow': '#ffc107',
                'green': '#28a745',
                'blue': '#007bff',
                'black': '#343a40',
                'white': '#ffffff'
            };
            grid[y][x].element.style.background = colorMap[color] || color;
        }
    }
}

function drawTurtle() {
    // Ne pas dessiner en mode aperçu
    if (window.isPreviewMode) {
        return;
    }
    
    // Remettre la flèche précédente en noir si elle existe
    if (turtle.lastX !== undefined && turtle.lastY !== undefined) {
        if (grid[turtle.lastY] && grid[turtle.lastY][turtle.lastX] && grid[turtle.lastY][turtle.lastX].element) {
            const lastCell = grid[turtle.lastY][turtle.lastX].element;
            // Vérifier si c'est toujours une flèche (pas écrasée par une couleur)
            if (lastCell.innerHTML && ['▲', '▶', '▼', '◀'].includes(lastCell.innerHTML)) {
                lastCell.style.color = 'black';
            }
        }
    }
    
    // Dessiner une flèche ROSE pour la position actuelle
    const arrows = ['▲', '▶', '▼', '◀'];
    if (turtle.y >= 0 && turtle.y < GRID_SIZE && turtle.x >= 0 && turtle.x < GRID_SIZE) {
        if (grid[turtle.y] && grid[turtle.y][turtle.x] && grid[turtle.y][turtle.x].element) {
            grid[turtle.y][turtle.x].element.innerHTML = arrows[turtle.direction];
            grid[turtle.y][turtle.x].element.style.fontSize = '20px';
            grid[turtle.y][turtle.x].element.style.display = 'flex';
            grid[turtle.y][turtle.x].element.style.alignItems = 'center';
            grid[turtle.y][turtle.x].element.style.justifyContent = 'center';
            grid[turtle.y][turtle.x].element.style.color = '#ff1493'; // Rose vif (deeppink)
        }
    }
    
    // Sauvegarder la position actuelle comme "précédente" pour le prochain appel
    turtle.lastX = turtle.x;
    turtle.lastY = turtle.y;
}

function clearGrid() {
    clearResult(); // Effacer le message de résultat
    getActiveGrid(); // S'assurer qu'on a la bonne grille
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            grid[y][x].color = 'white';
            grid[y][x].element.style.background = 'white';
            grid[y][x].element.innerHTML = '';
        }
    }
    resetTurtle();
    
    // NE PAS nettoyer les cellules peintes automatiquement
    // Elles seront nettoyées uniquement avec le bouton "Effacer" ou lors du changement de mode
}

// Fonction pour effacer la grille ET les cellules peintes (pour le bouton Effacer)
function clearGridAndPaint() {
    clearGrid();
    clearProgram(); // Effacer également le programme
    if (currentMode === 'teacher') {
        clearPaintedCells();
    }
}

function clearProgram() {
    document.getElementById('program-blocks').innerHTML = '';
    programBlocks = []; // Vider le tableau interne
    clearResult();
    updateBlockCount();
}

// Mettre à jour le compteur de blocs
function updateBlockCount() {
    const programBlocks = document.getElementById('program-blocks');
    const blocks = programBlocks.querySelectorAll(':scope > .program-block');
    let totalCount = countTotalBlocks(blocks);
    
    const blockCountSpan = document.getElementById('block-count');
    if (blockCountSpan) {
        blockCountSpan.textContent = `(${totalCount} bloc${totalCount > 1 ? 's' : ''})`;
    }
}

// Gestion des niveaux
function loadCursusLevels() {
    
    // VÉRIFICATION DE VERSION : aussi en mode aperçu local (pas seulement URL élève)
    if (currentMode === 'student' && !window.isStudentLoadMode) {
        // Mode aperçu local (pas une URL élève)
        checkVersionAndReset('local_preview');
        
        // Nettoyer les niveaux modifiés ou supprimés
        cleanupModifiedLevels();
    }
    
    currentCursus = document.getElementById('cursus-select').value;
    const levelSelect = document.getElementById('level-select');
    levelSelect.innerHTML = '';
    
    const cursusInfo = cursusData[currentCursus];
    const levels = cursusInfo.levels || {};
    const levelKeys = Object.keys(levels).sort((a, b) => parseInt(a) - parseInt(b));
    const levelsPerWorld = cursusInfo.levelsPerWorld || 10;
    
    if (levelKeys.length === 0) {
        levelSelect.innerHTML = '<option value="0">Aucun niveau disponible</option>';
        // Nettoyer toutes les grilles si aucun niveau
        clearGrid();
        clearPaintedCells();
        
        // Nettoyer aussi la grille preview "reproduis le motif"
        const targetGrid = document.getElementById('target-grid');
        if (targetGrid) {
            targetGrid.querySelectorAll('.grid-cell').forEach(cell => {
                cell.style.background = 'white';
                cell.innerHTML = '';
            });
        }
        
        return; // IMPORTANT : ne pas appeler loadLevel()
    }
    
    levelKeys.forEach((levelNum) => {
        const level = levels[levelNum];
        const levelIndex = parseInt(levelNum) - 1;
        const worldNum = Math.floor(levelIndex / levelsPerWorld) + 1;
        const levelInWorld = (levelIndex % levelsPerWorld) + 1;
        
        // Vérifier si le monde est débloqué
        const worldUnlocked = score >= (cursusInfo.pointsPerWorld[worldNum - 1] || 0);
        
        // Vérifier le statut de complétion du niveau
        const levelKey = `${currentCursus}-${levelNum}`;
        const completionStatus = completedLevels[levelKey];
        
        
        const option = document.createElement('option');
        option.value = levelNum;
        
        // Extraire les points (rétrocompatibilité avec ancien format)
        let points = 0;
        if (typeof completionStatus === 'object') {
            points = completionStatus.points || 0;
        } else if (typeof completionStatus === 'number') {
            points = completionStatus; // Ancien format
        }
        
        
        // Construire le texte avec les coches appropriées
        let statusIcon = '';
        if (points === 2) {
            statusIcon = '✓✓ '; // Double coche pour 2 points
        } else if (points === 1) {
            statusIcon = '✓ '; // Simple coche pour 1 point
        }
        
        
        option.textContent = `${statusIcon}Monde ${worldNum} - Niveau ${levelInWorld} - Blocs optimaux : ${level.blockCount}`;
        option.disabled = !worldUnlocked;
        if (!worldUnlocked) {
            option.textContent += ` 🔒 (${cursusInfo.pointsPerWorld[worldNum - 1]} pts requis)`;
        }
        levelSelect.appendChild(option);
    });
    
    // Charger le premier niveau débloqué
    const firstUnlocked = Array.from(levelSelect.options).find(opt => !opt.disabled);
    if (firstUnlocked) {
        levelSelect.value = firstUnlocked.value;
    }
    
    loadLevel();
}

// ========================================
// SAUVEGARDE AUTOMATIQUE DES PROGRAMMES ÉLÈVES
// ========================================
// Ce module a été déplacé vers js/studentProgramStorage.js
// Fonctions: saveStudentProgram(), loadStudentProgram(), removeBlockAndSave(), etc.

function loadLevel() {
    const levelNum = document.getElementById('level-select').value;
    const level = cursusData[currentCursus].levels[levelNum];
    
    if (!level) {
        // Nettoyer la grille target si pas de niveau
        const targetGridElement = document.getElementById('target-grid');
        if (targetGridElement) {
            const targetCells = targetGridElement.querySelectorAll('.grid-cell');
            targetCells.forEach(cell => {
                cell.style.background = 'white';
                cell.innerHTML = '';
            });
        }
        return;
    }
    
    currentLevelIndex = parseInt(levelNum) - 1;
    
    clearGrid();
    clearProgram();
    document.getElementById('result-message').innerHTML = '';
    
    // Charger le programme sauvegardé de l'élève (si mode élève)
    if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
        loadStudentProgram(currentCursus, levelNum);
    }
    
    // Afficher le motif attendu dans target-grid
    displayTargetPattern(level);
    
    // Démarrer le système d'aide si en mode élève
    if ((currentMode === 'student' || window.isStudentLoadMode) && typeof window.helpSystem !== 'undefined') {
        window.helpSystem.startLevel(currentCursus, levelNum);
    }
}

function displayTargetPattern(level) {
    // Utiliser la grille target pour afficher le motif
    const targetGridElement = document.getElementById('target-grid');
    if (!targetGridElement) return;
    
    // Vider la grille target
    const targetCells = targetGridElement.querySelectorAll('.grid-cell');
    targetCells.forEach(cell => {
        cell.style.background = 'white';
        cell.innerHTML = '';
    });
    
    // Activer le mode aperçu pour désactiver drawTurtle
    window.isPreviewMode = true;
    
    // Simuler l'exécution du programme du professeur dans la grille target
    const savedGrid = grid;
    const savedTurtle = { ...turtle };
    const savedVariables = { ...variables };
    const savedCreatedVariables = [...createdVariables];
    
    // Restaurer les variables du niveau
    if (level.variables) {
        createdVariables = [...(level.variables.createdVariables || [])];
        variables = { ...(level.variables.variableValues || {}) };
    } else {
        createdVariables = [];
        variables = {};
    }
    
    grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = targetCells[y * GRID_SIZE + x];
            grid[y][x] = { element: cell, color: 'white' };
        }
    }
    
    // Exécuter le programme pour dessiner le motif attendu (sans afficher la flèche)
    resetTurtle();
    executeSavedBlocks(level.blocks);
    
    // NE PAS appeler drawTurtle() pour la grille target - c'est ici le bug
    // Nettoyer les flèches éventuellement affichées
    targetCells.forEach(cell => {
        cell.innerHTML = '';
    });
    
    // Restaurer la grille et la tortue originales
    grid = savedGrid;
    turtle = savedTurtle;
    
    // MODE ÉLÈVE : Réinitialiser les variables d'exécution (ne pas garder les valeurs du prof)
    variables = {};
    // NE PLUS vider createdVariables car maintenant stockées séparément par mode
    
    // Masquer l'affichage des variables (sera mis à jour si l'élève a créé des variables)
    updateVariableDisplay();
    
    // Désactiver le mode aperçu
    window.isPreviewMode = false;
}

function validateLevel() {
    // Effacer le message de résultat précédent
    clearResult();
    
    // VÉRIFIER si le programme est vide AVANT toute exécution
    const blocks = document.getElementById('program-blocks').querySelectorAll(':scope > .program-block');
    if (blocks.length === 0) {
        showResult('❌ Ton programme est vide ! Ajoute des blocs avant de valider.', false);
        return; // Stopper complètement la validation
    }
    
    const levelNum = document.getElementById('level-select').value;
    const level = cursusData[currentCursus].levels[levelNum];
    if (!level) {
        alert('Aucun niveau à valider');
        return;
    }
    
    // Exécuter le programme de l'élève et le laisser affiché
    clearGrid();
    resetTurtle();
    getActiveGrid();
    executeBlocks(blocks);
    const studentGrid = getGridState();
    
    
    // Créer une grille temporaire pour exécuter le programme du prof
    // sans toucher à la grille affichée de l'élève
    const tempGrid = grid;
    
    // Exécuter le programme du professeur sur une grille séparée
    grid = Array(10).fill(null).map(() => Array(10).fill('white'));
    
    // Il faut créer les objets de grille complets, pas juste des couleurs
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            grid[y][x] = { color: 'white', element: null };
        }
    }
    
    resetTurtle();
    const teacherBlocks = level.blocks;
    executeSavedBlocks(teacherBlocks);
    const teacherGrid = getGridState();
    
    
    // Restaurer la grille de l'élève (pour l'affichage)
    grid = tempGrid;
    
    // Comparer les grilles
    const isCorrect = compareGrids(studentGrid, teacherGrid);
    
    const blockCount = countTotalBlocks(blocks);
    const isOptimal = blockCount <= level.blockCount;
    
    // Si le programme est incorrect, afficher le message (la grille de l'élève est déjà affichée)
    if (!isCorrect) {
        // Afficher un message d'erreur
        showResult('❌ Ton programme ne permet pas de refaire le motif. Essaie encore !', false);
        return;
    }
    
    if (isCorrect) {
        // Vérifier si ce niveau a déjà été complété
        const levelKey = `${currentCursus}-${levelNum}`;
        const levelStatus = completedLevels[levelKey];
        
        let pointsEarned = 0;
        let wasAlreadyCompleted = false;
        let wasAlreadyOptimal = false;
        
        // Calculer le hash du niveau actuel pour détection de modifications
        const levelData = cursusData[currentCursus].levels[levelNum];
        const levelHash = getLevelHash(levelData);
        
        
        if (!levelStatus) {
            // Première fois que le niveau est complété
            completedLevels[levelKey] = { points: 1, hash: levelHash }; // 1 point pour validation
            
            // +1 point pour avoir résolu le niveau
            pointsEarned += 1;
            score += 1;
            
            // +1 point bonus si optimal
            if (isOptimal) {
                completedLevels[levelKey] = { points: 2, hash: levelHash }; // 2 points pour optimal
                pointsEarned += 1;
                score += 1;
            }
        } else {
            // Le niveau a déjà été complété
            wasAlreadyCompleted = true;
            const currentPoints = typeof levelStatus === 'object' ? levelStatus.points : levelStatus;
            wasAlreadyOptimal = (currentPoints === 2);
            
            // Si le niveau était déjà complété mais pas optimal, et maintenant il l'est
            if (currentPoints === 1 && isOptimal) {
                completedLevels[levelKey] = { points: 2, hash: levelHash };
                pointsEarned += 1;
                score += 1;
            }
        }
        
        // Afficher un message de succès
        if (isOptimal) {
            showResult('✅ Niveau réussi avec le nombre optimal de blocs !', true);
        } else {
            showResult('✅ Niveau réussi !', true);
        }
        
        // Afficher la popup de félicitations
        showSuccessPopup(isOptimal, blockCount, level.blockCount, pointsEarned, wasAlreadyCompleted, wasAlreadyOptimal);
        
        _updateScoreDisplay();
        saveScore();
        saveCompletedLevels();
        
        // Mettre à jour uniquement les coches dans la liste sans recharger
        updateLevelChecks();
        
        // Notifier le système d'aide que le niveau est complété
        if (typeof window.helpSystem !== 'undefined') {
            window.helpSystem.levelCompleted(currentCursus, levelNum);
        }
    } else {
        showResult('❌ Le motif ne correspond pas. Réessaie !', false);
    }
}

function updateLevelChecks() {
    // Met à jour les coches dans la liste sans changer la sélection
    const levelSelect = document.getElementById('level-select');
    const currentValue = levelSelect.value; // Sauvegarder la valeur actuelle
    const cursusInfo = cursusData[currentCursus];
    const levels = cursusInfo.levels || {};
    const levelsPerWorld = cursusInfo.levelsPerWorld || 10;
    
    // Parcourir toutes les options et mettre à jour le texte
    Array.from(levelSelect.options).forEach((option) => {
        const levelNum = option.value;
        if (levelNum === '0') return; // Skip "Aucun niveau disponible"
        
        const level = levels[levelNum];
        if (!level) return;
        
        const levelIndex = parseInt(levelNum) - 1;
        const worldNum = Math.floor(levelIndex / levelsPerWorld) + 1;
        const levelInWorld = (levelIndex % levelsPerWorld) + 1;
        const worldUnlocked = score >= (cursusInfo.pointsPerWorld[worldNum - 1] || 0);
        
        // Vérifier le statut de complétion
        const levelKey = `${currentCursus}-${levelNum}`;
        const completionStatus = completedLevels[levelKey];
        
        // Extraire les points (rétrocompatibilité avec ancien format)
        let points = 0;
        if (typeof completionStatus === 'object') {
            points = completionStatus.points || 0;
        } else if (typeof completionStatus === 'number') {
            points = completionStatus; // Ancien format
        }
        
        // Construire le texte avec les coches appropriées
        let statusIcon = '';
        if (points === 2) {
            statusIcon = '✓✓ '; // Double coche pour 2 points
        } else if (points === 1) {
            statusIcon = '✓ '; // Simple coche pour 1 point
        }
        
        option.textContent = `${statusIcon}Monde ${worldNum} - Niveau ${levelInWorld} - Blocs optimaux : ${level.blockCount}`;
        option.disabled = !worldUnlocked;
        if (!worldUnlocked) {
            option.textContent += ` 🔒 (${cursusInfo.pointsPerWorld[worldNum - 1]} pts requis)`;
        }
    });
    
    // Restaurer la sélection
    levelSelect.value = currentValue;
}

function showSuccessPopup(isOptimal, studentBlockCount, teacherBlockCount, pointsEarned, wasAlreadyCompleted, wasAlreadyOptimal) {
    const overlay = document.getElementById('success-overlay');
    const popup = document.getElementById('success-popup');
    const title = document.getElementById('success-title');
    const message = document.getElementById('success-message');
    const bonusMessage = document.getElementById('bonus-message');
    const btnNext = document.getElementById('btn-next-level');
    
    // Configurer le titre et le message selon la situation
    if (!wasAlreadyCompleted) {
        // Première fois que le niveau est réussi
        if (isOptimal) {
            title.textContent = '🏆 Bravo ! Parfait !';
            message.textContent = `Tu as réussi ce niveau avec le nombre optimal de blocs ! +${pointsEarned} points`;
            bonusMessage.style.display = 'none';
        } else {
            title.textContent = '✅ Bravo !';
            message.textContent = `Tu as réussi ce niveau ! +${pointsEarned} point`;
            bonusMessage.textContent = `💡 Gagne un point de plus en créant ce motif avec ${teacherBlockCount} blocs au maximum`;
            bonusMessage.style.display = 'block';
        }
    } else {
        // Le niveau avait déjà été complété
        if (wasAlreadyOptimal) {
            // Déjà résolu de manière optimale
            title.textContent = '✅ Niveau déjà réussi !';
            message.textContent = `Tu as déjà obtenu tous les points pour ce niveau.`;
            bonusMessage.style.display = 'none';
        } else if (isOptimal) {
            // Maintenant résolu de manière optimale
            title.textContent = '🏆 Excellent !';
            message.textContent = `Tu as optimisé ta solution ! +${pointsEarned} point bonus`;
            bonusMessage.style.display = 'none';
        } else {
            // Toujours pas optimal
            title.textContent = '✅ Niveau déjà réussi !';
            message.textContent = `Tu as déjà obtenu +1 point pour ce niveau.`;
            bonusMessage.textContent = `💡 Gagne un point de plus en créant ce motif avec ${teacherBlockCount} blocs au maximum`;
            bonusMessage.style.display = 'block';
        }
    }
    
    // Configurer le bouton "Niveau suivant"
    // Vérifier s'il existe un niveau suivant débloqué
    const levelSelect = document.getElementById('level-select');
    const currentOption = levelSelect.options[levelSelect.selectedIndex];
    const nextOption = levelSelect.options[levelSelect.selectedIndex + 1];
    
    if (nextOption && !nextOption.disabled) {
        // Il y a un niveau suivant disponible
        btnNext.style.display = 'block';
        btnNext.innerHTML = '<span class="btn-icon">➡️</span><span class="btn-text">Niveau suivant</span>';
    } else {
        // Pas de niveau suivant ou niveau verrouillé
        btnNext.style.display = 'block';
        btnNext.innerHTML = '<span class="btn-icon">🏆</span><span class="btn-text">Cursus terminé !</span>';
    }
    
    // Afficher la popup
    overlay.classList.add('show');
    popup.classList.add('show');
}

function closeSuccessPopup() {
    const overlay = document.getElementById('success-overlay');
    const popup = document.getElementById('success-popup');
    overlay.classList.remove('show');
    popup.classList.remove('show');
}

function restartLevel() {
    closeSuccessPopup();
    // En mode élève, ne pas vider le programme (l'élève pourra l'effacer lui-même s'il veut)
    // En mode professeur, vider le programme
    if (currentMode !== 'student') {
        document.getElementById('program-blocks').innerHTML = '';
    }
    // Réinitialiser la grille
    clearGrid();
    resetTurtle();
}

function nextLevel() {
    closeSuccessPopup();
    
    const levelSelect = document.getElementById('level-select');
    const currentIndex = levelSelect.selectedIndex;
    const nextOption = levelSelect.options[currentIndex + 1];
    
    if (nextOption && !nextOption.disabled) {
        // Passer au niveau suivant
        levelSelect.selectedIndex = currentIndex + 1;
        loadLevel();
        
        // Vider le programme
        document.getElementById('program-blocks').innerHTML = '';
        // Réinitialiser la grille
        clearGrid();
        resetTurtle();
    } else {
        // Tous les niveaux terminés - afficher la popup de félicitations
        showCongratulationsModal();
    }
}

function getGridState() {
    const state = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        state[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            state[y][x] = grid[y][x].color;
        }
    }
    return state;
}

function compareGrids(grid1, grid2) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid1[y][x] !== grid2[y][x]) {
                return false;
            }
        }
    }
    return true;
}

function executeSavedBlocks(blocks) {
    // Fonction pour exécuter des blocs sauvegardés
    for (let block of blocks) {
        switch(block.type) {
            case 'color':
                turtle.color = block.value;
                // Colorier UNIQUEMENT la case actuelle
                paintCell(turtle.x, turtle.y, turtle.color);
                break;
            case 'forward':
                moveForward();
                break;
            case 'back':
                moveBackward();
                break;
            case 'right':
                turnRight();
                break;
            case 'left':
                turnLeft();
                break;
            case 'repeat':
                let repeatTimes = 1;
                
                // Si une variable est utilisée
                if (block.timesVar) {
                    repeatTimes = variables[block.timesVar] || 1;
                } else {
                    repeatTimes = block.times || 1;
                }
                
                for (let i = 0; i < repeatTimes; i++) {
                    if (block.nested && block.nested.length > 0) {
                        executeSavedBlocks(block.nested);
                    }
                }
                break;
            case 'variable':
                if (block.varName) {
                    let value = 0;
                    
                    // Si une variable est utilisée pour la valeur
                    if (block.varValueVar) {
                        value = variables[block.varValueVar] || 0;
                    } else {
                        value = parseInt(block.varValue) || 0;
                    }
                    
                    variables[block.varName] = value;
                    updateVariableDisplay();
                }
                break;
            case 'change-var':
                if (block.varName && variables.hasOwnProperty(block.varName)) {
                    let changeAmount = 0;
                    
                    // Si une variable est utilisée pour la valeur de changement
                    if (block.changeValueVar) {
                        changeAmount = variables[block.changeValueVar] || 0;
                    } else {
                        changeAmount = parseInt(block.changeValue) || 0;
                    }
                    
                    variables[block.varName] += changeAmount;
                    updateVariableDisplay();
                }
                break;
            case 'if':
                // Évaluer la condition
                if (block.varName && block.operator !== undefined) {
                    const varValue = variables[block.varName];
                    let compareValue = block.compareValue;
                    
                    // Essayer de convertir en nombre si possible
                    if (!isNaN(compareValue) && compareValue !== '') {
                        compareValue = parseFloat(compareValue);
                    }
                    
                    let conditionResult = false;
                    
                    if (varValue !== undefined && compareValue !== undefined) {
                        switch (block.operator) {
                            case '<':
                                conditionResult = varValue < compareValue;
                                break;
                            case '>':
                                conditionResult = varValue > compareValue;
                                break;
                            case '=':
                                conditionResult = varValue == compareValue;
                                break;
                            case '<=':
                                conditionResult = varValue <= compareValue;
                                break;
                            case '>=':
                                conditionResult = varValue >= compareValue;
                                break;
                        }
                    }
                    
                    // Si la condition est vraie, exécuter les blocs imbriqués
                    if (conditionResult && block.nested && block.nested.length > 0) {
                        executeSavedBlocks(block.nested);
                    }
                }
                break;
        }
    }
}

// Mode professeur

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.executeProgram = executeProgram;
    window.stopExecution = stopExecution;
    window.updateExecutionSpeed = updateExecutionSpeed;
    window.evaluateValueSlot = evaluateValueSlot;
    window.executeBlocks = executeBlocks;
    window.resetTurtle = resetTurtle;
    window.moveForward = moveForward;
    window.moveBackward = moveBackward;
    window.turnRight = turnRight;
    window.turnLeft = turnLeft;
    window.drawTurtle = drawTurtle;
    window.clearGrid = clearGrid;
    window.clearGridAndPaint = clearGridAndPaint;
    window.executeSavedBlocks = executeSavedBlocks;
    window.loadCursusLevels = loadCursusLevels;
    window.loadLevel = loadLevel;
    window.nextLevel = nextLevel;
    window.restartLevel = restartLevel;
    window.clearProgram = clearProgram;
    window.validateLevel = validateLevel;
    window.updateBlockCount = updateBlockCount;
    window.paintCell = paintCell;
    window.getGridState = getGridState;
    window.compareGrids = compareGrids;
    window.displayTargetPattern = displayTargetPattern;
    window.showSuccessPopup = showSuccessPopup;
    window.closeSuccessPopup = closeSuccessPopup;
    window.updateLevelChecks = updateLevelChecks;
    
    
})();
