        // ===== MODULE PINCEAU =====
        function selectPaintColor(color) {
            selectedPaintColor = color;
            
            // Mettre à jour visuellement la sélection
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('selected');
            });
            document.querySelector(`.color-option[data-color="${color}"]`).classList.add('selected');
        }
        
        // Gérer le changement de difficulté
        function handleDifficultyChange() {
            const difficulty = parseInt(document.getElementById('generation-difficulty').value);
            const colorPickerSection = document.getElementById('color-picker-section');
            const patternPickerSection = document.getElementById('pattern-picker-section');
            const teacherGrid = document.getElementById('teacher-grid');
            
            if (difficulty === 3) {
                // Afficher les motifs géométriques, masquer les couleurs
                colorPickerSection.style.display = 'none';
                patternPickerSection.style.display = 'flex';
                
                // DÉSACTIVER le pinceau en difficulté 3
                if (teacherGrid) {
                    teacherGrid.style.cursor = 'default';
                    // Retirer tous les événements de peinture
                    teacherGrid.removeEventListener('mousedown', startPainting);
                    teacherGrid.removeEventListener('mouseup', stopPainting);
                    teacherGrid.removeEventListener('mouseleave', stopPainting);
                    teacherGrid.removeEventListener('touchstart', handleTouchStart);
                    teacherGrid.removeEventListener('touchend', handleTouchEnd);
                    teacherGrid.removeEventListener('touchmove', handleTouchMove);
                    
                    // Retirer les événements sur les cellules individuelles
                    const cells = teacherGrid.querySelectorAll('.grid-cell');
                    cells.forEach(cell => {
                        // Retirer les événements attachés avec on...
                        cell.onmousedown = null;
                        cell.onmouseenter = null;
                        cell.oncontextmenu = null;
                        // Retirer la classe paintable
                        cell.classList.remove('paintable');
                        // Remettre le curseur normal
                        cell.style.cursor = 'default';
                    });
                    
                }
            } else {
                // Afficher les couleurs, masquer les motifs
                colorPickerSection.style.display = 'flex';
                patternPickerSection.style.display = 'none';
                
                // RÉACTIVER le pinceau pour difficulté 1 et 2
                if (teacherGrid) {
                    initPaintMode();
                }
            }
        }
        
        // Variable pour stocker le motif sélectionné
        let selectedPattern = null;
        
        // Sélectionner un motif géométrique
        function selectPattern(pattern) {
            selectedPattern = pattern;
            
            // Mettre à jour visuellement la sélection
            document.querySelectorAll('.pattern-option').forEach(option => {
                option.classList.remove('selected');
            });
            document.querySelector(`.pattern-option[data-pattern="${pattern}"]`).classList.add('selected');
            
        }
        
        function initPaintMode() {
            const teacherGrid = document.getElementById('teacher-grid');
            if (!teacherGrid) {
                return;
            }
            
            // Ne pas activer le pinceau en difficulté 3
            const difficultySelect = document.getElementById('generation-difficulty');
            if (difficultySelect && parseInt(difficultySelect.value) === 3) {
                return;
            }
            
            // Sélectionner la couleur rouge par défaut
            selectPaintColor('red');
            
            // Retirer les anciens événements s'ils existent
            teacherGrid.removeEventListener('mousedown', startPainting);
            teacherGrid.removeEventListener('mouseup', stopPainting);
            teacherGrid.removeEventListener('mouseleave', stopPainting);
            
            // Ajouter les événements de peinture à la grille
            teacherGrid.addEventListener('mousedown', startPainting);
            teacherGrid.addEventListener('mouseup', stopPainting);
            teacherGrid.addEventListener('mouseleave', stopPainting);
            
            // === SUPPORT TACTILE GLOBAL ===
            teacherGrid.addEventListener('touchstart', function(e) {
                e.preventDefault();
                isPainting = true;
            }, { passive: false });
            
            teacherGrid.addEventListener('touchend', function(e) {
                e.preventDefault();
                isPainting = false;
            }, { passive: false });
            
            teacherGrid.addEventListener('touchcancel', function(e) {
                isPainting = false;
            }, { passive: false });
            
            // Gérer le glissement du doigt pour peindre plusieurs cellules
            teacherGrid.addEventListener('touchmove', function(e) {
                e.preventDefault(); // CRUCIAL : Empêche le scroll
                if (isPainting) {
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element && element.classList.contains('grid-cell')) {
                        const cells = Array.from(teacherGrid.querySelectorAll('.grid-cell'));
                        const index = cells.indexOf(element);
                        if (index !== -1) {
                            paintCellManually(element, index);
                        }
                    }
                }
            }, { passive: false });
            
            // Ajouter les classes et événements aux cellules
            const cells = teacherGrid.querySelectorAll('.grid-cell');
            
            cells.forEach((cell, index) => {
                cell.classList.add('paintable');
                
                // Utiliser une nouvelle approche avec des fonctions nommées pour pouvoir les retirer
                cell.onmousedown = function(e) {
                    e.preventDefault();
                    // Ne déclencher la peinture que pour le clic gauche (button = 0)
                    if (e.button === 0) {
                        isPainting = true;
                        paintCellManually(cell, index);
                    }
                };
                
                // === SUPPORT TACTILE POUR LE MODE PAINT ===
                // On laisse touchstart peindre la cellule mais on ne stoppe PAS la propagation
                // pour que touchmove de la grille puisse fonctionner
                cell.addEventListener('touchstart', function(e) {
                    e.preventDefault(); // CRUCIAL : Empêche le scroll
                    // Ne PAS utiliser stopPropagation ici !
                    isPainting = true;
                    paintCellManually(cell, index);
                }, { passive: false }); // passive: false permet preventDefault
                
                // Gérer le clic droit pour effacer
                cell.oncontextmenu = function(e) {
                    e.preventDefault(); // Empêcher le menu contextuel
                    const row = Math.floor(index / GRID_SIZE);
                    const col = index % GRID_SIZE;
                    const cellKey = `${row}-${col}`;
                    
                    // Effacer la cellule si elle est peinte
                    if (paintedCells[cellKey]) {
                        cell.style.backgroundColor = 'white';
                        delete paintedCells[cellKey];
                    }
                    
                    return false;
                };
                
                cell.onmouseenter = function(e) {
                    // Effacer si clic droit maintenu (button = 2)
                    if (e.buttons === 2) {
                        const row = Math.floor(index / GRID_SIZE);
                        const col = index % GRID_SIZE;
                        const cellKey = `${row}-${col}`;
                        
                        if (paintedCells[cellKey]) {
                            cell.style.backgroundColor = 'white';
                            delete paintedCells[cellKey];
                        }
                    }
                    // Peindre si clic gauche maintenu (button = 1)
                    else if (isPainting && e.buttons === 1) {
                        paintCellManually(cell, index);
                    }
                };
            });
        }
        
        function startPainting(e) {
            isPainting = true;
        }
        
        function stopPainting() {
            isPainting = false;
        }
        
        function paintCellManually(cell, index) {
            // BLOQUER la peinture en difficulté 3
            const difficultySelect = document.getElementById('generation-difficulty');
            if (difficultySelect && parseInt(difficultySelect.value) === 3) {
                return; // Ne rien faire
            }
            
            const row = Math.floor(index / GRID_SIZE);
            const col = index % GRID_SIZE;
            const cellKey = `${row}-${col}`;
            
            
            if (selectedPaintColor === 'white') {
                // Effacer la cellule
                cell.style.backgroundColor = 'white';
                delete paintedCells[cellKey];
            } else {
                // Peindre la cellule - utiliser les mêmes couleurs que dans le reste de l'app
                const colorMap = {
                    'red': '#dc3545',
                    'yellow': '#ffc107',
                    'green': '#28a745',
                    'blue': '#007bff',
                    'black': '#343a40'
                };
                cell.style.backgroundColor = colorMap[selectedPaintColor];
                paintedCells[cellKey] = selectedPaintColor;
            }
            
        }
        
        // Générer un motif aléatoire automatiquement
        function generateRandomPattern() {
            
            // Récupérer la difficulté actuellement sélectionnée
            const difficulty = parseInt(document.getElementById('generation-difficulty').value);
            
            if (difficulty === 3) {
                // DIFFICULTÉ 3: Générer un motif géométrique
                
                // Choisir un motif au hasard parmi tous les motifs disponibles
                const availablePatterns = ['square', 'spiral', 'zigzag', 'stairs', 'checkerboard', 'cross'];
                const randomPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
                
                // Sélectionner visuellement le motif
                selectedPattern = randomPattern;
                
                // Mettre à jour l'interface pour montrer la sélection
                document.querySelectorAll('.pattern-option').forEach(option => {
                    option.classList.remove('selected');
                    if (option.getAttribute('data-pattern') === randomPattern) {
                        option.classList.add('selected');
                    }
                });
                
                // Nettoyer le programme existant
                clearProgram();
                
                // Générer le motif choisi
                if (randomPattern === 'square') {
                    generateSquareProgram();
                } else if (randomPattern === 'spiral') {
                    generateSpiralProgram();
                } else if (randomPattern === 'zigzag') {
                    generateZigzagProgram();
                } else if (randomPattern === 'stairs') {
                    generateStairsProgram();
                } else if (randomPattern === 'checkerboard') {
                    generateCheckerboardProgram();
                } else if (randomPattern === 'cross') {
                    generateCrossProgram();
                }
                
                // Exécuter automatiquement le programme pour afficher le motif
                setTimeout(() => executeProgram(), 100);
                
            } else {
                // DIFFICULTÉS 1 ET 2: Générer un motif aléatoire en peignant des cellules
                
                // Effacer toutes les cellules peintes existantes
                paintedCells = {};
                const teacherGrid = document.getElementById('teacher-grid');
                const cells = teacherGrid.querySelectorAll('.cell');
                cells.forEach(cell => {
                    cell.style.backgroundColor = 'white';
                });
                
                // Couleurs disponibles (limité à 3 couleurs maximum)
                const allColors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
                const colorMap = {
                    'red': '#dc3545',
                    'yellow': '#ffc107',
                    'green': '#28a745',
                    'blue': '#007bff',
                    'pink': '#FF69B4',
                    'black': '#343a40'
                };
                
                // Choisir 1 à 3 couleurs aléatoires
                const numColors = Math.floor(Math.random() * 3) + 1; // 1 à 3
                const shuffledColors = [...allColors].sort(() => Math.random() - 0.5);
                const colors = shuffledColors.slice(0, numColors);
                
                const gridSize = 10; // Taille de la grille 10x10
                
                // Utiliser la bibliothèque de motifs externe
                const shapeTypes = PATTERNS.difficulty1_2.ids;
                const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
                
                // Générer le motif en utilisant la bibliothèque externe
                const paintedPositions = PATTERNS.difficulty1_2.generators[shapeType](gridSize);
                
                
                // Colorier les cellules avec des couleurs (utiliser les couleurs de manière répétitive)
                paintedPositions.forEach((pos, index) => {
                    const posKey = `${pos.row}-${pos.col}`;
                    // Si plusieurs couleurs, les alterner de manière prévisible
                    const colorIndex = index % colors.length;
                    const color = colors[colorIndex];
                    paintedCells[posKey] = color;
                    
                    // Appliquer visuellement
                    const cellIndex = pos.row * gridSize + pos.col;
                    if (cellIndex < cells.length) {
                        const cell = cells[cellIndex];
                        if (cell) {
                            cell.style.backgroundColor = colorMap[color];
                        } else {
                        }
                    }
                });
                
                
                // Générer automatiquement le programme
                generateProgramFromPaint();
            }
        }
        
        // Générer un programme à partir des cellules peintes
        function generateProgramFromPaint() {
            // Récupérer la difficulté sélectionnée
            const difficulty = parseInt(document.getElementById('generation-difficulty').value);
            
            // Pour la difficulté 3, pas besoin de cellules peintes
            if (difficulty === 3) {
                if (!selectedPattern) {
                    showResult('❌ Veuillez sélectionner un motif géométrique !', false);
                    return;
                }
                
                // Nettoyer le programme existant
                clearProgram();
                
                // Générer le programme selon le motif sélectionné
                if (selectedPattern === 'square') {
                    generateSquareProgram();
                    // Exécuter automatiquement le programme pour afficher le motif
                    setTimeout(() => executeProgram(), 100);
                } else if (selectedPattern === 'spiral') {
                    generateSpiralProgram();
                    // Exécuter automatiquement le programme pour afficher le motif
                    setTimeout(() => executeProgram(), 100);
                } else if (selectedPattern === 'zigzag') {
                    generateZigzagProgram();
                    // Exécuter automatiquement le programme pour afficher le motif
                    setTimeout(() => executeProgram(), 100);
                } else if (selectedPattern === 'stairs') {
                    generateStairsProgram();
                    // Exécuter automatiquement le programme pour afficher le motif
                    setTimeout(() => executeProgram(), 100);
                } else if (selectedPattern === 'checkerboard') {
                    generateCheckerboardProgram();
                    // Exécuter automatiquement le programme pour afficher le motif
                    setTimeout(() => executeProgram(), 100);
                } else if (selectedPattern === 'cross') {
                    generateCrossProgram();
                    // Exécuter automatiquement le programme pour afficher le motif
                    setTimeout(() => executeProgram(), 100);
                } else {
                    showResult(`🎨 Motif "${selectedPattern}" - Génération à venir !`, true);
                }
                return;
            }
            
            // Pour difficultés 1 et 2, vérifier qu'il y a des cellules peintes
            if (Object.keys(paintedCells).length === 0) {
                showResult('❌ Aucune cellule peinte ! Utilisez le pinceau pour colorier la grille.', false);
                return;
            }
            
            // Nettoyer le programme existant
            clearProgram();
            
            // Convertir paintedCells en tableau
            const cellsArray = [];
            const usedColors = new Set();
            for (let [cellKey, color] of Object.entries(paintedCells)) {
                const [row, col] = cellKey.split('-').map(Number);
                cellsArray.push({ row, col, color });
                usedColors.add(color);
            }
            
            // Pas de limite sur le nombre de couleurs
            
            // Vérifier le nombre de cellules (max 40)
            if (cellsArray.length > 40) {
                showResult(`❌ Trop de cellules ! Limite à 40 blocs maximum (actuellement ${cellsArray.length} cellules).`, false);
                return;
            }
            
            // OPTIMISATION 1: Trier par proximité (algorithme du plus proche voisin)
            const optimizedPath = optimizePath(cellsArray);
            
            
            // Générer le programme de base (difficulté 1)
            const basicProgram = generateBasicProgram(optimizedPath);
            
            if (difficulty === 1) {
                // Difficulté 1 : Programme basique
                addProgramBlocks(basicProgram);
                showResult(`✅ Programme créé (Difficulté 1) avec ${optimizedPath.length} bloc(s) de couleur !`, true);
                // Exécuter automatiquement le programme pour afficher le motif
                setTimeout(() => executeProgram(), 100);
            } else if (difficulty === 2) {
                // Difficulté 2 : Programme optimisé avec boucles simples
                const optimizedProgram = optimizeWithLoops(basicProgram);
                addProgramBlocks(optimizedProgram);
                const loopCount = countLoops(optimizedProgram);
                showResult(`✅ Programme optimisé (Difficulté 2) avec ${loopCount} boucle(s) !`, true);
                // Exécuter automatiquement le programme pour afficher le motif
                setTimeout(() => executeProgram(), 100);
            }
        }
        
        // Fonction pour générer le déplacement initial optimisé
        function generateInitialMovement(deltaRow, deltaCol) {
            
            // La tortue commence orientée vers le HAUT (en haut de la grille)
            // Position de départ: ligne 9 (en bas), colonne 5 (au centre)
            
            // ÉTAPE 1: Déplacement HORIZONTAL (gauche/droite)
            if (deltaCol !== 0) {
                const absCol = Math.abs(deltaCol);
                
                // Tourner dans la bonne direction
                if (deltaCol > 0) {
                    // Aller à DROITE: tourner à droite
                    const turnRightHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML });
                } else {
                    // Aller à GAUCHE: tourner à gauche
                    const turnLeftHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
                    addBlockToProgram({ type: 'left', html: turnLeftHTML });
                }
                
                // Avancer horizontalement
                if (absCol > 1) {
                    // Utiliser une boucle (plus de 1 case)
                    const loopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${absCol}" min="1" max="100" onclick="event.stopPropagation()"></span> fois</div>`;
                    addBlockToProgram({ 
                        type: 'repeat',
                        html: loopHTML
                    });
                    
                    // Ajouter "avancer" dans la boucle
                    const programBlocks = document.getElementById('program-blocks');
                    const loopBlock = programBlocks.lastElementChild;
                    const nestedArea = loopBlock.querySelector('.nested-blocks');
                    
                    const forwardWrapper = document.createElement('div');
                    forwardWrapper.className = 'program-block';
                    forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    const forwardBlock = forwardWrapper.querySelector('.block');
                    const forwardRemoveBtn = document.createElement('button');
                    forwardRemoveBtn.className = 'remove-btn';
                    forwardRemoveBtn.innerHTML = '×';
                    forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
                    forwardBlock.appendChild(forwardRemoveBtn);
                    nestedArea.appendChild(forwardWrapper);
                    nestedArea.classList.remove('empty');
                    
                } else {
                    // 1 seule case: un seul bloc avancer
                    const forwardHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    addBlockToProgram({ type: 'forward', html: forwardHTML });
                }
            }
            
            // ÉTAPE 2: Se réorienter vers le HAUT ou le BAS selon le besoin vertical
            if (deltaRow !== 0) {
                if (deltaCol !== 0) {
                    // On vient de se déplacer horizontalement, il faut se réorienter
                    if (deltaRow < 0) {
                        // On doit MONTER: se tourner vers le haut
                        if (deltaCol > 0) {
                            // On était orienté à droite, tourner à gauche pour regarder vers le haut
                            const turnLeftHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
                            addBlockToProgram({ type: 'left', html: turnLeftHTML });
                        } else {
                            // On était orienté à gauche, tourner à droite pour regarder vers le haut
                            const turnRightHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                            addBlockToProgram({ type: 'right', html: turnRightHTML });
                        }
                    } else {
                        // On doit DESCENDRE: se tourner vers le bas
                        if (deltaCol > 0) {
                            // On était orienté à droite, tourner à droite pour regarder vers le bas
                            const turnRightHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                            addBlockToProgram({ type: 'right', html: turnRightHTML });
                        } else {
                            // On était orienté à gauche, tourner à gauche pour regarder vers le bas
                            const turnLeftHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
                            addBlockToProgram({ type: 'left', html: turnLeftHTML });
                        }
                    }
                } else {
                    // Pas de déplacement horizontal, on est déjà orienté vers le haut
                    if (deltaRow > 0) {
                        // On doit descendre, faire demi-tour
                        const turnRightHTML1 = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                        addBlockToProgram({ type: 'right', html: turnRightHTML1 });
                        const turnRightHTML2 = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                        addBlockToProgram({ type: 'right', html: turnRightHTML2 });
                    }
                    // Sinon on monte, on est déjà bien orienté
                }
                
                // ÉTAPE 3: Déplacement VERTICAL
                const absRow = Math.abs(deltaRow);
                
                if (absRow > 1) {
                    // Utiliser une boucle (plus de 1 case)
                    const loopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${absRow}" min="1" max="100" onclick="event.stopPropagation()"></span> fois</div>`;
                    addBlockToProgram({ 
                        type: 'repeat',
                        html: loopHTML
                    });
                    
                    // Ajouter "avancer" dans la boucle
                    const programBlocks = document.getElementById('program-blocks');
                    const loopBlock = programBlocks.lastElementChild;
                    const nestedArea = loopBlock.querySelector('.nested-blocks');
                    
                    const forwardWrapper = document.createElement('div');
                    forwardWrapper.className = 'program-block';
                    forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    const forwardBlock = forwardWrapper.querySelector('.block');
                    const forwardRemoveBtn = document.createElement('button');
                    forwardRemoveBtn.className = 'remove-btn';
                    forwardRemoveBtn.innerHTML = '×';
                    forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
                    forwardBlock.appendChild(forwardRemoveBtn);
                    nestedArea.appendChild(forwardWrapper);
                    nestedArea.classList.remove('empty');
                    
                } else {
                    // 1 seule case: un seul bloc avancer
                    const forwardHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    addBlockToProgram({ type: 'forward', html: forwardHTML });
                }
            }
            
        }
        
        // Fonction spéciale pour générer le déplacement initial pour le damier (garantit orientation vers le haut)
        function generateInitialMovementForCheckerboard(deltaRow, deltaCol) {
            
            // La tortue commence orientée vers le HAUT
            // On va se déplacer et finir toujours orienté vers le HAUT
            
            // ÉTAPE 1: Déplacement HORIZONTAL (gauche/droite)
            if (deltaCol !== 0) {
                const absCol = Math.abs(deltaCol);
                
                // Tourner dans la bonne direction
                if (deltaCol > 0) {
                    // Aller à DROITE
                    const turnRightHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML });
                } else {
                    // Aller à GAUCHE
                    const turnLeftHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
                    addBlockToProgram({ type: 'left', html: turnLeftHTML });
                }
                
                // Avancer horizontalement
                if (absCol > 1) {
                    const loopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${absCol}" min="1" max="100" onclick="event.stopPropagation()"></span> fois</div>`;
                    addBlockToProgram({ 
                        type: 'repeat',
                        html: loopHTML
                    });
                    
                    const programBlocks = document.getElementById('program-blocks');
                    const loopBlock = programBlocks.lastElementChild;
                    const nestedArea = loopBlock.querySelector('.nested-blocks');
                    
                    const forwardWrapper = document.createElement('div');
                    forwardWrapper.className = 'program-block';
                    forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    const forwardBlock = forwardWrapper.querySelector('.block');
                    const forwardRemoveBtn = document.createElement('button');
                    forwardRemoveBtn.className = 'remove-btn';
                    forwardRemoveBtn.innerHTML = '×';
                    forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
                    forwardBlock.appendChild(forwardRemoveBtn);
                    nestedArea.appendChild(forwardWrapper);
                    nestedArea.classList.remove('empty');
                    
                } else {
                    const forwardHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    addBlockToProgram({ type: 'forward', html: forwardHTML });
                }
                
                // IMPORTANT: Se réorienter vers le HAUT après le déplacement horizontal
                if (deltaCol > 0) {
                    // On était orienté à droite, tourner à gauche pour regarder vers le haut
                    const turnLeftHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
                    addBlockToProgram({ type: 'left', html: turnLeftHTML });
                } else {
                    // On était orienté à gauche, tourner à droite pour regarder vers le haut
                    const turnRightHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML });
                }
            }
            
            // ÉTAPE 2: Déplacement VERTICAL (on est maintenant orienté vers le haut)
            if (deltaRow !== 0) {
                if (deltaRow > 0) {
                    // On doit DESCENDRE: faire demi-tour
                    const turnRightHTML1 = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML1 });
                    const turnRightHTML2 = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML2 });
                }
                // Sinon on monte, on est déjà bien orienté vers le haut
                
                const absRow = Math.abs(deltaRow);
                
                if (absRow > 1) {
                    const loopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${absRow}" min="1" max="100" onclick="event.stopPropagation()"></span> fois</div>`;
                    addBlockToProgram({ 
                        type: 'repeat',
                        html: loopHTML
                    });
                    
                    const programBlocks = document.getElementById('program-blocks');
                    const loopBlock = programBlocks.lastElementChild;
                    const nestedArea = loopBlock.querySelector('.nested-blocks');
                    
                    const forwardWrapper = document.createElement('div');
                    forwardWrapper.className = 'program-block';
                    forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    const forwardBlock = forwardWrapper.querySelector('.block');
                    const forwardRemoveBtn = document.createElement('button');
                    forwardRemoveBtn.className = 'remove-btn';
                    forwardRemoveBtn.innerHTML = '×';
                    forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
                    forwardBlock.appendChild(forwardRemoveBtn);
                    nestedArea.appendChild(forwardWrapper);
                    nestedArea.classList.remove('empty');
                    
                } else {
                    const forwardHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    addBlockToProgram({ type: 'forward', html: forwardHTML });
                }
                
                // IMPORTANT: Si on a descendu, faire demi-tour pour revenir orienté vers le haut
                if (deltaRow > 0) {
                    const turnRightHTML1 = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML1 });
                    const turnRightHTML2 = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    addBlockToProgram({ type: 'right', html: turnRightHTML2 });
                }
            }
            
        }
        
        // Générer le programme pour la spirale
        function generateSpiralProgram() {
            
            // Générer une valeur aléatoire pour i entre 3 et 10
            const randomI = Math.floor(Math.random() * 8) + 3; // 3 à 10 inclus
            
            // Choisir une couleur aléatoire
            const colors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
            const colorNames = {
                'red': 'ROUGE',
                'yellow': 'JAUNE',
                'green': 'VERT',
                'blue': 'BLEU',
                'pink': 'ROSE',
                'black': 'NOIR'
            };
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomColorName = colorNames[randomColor];
            
            // Choisir aléatoirement le sens de rotation de la spirale
            const clockwise = Math.random() < 0.5; // true = sens horaire (droite), false = sens antihoraire (gauche)
            const initialTurn = clockwise ? 'right' : 'left';
            const initialTurnName = clockwise ? 'droite' : 'gauche';
            const loopTurn = clockwise ? 'left' : 'right'; // Rotation opposée dans la boucle
            const loopTurnName = clockwise ? 'gauche' : 'droite';
            
            // Générer une position de départ aléatoire sur la grille (10x10)
            // Position de départ actuelle : (9, 5) - on va aller ailleurs
            // Pour avoir de la marge pour la spirale, on évite les bords
            const targetRow = Math.floor(Math.random() * 6) + 2; // 2 à 7
            const targetCol = Math.floor(Math.random() * 6) + 2; // 2 à 7
            
            // Calculer le déplacement depuis la position de départ (9, 5)
            const startRow = 9;
            const startCol = 5;
            const deltaRow = targetRow - startRow; // négatif = monter, positif = descendre
            const deltaCol = targetCol - startCol; // négatif = gauche, positif = droite
            
            // Ajouter la variable 'i' si elle n'existe pas déjà
            if (!createdVariables.includes('i')) {
                createdVariables.push('i');
                variables['i'] = randomI;
                updateVariableDisplay();
            } else {
                variables['i'] = randomI;
                updateVariableDisplay();
            }
            
            // Générer les blocs de déplacement initial (optimisés avec boucles si nécessaire)
            generateInitialMovement(deltaRow, deltaCol);
            
            // 1. Créer le bloc "mettre i à [valeur aléatoire]"
            const varHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomI}" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varHTML,
                selectValues: ['i']
            });
            
            // 2. Créer le bloc "couleur [COULEUR ALÉATOIRE]" pour colorier la première case
            const firstColorHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            addBlockToProgram({ 
                type: 'color',
                html: firstColorHTML,
                value: randomColor
            });
            
            // 3. Créer le bloc "tourner [direction aléatoire]"
            const initialTurnHTML = `<div class="block motion" data-type="${initialTurn}">tourner ${clockwise ? '↻' : '↺'} ${initialTurnName}</div>`;
            addBlockToProgram({ 
                type: initialTurn,
                html: initialTurnHTML 
            });
            
            // 4. Créer la boucle principale "répéter i fois"
            const mainLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            addBlockToProgram({ 
                type: 'repeat',
                html: mainLoopHTML
            });
            
            // Récupérer la zone imbriquée de la boucle principale et son value-slot
            const programBlocks = document.getElementById('program-blocks');
            const mainLoopBlock = programBlocks.lastElementChild;
            const mainLoopValueSlot = mainLoopBlock.querySelector('.value-slot');
            const mainNestedArea = mainLoopBlock.querySelector('.nested-blocks');
            
            // Créer et insérer le bloc var-value "i" dans le value-slot de la boucle principale
            const mainVarBlock = document.createElement('div');
            mainVarBlock.className = 'block variables';
            mainVarBlock.setAttribute('data-type', 'var-value');
            mainVarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            mainLoopValueSlot.appendChild(mainVarBlock);
            
            
            // 4. Créer la boucle imbriquée "répéter i fois"
            const innerLoopWrapper = document.createElement('div');
            innerLoopWrapper.className = 'program-block block-capsule';
            const innerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            innerLoopWrapper.innerHTML = innerLoopHTML;
            
            // Créer et insérer le bloc var-value "i" dans le value-slot de la boucle imbriquée
            const innerLoopValueSlot = innerLoopWrapper.querySelector('.value-slot');
            const innerVarBlock = document.createElement('div');
            innerVarBlock.className = 'block variables';
            innerVarBlock.setAttribute('data-type', 'var-value');
            innerVarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            innerLoopValueSlot.appendChild(innerVarBlock);
            
            // Ajouter bouton de suppression à la boucle imbriquée
            const innerBlock = innerLoopWrapper.querySelector('.block');
            const innerRemoveBtn = document.createElement('button');
            innerRemoveBtn.className = 'remove-btn';
            innerRemoveBtn.innerHTML = '×';
            innerRemoveBtn.onclick = function() { innerLoopWrapper.remove(); updateBlockCount(); };
            innerBlock.appendChild(innerRemoveBtn);
            
            // Créer zone imbriquée pour la boucle intérieure
            const innerNestedArea = document.createElement('div');
            innerNestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(innerNestedArea);
            innerLoopWrapper.appendChild(innerNestedArea);
            
            // Ajouter le bas de la capsule
            const innerCapsuleBottom = document.createElement('div');
            innerCapsuleBottom.className = 'block-capsule-bottom';
            innerCapsuleBottom.style.background = getComputedStyle(innerBlock).background;
            innerLoopWrapper.appendChild(innerCapsuleBottom);
            
            mainNestedArea.appendChild(innerLoopWrapper);
            mainNestedArea.classList.remove('empty');
            
            // 5. Ajouter "avancer" dans la boucle intérieure
            const forwardWrapper = document.createElement('div');
            forwardWrapper.className = 'program-block';
            forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forwardBlock = forwardWrapper.querySelector('.block');
            const forwardRemoveBtn = document.createElement('button');
            forwardRemoveBtn.className = 'remove-btn';
            forwardRemoveBtn.innerHTML = '×';
            forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
            forwardBlock.appendChild(forwardRemoveBtn);
            innerNestedArea.appendChild(forwardWrapper);
            
            // 6. Ajouter "couleur [COULEUR ALÉATOIRE]" dans la boucle intérieure
            const colorWrapper = document.createElement('div');
            colorWrapper.className = 'program-block';
            colorWrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const colorBlock = colorWrapper.querySelector('.block');
            const colorRemoveBtn = document.createElement('button');
            colorRemoveBtn.className = 'remove-btn';
            colorRemoveBtn.innerHTML = '×';
            colorRemoveBtn.onclick = function() { colorWrapper.remove(); updateBlockCount(); };
            colorBlock.appendChild(colorRemoveBtn);
            innerNestedArea.appendChild(colorWrapper);
            innerNestedArea.classList.remove('empty');
            
            // 7. Ajouter "ajouter -1 à i" dans la boucle principale
            const changeVarWrapper = document.createElement('div');
            changeVarWrapper.className = 'program-block';
            changeVarWrapper.innerHTML = `<div class="block variables" data-type="change-var">ajouter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="-1" onclick="event.stopPropagation()"></span> à <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select></div>`;
            const changeVarBlock = changeVarWrapper.querySelector('.block');
            const changeVarRemoveBtn = document.createElement('button');
            changeVarRemoveBtn.className = 'remove-btn';
            changeVarRemoveBtn.innerHTML = '×';
            changeVarRemoveBtn.onclick = function() { changeVarWrapper.remove(); updateBlockCount(); };
            changeVarBlock.appendChild(changeVarRemoveBtn);
            mainNestedArea.appendChild(changeVarWrapper);
            
            // 8. Ajouter "tourner [direction opposée]" dans la boucle principale
            const loopTurnWrapper = document.createElement('div');
            loopTurnWrapper.className = 'program-block';
            loopTurnWrapper.innerHTML = `<div class="block motion" data-type="${loopTurn}">tourner ${clockwise ? '↺' : '↻'} ${loopTurnName}</div>`;
            const loopTurnBlock = loopTurnWrapper.querySelector('.block');
            const loopTurnRemoveBtn = document.createElement('button');
            loopTurnRemoveBtn.className = 'remove-btn';
            loopTurnRemoveBtn.innerHTML = '×';
            loopTurnRemoveBtn.onclick = function() { loopTurnWrapper.remove(); updateBlockCount(); };
            loopTurnBlock.appendChild(loopTurnRemoveBtn);
            mainNestedArea.appendChild(loopTurnWrapper);
            
            // Mettre à jour l'affichage des variables dans toute l'interface
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            updateBlockCount();
            
            showResult('✅ Programme Spirale généré avec succès !', true);
        }
        
        // Générer le programme pour le zigzag
        function generateZigzagProgram() {
            
            // La valeur initiale de i doit toujours être 1
            const randomI = 1;
            
            // Choisir une couleur aléatoire
            const colors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
            const colorNames = {
                'red': 'ROUGE',
                'yellow': 'JAUNE',
                'green': 'VERT',
                'blue': 'BLEU',
                'pink': 'ROSE',
                'black': 'NOIR'
            };
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomColorName = colorNames[randomColor];
            
            // Décider aléatoirement de l'orientation du zigzag
            // true = horizontal (va vers la droite)
            // false = vertical (va vers la gauche/vers le haut)
            const addInitialTurn = Math.random() < 0.5; // 50% de chances
            
            // Générer une position adaptée selon l'orientation
            let targetRow, targetCol;
            
            if (addInitialTurn) {
                // Zigzag HORIZONTAL (va vers la droite)
                // La flèche doit être dans la partie DROITE de la grille
                // Pour avoir de l'espace à droite, on place la flèche à gauche/centre
                // Colonnes : 1 à 5 (partie gauche/centre pour avoir de l'espace à droite)
                // Lignes : 1 à 8 (éviter les bords)
                targetCol = Math.floor(Math.random() * 5) + 1; // 1 à 5
                targetRow = Math.floor(Math.random() * 8) + 1; // 1 à 8
            } else {
                // Zigzag VERTICAL (va vers la gauche)
                // La flèche ne doit PAS être dans la partie supérieure
                // Lignes : 4 à 8 (partie basse/milieu, éviter le haut)
                // Colonnes : 1 à 8 (éviter les bords, besoin d'espace à gauche)
                targetRow = Math.floor(Math.random() * 5) + 4; // 4 à 8
                targetCol = Math.floor(Math.random() * 8) + 1; // 1 à 8
            }
            
            
            // Calculer les contraintes pour la taille du zigzag
            // Le zigzag se déplace horizontalement (largeur = loop1 × loop2)
            // Sens du zigzag dépend de addInitialTurn:
            // - Sans tourner droite: va vers la gauche
            // - Avec tourner droite: va vers la droite
            
            let maxWidth;
            if (addInitialTurn) {
                // Va vers la droite: maxWidth = colonnes disponibles à droite
                maxWidth = 9 - targetCol;
            } else {
                // Va vers la gauche: maxWidth = colonnes disponibles à gauche
                maxWidth = targetCol;
            }
            
            
            // Générer la boucle interne (entre 1 et 3)
            const innerLoop = Math.floor(Math.random() * 3) + 1; // 1 à 3
            
            // Définir la plage pour la boucle externe selon la boucle interne
            let minOuterLoop, maxOuterLoop;
            
            if (innerLoop === 3) {
                // Si innerLoop = 3, outerLoop doit être 3
                minOuterLoop = 3;
                maxOuterLoop = 3;
            } else if (innerLoop === 2) {
                // Si innerLoop = 2, outerLoop entre 3 et 5
                minOuterLoop = 3;
                maxOuterLoop = 5;
            } else { // innerLoop === 1
                // Si innerLoop = 1, outerLoop entre 4 et 10
                minOuterLoop = 4;
                maxOuterLoop = 10;
            }
            
            // Vérifier que le zigzag ne dépasse pas le bord
            // largeur_totale = outerLoop × innerLoop <= maxWidth
            const absoluteMaxOuterLoop = Math.floor(maxWidth / innerLoop);
            
            // Ajuster maxOuterLoop si nécessaire
            if (absoluteMaxOuterLoop < maxOuterLoop) {
                maxOuterLoop = absoluteMaxOuterLoop;
            }
            
            // Si l'espace disponible est insuffisant, réduire aussi minOuterLoop
            if (absoluteMaxOuterLoop < minOuterLoop) {
                minOuterLoop = Math.max(2, absoluteMaxOuterLoop); // Au minimum 2 pour avoir un zigzag
            }
            
            // Générer outerLoop dans la plage autorisée
            let outerLoop;
            if (maxOuterLoop >= minOuterLoop) {
                outerLoop = Math.floor(Math.random() * (maxOuterLoop - minOuterLoop + 1)) + minOuterLoop;
            } else {
                // Pas assez d'espace, utiliser le maximum possible
                outerLoop = Math.max(2, absoluteMaxOuterLoop);
            }
            
            
            // Calculer le déplacement depuis la position de départ (9, 5)
            const startRow = 9;
            const startCol = 5;
            const deltaRow = targetRow - startRow;
            const deltaCol = targetCol - startCol;
            
            // Ajouter la variable 'i' si elle n'existe pas déjà
            if (!createdVariables.includes('i')) {
                createdVariables.push('i');
                variables['i'] = randomI;
                updateVariableDisplay();
            } else {
                variables['i'] = randomI;
                updateVariableDisplay();
            }
            
            // Générer les blocs de déplacement initial avec garantie d'orientation vers le haut
            generateInitialMovementForCheckerboard(deltaRow, deltaCol);
            
            // 1. Créer le bloc "mettre i à 1"
            const varHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomI}" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varHTML,
                selectValues: ['i']
            });
            
            // 2. Optionnellement ajouter "tourner droite" au début
            if (addInitialTurn) {
                const initialTurnHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
                addBlockToProgram({ 
                    type: 'right',
                    html: initialTurnHTML 
                });
            }
            
            // 3. Créer la première boucle "répéter [outerLoop] fois"
            const outerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${outerLoop}" onclick="event.stopPropagation()"></span> fois</div>`;
            addBlockToProgram({ 
                type: 'repeat',
                html: outerLoopHTML
            });
            
            const programBlocks = document.getElementById('program-blocks');
            const outerLoopBlock = programBlocks.lastElementChild;
            const outerNestedArea = outerLoopBlock.querySelector('.nested-blocks');
            
            // 4. Créer la deuxième boucle "répéter [innerLoop] fois" dans la première
            const innerLoopWrapper = document.createElement('div');
            innerLoopWrapper.className = 'program-block block-capsule';
            const innerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${innerLoop}" onclick="event.stopPropagation()"></span> fois</div>`;
            innerLoopWrapper.innerHTML = innerLoopHTML;
            
            const innerLoopBlock = innerLoopWrapper.querySelector('.block');
            const innerLoopRemoveBtn = document.createElement('button');
            innerLoopRemoveBtn.className = 'remove-btn';
            innerLoopRemoveBtn.innerHTML = '×';
            innerLoopRemoveBtn.onclick = function() { innerLoopWrapper.remove(); updateBlockCount(); };
            innerLoopBlock.appendChild(innerLoopRemoveBtn);
            
            const innerNestedArea = document.createElement('div');
            innerNestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(innerNestedArea);
            innerLoopWrapper.appendChild(innerNestedArea);
            
            const innerCapsuleBottom = document.createElement('div');
            innerCapsuleBottom.className = 'block-capsule-bottom';
            innerCapsuleBottom.style.background = getComputedStyle(innerLoopBlock).background;
            innerLoopWrapper.appendChild(innerCapsuleBottom);
            
            outerNestedArea.appendChild(innerLoopWrapper);
            outerNestedArea.classList.remove('empty');
            
            // 5. Ajouter "couleur" dans la boucle interne
            const colorWrapper = document.createElement('div');
            colorWrapper.className = 'program-block';
            colorWrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const colorBlock = colorWrapper.querySelector('.block');
            const colorRemoveBtn = document.createElement('button');
            colorRemoveBtn.className = 'remove-btn';
            colorRemoveBtn.innerHTML = '×';
            colorRemoveBtn.onclick = function() { colorWrapper.remove(); updateBlockCount(); };
            colorBlock.appendChild(colorRemoveBtn);
            innerNestedArea.appendChild(colorWrapper);
            innerNestedArea.classList.remove('empty');
            
            // 6. Ajouter "avancer" dans la boucle interne
            const forwardWrapper = document.createElement('div');
            forwardWrapper.className = 'program-block';
            forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forwardBlock = forwardWrapper.querySelector('.block');
            const forwardRemoveBtn = document.createElement('button');
            forwardRemoveBtn.className = 'remove-btn';
            forwardRemoveBtn.innerHTML = '×';
            forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
            forwardBlock.appendChild(forwardRemoveBtn);
            innerNestedArea.appendChild(forwardWrapper);
            
            // 7. Première condition "si i = 1 alors"
            const if1Wrapper = document.createElement('div');
            if1Wrapper.className = 'program-block block-capsule';
            if1Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="i" selected>i</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if1Block = if1Wrapper.querySelector('.block');
            const if1RemoveBtn = document.createElement('button');
            if1RemoveBtn.className = 'remove-btn';
            if1RemoveBtn.innerHTML = '×';
            if1RemoveBtn.onclick = function() { if1Wrapper.remove(); updateBlockCount(); };
            if1Block.appendChild(if1RemoveBtn);
            
            const if1NestedArea = document.createElement('div');
            if1NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if1NestedArea);
            if1Wrapper.appendChild(if1NestedArea);
            
            const if1CapsuleBottom = document.createElement('div');
            if1CapsuleBottom.className = 'block-capsule-bottom';
            if1CapsuleBottom.style.background = getComputedStyle(if1Block).background;
            if1Wrapper.appendChild(if1CapsuleBottom);
            
            innerNestedArea.appendChild(if1Wrapper);
            
            // Ajouter les blocs dans if1: tourner gauche, avancer, tourner droite
            const left1Wrapper = document.createElement('div');
            left1Wrapper.className = 'program-block';
            left1Wrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const left1Block = left1Wrapper.querySelector('.block');
            const left1RemoveBtn = document.createElement('button');
            left1RemoveBtn.className = 'remove-btn';
            left1RemoveBtn.innerHTML = '×';
            left1RemoveBtn.onclick = function() { left1Wrapper.remove(); updateBlockCount(); };
            left1Block.appendChild(left1RemoveBtn);
            if1NestedArea.appendChild(left1Wrapper);
            
            const forward1Wrapper = document.createElement('div');
            forward1Wrapper.className = 'program-block';
            forward1Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward1Block = forward1Wrapper.querySelector('.block');
            const forward1RemoveBtn = document.createElement('button');
            forward1RemoveBtn.className = 'remove-btn';
            forward1RemoveBtn.innerHTML = '×';
            forward1RemoveBtn.onclick = function() { forward1Wrapper.remove(); updateBlockCount(); };
            forward1Block.appendChild(forward1RemoveBtn);
            if1NestedArea.appendChild(forward1Wrapper);
            
            const right1Wrapper = document.createElement('div');
            right1Wrapper.className = 'program-block';
            right1Wrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const right1Block = right1Wrapper.querySelector('.block');
            const right1RemoveBtn = document.createElement('button');
            right1RemoveBtn.className = 'remove-btn';
            right1RemoveBtn.innerHTML = '×';
            right1RemoveBtn.onclick = function() { right1Wrapper.remove(); updateBlockCount(); };
            right1Block.appendChild(right1RemoveBtn);
            if1NestedArea.appendChild(right1Wrapper);
            if1NestedArea.classList.remove('empty');
            
            // 8. Deuxième condition "si i = -1 alors"
            const if2Wrapper = document.createElement('div');
            if2Wrapper.className = 'program-block block-capsule';
            if2Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="i" selected>i</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="-1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if2Block = if2Wrapper.querySelector('.block');
            const if2RemoveBtn = document.createElement('button');
            if2RemoveBtn.className = 'remove-btn';
            if2RemoveBtn.innerHTML = '×';
            if2RemoveBtn.onclick = function() { if2Wrapper.remove(); updateBlockCount(); };
            if2Block.appendChild(if2RemoveBtn);
            
            const if2NestedArea = document.createElement('div');
            if2NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if2NestedArea);
            if2Wrapper.appendChild(if2NestedArea);
            
            const if2CapsuleBottom = document.createElement('div');
            if2CapsuleBottom.className = 'block-capsule-bottom';
            if2CapsuleBottom.style.background = getComputedStyle(if2Block).background;
            if2Wrapper.appendChild(if2CapsuleBottom);
            
            innerNestedArea.appendChild(if2Wrapper);
            
            // Ajouter les blocs dans if2: tourner droite, avancer, tourner gauche
            const right2Wrapper = document.createElement('div');
            right2Wrapper.className = 'program-block';
            right2Wrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const right2Block = right2Wrapper.querySelector('.block');
            const right2RemoveBtn = document.createElement('button');
            right2RemoveBtn.className = 'remove-btn';
            right2RemoveBtn.innerHTML = '×';
            right2RemoveBtn.onclick = function() { right2Wrapper.remove(); updateBlockCount(); };
            right2Block.appendChild(right2RemoveBtn);
            if2NestedArea.appendChild(right2Wrapper);
            
            const forward2Wrapper = document.createElement('div');
            forward2Wrapper.className = 'program-block';
            forward2Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward2Block = forward2Wrapper.querySelector('.block');
            const forward2RemoveBtn = document.createElement('button');
            forward2RemoveBtn.className = 'remove-btn';
            forward2RemoveBtn.innerHTML = '×';
            forward2RemoveBtn.onclick = function() { forward2Wrapper.remove(); updateBlockCount(); };
            forward2Block.appendChild(forward2RemoveBtn);
            if2NestedArea.appendChild(forward2Wrapper);
            
            const left2Wrapper = document.createElement('div');
            left2Wrapper.className = 'program-block';
            left2Wrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const left2Block = left2Wrapper.querySelector('.block');
            const left2RemoveBtn = document.createElement('button');
            left2RemoveBtn.className = 'remove-btn';
            left2RemoveBtn.innerHTML = '×';
            left2RemoveBtn.onclick = function() { left2Wrapper.remove(); updateBlockCount(); };
            left2Block.appendChild(left2RemoveBtn);
            if2NestedArea.appendChild(left2Wrapper);
            if2NestedArea.classList.remove('empty');
            
            // 9. Ajouter "mettre i à (i × -1)" dans la boucle externe (après la boucle interne)
            function createOperatorInValueSlot(varBlock, var1Name, operator, var2Name) {
                const valueSlot = varBlock.querySelector('.value-slot');
                
                const operatorBlock = document.createElement('div');
                operatorBlock.className = 'block operators';
                operatorBlock.setAttribute('data-type', 'operator');
                
                const firstSlotHTML = `<span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
                const operatorHTML = `<select onclick="event.stopPropagation()"><option value="${operator}">${operator === '*' ? '×' : operator === '/' ? '÷' : operator}</option></select>`;
                const secondSlotHTML = `<span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
                
                operatorBlock.innerHTML = firstSlotHTML + operatorHTML + secondSlotHTML;
                
                const var1Block = document.createElement('div');
                var1Block.className = 'block variables';
                var1Block.setAttribute('data-type', 'var-value');
                var1Block.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="${var1Name}" selected>${var1Name}</option></select>`;
                
                const firstSlot = operatorBlock.querySelectorAll('.value-slot')[0];
                firstSlot.appendChild(var1Block);
                
                const secondSlot = operatorBlock.querySelectorAll('.value-slot')[1];
                if (var2Name === '-1' || var2Name === '1') {
                    secondSlot.innerHTML = `<input type="text" value="${var2Name}" onclick="event.stopPropagation()">`;
                } else {
                    const var2Block = document.createElement('div');
                    var2Block.className = 'block variables';
                    var2Block.setAttribute('data-type', 'var-value');
                    var2Block.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="${var2Name}" selected>${var2Name}</option></select>`;
                    secondSlot.appendChild(var2Block);
                }
                
                valueSlot.appendChild(operatorBlock);
            }
            
            const setIWrapper = document.createElement('div');
            setIWrapper.className = 'program-block';
            const setIBlock = document.createElement('div');
            setIBlock.className = 'block variables';
            setIBlock.setAttribute('data-type', 'variable');
            setIBlock.innerHTML = `mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
            createOperatorInValueSlot(setIBlock, 'i', '*', '-1');
            const setIRemoveBtn = document.createElement('button');
            setIRemoveBtn.className = 'remove-btn';
            setIRemoveBtn.innerHTML = '×';
            setIRemoveBtn.onclick = function() { setIWrapper.remove(); updateBlockCount(); };
            setIBlock.appendChild(setIRemoveBtn);
            setIWrapper.appendChild(setIBlock);
            outerNestedArea.appendChild(setIWrapper);
            
            // Mettre à jour l'affichage
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            updateBlockCount();
            
            showResult('✅ Programme Zigzag généré avec succès !', true);
        }
        
        // Générer le programme pour l'escalier
        function generateStairsProgram() {
            
            // La valeur initiale de i doit toujours être 1
            const randomI = 1;
            
            // Générer une position de départ aléatoire sur la grille (10x10)
            // Pour garantir un escalier minimum 2×2, on évite la dernière ligne et la dernière colonne
            // Pour Y : entre 1 et 8 (pas 0 ni 9) pour avoir au moins 2 lignes
            // Pour X : entre 0 et 8 (pas 9, qui est la 10ème case) pour avoir au moins 2 colonnes
            const targetRow = Math.floor(Math.random() * 8) + 1; // 1 à 8
            const targetCol = Math.floor(Math.random() * 9); // 0 à 8
            
            // Calculer le nombre maximum de répétitions en fonction de la position X
            // Si targetCol = 0 (1ère case), max = 10 répétitions
            // Si targetCol = 8 (9ème case), max = 2 répétitions
            const maxRepeatX = 10 - targetCol;
            
            // Calculer le nombre maximum de répétitions en fonction de la position Y
            // L'escalier monte d'une case à chaque itération
            // Si targetRow = 1 (2ème ligne), max = 2 répétitions (min garanti)
            // Si targetRow = 8 (9ème ligne), max = 9 répétitions
            const maxRepeatY = targetRow + 1;
            
            // Prendre le minimum des deux contraintes
            const maxRepeat = Math.min(maxRepeatX, maxRepeatY);
            
            // Générer un nombre aléatoire de répétitions entre 2 et maxRepeat
            const minRepeat = 2;
            const randomRepeat = maxRepeat >= minRepeat ? 
                Math.floor(Math.random() * (maxRepeat - minRepeat + 1)) + minRepeat : 
                maxRepeat;
            
            // Choisir une couleur aléatoire
            const colors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
            const colorNames = {
                'red': 'ROUGE',
                'yellow': 'JAUNE',
                'green': 'VERT',
                'blue': 'BLEU',
                'pink': 'ROSE',
                'black': 'NOIR'
            };
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomColorName = colorNames[randomColor];
            
            // Calculer le déplacement depuis la position de départ (9, 5)
            const startRow = 9;
            const startCol = 5;
            const deltaRow = targetRow - startRow;
            const deltaCol = targetCol - startCol;
            
            // Ajouter la variable 'i' si elle n'existe pas déjà
            if (!createdVariables.includes('i')) {
                createdVariables.push('i');
                variables['i'] = randomI;
                updateVariableDisplay();
            } else {
                variables['i'] = randomI;
                updateVariableDisplay();
            }
            
            // Générer les blocs de déplacement initial avec garantie d'orientation vers le haut
            generateInitialMovementForCheckerboard(deltaRow, deltaCol);
            
            // 1. Créer le bloc "mettre i à 1"
            const varHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomI}" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varHTML,
                selectValues: ['i']
            });
            
            // 2. Créer la boucle principale "répéter [randomRepeat] fois"
            const mainLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomRepeat}" onclick="event.stopPropagation()"></span> fois</div>`;
            addBlockToProgram({ 
                type: 'repeat',
                html: mainLoopHTML
            });
            
            // Récupérer la zone imbriquée de la boucle principale
            const programBlocks = document.getElementById('program-blocks');
            const mainLoopBlock = programBlocks.lastElementChild;
            const mainNestedArea = mainLoopBlock.querySelector('.nested-blocks');
            
            // 3. Créer la première boucle imbriquée "répéter i fois"
            const firstInnerLoopWrapper = document.createElement('div');
            firstInnerLoopWrapper.className = 'program-block block-capsule';
            const firstInnerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            firstInnerLoopWrapper.innerHTML = firstInnerLoopHTML;
            
            // Créer et insérer le bloc var-value "i" dans le value-slot de la première boucle imbriquée
            const firstInnerLoopValueSlot = firstInnerLoopWrapper.querySelector('.value-slot');
            const firstInnerVarBlock = document.createElement('div');
            firstInnerVarBlock.className = 'block variables';
            firstInnerVarBlock.setAttribute('data-type', 'var-value');
            firstInnerVarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            firstInnerLoopValueSlot.appendChild(firstInnerVarBlock);
            
            // Ajouter bouton de suppression à la première boucle imbriquée
            const firstInnerBlock = firstInnerLoopWrapper.querySelector('.block');
            const firstInnerRemoveBtn = document.createElement('button');
            firstInnerRemoveBtn.className = 'remove-btn';
            firstInnerRemoveBtn.innerHTML = '×';
            firstInnerRemoveBtn.onclick = function() { firstInnerLoopWrapper.remove(); updateBlockCount(); };
            firstInnerBlock.appendChild(firstInnerRemoveBtn);
            
            // Créer zone imbriquée pour la première boucle intérieure
            const firstInnerNestedArea = document.createElement('div');
            firstInnerNestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(firstInnerNestedArea);
            firstInnerLoopWrapper.appendChild(firstInnerNestedArea);
            
            // Ajouter le bas de la capsule
            const firstInnerCapsuleBottom = document.createElement('div');
            firstInnerCapsuleBottom.className = 'block-capsule-bottom';
            firstInnerCapsuleBottom.style.background = getComputedStyle(firstInnerBlock).background;
            firstInnerLoopWrapper.appendChild(firstInnerCapsuleBottom);
            
            mainNestedArea.appendChild(firstInnerLoopWrapper);
            mainNestedArea.classList.remove('empty');
            
            // 4. Ajouter "couleur [COULEUR ALÉATOIRE]" dans la première boucle imbriquée
            const colorWrapper = document.createElement('div');
            colorWrapper.className = 'program-block';
            colorWrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const colorBlock = colorWrapper.querySelector('.block');
            const colorRemoveBtn = document.createElement('button');
            colorRemoveBtn.className = 'remove-btn';
            colorRemoveBtn.innerHTML = '×';
            colorRemoveBtn.onclick = function() { colorWrapper.remove(); updateBlockCount(); };
            colorBlock.appendChild(colorRemoveBtn);
            firstInnerNestedArea.appendChild(colorWrapper);
            firstInnerNestedArea.classList.remove('empty');
            
            // 5. Ajouter "avancer" dans la première boucle imbriquée
            const forwardWrapper = document.createElement('div');
            forwardWrapper.className = 'program-block';
            forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forwardBlock = forwardWrapper.querySelector('.block');
            const forwardRemoveBtn = document.createElement('button');
            forwardRemoveBtn.className = 'remove-btn';
            forwardRemoveBtn.innerHTML = '×';
            forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
            forwardBlock.appendChild(forwardRemoveBtn);
            firstInnerNestedArea.appendChild(forwardWrapper);
            
            // 6. Créer la deuxième boucle imbriquée "répéter i fois"
            const secondInnerLoopWrapper = document.createElement('div');
            secondInnerLoopWrapper.className = 'program-block block-capsule';
            const secondInnerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            secondInnerLoopWrapper.innerHTML = secondInnerLoopHTML;
            
            // Créer et insérer le bloc var-value "i" dans le value-slot de la deuxième boucle imbriquée
            const secondInnerLoopValueSlot = secondInnerLoopWrapper.querySelector('.value-slot');
            const secondInnerVarBlock = document.createElement('div');
            secondInnerVarBlock.className = 'block variables';
            secondInnerVarBlock.setAttribute('data-type', 'var-value');
            secondInnerVarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            secondInnerLoopValueSlot.appendChild(secondInnerVarBlock);
            
            // Ajouter bouton de suppression à la deuxième boucle imbriquée
            const secondInnerBlock = secondInnerLoopWrapper.querySelector('.block');
            const secondInnerRemoveBtn = document.createElement('button');
            secondInnerRemoveBtn.className = 'remove-btn';
            secondInnerRemoveBtn.innerHTML = '×';
            secondInnerRemoveBtn.onclick = function() { secondInnerLoopWrapper.remove(); updateBlockCount(); };
            secondInnerBlock.appendChild(secondInnerRemoveBtn);
            
            // Créer zone imbriquée pour la deuxième boucle intérieure
            const secondInnerNestedArea = document.createElement('div');
            secondInnerNestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(secondInnerNestedArea);
            secondInnerLoopWrapper.appendChild(secondInnerNestedArea);
            
            // Ajouter le bas de la capsule
            const secondInnerCapsuleBottom = document.createElement('div');
            secondInnerCapsuleBottom.className = 'block-capsule-bottom';
            secondInnerCapsuleBottom.style.background = getComputedStyle(secondInnerBlock).background;
            secondInnerLoopWrapper.appendChild(secondInnerCapsuleBottom);
            
            mainNestedArea.appendChild(secondInnerLoopWrapper);
            
            // 7. Ajouter "reculer" dans la deuxième boucle imbriquée
            const backWrapper = document.createElement('div');
            backWrapper.className = 'program-block';
            backWrapper.innerHTML = '<div class="block motion" data-type="back">reculer</div>';
            const backBlock = backWrapper.querySelector('.block');
            const backRemoveBtn = document.createElement('button');
            backRemoveBtn.className = 'remove-btn';
            backRemoveBtn.innerHTML = '×';
            backRemoveBtn.onclick = function() { backWrapper.remove(); updateBlockCount(); };
            backBlock.appendChild(backRemoveBtn);
            secondInnerNestedArea.appendChild(backWrapper);
            secondInnerNestedArea.classList.remove('empty');
            
            // 8. Ajouter "tourner droite" dans la boucle principale
            const rightTurnWrapper = document.createElement('div');
            rightTurnWrapper.className = 'program-block';
            rightTurnWrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const rightTurnBlock = rightTurnWrapper.querySelector('.block');
            const rightTurnRemoveBtn = document.createElement('button');
            rightTurnRemoveBtn.className = 'remove-btn';
            rightTurnRemoveBtn.innerHTML = '×';
            rightTurnRemoveBtn.onclick = function() { rightTurnWrapper.remove(); updateBlockCount(); };
            rightTurnBlock.appendChild(rightTurnRemoveBtn);
            mainNestedArea.appendChild(rightTurnWrapper);
            
            // 9. Ajouter "avancer" dans la boucle principale
            const forward2Wrapper = document.createElement('div');
            forward2Wrapper.className = 'program-block';
            forward2Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward2Block = forward2Wrapper.querySelector('.block');
            const forward2RemoveBtn = document.createElement('button');
            forward2RemoveBtn.className = 'remove-btn';
            forward2RemoveBtn.innerHTML = '×';
            forward2RemoveBtn.onclick = function() { forward2Wrapper.remove(); updateBlockCount(); };
            forward2Block.appendChild(forward2RemoveBtn);
            mainNestedArea.appendChild(forward2Wrapper);
            
            // 10. Ajouter "tourner gauche" dans la boucle principale
            const leftTurnWrapper = document.createElement('div');
            leftTurnWrapper.className = 'program-block';
            leftTurnWrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const leftTurnBlock = leftTurnWrapper.querySelector('.block');
            const leftTurnRemoveBtn = document.createElement('button');
            leftTurnRemoveBtn.className = 'remove-btn';
            leftTurnRemoveBtn.innerHTML = '×';
            leftTurnRemoveBtn.onclick = function() { leftTurnWrapper.remove(); updateBlockCount(); };
            leftTurnBlock.appendChild(leftTurnRemoveBtn);
            mainNestedArea.appendChild(leftTurnWrapper);
            
            // 11. Ajouter "ajouter 1 à i" dans la boucle principale
            const changeVarWrapper = document.createElement('div');
            changeVarWrapper.className = 'program-block';
            changeVarWrapper.innerHTML = `<div class="block variables" data-type="change-var">ajouter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="1" onclick="event.stopPropagation()"></span> à <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select></div>`;
            const changeVarBlock = changeVarWrapper.querySelector('.block');
            const changeVarRemoveBtn = document.createElement('button');
            changeVarRemoveBtn.className = 'remove-btn';
            changeVarRemoveBtn.innerHTML = '×';
            changeVarRemoveBtn.onclick = function() { changeVarWrapper.remove(); updateBlockCount(); };
            changeVarBlock.appendChild(changeVarRemoveBtn);
            mainNestedArea.appendChild(changeVarWrapper);
            
            // Mettre à jour l'affichage des variables dans toute l'interface
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            updateBlockCount();
            
            showResult('✅ Programme Escalier généré avec succès !', true);
        }
        
        // Générer le programme pour le damier
        function generateCheckerboardProgram() {
            
            // Choisir une couleur aléatoire
            const colors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
            const colorNames = {
                'red': 'ROUGE',
                'yellow': 'JAUNE',
                'green': 'VERT',
                'blue': 'BLEU',
                'pink': 'ROSE',
                'black': 'NOIR'
            };
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomColorName = colorNames[randomColor];
            
            // Générer une position de départ aléatoire sur la grille (10x10)
            // Pour garantir un damier minimum 2×2, on évite la dernière ligne et la dernière colonne
            // targetRow : 0 à 8 (pas 9, qui est la dernière ligne)
            // targetCol : 0 à 8 (pas 9, qui est la dernière colonne)
            const targetRow = Math.floor(Math.random() * 9); // 0 à 8
            const targetCol = Math.floor(Math.random() * 9); // 0 à 8
            
            // Calculer le nombre maximum de colonnes et de lignes
            // Colonnes : on va vers la droite (minimum 2 colonnes garanties)
            const maxCols = 10 - targetCol;
            // Lignes : répéter s fois fait s+1 lignes (minimum 2 lignes garanties car targetRow <= 8)
            const maxRows = targetRow;
            
            // Générer des valeurs aléatoires entre 2 et le max
            const minValue = 2;
            const randomCols = maxCols >= minValue ? 
                Math.floor(Math.random() * (maxCols - minValue + 1)) + minValue : 
                maxCols;
            const randomRows = maxRows >= minValue ? 
                Math.floor(Math.random() * (maxRows - minValue + 1)) + minValue : 
                maxRows;
            
            
            // Calculer le déplacement depuis la position de départ (9, 5)
            const startRow = 9;
            const startCol = 5;
            const deltaRow = targetRow - startRow;
            const deltaCol = targetCol - startCol;
            
            // Créer les variables i et p seulement (pas a)
            const varNames = ['i', 'p'];
            const varValues = {'i': 1, 'p': 1};
            
            varNames.forEach(varName => {
                if (!createdVariables.includes(varName)) {
                    createdVariables.push(varName);
                }
                variables[varName] = varValues[varName];
            });
            updateVariableDisplay();
            
            // Générer les blocs de déplacement initial avec garantie d'orientation vers le haut
            generateInitialMovementForCheckerboard(deltaRow, deltaCol);
            
            // Fonction auxiliaire pour créer des blocs avec opérateurs
            function createOperatorInValueSlot(varBlock, var1Name, operator, var2Name) {
                const valueSlot = varBlock.querySelector('.value-slot');
                
                const operatorBlock = document.createElement('div');
                operatorBlock.className = 'block operators';
                operatorBlock.setAttribute('data-type', 'operator');
                
                // Créer le premier value-slot avec variable
                const firstSlotHTML = `<span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
                const operatorHTML = `<select onclick="event.stopPropagation()"><option value="${operator}">${operator === '*' ? '×' : operator === '/' ? '÷' : operator}</option></select>`;
                const secondSlotHTML = `<span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
                
                operatorBlock.innerHTML = firstSlotHTML + operatorHTML + secondSlotHTML;
                
                // Créer le premier bloc variable
                const var1Block = document.createElement('div');
                var1Block.className = 'block variables';
                var1Block.setAttribute('data-type', 'var-value');
                var1Block.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="${var1Name}" selected>${var1Name}</option></select>`;
                
                // Insérer dans le premier slot
                const firstSlot = operatorBlock.querySelectorAll('.value-slot')[0];
                firstSlot.appendChild(var1Block);
                
                // Gérer le deuxième slot (peut être une variable ou un nombre)
                const secondSlot = operatorBlock.querySelectorAll('.value-slot')[1];
                if (var2Name === '-1' || var2Name === '1') {
                    // C'est un nombre
                    secondSlot.innerHTML = `<input type="text" value="${var2Name}" onclick="event.stopPropagation()">`;
                } else {
                    // C'est une variable
                    const var2Block = document.createElement('div');
                    var2Block.className = 'block variables';
                    var2Block.setAttribute('data-type', 'var-value');
                    var2Block.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="${var2Name}" selected>${var2Name}</option></select>`;
                    secondSlot.appendChild(var2Block);
                }
                
                valueSlot.appendChild(operatorBlock);
            }
            
            // 1. Créer "mettre i à 1"
            const varIHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="1" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varIHTML,
                selectValues: ['i']
            });
            
            // 2. Créer "mettre p à 1"
            const varPHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="p" selected>p</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="1" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varPHTML,
                selectValues: ['p']
            });
            
            // 3. Créer la boucle principale "répéter [randomCols] fois" (colonnes)
            const mainLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomCols}" onclick="event.stopPropagation()"></span> fois</div>`;
            addBlockToProgram({ 
                type: 'repeat',
                html: mainLoopHTML
            });
            
            const programBlocks = document.getElementById('program-blocks');
            const mainLoopBlock = programBlocks.lastElementChild;
            const mainNestedArea = mainLoopBlock.querySelector('.nested-blocks');
            
            // 4. Créer la boucle imbriquée "répéter [randomRows] fois" (lignes)
            const innerLoopWrapper = document.createElement('div');
            innerLoopWrapper.className = 'program-block block-capsule';
            const innerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomRows}" onclick="event.stopPropagation()"></span> fois</div>`;
            innerLoopWrapper.innerHTML = innerLoopHTML;
            
            const innerBlock = innerLoopWrapper.querySelector('.block');
            const innerRemoveBtn = document.createElement('button');
            innerRemoveBtn.className = 'remove-btn';
            innerRemoveBtn.innerHTML = '×';
            innerRemoveBtn.onclick = function() { innerLoopWrapper.remove(); updateBlockCount(); };
            innerBlock.appendChild(innerRemoveBtn);
            
            const innerNestedArea = document.createElement('div');
            innerNestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(innerNestedArea);
            innerLoopWrapper.appendChild(innerNestedArea);
            
            const innerCapsuleBottom = document.createElement('div');
            innerCapsuleBottom.className = 'block-capsule-bottom';
            innerCapsuleBottom.style.background = getComputedStyle(innerBlock).background;
            innerLoopWrapper.appendChild(innerCapsuleBottom);
            
            mainNestedArea.appendChild(innerLoopWrapper);
            mainNestedArea.classList.remove('empty');
            
            // 5. Première condition "si i = 1 alors"
            const if1Wrapper = document.createElement('div');
            if1Wrapper.className = 'program-block block-capsule';
            if1Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="i" selected>i</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if1Block = if1Wrapper.querySelector('.block');
            const if1RemoveBtn = document.createElement('button');
            if1RemoveBtn.className = 'remove-btn';
            if1RemoveBtn.innerHTML = '×';
            if1RemoveBtn.onclick = function() { if1Wrapper.remove(); updateBlockCount(); };
            if1Block.appendChild(if1RemoveBtn);
            
            const if1NestedArea = document.createElement('div');
            if1NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if1NestedArea);
            if1Wrapper.appendChild(if1NestedArea);
            
            const if1CapsuleBottom = document.createElement('div');
            if1CapsuleBottom.className = 'block-capsule-bottom';
            if1CapsuleBottom.style.background = getComputedStyle(if1Block).background;
            if1Wrapper.appendChild(if1CapsuleBottom);
            
            innerNestedArea.appendChild(if1Wrapper);
            innerNestedArea.classList.remove('empty');
            
            // Ajouter "couleur" dans if1
            const color1Wrapper = document.createElement('div');
            color1Wrapper.className = 'program-block';
            color1Wrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const color1Block = color1Wrapper.querySelector('.block');
            const color1RemoveBtn = document.createElement('button');
            color1RemoveBtn.className = 'remove-btn';
            color1RemoveBtn.innerHTML = '×';
            color1RemoveBtn.onclick = function() { color1Wrapper.remove(); updateBlockCount(); };
            color1Block.appendChild(color1RemoveBtn);
            if1NestedArea.appendChild(color1Wrapper);
            if1NestedArea.classList.remove('empty');
            
            // 6. Deuxième condition "si p = 1 alors"
            const if2Wrapper = document.createElement('div');
            if2Wrapper.className = 'program-block block-capsule';
            if2Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="p" selected>p</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if2Block = if2Wrapper.querySelector('.block');
            const if2RemoveBtn = document.createElement('button');
            if2RemoveBtn.className = 'remove-btn';
            if2RemoveBtn.innerHTML = '×';
            if2RemoveBtn.onclick = function() { if2Wrapper.remove(); updateBlockCount(); };
            if2Block.appendChild(if2RemoveBtn);
            
            const if2NestedArea = document.createElement('div');
            if2NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if2NestedArea);
            if2Wrapper.appendChild(if2NestedArea);
            
            const if2CapsuleBottom = document.createElement('div');
            if2CapsuleBottom.className = 'block-capsule-bottom';
            if2CapsuleBottom.style.background = getComputedStyle(if2Block).background;
            if2Wrapper.appendChild(if2CapsuleBottom);
            
            innerNestedArea.appendChild(if2Wrapper);
            
            // Ajouter "avancer" dans if2
            const forward1Wrapper = document.createElement('div');
            forward1Wrapper.className = 'program-block';
            forward1Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward1Block = forward1Wrapper.querySelector('.block');
            const forward1RemoveBtn = document.createElement('button');
            forward1RemoveBtn.className = 'remove-btn';
            forward1RemoveBtn.innerHTML = '×';
            forward1RemoveBtn.onclick = function() { forward1Wrapper.remove(); updateBlockCount(); };
            forward1Block.appendChild(forward1RemoveBtn);
            if2NestedArea.appendChild(forward1Wrapper);
            if2NestedArea.classList.remove('empty');
            
            // 7. Troisième condition "si p = -1 alors"
            const if3Wrapper = document.createElement('div');
            if3Wrapper.className = 'program-block block-capsule';
            if3Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="p" selected>p</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="-1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if3Block = if3Wrapper.querySelector('.block');
            const if3RemoveBtn = document.createElement('button');
            if3RemoveBtn.className = 'remove-btn';
            if3RemoveBtn.innerHTML = '×';
            if3RemoveBtn.onclick = function() { if3Wrapper.remove(); updateBlockCount(); };
            if3Block.appendChild(if3RemoveBtn);
            
            const if3NestedArea = document.createElement('div');
            if3NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if3NestedArea);
            if3Wrapper.appendChild(if3NestedArea);
            
            const if3CapsuleBottom = document.createElement('div');
            if3CapsuleBottom.className = 'block-capsule-bottom';
            if3CapsuleBottom.style.background = getComputedStyle(if3Block).background;
            if3Wrapper.appendChild(if3CapsuleBottom);
            
            innerNestedArea.appendChild(if3Wrapper);
            
            // Ajouter "reculer" dans if3
            const backWrapper = document.createElement('div');
            backWrapper.className = 'program-block';
            backWrapper.innerHTML = '<div class="block motion" data-type="back">reculer</div>';
            const backBlock = backWrapper.querySelector('.block');
            const backRemoveBtn = document.createElement('button');
            backRemoveBtn.className = 'remove-btn';
            backRemoveBtn.innerHTML = '×';
            backRemoveBtn.onclick = function() { backWrapper.remove(); updateBlockCount(); };
            backBlock.appendChild(backRemoveBtn);
            if3NestedArea.appendChild(backWrapper);
            if3NestedArea.classList.remove('empty');
            
            // 8. "mettre i à (i × -1)"
            const setI1Wrapper = document.createElement('div');
            setI1Wrapper.className = 'program-block';
            const setI1Block = document.createElement('div');
            setI1Block.className = 'block variables';
            setI1Block.setAttribute('data-type', 'variable');
            setI1Block.innerHTML = `mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
            createOperatorInValueSlot(setI1Block, 'i', '*', '-1');
            const setI1RemoveBtn = document.createElement('button');
            setI1RemoveBtn.className = 'remove-btn';
            setI1RemoveBtn.innerHTML = '×';
            setI1RemoveBtn.onclick = function() { setI1Wrapper.remove(); updateBlockCount(); };
            setI1Block.appendChild(setI1RemoveBtn);
            setI1Wrapper.appendChild(setI1Block);
            innerNestedArea.appendChild(setI1Wrapper);
            
            // 9. Dans la boucle principale : "si i = 1 alors"
            const if4Wrapper = document.createElement('div');
            if4Wrapper.className = 'program-block block-capsule';
            if4Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="i" selected>i</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if4Block = if4Wrapper.querySelector('.block');
            const if4RemoveBtn = document.createElement('button');
            if4RemoveBtn.className = 'remove-btn';
            if4RemoveBtn.innerHTML = '×';
            if4RemoveBtn.onclick = function() { if4Wrapper.remove(); updateBlockCount(); };
            if4Block.appendChild(if4RemoveBtn);
            
            const if4NestedArea = document.createElement('div');
            if4NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if4NestedArea);
            if4Wrapper.appendChild(if4NestedArea);
            
            const if4CapsuleBottom = document.createElement('div');
            if4CapsuleBottom.className = 'block-capsule-bottom';
            if4CapsuleBottom.style.background = getComputedStyle(if4Block).background;
            if4Wrapper.appendChild(if4CapsuleBottom);
            
            mainNestedArea.appendChild(if4Wrapper);
            
            // Ajouter "couleur" dans if4
            const color2Wrapper = document.createElement('div');
            color2Wrapper.className = 'program-block';
            color2Wrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const color2Block = color2Wrapper.querySelector('.block');
            const color2RemoveBtn = document.createElement('button');
            color2RemoveBtn.className = 'remove-btn';
            color2RemoveBtn.innerHTML = '×';
            color2RemoveBtn.onclick = function() { color2Wrapper.remove(); updateBlockCount(); };
            color2Block.appendChild(color2RemoveBtn);
            if4NestedArea.appendChild(color2Wrapper);
            if4NestedArea.classList.remove('empty');
            
            // 10. "tourner droite"
            const rightWrapper = document.createElement('div');
            rightWrapper.className = 'program-block';
            rightWrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const rightBlock = rightWrapper.querySelector('.block');
            const rightRemoveBtn = document.createElement('button');
            rightRemoveBtn.className = 'remove-btn';
            rightRemoveBtn.innerHTML = '×';
            rightRemoveBtn.onclick = function() { rightWrapper.remove(); updateBlockCount(); };
            rightBlock.appendChild(rightRemoveBtn);
            mainNestedArea.appendChild(rightWrapper);
            
            // 11. "avancer"
            const forward2Wrapper = document.createElement('div');
            forward2Wrapper.className = 'program-block';
            forward2Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward2Block = forward2Wrapper.querySelector('.block');
            const forward2RemoveBtn = document.createElement('button');
            forward2RemoveBtn.className = 'remove-btn';
            forward2RemoveBtn.innerHTML = '×';
            forward2RemoveBtn.onclick = function() { forward2Wrapper.remove(); updateBlockCount(); };
            forward2Block.appendChild(forward2RemoveBtn);
            mainNestedArea.appendChild(forward2Wrapper);
            
            // 12. "tourner gauche"
            const leftWrapper = document.createElement('div');
            leftWrapper.className = 'program-block';
            leftWrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const leftBlock = leftWrapper.querySelector('.block');
            const leftRemoveBtn = document.createElement('button');
            leftRemoveBtn.className = 'remove-btn';
            leftRemoveBtn.innerHTML = '×';
            leftRemoveBtn.onclick = function() { leftWrapper.remove(); updateBlockCount(); };
            leftBlock.appendChild(leftRemoveBtn);
            mainNestedArea.appendChild(leftWrapper);
            
            // 13. "mettre i à (i × -1)"
            const setI2Wrapper = document.createElement('div');
            setI2Wrapper.className = 'program-block';
            const setI2Block = document.createElement('div');
            setI2Block.className = 'block variables';
            setI2Block.setAttribute('data-type', 'variable');
            setI2Block.innerHTML = `mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
            createOperatorInValueSlot(setI2Block, 'i', '*', '-1');
            const setI2RemoveBtn = document.createElement('button');
            setI2RemoveBtn.className = 'remove-btn';
            setI2RemoveBtn.innerHTML = '×';
            setI2RemoveBtn.onclick = function() { setI2Wrapper.remove(); updateBlockCount(); };
            setI2Block.appendChild(setI2RemoveBtn);
            setI2Wrapper.appendChild(setI2Block);
            mainNestedArea.appendChild(setI2Wrapper);
            
            // 14. "mettre p à (p × -1)"
            const setPWrapper = document.createElement('div');
            setPWrapper.className = 'program-block';
            const setPBlock = document.createElement('div');
            setPBlock.className = 'block variables';
            setPBlock.setAttribute('data-type', 'variable');
            setPBlock.innerHTML = `mettre <select onclick="event.stopPropagation()" class="var-select"><option value="p" selected>p</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
            createOperatorInValueSlot(setPBlock, 'p', '*', '-1');
            const setPRemoveBtn = document.createElement('button');
            setPRemoveBtn.className = 'remove-btn';
            setPRemoveBtn.innerHTML = '×';
            setPRemoveBtn.onclick = function() { setPWrapper.remove(); updateBlockCount(); };
            setPBlock.appendChild(setPRemoveBtn);
            setPWrapper.appendChild(setPBlock);
            mainNestedArea.appendChild(setPWrapper);
            
            // Mettre à jour l'affichage
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            updateBlockCount();
            
            showResult('✅ Programme Damier généré avec succès !', true);
        }
        
        // Générer le programme pour la croix
        function generateCrossProgram() {
            
            // Choisir une couleur aléatoire
            const colors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
            const colorNames = {
                'red': 'ROUGE',
                'yellow': 'JAUNE',
                'green': 'VERT',
                'blue': 'BLEU',
                'pink': 'ROSE',
                'black': 'NOIR'
            };
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomColorName = colorNames[randomColor];
            
            // Générer une position de départ aléatoire
            // La croix fait i+1 de large (si i=2, croix 3×3)
            // Pour garantir minimum 3×3 : i minimum = 2
            // Position doit être à au moins 3 cases du bord droit et du bord haut
            // targetCol : 0 à 6 maximum (pour avoir 3 cases de marge à droite avec i=2)
            // targetRow : 3 à 9 (pour avoir 3 cases vers le haut)
            
            const targetCol = Math.floor(Math.random() * 7); // 0 à 6
            const targetRow = Math.floor(Math.random() * 7) + 3; // 3 à 9
            
            // Calculer la valeur maximale de i en fonction de la position
            // À droite : il faut i cases + position ne doit pas dépasser 9
            // maxI selon X : 9 - targetCol (si col=0, max 9; si col=6, max 3)
            const maxIX = 9 - targetCol;
            
            // En haut : il faut i cases vers le haut
            // maxI selon Y : targetRow (si row=3, max 3; si row=9, max 9)
            const maxIY = targetRow;
            
            const maxI = Math.min(maxIX, maxIY, 9); // Limité à 9 maximum
            
            // Générer une valeur aléatoire pour i entre 2 et maxI
            const minI = 2;
            const randomI = maxI >= minI ? 
                Math.floor(Math.random() * (maxI - minI + 1)) + minI : 
                maxI;
            
            
            // Calculer le déplacement depuis la position de départ (9, 5)
            const startRow = 9;
            const startCol = 5;
            const deltaRow = targetRow - startRow;
            const deltaCol = targetCol - startCol;
            
            // Créer les variables i et p
            const varNames = ['i', 'p'];
            const varValues = {'i': randomI, 'p': 1};
            
            varNames.forEach(varName => {
                if (!createdVariables.includes(varName)) {
                    createdVariables.push(varName);
                }
                variables[varName] = varValues[varName];
            });
            updateVariableDisplay();
            
            // Générer les blocs de déplacement initial avec garantie d'orientation vers le haut
            generateInitialMovementForCheckerboard(deltaRow, deltaCol);
            
            // Fonction auxiliaire pour créer des blocs avec opérateurs
            function createOperatorInValueSlot(varBlock, var1Name, operator, var2Name) {
                const valueSlot = varBlock.querySelector('.value-slot');
                
                const operatorBlock = document.createElement('div');
                operatorBlock.className = 'block operators';
                operatorBlock.setAttribute('data-type', 'operator');
                
                const firstSlotHTML = `<span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
                const operatorHTML = `<select onclick="event.stopPropagation()"><option value="${operator}">${operator === '*' ? '×' : operator === '/' ? '÷' : operator}</option></select>`;
                const secondSlotHTML = `<span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
                
                operatorBlock.innerHTML = firstSlotHTML + operatorHTML + secondSlotHTML;
                
                const var1Block = document.createElement('div');
                var1Block.className = 'block variables';
                var1Block.setAttribute('data-type', 'var-value');
                var1Block.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="${var1Name}" selected>${var1Name}</option></select>`;
                
                const firstSlot = operatorBlock.querySelectorAll('.value-slot')[0];
                firstSlot.appendChild(var1Block);
                
                const secondSlot = operatorBlock.querySelectorAll('.value-slot')[1];
                if (var2Name === '-1' || var2Name === '1') {
                    secondSlot.innerHTML = `<input type="text" value="${var2Name}" onclick="event.stopPropagation()">`;
                } else {
                    const var2Block = document.createElement('div');
                    var2Block.className = 'block variables';
                    var2Block.setAttribute('data-type', 'var-value');
                    var2Block.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="${var2Name}" selected>${var2Name}</option></select>`;
                    secondSlot.appendChild(var2Block);
                }
                
                valueSlot.appendChild(operatorBlock);
            }
            
            // 1. Créer "mettre i à [randomI]"
            const varIHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomI}" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varIHTML,
                selectValues: ['i']
            });
            
            // 2. Créer "mettre p à 1"
            const varPHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="p" selected>p</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="1" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varPHTML,
                selectValues: ['p']
            });
            
            // 3. Créer la boucle principale "répéter 2 fois"
            const mainLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="2" onclick="event.stopPropagation()"></span> fois</div>`;
            addBlockToProgram({ 
                type: 'repeat',
                html: mainLoopHTML
            });
            
            const programBlocks = document.getElementById('program-blocks');
            const mainLoopBlock = programBlocks.lastElementChild;
            const mainNestedArea = mainLoopBlock.querySelector('.nested-blocks');
            
            // 4. Ajouter "couleur" dans la boucle principale
            const color1Wrapper = document.createElement('div');
            color1Wrapper.className = 'program-block';
            color1Wrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const color1Block = color1Wrapper.querySelector('.block');
            const color1RemoveBtn = document.createElement('button');
            color1RemoveBtn.className = 'remove-btn';
            color1RemoveBtn.innerHTML = '×';
            color1RemoveBtn.onclick = function() { color1Wrapper.remove(); updateBlockCount(); };
            color1Block.appendChild(color1RemoveBtn);
            mainNestedArea.appendChild(color1Wrapper);
            mainNestedArea.classList.remove('empty');
            
            // 5. Créer la boucle imbriquée "répéter i fois"
            const innerLoop1Wrapper = document.createElement('div');
            innerLoop1Wrapper.className = 'program-block block-capsule';
            const innerLoop1HTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            innerLoop1Wrapper.innerHTML = innerLoop1HTML;
            
            const innerLoop1ValueSlot = innerLoop1Wrapper.querySelector('.value-slot');
            const innerLoop1VarBlock = document.createElement('div');
            innerLoop1VarBlock.className = 'block variables';
            innerLoop1VarBlock.setAttribute('data-type', 'var-value');
            innerLoop1VarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            innerLoop1ValueSlot.appendChild(innerLoop1VarBlock);
            
            const innerLoop1Block = innerLoop1Wrapper.querySelector('.block');
            const innerLoop1RemoveBtn = document.createElement('button');
            innerLoop1RemoveBtn.className = 'remove-btn';
            innerLoop1RemoveBtn.innerHTML = '×';
            innerLoop1RemoveBtn.onclick = function() { innerLoop1Wrapper.remove(); updateBlockCount(); };
            innerLoop1Block.appendChild(innerLoop1RemoveBtn);
            
            const innerLoop1NestedArea = document.createElement('div');
            innerLoop1NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(innerLoop1NestedArea);
            innerLoop1Wrapper.appendChild(innerLoop1NestedArea);
            
            const innerLoop1CapsuleBottom = document.createElement('div');
            innerLoop1CapsuleBottom.className = 'block-capsule-bottom';
            innerLoop1CapsuleBottom.style.background = getComputedStyle(innerLoop1Block).background;
            innerLoop1Wrapper.appendChild(innerLoop1CapsuleBottom);
            
            mainNestedArea.appendChild(innerLoop1Wrapper);
            
            // 6. Première condition "si p = 1 alors"
            const if1Wrapper = document.createElement('div');
            if1Wrapper.className = 'program-block block-capsule';
            if1Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="p" selected>p</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if1Block = if1Wrapper.querySelector('.block');
            const if1RemoveBtn = document.createElement('button');
            if1RemoveBtn.className = 'remove-btn';
            if1RemoveBtn.innerHTML = '×';
            if1RemoveBtn.onclick = function() { if1Wrapper.remove(); updateBlockCount(); };
            if1Block.appendChild(if1RemoveBtn);
            
            const if1NestedArea = document.createElement('div');
            if1NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if1NestedArea);
            if1Wrapper.appendChild(if1NestedArea);
            
            const if1CapsuleBottom = document.createElement('div');
            if1CapsuleBottom.className = 'block-capsule-bottom';
            if1CapsuleBottom.style.background = getComputedStyle(if1Block).background;
            if1Wrapper.appendChild(if1CapsuleBottom);
            
            innerLoop1NestedArea.appendChild(if1Wrapper);
            innerLoop1NestedArea.classList.remove('empty');
            
            // Ajouter les blocs dans if1: tourner droite, avancer, tourner gauche
            const right1Wrapper = document.createElement('div');
            right1Wrapper.className = 'program-block';
            right1Wrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const right1Block = right1Wrapper.querySelector('.block');
            const right1RemoveBtn = document.createElement('button');
            right1RemoveBtn.className = 'remove-btn';
            right1RemoveBtn.innerHTML = '×';
            right1RemoveBtn.onclick = function() { right1Wrapper.remove(); updateBlockCount(); };
            right1Block.appendChild(right1RemoveBtn);
            if1NestedArea.appendChild(right1Wrapper);
            
            const forward1Wrapper = document.createElement('div');
            forward1Wrapper.className = 'program-block';
            forward1Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward1Block = forward1Wrapper.querySelector('.block');
            const forward1RemoveBtn = document.createElement('button');
            forward1RemoveBtn.className = 'remove-btn';
            forward1RemoveBtn.innerHTML = '×';
            forward1RemoveBtn.onclick = function() { forward1Wrapper.remove(); updateBlockCount(); };
            forward1Block.appendChild(forward1RemoveBtn);
            if1NestedArea.appendChild(forward1Wrapper);
            
            const left1Wrapper = document.createElement('div');
            left1Wrapper.className = 'program-block';
            left1Wrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const left1Block = left1Wrapper.querySelector('.block');
            const left1RemoveBtn = document.createElement('button');
            left1RemoveBtn.className = 'remove-btn';
            left1RemoveBtn.innerHTML = '×';
            left1RemoveBtn.onclick = function() { left1Wrapper.remove(); updateBlockCount(); };
            left1Block.appendChild(left1RemoveBtn);
            if1NestedArea.appendChild(left1Wrapper);
            if1NestedArea.classList.remove('empty');
            
            // 7. Deuxième condition "si p = -1 alors"
            const if2Wrapper = document.createElement('div');
            if2Wrapper.className = 'program-block block-capsule';
            if2Wrapper.innerHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="p" selected>p</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="=">=</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" value="-1" onclick="event.stopPropagation()"></span> alors</div>`;
            
            const if2Block = if2Wrapper.querySelector('.block');
            const if2RemoveBtn = document.createElement('button');
            if2RemoveBtn.className = 'remove-btn';
            if2RemoveBtn.innerHTML = '×';
            if2RemoveBtn.onclick = function() { if2Wrapper.remove(); updateBlockCount(); };
            if2Block.appendChild(if2RemoveBtn);
            
            const if2NestedArea = document.createElement('div');
            if2NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(if2NestedArea);
            if2Wrapper.appendChild(if2NestedArea);
            
            const if2CapsuleBottom = document.createElement('div');
            if2CapsuleBottom.className = 'block-capsule-bottom';
            if2CapsuleBottom.style.background = getComputedStyle(if2Block).background;
            if2Wrapper.appendChild(if2CapsuleBottom);
            
            innerLoop1NestedArea.appendChild(if2Wrapper);
            
            // Ajouter les blocs dans if2: tourner gauche, avancer, tourner droite
            const left2Wrapper = document.createElement('div');
            left2Wrapper.className = 'program-block';
            left2Wrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const left2Block = left2Wrapper.querySelector('.block');
            const left2RemoveBtn = document.createElement('button');
            left2RemoveBtn.className = 'remove-btn';
            left2RemoveBtn.innerHTML = '×';
            left2RemoveBtn.onclick = function() { left2Wrapper.remove(); updateBlockCount(); };
            left2Block.appendChild(left2RemoveBtn);
            if2NestedArea.appendChild(left2Wrapper);
            
            const forward2Wrapper = document.createElement('div');
            forward2Wrapper.className = 'program-block';
            forward2Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward2Block = forward2Wrapper.querySelector('.block');
            const forward2RemoveBtn = document.createElement('button');
            forward2RemoveBtn.className = 'remove-btn';
            forward2RemoveBtn.innerHTML = '×';
            forward2RemoveBtn.onclick = function() { forward2Wrapper.remove(); updateBlockCount(); };
            forward2Block.appendChild(forward2RemoveBtn);
            if2NestedArea.appendChild(forward2Wrapper);
            
            const right2Wrapper = document.createElement('div');
            right2Wrapper.className = 'program-block';
            right2Wrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const right2Block = right2Wrapper.querySelector('.block');
            const right2RemoveBtn = document.createElement('button');
            right2RemoveBtn.className = 'remove-btn';
            right2RemoveBtn.innerHTML = '×';
            right2RemoveBtn.onclick = function() { right2Wrapper.remove(); updateBlockCount(); };
            right2Block.appendChild(right2RemoveBtn);
            if2NestedArea.appendChild(right2Wrapper);
            if2NestedArea.classList.remove('empty');
            
            // 8. Ajouter "avancer" dans la première boucle "répéter i fois" (après les conditions)
            const forward3Wrapper = document.createElement('div');
            forward3Wrapper.className = 'program-block';
            forward3Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward3Block = forward3Wrapper.querySelector('.block');
            const forward3RemoveBtn = document.createElement('button');
            forward3RemoveBtn.className = 'remove-btn';
            forward3RemoveBtn.innerHTML = '×';
            forward3RemoveBtn.onclick = function() { forward3Wrapper.remove(); updateBlockCount(); };
            forward3Block.appendChild(forward3RemoveBtn);
            innerLoop1NestedArea.appendChild(forward3Wrapper);
            
            // 9. Ajouter "couleur" dans la première boucle "répéter i fois"
            const color2Wrapper = document.createElement('div');
            color2Wrapper.className = 'program-block';
            color2Wrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const color2Block = color2Wrapper.querySelector('.block');
            const color2RemoveBtn = document.createElement('button');
            color2RemoveBtn.className = 'remove-btn';
            color2RemoveBtn.innerHTML = '×';
            color2RemoveBtn.onclick = function() { color2Wrapper.remove(); updateBlockCount(); };
            color2Block.appendChild(color2RemoveBtn);
            innerLoop1NestedArea.appendChild(color2Wrapper);
            
            // 10. Ajouter "tourner gauche" (premier tourner gauche)
            const left3Wrapper = document.createElement('div');
            left3Wrapper.className = 'program-block';
            left3Wrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const left3Block = left3Wrapper.querySelector('.block');
            const left3RemoveBtn = document.createElement('button');
            left3RemoveBtn.className = 'remove-btn';
            left3RemoveBtn.innerHTML = '×';
            left3RemoveBtn.onclick = function() { left3Wrapper.remove(); updateBlockCount(); };
            left3Block.appendChild(left3RemoveBtn);
            mainNestedArea.appendChild(left3Wrapper);
            
            // 11. Créer la deuxième boucle imbriquée "répéter i fois"
            const innerLoop2Wrapper = document.createElement('div');
            innerLoop2Wrapper.className = 'program-block block-capsule';
            const innerLoop2HTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            innerLoop2Wrapper.innerHTML = innerLoop2HTML;
            
            const innerLoop2ValueSlot = innerLoop2Wrapper.querySelector('.value-slot');
            const innerLoop2VarBlock = document.createElement('div');
            innerLoop2VarBlock.className = 'block variables';
            innerLoop2VarBlock.setAttribute('data-type', 'var-value');
            innerLoop2VarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            innerLoop2ValueSlot.appendChild(innerLoop2VarBlock);
            
            const innerLoop2Block = innerLoop2Wrapper.querySelector('.block');
            const innerLoop2RemoveBtn = document.createElement('button');
            innerLoop2RemoveBtn.className = 'remove-btn';
            innerLoop2RemoveBtn.innerHTML = '×';
            innerLoop2RemoveBtn.onclick = function() { innerLoop2Wrapper.remove(); updateBlockCount(); };
            innerLoop2Block.appendChild(innerLoop2RemoveBtn);
            
            const innerLoop2NestedArea = document.createElement('div');
            innerLoop2NestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(innerLoop2NestedArea);
            innerLoop2Wrapper.appendChild(innerLoop2NestedArea);
            
            const innerLoop2CapsuleBottom = document.createElement('div');
            innerLoop2CapsuleBottom.className = 'block-capsule-bottom';
            innerLoop2CapsuleBottom.style.background = getComputedStyle(innerLoop2Block).background;
            innerLoop2Wrapper.appendChild(innerLoop2CapsuleBottom);
            
            mainNestedArea.appendChild(innerLoop2Wrapper);
            
            // 12. Ajouter "avancer" dans la deuxième boucle imbriquée
            const forward4Wrapper = document.createElement('div');
            forward4Wrapper.className = 'program-block';
            forward4Wrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forward4Block = forward4Wrapper.querySelector('.block');
            const forward4RemoveBtn = document.createElement('button');
            forward4RemoveBtn.className = 'remove-btn';
            forward4RemoveBtn.innerHTML = '×';
            forward4RemoveBtn.onclick = function() { forward4Wrapper.remove(); updateBlockCount(); };
            forward4Block.appendChild(forward4RemoveBtn);
            innerLoop2NestedArea.appendChild(forward4Wrapper);
            innerLoop2NestedArea.classList.remove('empty');
            
            // 15. Ajouter "tourner gauche"
            const left4Wrapper = document.createElement('div');
            left4Wrapper.className = 'program-block';
            left4Wrapper.innerHTML = `<div class="block motion" data-type="left">tourner ↺ gauche</div>`;
            const left4Block = left4Wrapper.querySelector('.block');
            const left4RemoveBtn = document.createElement('button');
            left4RemoveBtn.className = 'remove-btn';
            left4RemoveBtn.innerHTML = '×';
            left4RemoveBtn.onclick = function() { left4Wrapper.remove(); updateBlockCount(); };
            left4Block.appendChild(left4RemoveBtn);
            mainNestedArea.appendChild(left4Wrapper);
            
            // 16. Créer "mettre p à (p × -1)"
            const setPWrapper = document.createElement('div');
            setPWrapper.className = 'program-block';
            const setPBlock = document.createElement('div');
            setPBlock.className = 'block variables';
            setPBlock.setAttribute('data-type', 'variable');
            setPBlock.innerHTML = `mettre <select onclick="event.stopPropagation()" class="var-select"><option value="p" selected>p</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span>`;
            createOperatorInValueSlot(setPBlock, 'p', '*', '-1');
            const setPRemoveBtn = document.createElement('button');
            setPRemoveBtn.className = 'remove-btn';
            setPRemoveBtn.innerHTML = '×';
            setPRemoveBtn.onclick = function() { setPWrapper.remove(); updateBlockCount(); };
            setPBlock.appendChild(setPRemoveBtn);
            setPWrapper.appendChild(setPBlock);
            mainNestedArea.appendChild(setPWrapper);
            
            // Mettre à jour l'affichage
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            updateBlockCount();
            
            showResult('✅ Programme Croix généré avec succès !', true);
        }
        
        // Générer le programme pour le carré
        function generateSquareProgram() {
            
            // Choisir une couleur aléatoire
            const colors = ['red', 'yellow', 'green', 'blue', 'pink', 'black'];
            const colorNames = {
                'red': 'ROUGE',
                'yellow': 'JAUNE',
                'green': 'VERT',
                'blue': 'BLEU',
                'pink': 'ROSE',
                'black': 'NOIR'
            };
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomColorName = colorNames[randomColor];
            
            // Générer une valeur aléatoire pour i entre 1 et 9
            const randomI = Math.floor(Math.random() * 9) + 1; // 1 à 9
            
            // Calculer la position de la flèche
            // Le carré fait i×i cases
            // Pour ne pas toucher les bords, on doit être à au moins (i-1) cases des bords
            // Si i=9, le carré fait 9×9, donc la flèche doit être en (9,0) = première case en bas à gauche
            // Si i=1, le carré fait 1×1, on peut être n'importe où sauf les bords
            
            // Position: ligne 9-i+1 à 9 (partie basse), colonne 0 à 9-i (partie gauche)
            const minRow = Math.max(1, 10 - randomI); // Ne pas être sur ligne 0
            const maxRow = 9; // Toujours en bas
            const minCol = 0;
            const maxCol = Math.max(0, 9 - randomI); // Laisser la place pour i cases à droite
            
            let targetRow, targetCol;
            
            if (randomI === 9) {
                // Cas spécial: carré 9×9, forcer position (9, 0)
                targetRow = 9;
                targetCol = 0;
            } else {
                // Position aléatoire dans la plage autorisée
                targetRow = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
                targetCol = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));
            }
            
            
            // Calculer le déplacement depuis la position de départ (9, 5)
            const startRow = 9;
            const startCol = 5;
            const deltaRow = targetRow - startRow;
            const deltaCol = targetCol - startCol;
            
            // Créer la variable i
            if (!createdVariables.includes('i')) {
                createdVariables.push('i');
            }
            variables['i'] = randomI;
            updateVariableDisplay();
            
            // Générer les blocs de déplacement initial avec garantie d'orientation vers le haut
            generateInitialMovementForCheckerboard(deltaRow, deltaCol);
            
            // 1. Créer "mettre i à [randomI]"
            const varIHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${randomI}" onclick="event.stopPropagation()"></span></div>`;
            addBlockToProgram({ 
                type: 'variable',
                html: varIHTML,
                selectValues: ['i']
            });
            
            // 2. Créer la boucle externe "répéter 4 fois"
            const outerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="4" onclick="event.stopPropagation()"></span> fois</div>`;
            addBlockToProgram({ 
                type: 'repeat',
                html: outerLoopHTML
            });
            
            const programBlocks = document.getElementById('program-blocks');
            const outerLoopBlock = programBlocks.lastElementChild;
            const outerNestedArea = outerLoopBlock.querySelector('.nested-blocks');
            
            // 3. Créer la boucle interne "répéter i fois"
            const innerLoopWrapper = document.createElement('div');
            innerLoopWrapper.className = 'program-block block-capsule';
            const innerLoopHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"></span> fois</div>`;
            innerLoopWrapper.innerHTML = innerLoopHTML;
            
            const innerLoopValueSlot = innerLoopWrapper.querySelector('.value-slot');
            const innerLoopVarBlock = document.createElement('div');
            innerLoopVarBlock.className = 'block variables';
            innerLoopVarBlock.setAttribute('data-type', 'var-value');
            innerLoopVarBlock.innerHTML = `<select onclick="event.stopPropagation()" class="var-select"><option value="i" selected>i</option></select>`;
            innerLoopValueSlot.appendChild(innerLoopVarBlock);
            
            const innerLoopBlock = innerLoopWrapper.querySelector('.block');
            const innerLoopRemoveBtn = document.createElement('button');
            innerLoopRemoveBtn.className = 'remove-btn';
            innerLoopRemoveBtn.innerHTML = '×';
            innerLoopRemoveBtn.onclick = function() { innerLoopWrapper.remove(); updateBlockCount(); };
            innerLoopBlock.appendChild(innerLoopRemoveBtn);
            
            const innerNestedArea = document.createElement('div');
            innerNestedArea.className = 'nested-blocks empty';
            setupNestedAreaDrop(innerNestedArea);
            innerLoopWrapper.appendChild(innerNestedArea);
            
            const innerCapsuleBottom = document.createElement('div');
            innerCapsuleBottom.className = 'block-capsule-bottom';
            innerCapsuleBottom.style.background = getComputedStyle(innerLoopBlock).background;
            innerLoopWrapper.appendChild(innerCapsuleBottom);
            
            outerNestedArea.appendChild(innerLoopWrapper);
            outerNestedArea.classList.remove('empty');
            
            // 4. Ajouter "couleur" dans la boucle interne
            const colorWrapper = document.createElement('div');
            colorWrapper.className = 'program-block';
            colorWrapper.innerHTML = `<div class="block looks" data-type="color" data-value="${randomColor}">couleur ${randomColorName}</div>`;
            const colorBlock = colorWrapper.querySelector('.block');
            const colorRemoveBtn = document.createElement('button');
            colorRemoveBtn.className = 'remove-btn';
            colorRemoveBtn.innerHTML = '×';
            colorRemoveBtn.onclick = function() { colorWrapper.remove(); updateBlockCount(); };
            colorBlock.appendChild(colorRemoveBtn);
            innerNestedArea.appendChild(colorWrapper);
            innerNestedArea.classList.remove('empty');
            
            // 5. Ajouter "avancer" dans la boucle interne
            const forwardWrapper = document.createElement('div');
            forwardWrapper.className = 'program-block';
            forwardWrapper.innerHTML = '<div class="block motion" data-type="forward">avancer</div>';
            const forwardBlock = forwardWrapper.querySelector('.block');
            const forwardRemoveBtn = document.createElement('button');
            forwardRemoveBtn.className = 'remove-btn';
            forwardRemoveBtn.innerHTML = '×';
            forwardRemoveBtn.onclick = function() { forwardWrapper.remove(); updateBlockCount(); };
            forwardBlock.appendChild(forwardRemoveBtn);
            innerNestedArea.appendChild(forwardWrapper);
            
            // 6. Ajouter "tourner droite" dans la boucle externe
            const rightWrapper = document.createElement('div');
            rightWrapper.className = 'program-block';
            rightWrapper.innerHTML = `<div class="block motion" data-type="right">tourner ↻ droite</div>`;
            const rightBlock = rightWrapper.querySelector('.block');
            const rightRemoveBtn = document.createElement('button');
            rightRemoveBtn.className = 'remove-btn';
            rightRemoveBtn.innerHTML = '×';
            rightRemoveBtn.onclick = function() { rightWrapper.remove(); updateBlockCount(); };
            rightBlock.appendChild(rightRemoveBtn);
            outerNestedArea.appendChild(rightWrapper);
            
            // Mettre à jour l'affichage
            updateAllVariableSelectors();
            updateVariableBlocksVisibility();
            updateBlockCount();
            
            showResult('✅ Programme Carré généré avec succès !', true);
        }
        
        // Supprimer la fonction createProgramBlockElement qui n'est plus utilisée
        
        // Générer le programme basique (sans boucles)
        function generateBasicProgram(optimizedPath) {
            const program = [];
            
            // Position de départ de la tortue
            let currentPos = { row: 9, col: 5 };
            let currentDirection = 0;
            
            
            optimizedPath.forEach((cell, index) => {
                
                // Calculer le chemin vers cette cellule
                const pathResult = calculatePathToCell(currentPos, cell, currentDirection);
                
                
                // Ajouter les mouvements au programme
                pathResult.moves.forEach(move => {
                    program.push({
                        type: move.type,
                        blockType: 'movement'
                    });
                });
                
                // Ajouter le bloc de couleur
                program.push({
                    type: 'color',
                    value: cell.color,
                    blockType: 'color'
                });
                
                // Mettre à jour la position et direction actuelles
                currentPos = { row: cell.row, col: cell.col };
                currentDirection = pathResult.finalDirection;
            });
            
            return program;
        }
        
        // DIFFICULTÉ 2: Optimiser le programme avec des boucles "répéter"
        function optimizeWithLoops(program) {
            const optimized = [];
            let i = 0;
            
            while (i < program.length) {
                const current = program[i];
                
                // Chercher des séquences répétitives
                const pattern = findRepeatPattern(program, i);
                
                if (pattern && pattern.count >= 2) {
                    // On a trouvé un motif répétitif !
                    
                    optimized.push({
                        type: 'repeat',
                        times: pattern.count,
                        nested: pattern.blocks,
                        blockType: 'loop'
                    });
                    
                    i += pattern.length * pattern.count;
                } else {
                    // Pas de répétition, ajouter le bloc tel quel
                    optimized.push(current);
                    i++;
                }
            }
            
            return optimized;
        }
        
        // Trouver un motif répétitif à partir d'une position
        function findRepeatPattern(program, startIndex) {
            // Tester différentes longueurs de motif (de 2 à 10 blocs)
            for (let patternLength = 2; patternLength <= Math.min(10, program.length - startIndex); patternLength++) {
                const pattern = program.slice(startIndex, startIndex + patternLength);
                let repeatCount = 1;
                let currentIndex = startIndex + patternLength;
                
                // Compter combien de fois le motif se répète
                while (currentIndex + patternLength <= program.length) {
                    const nextSegment = program.slice(currentIndex, currentIndex + patternLength);
                    
                    if (patternsMatch(pattern, nextSegment)) {
                        repeatCount++;
                        currentIndex += patternLength;
                    } else {
                        break;
                    }
                }
                
                // Si le motif se répète au moins 2 fois, on le retourne
                if (repeatCount >= 2) {
                    return {
                        blocks: pattern,
                        length: patternLength,
                        count: repeatCount
                    };
                }
            }
            
            return null;
        }
        
        // Vérifier si deux motifs sont identiques
        function patternsMatch(pattern1, pattern2) {
            if (pattern1.length !== pattern2.length) return false;
            
            for (let i = 0; i < pattern1.length; i++) {
                if (pattern1[i].type !== pattern2[i].type) return false;
                if (pattern1[i].type === 'color' && pattern1[i].value !== pattern2[i].value) return false;
            }
            
            return true;
        }
        
        // Ajouter les blocs du programme à l'interface
        function addProgramBlocks(program) {
            program.forEach(block => {
                if (block.type === 'repeat') {
                    // Créer un bloc répéter avec blocs imbriqués
                    const repeatHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${block.times}" min="1" max="100" onclick="event.stopPropagation()"></span> fois</div>`;
                    addBlockToProgram({ 
                        type: 'repeat', 
                        html: repeatHTML 
                    });
                    
                    // Ajouter les blocs imbriqués
                    const programBlocks = document.getElementById('program-blocks');
                    const lastBlock = programBlocks.lastElementChild;
                    const nestedArea = lastBlock.querySelector('.nested-blocks');
                    
                    if (nestedArea && block.nested) {
                        block.nested.forEach(nestedBlock => {
                            addNestedBlockFromData(nestedBlock, nestedArea);
                        });
                        nestedArea.classList.remove('empty');
                    }
                } else if (block.type === 'variable') {
                    // Créer un bloc variable
                    let blockHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="${block.varName}">${block.varName}</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${block.varValue || '0'}" onclick="event.stopPropagation()"></span></div>`;
                    
                    addBlockToProgram({ 
                        type: 'variable',
                        html: blockHTML,
                        selectValues: [block.varName]
                    });
                    
                    // Ajouter la variable à la liste si elle n'existe pas
                    if (!createdVariables.includes(block.varName)) {
                        createdVariables.push(block.varName);
                        updateAllVariableSelectors();
                        updateVariableBlocksVisibility();
                    }
                } else if (block.type === 'change-var') {
                    // Créer un bloc ajouter à variable
                    let blockHTML = `<div class="block variables" data-type="change-var">ajouter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${block.changeValue || '1'}" onclick="event.stopPropagation()"></span> à <select onclick="event.stopPropagation()" class="var-select"><option value="${block.varName}">${block.varName}</option></select></div>`;
                    
                    addBlockToProgram({ 
                        type: 'change-var',
                        html: blockHTML,
                        selectValues: [block.varName]
                    });
                } else if (block.type === 'if') {
                    // Créer un bloc condition
                    let blockHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="${block.varName}">${block.varName}</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="${block.operator}">${block.operator}</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" placeholder="valeur" value="${block.compareValue}" onclick="event.stopPropagation()"></span> alors</div>`;
                    
                    addBlockToProgram({ 
                        type: 'if',
                        html: blockHTML,
                        selectValues: [block.varName, block.operator]
                    });
                    
                    // Ajouter les blocs imbriqués
                    const programBlocks = document.getElementById('program-blocks');
                    const lastBlock = programBlocks.lastElementChild;
                    const nestedArea = lastBlock.querySelector('.nested-blocks');
                    
                    if (nestedArea && block.nested) {
                        block.nested.forEach(nestedBlock => {
                            addNestedBlockFromData(nestedBlock, nestedArea);
                        });
                        nestedArea.classList.remove('empty');
                    }
                } else {
                    // Bloc simple
                    let blockHTML = '';
                    
                    if (block.type === 'forward') {
                        blockHTML = '<div class="block motion" data-type="forward">avancer</div>';
                    } else if (block.type === 'right') {
                        blockHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
                    } else if (block.type === 'left') {
                        blockHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
                    } else if (block.type === 'color') {
                        // Map de traduction anglais -> français
                        const colorNames = {
                            'red': 'ROUGE',
                            'yellow': 'JAUNE',
                            'green': 'VERT',
                            'blue': 'BLEU',
                'pink': 'ROSE',
                            'black': 'NOIR',
                            'white': 'BLANC'
                        };
                        const colorFr = colorNames[block.value.toLowerCase()] || block.value.toUpperCase();
                        blockHTML = `<div class="block looks" data-type="color" data-value="${block.value}">couleur ${colorFr}</div>`;
                    }
                    
                    if (blockHTML) {
                        addBlockToProgram({ 
                            type: block.type, 
                            value: block.value,
                            html: blockHTML 
                        });
                    }
                }
            });
        }
        
        // Ajouter un bloc imbriqué depuis les données
        function addNestedBlockFromData(blockData, nestedArea) {
            // Gérer les blocs imbriqués complexes (répéter, if dans une boucle)
            if (blockData.type === 'repeat' || blockData.type === 'if') {
                let blockHTML = '';
                
                if (blockData.type === 'repeat') {
                    blockHTML = `<div class="block control" data-type="repeat">répéter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${blockData.times}" min="1" max="100" onclick="event.stopPropagation()"></span> fois</div>`;
                } else if (blockData.type === 'if') {
                    blockHTML = `<div class="block sensing" data-type="if">si <select class="var-select" onclick="event.stopPropagation()"><option value="${blockData.varName}">${blockData.varName}</option></select> <select class="compare-op" onclick="event.stopPropagation()"><option value="${blockData.operator}">${blockData.operator}</option></select> <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="text" placeholder="valeur" value="${blockData.compareValue}" onclick="event.stopPropagation()"></span> alors</div>`;
                }
                
                const wrapper = document.createElement('div');
                wrapper.innerHTML = blockHTML;
                addNestedBlock({ type: blockData.type, html: wrapper.innerHTML }, nestedArea);
                
                // Ajouter les blocs doublement imbriqués
                if (blockData.nested) {
                    const addedBlock = nestedArea.lastElementChild;
                    const doubleNestedArea = addedBlock.querySelector('.nested-blocks');
                    if (doubleNestedArea) {
                        blockData.nested.forEach(deepBlock => {
                            addNestedBlockFromData(deepBlock, doubleNestedArea);
                        });
                        doubleNestedArea.classList.remove('empty');
                    }
                }
                
                return;
            }
            
            // Blocs simples
            let blockHTML = '';
            
            if (blockData.type === 'forward') {
                blockHTML = '<div class="block motion" data-type="forward">avancer</div>';
            } else if (blockData.type === 'right') {
                blockHTML = '<div class="block motion" data-type="right">tourner ↻ droite</div>';
            } else if (blockData.type === 'left') {
                blockHTML = '<div class="block motion" data-type="left">tourner ↺ gauche</div>';
            } else if (blockData.type === 'color') {
                // Map de traduction anglais -> français
                const colorNames = {
                    'red': 'ROUGE',
                    'yellow': 'JAUNE',
                    'green': 'VERT',
                    'blue': 'BLEU',
                'pink': 'ROSE',
                    'black': 'NOIR',
                    'white': 'BLANC'
                };
                const colorFr = colorNames[blockData.value.toLowerCase()] || blockData.value.toUpperCase();
                blockHTML = `<div class="block looks" data-type="color" data-value="${blockData.value}">couleur ${colorFr}</div>`;
            } else if (blockData.type === 'variable') {
                blockHTML = `<div class="block variables" data-type="variable">mettre <select onclick="event.stopPropagation()" class="var-select"><option value="${blockData.varName}">${blockData.varName}</option></select> à <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${blockData.varValue || '0'}" onclick="event.stopPropagation()"></span></div>`;
            } else if (blockData.type === 'change-var') {
                blockHTML = `<div class="block variables" data-type="change-var">ajouter <span class="value-slot" ondrop="dropValueOrOperator(event)" ondragover="allowDrop(event)"><input type="number" value="${blockData.changeValue || '1'}" onclick="event.stopPropagation()"></span> à <select onclick="event.stopPropagation()" class="var-select"><option value="${blockData.varName}">${blockData.varName}</option></select></div>`;
            }
            
            if (blockHTML) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = blockHTML;
                addNestedBlock({ type: blockData.type, value: blockData.value, html: wrapper.innerHTML }, nestedArea);
            }
        }
        
        // Compter le nombre de boucles dans un programme
        function countLoops(program) {
            return program.filter(block => block.type === 'repeat').length;
        }
        
        function optimizePath(cells) {
            if (cells.length === 0) return [];
            
            const startPos = { row: 9, col: 5 }; // Position de départ
            const remaining = [...cells];
            const optimized = [];
            let current = startPos;
            let currentColor = null;
            
            // Tant qu'il reste des cellules à visiter
            while (remaining.length > 0) {
                let minDistance = Infinity;
                let nearestIndex = 0;
                let foundSameColor = false;
                
                // PRIORITÉ 1: Chercher d'abord une cellule de la même couleur à proximité
                if (currentColor !== null) {
                    remaining.forEach((cell, index) => {
                        if (cell.color === currentColor) {
                            const distance = manhattanDistance(current, cell);
                            // Bonus : considérer les cellules de même couleur comme 30% plus proches
                            const adjustedDistance = distance * 0.7;
                            if (adjustedDistance < minDistance) {
                                minDistance = adjustedDistance;
                                nearestIndex = index;
                                foundSameColor = true;
                            }
                        }
                    });
                }
                
                // PRIORITÉ 2: Si pas de même couleur à proximité, prendre la plus proche
                if (!foundSameColor) {
                    minDistance = Infinity;
                    remaining.forEach((cell, index) => {
                        const distance = manhattanDistance(current, cell);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestIndex = index;
                        }
                    });
                }
                
                // Ajouter la cellule sélectionnée au chemin
                const nearest = remaining[nearestIndex];
                optimized.push(nearest);
                current = nearest;
                currentColor = nearest.color;
                
                // Retirer la cellule du tableau des restantes
                remaining.splice(nearestIndex, 1);
            }
            
            return optimized;
        }
        
        // Calculer la distance de Manhattan entre deux positions
        function manhattanDistance(pos1, pos2) {
            return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
        }
        
        // Calculer le chemin complet vers une cellule cible
        function calculatePathToCell(from, to, startDirection) {
            const moves = [];
            let currentDir = startDirection;
            
            // Calculer les déplacements nécessaires
            const deltaRow = to.row - from.row; // Positif = vers le bas, Négatif = vers le haut
            const deltaCol = to.col - from.col; // Positif = vers la droite, Négatif = vers la gauche
            
            
            // OPTIMISATION 2: Choisir l'ordre vertical/horizontal selon la direction actuelle
            // pour minimiser les rotations
            const needsVertical = deltaRow !== 0;
            const needsHorizontal = deltaCol !== 0;
            
            // Déterminer quelle direction nécessite moins de rotations
            let doVerticalFirst = true;
            
            if (needsVertical && needsHorizontal) {
                const verticalDir = deltaRow > 0 ? 2 : 0;
                const horizontalDir = deltaCol > 0 ? 1 : 3;
                
                const verticalRotations = countRotations(currentDir, verticalDir);
                const horizontalRotations = countRotations(currentDir, horizontalDir);
                
                // Faire d'abord le mouvement qui nécessite le moins de rotations
                doVerticalFirst = verticalRotations <= horizontalRotations;
            }
            
            // Exécuter les mouvements dans l'ordre optimal
            if (doVerticalFirst) {
                // Phase 1: Déplacement vertical
                if (needsVertical) {
                    const targetDir = deltaRow > 0 ? 2 : 0;
                    const rotations = getRotationMoves(currentDir, targetDir);
                    moves.push(...rotations);
                    currentDir = targetDir;
                    
                    const distance = Math.abs(deltaRow);
                    for (let i = 0; i < distance; i++) {
                        moves.push({ type: 'forward' });
                    }
                }
                
                // Phase 2: Déplacement horizontal
                if (needsHorizontal) {
                    const targetDir = deltaCol > 0 ? 1 : 3;
                    const rotations = getRotationMoves(currentDir, targetDir);
                    moves.push(...rotations);
                    currentDir = targetDir;
                    
                    const distance = Math.abs(deltaCol);
                    for (let i = 0; i < distance; i++) {
                        moves.push({ type: 'forward' });
                    }
                }
            } else {
                // Phase 1: Déplacement horizontal d'abord
                if (needsHorizontal) {
                    const targetDir = deltaCol > 0 ? 1 : 3;
                    const rotations = getRotationMoves(currentDir, targetDir);
                    moves.push(...rotations);
                    currentDir = targetDir;
                    
                    const distance = Math.abs(deltaCol);
                    for (let i = 0; i < distance; i++) {
                        moves.push({ type: 'forward' });
                    }
                }
                
                // Phase 2: Déplacement vertical
                if (needsVertical) {
                    const targetDir = deltaRow > 0 ? 2 : 0;
                    const rotations = getRotationMoves(currentDir, targetDir);
                    moves.push(...rotations);
                    currentDir = targetDir;
                    
                    const distance = Math.abs(deltaRow);
                    for (let i = 0; i < distance; i++) {
                        moves.push({ type: 'forward' });
                    }
                }
            }
            
            return {
                moves: moves,
                finalDirection: currentDir
            };
        }
        
        // Compter le nombre de rotations nécessaires
        function countRotations(fromDir, toDir) {
            let diff = toDir - fromDir;
            if (diff > 2) diff -= 4;
            if (diff < -2) diff += 4;
            return Math.abs(diff);
        }
        
        // Calculer les rotations nécessaires pour passer d'une direction à une autre
        function getRotationMoves(fromDir, toDir) {
            const moves = [];
            let diff = toDir - fromDir;
            
            // Normaliser la différence entre -3 et 3
            if (diff > 2) diff -= 4;
            if (diff < -2) diff += 4;
            
            if (diff === 1) {
                // Tourner à droite une fois
                moves.push({ type: 'right' });
            } else if (diff === -1) {
                // Tourner à gauche une fois
                moves.push({ type: 'left' });
            } else if (diff === 2 || diff === -2) {
                // Faire demi-tour (deux rotations à droite)
                moves.push({ type: 'right' });
                moves.push({ type: 'right' });
            }
            
            return moves;
        }
        
        function clearPaintedCells() {
            paintedCells = {};
            const teacherGrid = document.getElementById('teacher-grid');
            if (teacherGrid) {
                const cells = teacherGrid.querySelectorAll('.grid-cell');
                cells.forEach(cell => {
                    cell.style.backgroundColor = 'white';
                });
            }
        }
        
        function getPaintedCellsData() {
            // Retourne une copie des cellules peintes pour sauvegarde
            return JSON.parse(JSON.stringify(paintedCells));
        }
        
        function loadPaintedCells(data) {
            // Charger les cellules peintes depuis les données sauvegardées
            if (!data) return;
            
            paintedCells = JSON.parse(JSON.stringify(data));
            const teacherGrid = document.getElementById('teacher-grid');
            if (!teacherGrid) return;
            
            const cells = teacherGrid.querySelectorAll('.grid-cell');
            
            // Réinitialiser toutes les cellules
            cells.forEach(cell => {
                cell.style.backgroundColor = 'white';
            });
            
            // Utiliser la même colorMap que dans le reste de l'app
            const colorMap = {
                'red': '#dc3545',
                'yellow': '#ffc107',
                'green': '#28a745',
                'blue': '#007bff',
                'black': '#343a40'
            };
            
            // Appliquer les couleurs sauvegardées
            for (let [cellKey, color] of Object.entries(paintedCells)) {
                const [row, col] = cellKey.split('-').map(Number);
                const index = row * GRID_SIZE + col;
                if (cells[index]) {
                    cells[index].style.backgroundColor = colorMap[color] || '#FFFFFF';
                }
            }
        }
        // ===== FIN MODULE PINCEAU =====
