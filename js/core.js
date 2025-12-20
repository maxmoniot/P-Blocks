// ========================================
// CORE - Fonctions principales
// ========================================
// Ce fichier contient le code principal de l'application
// (grille, tortue, blocs, programme, niveaux, etc.)

        // Liste des variables créées
        let createdVariables = [];
        let levelToDelete = null; // Pour stocker le niveau à supprimer
        
        // Module Pinceau
        let selectedPaintColor = 'red'; // Couleur par défaut
        let isPainting = false; // Pour savoir si on est en train de peindre
        let paintedCells = {}; // Stockage des cellules peintes : {row-col: 'color'}
        
        // Configuration
        const TEACHER_PASSWORD = 'prof123'; // Changez ce mot de passe
        const GRID_SIZE = 10;
        const MAX_TOTAL_LEVELS = 100; // Limite maximale de niveaux (tous cursus confondus) - MODIFIEZ CETTE VALEUR POUR CHANGER LA LIMITE
        const MAX_LEVELS_PER_INPUT_ALL = 33; // Limite pour cursus "Tous" (sera multiplié par 3 = 99 max)
        const MAX_LEVELS_PER_INPUT_SINGLE = MAX_TOTAL_LEVELS; // Limite pour cursus individuel
        
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
            const lastCreatedVar = createdVariables[createdVariables.length - 1];
            
            paletteSelects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="">choisir...</option>';
                
                createdVariables.forEach(varName => {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    // Garder la sélection actuelle si elle existe, sinon sélectionner la dernière créée
                    if (varName === currentValue || (!currentValue && varName === lastCreatedVar)) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            });
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
        
        // État global
        let currentMode = 'student';
        let currentCursus = '5eme';
        let currentLevelIndex = 0;
        // Initialisation
        // ===== SAUVEGARDE PROGRESSION ÉLÈVE =====
        
        // Clé secrète pour l'encodage
        const SECRET_KEY = 42;
        
        // Caractères base40 : 0-9, A-Z, !, ?, +, =
        const BASE40_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!?+=';
        
        // Générer un code de progression pour l'élève
        function generateStudentCode() {
            const urlParams = new URLSearchParams(window.location.search);
            const profName = urlParams.get('prof');
            
            if (!profName) {
                alert('❌ Impossible de générer un code : aucun professeur détecté');
                return;
            }
            
            // 1. Cursus (0=5eme, 1=4eme, 2=3eme)
            const cursusNum = currentCursus === '5eme' ? 0 : currentCursus === '4eme' ? 1 : 2;
            
            // 2. Collecter tous les niveaux complétés avec leurs coches
            const levels = [];
            for (let key in completedLevels) {
                const parts = key.split('-');
                if (parts[0] === currentCursus) {
                    const levelNum = parseInt(parts[1]);
                    const statusData = completedLevels[key];
                    // Rétrocompatibilité : extraire les points
                    const points = typeof statusData === 'object' ? statusData.points : statusData;
                    levels.push({ level: levelNum, points: points });
                }
            }
            
            // Trier par numéro de niveau
            levels.sort((a, b) => a.level - b.level);
            
            if (levels.length === 0) {
                alert('❌ Aucun niveau complété à sauvegarder');
                return;
            }
            
            // 3. Encoder format: cursus:niveau1*coches1|niveau2*coches2|...
            let dataStr = cursusNum + ':';
            levels.forEach((l, i) => {
                dataStr += l.level + '*' + l.points;
                if (i < levels.length - 1) dataStr += '|';
            });
            
            // Convertir en bytes et encoder avec XOR
            let bytes = [];
            for (let i = 0; i < dataStr.length; i++) {
                bytes.push(dataStr.charCodeAt(i) ^ SECRET_KEY);
            }
            
            // Convertir bytes en nombre (BigInt)
            let bigNum = 0n;
            for (let byte of bytes) {
                bigNum = bigNum * 256n + BigInt(byte);
            }
            
            // Convertir en base40
            let code = '';
            if (bigNum === 0n) {
                code = '0';
            } else {
                while (bigNum > 0n) {
                    code = BASE40_CHARS[Number(bigNum % 40n)] + code;
                    bigNum = bigNum / 40n;
                }
            }
            
            // Ajouter checksum
            let checksum = 0;
            for (let c of code) {
                checksum = (checksum + BASE40_CHARS.indexOf(c)) % 40;
            }
            code += BASE40_CHARS[checksum];
            
            // Afficher
            document.getElementById('student-code-display').value = code;
            document.getElementById('student-save-modal').classList.add('active');
        }
        
        function closeStudentSaveModal() {
            document.getElementById('student-save-modal').classList.remove('active');
        }
        
        function copyStudentCode() {
            const codeInput = document.getElementById('student-code-display');
            codeInput.select();
            document.execCommand('copy');
            
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✅ Copié !';
            button.style.background = '#4CAF50';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#2196F3';
            }, 2000);
        }
        
        function openLoadProgressModal() {
            document.getElementById('student-load-modal').classList.add('active');
            document.getElementById('student-code-input').value = '';
            document.getElementById('student-load-message').innerHTML = '';
        }
        
        function closeLoadProgressModal() {
            document.getElementById('student-load-modal').classList.remove('active');
        }
        
        function loadStudentProgress() {
            let code = document.getElementById('student-code-input').value.trim().toUpperCase();
            const messageDiv = document.getElementById('student-load-message');
            
            if (!code) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez entrer un code</div>';
                return;
            }
            
            // Filtrer pour garder uniquement les caractères base40
            code = code.replace(/[^0-9A-Z!?+=]/g, '');
            
            if (code.length < 2) {
                messageDiv.innerHTML = '<div class="error-message">❌ Code trop court</div>';
                return;
            }
            
            try {
                // Séparer checksum
                const mainCode = code.slice(0, -1);
                const checksumProvided = BASE40_CHARS.indexOf(code.slice(-1));
                
                // Vérifier checksum
                let checksumCalculated = 0;
                for (let c of mainCode) {
                    checksumCalculated = (checksumCalculated + BASE40_CHARS.indexOf(c)) % 40;
                }
                
                if (checksumCalculated !== checksumProvided) {
                    messageDiv.innerHTML = '<div class="error-message">❌ Code invalide (checksum incorrect)</div>';
                    return;
                }
                
                // Décoder de base40
                let bigNum = 0n;
                for (let c of mainCode) {
                    const idx = BASE40_CHARS.indexOf(c);
                    if (idx === -1) throw new Error('Caractère invalide');
                    bigNum = bigNum * 40n + BigInt(idx);
                }
                
                // Convertir en bytes
                let bytes = [];
                while (bigNum > 0n) {
                    bytes.unshift(Number(bigNum % 256n));
                    bigNum = bigNum / 256n;
                }
                
                // Décoder XOR et reconstituer string
                let dataStr = '';
                for (let byte of bytes) {
                    dataStr += String.fromCharCode(byte ^ SECRET_KEY);
                }
                
                // Parser : cursus:niveau1*coches1|niveau2*coches2|...
                const parts = dataStr.split(':');
                if (parts.length !== 2) throw new Error('Format invalide');
                
                const cursusNum = parseInt(parts[0]);
                const cursusMap = ['5eme', '4eme', '3eme'];
                const decodedCursus = cursusMap[cursusNum];
                
                if (!decodedCursus) throw new Error('Cursus invalide');
                
                // Parser les niveaux
                const levelParts = parts[1].split('|');
                const decodedCompleted = {};
                let totalScore = 0;
                
                for (let lp of levelParts) {
                    const [level, points] = lp.split('*').map(n => parseInt(n));
                    if (isNaN(level) || isNaN(points)) throw new Error('Données invalides');
                    
                    const key = `${decodedCursus}-${level}`;
                    decodedCompleted[key] = points;
                    totalScore += points;
                }
                
                // Charger
                score = totalScore;
                completedLevels = decodedCompleted;
                currentCursus = decodedCursus;
                
                saveToStorage();
                document.getElementById('cursus-select').value = currentCursus;
                document.getElementById('score').textContent = score;
                loadCursusLevels();
                
                messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Progression chargée avec succès !</div>';
                
                setTimeout(() => closeLoadProgressModal(), 1500);
                
            } catch (error) {
                messageDiv.innerHTML = '<div class="error-message">❌ Code invalide. Vérifiez le code complet.</div>';
            }
        }
        
        function init() {
            createGrid();
            loadFromStorage();
            
            // Migrer l'ancien format si nécessaire
            for (let cursus in cursusData) {
                if (Array.isArray(cursusData[cursus])) {
                    // Ancien format - convertir
                    const oldLevels = cursusData[cursus];
                    cursusData[cursus] = {
                        worlds: 1,
                        levelsPerWorld: 10,
                        pointsPerWorld: [0],
                        levels: {}
                    };
                    oldLevels.forEach((level, index) => {
                        cursusData[cursus].levels[(index + 1).toString()] = level;
                    });
                }
                // S'assurer que la structure est complète
                if (!cursusData[cursus].worlds) cursusData[cursus].worlds = 1;
                if (!cursusData[cursus].levelsPerWorld) cursusData[cursus].levelsPerWorld = 10;
                if (!cursusData[cursus].pointsPerWorld) cursusData[cursus].pointsPerWorld = [0];
                if (!cursusData[cursus].levels) cursusData[cursus].levels = {};
                // S'assurer qu'il y a une version
                if (!cursusData[cursus].version) cursusData[cursus].version = 1;
            }
            saveToStorage();
            
            loadCursusLevels();
            resetTurtle();
            setupDeleteZone();
        }

        // Configuration de la zone de suppression (palette)
        function setupDeleteZone() {
            const palette = document.querySelector('.middle-panel');
            if (!palette) return;
            
            palette.addEventListener('dragover', function(e) {
                // Vérifier si c'est un bloc du programme qui est déplacé
                const dragging = document.querySelector('.dragging');
                if (dragging) {
                    e.preventDefault();
                    palette.classList.add('delete-zone');
                }
            });
            
            palette.addEventListener('dragleave', function(e) {
                // Ne retirer la classe que si on quitte vraiment la palette
                if (e.target === palette || !palette.contains(e.relatedTarget)) {
                    palette.classList.remove('delete-zone');
                }
            });
            
            palette.addEventListener('drop', function(e) {
                e.preventDefault();
                const dragging = document.querySelector('.dragging');
                if (dragging) {
                    // Vérifier si le bloc est dans une zone imbriquée
                    const parentNested = dragging.parentElement;
                    
                    // Supprimer le bloc
                    dragging.remove();
                    
                    // Si c'était dans une zone imbriquée, vérifier si elle est maintenant vide
                    if (parentNested && parentNested.classList.contains('nested-blocks')) {
                        if (parentNested.children.length === 0) {
                            parentNested.classList.add('empty');
                        }
                    }
                    
                    palette.classList.remove('delete-zone');
                }
            });
        }

        // Création de la grille
        function createGrid() {
            // Créer les trois grilles au démarrage
            createGridElement('student-grid');
            createGridElement('teacher-grid');
            createGridElement('target-grid');
        }
        
        function createGridElement(gridId) {
            const gridElement = document.getElementById(gridId);
            if (!gridElement) return;
            
            gridElement.innerHTML = '';
            
            // Sur mobile, utiliser 1fr pour que les cellules s'adaptent
            // Sur desktop, utiliser 25px fixe
            if (window.innerWidth <= 768) {
                gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
            } else {
                gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 25px)`;
            }
            
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.dataset.gridId = gridId;
                    gridElement.appendChild(cell);
                }
            }
            
            // Initialiser la grille globale seulement pour student-grid
            if (gridId === 'student-grid') {
                grid = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                    grid[y] = [];
                    for (let x = 0; x < GRID_SIZE; x++) {
                        const cells = gridElement.querySelectorAll('.grid-cell');
                        const cell = cells[y * GRID_SIZE + x];
                        grid[y][x] = { element: cell, color: 'white' };
                    }
                }
            }
        }
        
        function getActiveGrid() {
            const gridId = currentMode === 'student' ? 'student-grid' : 'teacher-grid';
            const gridElement = document.getElementById(gridId);
            
            // Reconstruire l'objet grid pour la grille active
            grid = [];
            for (let y = 0; y < GRID_SIZE; y++) {
                grid[y] = [];
                for (let x = 0; x < GRID_SIZE; x++) {
                    const cells = gridElement.querySelectorAll('.grid-cell');
                    const cell = cells[y * GRID_SIZE + x];
                    grid[y][x] = { 
                        element: cell, 
                        color: cell.style.background ? getColorNameFromRGB(cell.style.background) : 'white'
                    };
                }
            }
            return grid;
        }
        
        function getColorNameFromRGB(rgb) {
            const colorMap = {
                'rgb(220, 53, 69)': 'red',
                '#dc3545': 'red',
                'rgb(255, 193, 7)': 'yellow',
                '#ffc107': 'yellow',
                'rgb(40, 167, 69)': 'green',
                '#28a745': 'green',
                'rgb(0, 123, 255)': 'blue',
                '#007bff': 'blue',
                'rgb(52, 58, 64)': 'black',
                '#343a40': 'black',
                'white': 'white',
                'rgb(255, 255, 255)': 'white',
                '#ffffff': 'white',
                '': 'white'
            };
            return colorMap[rgb] || 'white';
        }

        // Gestion du mode
        function switchMode(mode) {
            // Ne rien faire si on est déjà dans le mode sélectionné
            if (currentMode === mode) {
                return;
            }
            
            if (mode === 'teacher') {
                const modal = document.getElementById('password-modal');
                const passwordInput = document.getElementById('teacher-password');
                
                // Vider l'input au cas où il contiendrait quelque chose
                passwordInput.value = '';
                
                modal.classList.add('active');
                
                // Focus immédiat et après la transition pour plus de fiabilité
                passwordInput.focus();
                setTimeout(() => {
                    passwordInput.focus();
                }, 0);
                setTimeout(() => {
                    passwordInput.focus();
                }, 50);
            } else {
                currentMode = 'student';
                updateModeDisplay();
            }
        }

        function checkPassword() {
            const password = document.getElementById('teacher-password').value;
            if (password === TEACHER_PASSWORD) {
                currentMode = 'teacher';
                updateModeDisplay();
                closePasswordModal();
                
                // Remonter en haut de la page sur mobile
                if (window.innerWidth <= 768) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                
                loadTeacherLevels();
                // Nettoyer les vieux fichiers à l'ouverture du mode professeur
                cleanupOldLevels();
            } else if (password.length > 0) {
                // Ne montrer l'erreur que si un mot de passe a été entré
                document.getElementById('teacher-password').style.borderColor = '#ff0000';
            }
        }
        
        function checkPasswordAuto() {
            const password = document.getElementById('teacher-password').value;
            if (password === TEACHER_PASSWORD) {
                currentMode = 'teacher';
                updateModeDisplay();
                closePasswordModal();
                
                // Remonter en haut de la page sur mobile
                if (window.innerWidth <= 768) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                
                loadTeacherLevels();
                // Nettoyer les vieux fichiers à l'ouverture du mode professeur
                cleanupOldLevels();
            } else {
                // Réinitialiser la bordure rouge pendant la saisie
                document.getElementById('teacher-password').style.borderColor = '#E0E0E0';
            }
        }
        
        // Nettoyer les fichiers inactifs (> 1 an)
        async function cleanupOldLevels() {
            try {
                const response = await fetch('api.php?action=cleanup');
                const result = await response.json();
                if (result.success && result.cleaned > 0) {
                }
            } catch (error) {
            }
        }

        function closePasswordModal() {
            document.getElementById('password-modal').classList.remove('active');
            document.getElementById('teacher-password').value = '';
            document.getElementById('teacher-password').style.borderColor = '#E0E0E0';
        }
        
        // ===== GESTION DES NIVEAUX ET MONDES =====
        let tempWorldsConfig = null;
        let tempLevelsData = null; // Stocker les données de chaque niveau indexées par position (1, 2, 3...)
        
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
            
                worlds: tempWorldsConfig.worlds,
                levelsPerWorld: tempWorldsConfig.levelsPerWorld,
                niveaux: Object.keys(tempLevelsData).length
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
        let autoCreateConfig = null;
        
        // Fonction de confirmation personnalisée
        function customConfirm(message, isDangerous = false) {
            return new Promise((resolve) => {
                const overlay = document.getElementById('custom-confirm-overlay');
                const modal = document.getElementById('custom-confirm-modal');
                const messageDiv = document.getElementById('custom-confirm-message');
                const okBtn = document.getElementById('custom-confirm-ok');
                const cancelBtn = document.getElementById('custom-confirm-cancel');
                
                messageDiv.textContent = message;
                overlay.style.display = 'block';
                modal.style.display = 'block';
                
                // Changer la couleur du bouton selon le danger
                if (isDangerous) {
                    okBtn.style.background = '#dc3545'; // Rouge pour danger
                } else {
                    okBtn.style.background = '#4CAF50'; // Vert pour normal
                }
                
                const handleOk = () => {
                    overlay.style.display = 'none';
                    modal.style.display = 'none';
                    okBtn.removeEventListener('click', handleOk);
                    cancelBtn.removeEventListener('click', handleCancel);
                    resolve(true);
                };
                
                const handleCancel = () => {
                    overlay.style.display = 'none';
                    modal.style.display = 'none';
                    okBtn.removeEventListener('click', handleOk);
                    cancelBtn.removeEventListener('click', handleCancel);
                    resolve(false);
                };
                
                okBtn.addEventListener('click', handleOk);
                cancelBtn.addEventListener('click', handleCancel);
            });
        }
        
        function openAutoCreateModal() {
            const modal = document.getElementById('auto-create-modal');
            
            // Synchroniser le cursus avec le select principal (par défaut)
            const currentCursus = document.getElementById('teacher-cursus-select').value;
            document.getElementById('auto-cursus-select').value = currentCursus;
            
            // Initialiser la configuration
            autoCreateConfig = {
                numWorlds: 3,
                levelsPerWorld: 10,
                worlds: []
            };
            
            // Initialiser les mondes avec des valeurs par défaut
            for (let i = 0; i < 3; i++) {
                autoCreateConfig.worlds.push({
                    pointsRequired: i === 0 ? 0 : 10 * i,
                    difficulty1: Math.floor(autoCreateConfig.levelsPerWorld / 3),
                    difficulty2: Math.floor(autoCreateConfig.levelsPerWorld / 3),
                    difficulty3: autoCreateConfig.levelsPerWorld - 2 * Math.floor(autoCreateConfig.levelsPerWorld / 3)
                });
            }
            
            document.getElementById('auto-num-worlds').value = autoCreateConfig.numWorlds;
            document.getElementById('auto-levels-per-world').value = autoCreateConfig.levelsPerWorld;
            
            // Initialiser les limites selon le cursus
            updateAutoLimits();
            
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
        
        // Mettre à jour les limites des compteurs selon le cursus sélectionné
        function updateAutoLimits() {
            const cursusSelect = document.getElementById('auto-cursus-select');
            const numWorldsInput = document.getElementById('auto-num-worlds');
            const levelsPerWorldInput = document.getElementById('auto-levels-per-world');
            
            const isAll = cursusSelect.value === 'all';
            
            // Cursus "Tous" = max 100 par compteur (car × 3 cursus)
            // Cursus individuel = max MAX_TOTAL_LEVELS
            numWorldsInput.max = isAll ? MAX_LEVELS_PER_INPUT_ALL : MAX_LEVELS_PER_INPUT_SINGLE;
            levelsPerWorldInput.max = isAll ? MAX_LEVELS_PER_INPUT_ALL : MAX_LEVELS_PER_INPUT_SINGLE;
            
            // Ajuster les valeurs si elles dépassent la nouvelle limite
            if (parseInt(numWorldsInput.value) > parseInt(numWorldsInput.max)) {
                numWorldsInput.value = numWorldsInput.max;
            }
            if (parseInt(levelsPerWorldInput.value) > parseInt(levelsPerWorldInput.max)) {
                levelsPerWorldInput.value = levelsPerWorldInput.max;
            }
            
            updateAutoWorldsConfig();
        }
        
        function updateAutoWorldsConfig(shouldUpdatePoints = true) {
            const cursusSelect = document.getElementById('auto-cursus-select');
            const numWorldsInput = document.getElementById('auto-num-worlds');
            const levelsPerWorldInput = document.getElementById('auto-levels-per-world');
            const numWorlds = parseInt(numWorldsInput.value);
            const levelsPerWorld = parseInt(levelsPerWorldInput.value);
            
            // Calculer le multiplicateur selon le cursus
            const isAll = cursusSelect.value === 'all';
            const multiplier = isAll ? 3 : 1; // "Tous" = 3 cursus
            
            // VALIDATION : Vérifier que le total ne dépasse pas MAX_TOTAL_LEVELS niveaux
            const totalLevels = numWorlds * levelsPerWorld * multiplier;
            if (totalLevels > MAX_TOTAL_LEVELS) {
                numWorldsInput.style.border = '2px solid #FF0000';
                numWorldsInput.style.background = '#FFE0E0';
                levelsPerWorldInput.style.border = '2px solid #FF0000';
                levelsPerWorldInput.style.background = '#FFE0E0';
                const cursusInfo = isAll ? ` × 3 cursus` : '';
                alert(`❌ Limite dépassée !\n\n${numWorlds} mondes × ${levelsPerWorld} niveaux/monde${cursusInfo} = ${totalLevels} niveaux\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux au total.\n\nLes valeurs ont été ajustées automatiquement.`);
                
                // Ajuster automatiquement les valeurs
                // Stratégie : réduire levelsPerWorld en priorité
                let adjustedLevelsPerWorld = Math.floor(MAX_TOTAL_LEVELS / (numWorlds * multiplier));
                if (adjustedLevelsPerWorld < 1) {
                    // Si même avec 1 niveau par monde c'est trop, réduire le nombre de mondes
                    adjustedLevelsPerWorld = 1;
                    const adjustedNumWorlds = Math.floor(MAX_TOTAL_LEVELS / multiplier);
                    numWorldsInput.value = adjustedNumWorlds;
                }
                levelsPerWorldInput.value = adjustedLevelsPerWorld;
                
                // Réinitialiser les styles
                numWorldsInput.style.border = '2px solid #E0E0E0';
                numWorldsInput.style.background = 'white';
                levelsPerWorldInput.style.border = '2px solid #E0E0E0';
                levelsPerWorldInput.style.background = 'white';
                
                // Utiliser les valeurs ajustées pour la suite
                autoCreateConfig.numWorlds = parseInt(numWorldsInput.value);
                autoCreateConfig.levelsPerWorld = parseInt(levelsPerWorldInput.value);
            } else {
                // Réinitialiser les styles si OK
                numWorldsInput.style.border = '2px solid #E0E0E0';
                numWorldsInput.style.background = 'white';
                levelsPerWorldInput.style.border = '2px solid #E0E0E0';
                levelsPerWorldInput.style.background = 'white';
                
                autoCreateConfig.numWorlds = numWorlds;
                autoCreateConfig.levelsPerWorld = levelsPerWorld;
            }
            
            // Ajuster le tableau des mondes
            while (autoCreateConfig.worlds.length < numWorlds) {
                const worldIndex = autoCreateConfig.worlds.length;
                autoCreateConfig.worlds.push({
                    pointsRequired: worldIndex === 0 ? 0 : 10 * worldIndex,
                    difficulty1: Math.floor(levelsPerWorld / 3),
                    difficulty2: Math.floor(levelsPerWorld / 3),
                    difficulty3: levelsPerWorld - 2 * Math.floor(levelsPerWorld / 3)
                });
            }
            autoCreateConfig.worlds = autoCreateConfig.worlds.slice(0, numWorlds);
            
            // Mettre à jour les valeurs pour correspondre au nouveau levelsPerWorld
            autoCreateConfig.worlds.forEach((world, i) => {
                const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
                if (total !== levelsPerWorld) {
                    // Répartir équitablement
                    world.difficulty1 = Math.floor(levelsPerWorld / 3);
                    world.difficulty2 = Math.floor(levelsPerWorld / 3);
                    world.difficulty3 = levelsPerWorld - 2 * Math.floor(levelsPerWorld / 3);
                }
                
                // AJUSTEMENT AUTOMATIQUE DES POINTS REQUIS
                if (shouldUpdatePoints && i > 0) {
                    const previousLevels = i * levelsPerWorld;
                    const maxPointsAvailable = previousLevels * 2;
                    
                    // Utiliser la formule incrémentale : (levelsPerWorld + 1) × index
                    // Monde 2 : (10 + 1) × 1 = 11
                    // Monde 3 : (10 + 1) × 2 = 22
                    const recommendedPoints = (levelsPerWorld + 1) * i;
                    
                    // Si les points actuels dépassent le max OU si shouldUpdatePoints = true, ajuster
                    if (world.pointsRequired > maxPointsAvailable || shouldUpdatePoints) {
                        // Utiliser les points recommandés s'ils sont atteignables, sinon le max
                        world.pointsRequired = Math.min(recommendedPoints, maxPointsAvailable);
                    }
                }
            });
            
            // Mettre à jour les champs de configuration rapide pour refléter la nouvelle répartition
            if (autoCreateConfig.worlds.length > 0) {
                document.getElementById('quick-diff1').value = autoCreateConfig.worlds[0].difficulty1;
                document.getElementById('quick-diff2').value = autoCreateConfig.worlds[0].difficulty2;
                document.getElementById('quick-diff3').value = autoCreateConfig.worlds[0].difficulty3;
                
                // Ajuster les points requis SEULEMENT si shouldUpdatePoints = true
                if (shouldUpdatePoints) {
                    document.getElementById('quick-points').value = levelsPerWorld + 1;
                }
            }
            
            // Générer l'interface
            const configDiv = document.getElementById('auto-worlds-config');
            configDiv.innerHTML = '';
            
            for (let i = 0; i < numWorlds; i++) {
                const worldDiv = document.createElement('div');
                worldDiv.style.cssText = 'margin-bottom: 15px; padding: 12px; background: white; border-radius: 4px; border: 2px solid #E0E0E0;';
                
                // Titre du monde
                const worldTitle = document.createElement('div');
                worldTitle.style.cssText = 'font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #1976D2;';
                worldTitle.textContent = `🌍 Monde ${i + 1}`;
                worldDiv.appendChild(worldTitle);
                
                // Points requis
                const pointsDiv = document.createElement('div');
                pointsDiv.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
                
                const pointsLabel = document.createElement('label');
                pointsLabel.style.cssText = 'font-size: 12px; min-width: 120px;';
                pointsLabel.textContent = 'Points requis:';
                
                const pointsInput = document.createElement('input');
                pointsInput.type = 'number';
                pointsInput.min = '0';
                pointsInput.max = '10000';
                pointsInput.value = autoCreateConfig.worlds[i].pointsRequired;
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
                            pointsInput.value = autoCreateConfig.worlds[i].pointsRequired;
                            return;
                        }
                        
                        // Réinitialiser le style si OK
                        pointsInput.style.border = '2px solid #E0E0E0';
                        pointsInput.style.background = 'white';
                    }
                    
                    autoCreateConfig.worlds[i].pointsRequired = newPoints;
                };
                
                pointsDiv.appendChild(pointsLabel);
                pointsDiv.appendChild(pointsInput);
                
                if (i === 0) {
                    const note = document.createElement('span');
                    note.style.cssText = 'font-size: 11px; color: #999;';
                    note.textContent = '(toujours accessible)';
                    pointsDiv.appendChild(note);
                }
                
                worldDiv.appendChild(pointsDiv);
                
                // Difficultés
                const difficultiesDiv = document.createElement('div');
                difficultiesDiv.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;';
                
                ['difficulty1', 'difficulty2', 'difficulty3'].forEach((key, idx) => {
                    const diffDiv = document.createElement('div');
                    diffDiv.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
                    
                    const diffLabel = document.createElement('label');
                    diffLabel.style.cssText = 'font-size: 11px; font-weight: bold;';
                    diffLabel.textContent = `Difficulté ${idx + 1}:`;
                    
                    const diffInput = document.createElement('input');
                    diffInput.type = 'number';
                    diffInput.min = '0';
                    diffInput.max = levelsPerWorld.toString();
                    diffInput.value = autoCreateConfig.worlds[i][key];
                    diffInput.dataset.worldIndex = i;
                    diffInput.dataset.key = key;
                    diffInput.style.cssText = 'width: 100%; padding: 4px; border: 2px solid #E0E0E0; border-radius: 4px; font-size: 12px;';
                    
                    // Ajouter la sélection automatique au focus
                    diffInput.addEventListener('focus', function() {
                        this.select();
                    });
                    
                    diffInput.onchange = (e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        
                        // Obtenir le multiplicateur selon le cursus
                        const cursusSelect = document.getElementById('auto-cursus-select');
                        const isAll = cursusSelect.value === 'all';
                        const multiplier = isAll ? 3 : 1;
                        
                        // Calculer le total si on applique ce changement
                        const tempWorld = {...autoCreateConfig.worlds[i]};
                        tempWorld[key] = newValue;
                        const worldTotal = tempWorld.difficulty1 + tempWorld.difficulty2 + tempWorld.difficulty3;
                        
                        // Calculer le total global
                        let globalTotal = 0;
                        autoCreateConfig.worlds.forEach((w, idx) => {
                            if (idx === i) {
                                globalTotal += worldTotal;
                            } else {
                                globalTotal += (w.difficulty1 + w.difficulty2 + w.difficulty3);
                            }
                        });
                        
                        // Appliquer le multiplicateur
                        globalTotal *= multiplier;
                        
                        // Vérifier la limite de 300
                        if (globalTotal > MAX_TOTAL_LEVELS) {
                            e.target.style.border = '2px solid #FF0000';
                            e.target.style.background = '#FFE0E0';
                            const cursusInfo = isAll ? ' (× 3 cursus)' : '';
                            alert(`❌ Limite dépassée !\n\nCe changement porterait le total à ${globalTotal} niveaux${cursusInfo}.\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux au total.\n\nVeuillez réduire les niveaux dans d'autres mondes ou ajuster la configuration générale.`);
                            e.target.value = autoCreateConfig.worlds[i][key];
                            // Réinitialiser les styles après restauration
                            e.target.style.border = '2px solid #E0E0E0';
                            e.target.style.background = 'white';
                            return;
                        }
                        
                        // Si OK, appliquer le changement
                        autoCreateConfig.worlds[i][key] = newValue;
                        validateDifficulties(i);
                    };
                    
                    diffDiv.appendChild(diffLabel);
                    diffDiv.appendChild(diffInput);
                    difficultiesDiv.appendChild(diffDiv);
                });
                
                worldDiv.appendChild(difficultiesDiv);
                
                // Message d'erreur
                const errorMsg = document.createElement('div');
                errorMsg.id = `world-${i}-error`;
                errorMsg.style.cssText = 'font-size: 11px; color: #f44336; margin-top: 5px; display: none;';
                worldDiv.appendChild(errorMsg);
                
                configDiv.appendChild(worldDiv);
            }
        }
        
        function validateQuickConfig() {
            const diff1 = parseInt(document.getElementById('quick-diff1').value) || 0;
            const diff2 = parseInt(document.getElementById('quick-diff2').value) || 0;
            const diff3 = parseInt(document.getElementById('quick-diff3').value) || 0;
            const levelsPerWorld = autoCreateConfig.levelsPerWorld;
            const total = diff1 + diff2 + diff3;
            
            const errorMsg = document.getElementById('quick-config-error');
            const applyBtn = document.getElementById('quick-apply-btn');
            const inputs = [
                document.getElementById('quick-diff1'),
                document.getElementById('quick-diff2'),
                document.getElementById('quick-diff3')
            ];
            
            if (total > levelsPerWorld) {
                errorMsg.textContent = `⚠️ Total: ${total} / ${levelsPerWorld} niveaux (trop de niveaux !)`;
                errorMsg.style.display = 'block';
                inputs.forEach(input => {
                    input.style.borderColor = '#f44336';
                    input.style.color = '#f44336';
                });
                // Désactiver le bouton
                applyBtn.disabled = true;
                applyBtn.style.opacity = '0.5';
                applyBtn.style.cursor = 'not-allowed';
                applyBtn.style.background = '#9E9E9E';
            } else {
                errorMsg.style.display = 'none';
                inputs.forEach(input => {
                    input.style.borderColor = '#E0E0E0';
                    input.style.color = '#000';
                });
                // Réactiver le bouton
                applyBtn.disabled = false;
                applyBtn.style.opacity = '1';
                applyBtn.style.cursor = 'pointer';
                applyBtn.style.background = '#4CAF50';
            }
        }
        
        function applyQuickConfig() {
            const cursusSelect = document.getElementById('auto-cursus-select');
            const isAll = cursusSelect.value === 'all';
            const multiplier = isAll ? 3 : 1;
            
            const pointsIncrement = parseInt(document.getElementById('quick-points').value) || 10;
            const diff1 = parseInt(document.getElementById('quick-diff1').value) || 0;
            const diff2 = parseInt(document.getElementById('quick-diff2').value) || 0;
            const diff3 = parseInt(document.getElementById('quick-diff3').value) || 0;
            const levelsPerWorld = autoCreateConfig.levelsPerWorld;
            
            
            // Vérifier que le total correspond au nombre de niveaux par monde
            const total = diff1 + diff2 + diff3;
            if (total !== levelsPerWorld) {
                alert(`⚠️ Le total des difficultés (${total}) doit être égal au nombre de niveaux par monde (${levelsPerWorld})`);
                return;
            }
            
            // VALIDATION : Vérifier que le total ne dépasse pas 300 niveaux
            const totalLevels = autoCreateConfig.numWorlds * levelsPerWorld * multiplier;
            if (totalLevels > MAX_TOTAL_LEVELS) {
                const cursusInfo = isAll ? ` × 3 cursus` : '';
                alert(`❌ Configuration impossible !\n\n${autoCreateConfig.numWorlds} mondes × ${levelsPerWorld} niveaux/monde${cursusInfo} = ${totalLevels} niveaux\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux au total.\n\nVeuillez d'abord ajuster le nombre de mondes ou de niveaux par monde dans "Configuration générale".`);
                return;
            }
            
            // VALIDATION : Vérifier que les points requis sont atteignables pour tous les mondes
            for (let i = 1; i < autoCreateConfig.numWorlds; i++) {
                const previousLevels = i * levelsPerWorld;
                const maxPointsAvailable = previousLevels * 2;
                const requiredPoints = pointsIncrement * i; // Incrément cumulatif : monde 2 = 11, monde 3 = 22
                
                
                if (requiredPoints > maxPointsAvailable) {
                    alert(`❌ Impossible !\n\nLe Monde ${i + 1} nécessiterait ${requiredPoints} points avec cette configuration.\n\nMais les ${previousLevels} niveaux précédents donnent au maximum ${maxPointsAvailable} points (${previousLevels} × 2).\n\nVeuillez réduire les points requis à maximum ${Math.floor(maxPointsAvailable / i)}.`);
                    return;
                }
            }
            
            
            // Appliquer à tous les mondes
            autoCreateConfig.worlds.forEach((world, index) => {
                if (index === 0) {
                    world.pointsRequired = 0;
                } else {
                    // Incrément cumulatif : monde 2 = 11, monde 3 = 22, monde 4 = 33
                    world.pointsRequired = pointsIncrement * index;
                }
                
                world.difficulty1 = diff1;
                world.difficulty2 = diff2;
                world.difficulty3 = diff3;
            });
            
            
            // Régénérer l'interface SANS mettre à jour les points
            updateAutoWorldsConfig(false);
            
        }
        
        function validateDifficulties(worldIndex) {
            const world = autoCreateConfig.worlds[worldIndex];
            const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
            const levelsPerWorld = autoCreateConfig.levelsPerWorld;
            const errorMsg = document.getElementById(`world-${worldIndex}-error`);
            
            // Trouver tous les inputs de ce monde
            const inputs = document.querySelectorAll(`input[data-world-index="${worldIndex}"]`);
            
            if (total > levelsPerWorld) {
                errorMsg.textContent = `⚠️ Total: ${total} / ${levelsPerWorld} niveaux (trop de niveaux !)`;
                errorMsg.style.display = 'block';
                inputs.forEach(input => {
                    input.style.borderColor = '#f44336';
                    input.style.color = '#f44336';
                });
            } else {
                errorMsg.style.display = 'none';
                inputs.forEach(input => {
                    input.style.borderColor = '#E0E0E0';
                    input.style.color = 'inherit';
                });
                if (total < levelsPerWorld) {
                    errorMsg.textContent = `ℹ️ Total: ${total} / ${levelsPerWorld} niveaux`;
                    errorMsg.style.display = 'block';
                    errorMsg.style.color = '#2196F3';
                }
            }
            
            // Vérifier tous les mondes pour activer/désactiver les boutons de génération
            checkAllWorlds();
        }
        
        function checkAllWorlds() {
            const levelsPerWorld = autoCreateConfig.levelsPerWorld;
            let hasError = false;
            
            // Vérifier chaque monde
            autoCreateConfig.worlds.forEach((world) => {
                const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
                if (total > levelsPerWorld) {
                    hasError = true;
                }
            });
            
            // Activer/désactiver les boutons de génération
            const btnTop = document.getElementById('generate-btn-top');
            const btnBottom = document.getElementById('generate-btn-bottom');
            
            if (hasError) {
                // Désactiver les boutons
                btnTop.disabled = true;
                btnTop.style.opacity = '0.5';
                btnTop.style.cursor = 'not-allowed';
                btnTop.style.background = '#9E9E9E';
                
                btnBottom.disabled = true;
                btnBottom.style.opacity = '0.5';
                btnBottom.style.cursor = 'not-allowed';
                btnBottom.style.background = '#9E9E9E';
            } else {
                // Réactiver les boutons
                btnTop.disabled = false;
                btnTop.style.opacity = '1';
                btnTop.style.cursor = 'pointer';
                btnTop.style.background = '#4CAF50';
                
                btnBottom.disabled = false;
                btnBottom.style.opacity = '1';
                btnBottom.style.cursor = 'pointer';
                btnBottom.style.background = '#4CAF50';
            }
        }
        
        async function generateWorldsAutomatically() {
            
            // Vérifier que la config existe
            if (!autoCreateConfig) {
                alert('❌ Erreur: Configuration non initialisée. Veuillez fermer et rouvrir la popup.');
                return;
            }
            
            
            const selectedCursus = document.getElementById('auto-cursus-select').value;
            const cursusList = selectedCursus === 'all' ? ['5eme', '4eme', '3eme'] : [selectedCursus];
            
            // VÉRIFICATION PRIORITAIRE : Calculer le nombre total de niveaux qui seront créés
            let totalLevelsToCreate = 0;
            for (const cursus of cursusList) {
                // Nombre de niveaux par monde * nombre de mondes = niveaux par cursus
                const levelsPerCursus = autoCreateConfig.numWorlds * autoCreateConfig.levelsPerWorld;
                totalLevelsToCreate += levelsPerCursus;
            }
            
            // Compter les niveaux existants dans les cursus NON affectés
            let existingLevelsInOtherCursus = 0;
            for (let cursusName in cursusData) {
                if (!cursusList.includes(cursusName)) {
                    existingLevelsInOtherCursus += Object.keys(cursusData[cursusName].levels).length;
                }
            }
            
            const totalFinalLevels = totalLevelsToCreate + existingLevelsInOtherCursus;
            
            if (totalFinalLevels > MAX_TOTAL_LEVELS) {
                alert(`❌ Limite dépassée !\n\nCette génération créerait ${totalLevelsToCreate} niveau(x).\nAvec les ${existingLevelsInOtherCursus} niveau(x) existant(s) dans les autres cursus, cela ferait ${totalFinalLevels} niveaux au total.\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux (tous cursus confondus).\n\nVeuillez réduire le nombre de mondes ou de niveaux par monde.`);
                return;
            }
            
            // Vérifier les configurations pour tous les cursus
            for (let i = 0; i < autoCreateConfig.worlds.length; i++) {
                const world = autoCreateConfig.worlds[i];
                const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
                
                if (total > autoCreateConfig.levelsPerWorld) {
                    alert(`❌ Erreur: Le monde ${i + 1} a trop de niveaux (${total}/${autoCreateConfig.levelsPerWorld})`);
                    return;
                }
                
                // Vérifier que les points requis sont atteignables (pour monde 2+)
                if (i > 0) {
                    const previousLevels = i * autoCreateConfig.levelsPerWorld;
                    const maxPointsAvailable = previousLevels * 2;
                    
                    if (world.pointsRequired > maxPointsAvailable) {
                        alert(`❌ Erreur: Le Monde ${i + 1} demande ${world.pointsRequired} points pour être débloqué.\n\nMais les ${previousLevels} niveaux des mondes précédents donnent au maximum ${maxPointsAvailable} points.\n\nVeuillez ajuster les points requis.`);
                        return;
                    }
                }
            }
            
            // Message de confirmation
            let confirmMessage = '';
            let totalExistingLevels = 0;
            
            for (const cursus of cursusList) {
                const existingLevels = Object.keys(cursusData[cursus].levels || {});
                totalExistingLevels += existingLevels.length;
            }
            
            if (totalExistingLevels > 0) {
                const cursusText = cursusList.length > 1 ? `les ${cursusList.length} cursus` : `le cursus ${cursusList[0]}`;
                confirmMessage = `⚠️ ATTENTION\n\nVous avez ${totalExistingLevels} niveau(x) existant(s) dans ${cursusText}.\nLa génération entraînera leur suppression.\nCette action est irréversible.\n\nVoulez-vous continuer ?`;
            } else {
                const cursusText = cursusList.length > 1 ? `les ${cursusList.length} cursus` : `le cursus ${cursusList[0]}`;
                confirmMessage = `Voulez-vous générer ${autoCreateConfig.numWorlds} monde(s) avec ${autoCreateConfig.levelsPerWorld} niveaux par monde pour ${cursusText} ?\n\nCela va créer les niveaux automatiquement selon la configuration choisie.`;
            }
            
            const userConfirmed = await customConfirm(confirmMessage, totalExistingLevels > 0);
            
            if (!userConfirmed) {
                return;
            }
            
            
            // Afficher un message de progression
            const progressMsg = document.createElement('div');
            progressMsg.id = 'progress-message';
            progressMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10004; text-align: center;';
            progressMsg.innerHTML = '<h3>⏳ Génération en cours...</h3><p style="margin-top: 10px;">Veuillez patienter</p>';
            document.body.appendChild(progressMsg);
            
            // Attendre un peu pour que le message s'affiche
            await new Promise(resolve => setTimeout(resolve, 100));
            
            try {
                let totalLevelsCreated = 0;
                
                // Boucle sur tous les cursus à générer
                for (const cursus of cursusList) {
                    
                    // Effacer tous les niveaux existants
                    cursusData[cursus].levels = {};
                    
                    // Configurer les mondes
                    cursusData[cursus].worlds = autoCreateConfig.numWorlds;
                    cursusData[cursus].levelsPerWorld = autoCreateConfig.levelsPerWorld;
                    cursusData[cursus].pointsPerWorld = autoCreateConfig.worlds.map(w => w.pointsRequired);
                    
                    
                    // Générer les niveaux pour chaque monde
                    let levelNumber = 1;
                    
                    for (let worldIdx = 0; worldIdx < autoCreateConfig.numWorlds; worldIdx++) {
                        const worldConfig = autoCreateConfig.worlds[worldIdx];
                        
                        // Générer les niveaux de difficulté 1
                        for (let i = 0; i < worldConfig.difficulty1; i++) {
                            await generateLevel(cursus, levelNumber, 1);
                            levelNumber++;
                            totalLevelsCreated++;
                        }
                        
                        // Générer les niveaux de difficulté 2
                        for (let i = 0; i < worldConfig.difficulty2; i++) {
                            await generateLevel(cursus, levelNumber, 2);
                            levelNumber++;
                            totalLevelsCreated++;
                        }
                        
                        // Générer les niveaux de difficulté 3
                        for (let i = 0; i < worldConfig.difficulty3; i++) {
                            await generateLevel(cursus, levelNumber, 3);
                            levelNumber++;
                            totalLevelsCreated++;
                        }
                    }
                }
                
                // Sauvegarder
                saveToStorage();
                markAsModified(); // Marquer qu'il y a eu des modifications
                
                // Fermer les popups et recharger
                const progressElement = document.getElementById('progress-message');
                if (progressElement) {
                    document.body.removeChild(progressElement);
                }
                closeAutoCreateModal();
                closeLevelManagerModal();
                loadTeacherLevels();
                
                
            } catch (error) {
                const progressElement = document.getElementById('progress-message');
                if (progressElement) {
                    document.body.removeChild(progressElement);
                }
                alert('❌ Erreur lors de la génération: ' + error.message);
            }
        }
        
        async function generateLevel(cursus, levelNumber, difficulty) {
            // Simuler un petit délai pour ne pas bloquer l'interface
            await new Promise(resolve => setTimeout(resolve, 10));
            
            
            // Sauvegarder l'état actuel
            const savedPaintedCells = { ...paintedCells };
            const savedSelectedPattern = selectedPattern;
            const savedDifficulty = document.getElementById('generation-difficulty').value;
            const savedCreatedVariables = [...createdVariables];
            const savedVariables = { ...variables };
            
            try {
                // Nettoyer complètement l'état
                paintedCells = {};
                createdVariables = [];
                variables = {};
                clearProgram();
                
                // Ajouter de l'aléatoire basé sur le cursus pour avoir des motifs différents
                // Chaque cursus aura une "seed" différente basée sur son nom
                const cursusSeeds = { '5eme': 17, '4eme': 37, '3eme': 53 };
                const seed = cursusSeeds[cursus] || 1;
                
                // Générer des appels aléatoires pour décaler la séquence Math.random()
                // Cela fait que chaque cursus aura des motifs différents
                for (let i = 0; i < seed + levelNumber; i++) {
                    Math.random();
                }
                
                // Mettre la difficulté dans le select pour que generateRandomPattern l'utilise
                document.getElementById('generation-difficulty').value = difficulty;
                
                // Appeler directement la fonction de génération automatique du mode pinceau
                generateRandomPattern();
                
                // Attendre plus longtemps pour la difficulté 3 car elle a un setTimeout interne
                const waitTime = difficulty === 3 ? 250 : 100;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // Récupérer les blocs créés
                const programBlocks = document.getElementById('program-blocks');
                const blocks = programBlocks.querySelectorAll(':scope > .program-block');
                
                if (blocks.length === 0) {
                    // Attendre encore un peu et réessayer
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const blocksRetry = programBlocks.querySelectorAll(':scope > .program-block');
                    if (blocksRetry.length === 0) {
                        throw new Error('Aucun bloc généré même après 2 tentatives');
                    }
                }
                
                const finalBlocks = programBlocks.querySelectorAll(':scope > .program-block');
                const savedBlocks = [];
                finalBlocks.forEach(block => {
                    const blockData = extractBlockData(block);
                    savedBlocks.push(blockData);
                });
                
                
                // Sauvegarder l'état de la grille et les cellules peintes
                const gridState = getGridState();
                const paintedCellsData = getPaintedCellsData();
                
                // Sauvegarder aussi les variables créées
                const savedVars = {
                    createdVariables: [...createdVariables],
                    variableValues: { ...variables }
                };
                
                // Créer le niveau
                const newLevel = {
                    blocks: savedBlocks,
                    blockCount: countTotalBlocks(finalBlocks),
                    gridState: gridState,
                    paintedCells: paintedCellsData,
                    variables: savedVars
                };
                
                
                cursusData[cursus].levels[levelNumber.toString()] = newLevel;
                
            } catch (error) {
                throw error;
            } finally {
                // Restaurer l'état
                paintedCells = savedPaintedCells;
                selectedPattern = savedSelectedPattern;
                document.getElementById('generation-difficulty').value = savedDifficulty;
                createdVariables = savedCreatedVariables;
                variables = savedVariables;
            }
        }
        
        function closeAutoCreateModal() {
            document.getElementById('auto-create-modal').classList.remove('active');
            autoCreateConfig = null;
        }
        
        
        // Raccourci clavier P pour mode professeur et ECHAP pour fermer la modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'p' || e.key === 'P') {
                // Ne pas déclencher si on est en train de taper dans un input
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault(); // Empêcher la touche P de s'écrire
                    switchMode('teacher');
                }
            }
            
            // Fermer la modal de mot de passe avec ECHAP
            if (e.key === 'Escape') {
                const passwordModal = document.getElementById('password-modal');
                if (passwordModal.classList.contains('active')) {
                    closePasswordModal();
                }
            }
        });

        function updateModeDisplay() {
            const studentLeft = document.getElementById('student-left');
            const teacherLeft = document.getElementById('teacher-left');
            const modeBtns = document.querySelectorAll('.mode-btn');
            const headerScore = document.getElementById('header-score-display');
            const appHeader = document.getElementById('app-header');
            const headerSubtitle = document.getElementById('header-subtitle');
            const headerMainTitle = document.getElementById('header-main-title');
            const loadLevelsBtn = document.getElementById('load-levels-btn');
            const saveOnlineBtn = document.getElementById('save-online-btn');
            const studentModeBtn = document.getElementById('student-mode-btn');
            const teacherModeBtn = document.getElementById('teacher-mode-btn');
            const mobileStudentModeBtn = document.getElementById('mobile-student-mode-btn');
            const mobileTeacherModeBtn = document.getElementById('mobile-teacher-mode-btn');

            if (currentMode === 'student') {
                // MODE ÉLÈVE (Aperçu)
                studentLeft.style.display = 'block';
                teacherLeft.style.display = 'none';
                
                // Gérer les boutons PC
                if (studentModeBtn) studentModeBtn.style.display = 'none'; // Cacher "Aperçu mode élève"
                if (teacherModeBtn) teacherModeBtn.style.display = 'inline-block'; // Afficher "Création de niveaux"
                
                // Gérer les boutons mobile
                if (mobileStudentModeBtn) mobileStudentModeBtn.style.display = 'none';
                if (mobileTeacherModeBtn) mobileTeacherModeBtn.style.display = 'block';
                
                // Header PC et mobile
                if (headerMainTitle) {
                    if (window.innerWidth > 768) {
                        headerMainTitle.textContent = '🎨 Programmation motifs - Aperçu mode élève';
                    } else {
                        headerMainTitle.textContent = '📖 Aperçu mode élève';
                    }
                }
                
                headerScore.style.display = 'block';
                appHeader.classList.remove('teacher-mode');
                document.body.classList.remove('teacher-mode');
                headerSubtitle.style.display = 'none';
                loadLevelsBtn.style.display = 'none';
                saveOnlineBtn.style.display = 'none';
                
                // Cacher le bouton d'aide en mode élève
                const helpBtn = document.getElementById('help-button');
                if (helpBtn) helpBtn.style.display = 'none';
                
                loadCursusLevels();
            } else {
                // MODE PROFESSEUR (Création de niveaux)
                studentLeft.style.display = 'none';
                teacherLeft.style.display = 'block';
                
                // Gérer les boutons PC
                if (studentModeBtn) studentModeBtn.style.display = 'inline-block'; // Afficher "Aperçu mode élève"
                if (teacherModeBtn) teacherModeBtn.style.display = 'none'; // Cacher "Création de niveaux"
                
                // Gérer les boutons mobile
                if (mobileStudentModeBtn) mobileStudentModeBtn.style.display = 'block';
                if (mobileTeacherModeBtn) mobileTeacherModeBtn.style.display = 'none';
                
                // Header PC et mobile
                if (headerMainTitle) {
                    if (window.innerWidth > 768) {
                        headerMainTitle.textContent = '🎨 Programmation motifs - Mode création de niveaux';
                    } else {
                        headerMainTitle.textContent = '✏️ Mode création de niveaux';
                    }
                }
                
                headerScore.style.display = 'none';
                appHeader.classList.add('teacher-mode');
                document.body.classList.add('teacher-mode');
                headerSubtitle.style.display = 'block';
                loadLevelsBtn.style.display = 'block';
                saveOnlineBtn.style.display = 'block';
                
                // Afficher le bouton d'aide en mode professeur
                const helpBtn = document.getElementById('help-button');
                if (helpBtn) helpBtn.style.display = 'block';
                
                // Animer le bouton d'aide au premier chargement
                checkAndAnimateHelpButton();
                
                setTimeout(() => {
                    initPaintMode();
                }, 100);
            }
            
            // Mettre à jour les boutons mobiles
            updateMobileModeButtons();
            
            clearProgram();
            clearGrid();
            clearPaintedCells();
        }

        // Fonction pour gérer le pliage/dépliage des catégories
        function toggleCategory(header) {
            const categoryBlocks = header.nextElementSibling;
            const isExpanded = header.classList.contains('expanded');
            
            if (isExpanded) {
                header.classList.remove('expanded');
                header.classList.add('collapsed');
                categoryBlocks.classList.add('hidden');
            } else {
                header.classList.remove('collapsed');
                header.classList.add('expanded');
                categoryBlocks.classList.remove('hidden');
            }
        }

        // Drag & Drop
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
            
            ev.dataTransfer.setData('text', JSON.stringify(blockData));
        }

        function drop(ev) {
            ev.preventDefault();
            ev.stopPropagation(); // Empêcher la propagation pour éviter les doublons
            ev.currentTarget.classList.remove('drag-over');
            
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

        // Fonction pour valider et gérer les inputs numériques dans les blocs
        function setupNumericInputValidation(blockElement) {
            // Attraper TOUS les inputs : dans le bloc ET dans les value-slots
            const inputs = blockElement.querySelectorAll('input[type="text"], input[type="number"]');
            
            inputs.forEach(input => {
                // Vérifier si déjà initialisé pour éviter les doublons
                if (input.dataset.validationInitialized === 'true') {
                    return; // Déjà fait, passer au suivant
                }
                
                // Marquer comme initialisé
                input.dataset.validationInitialized = 'true';
                
                // Ignorer les inputs qui ont un placeholder mais pas de value (sélection de variable)
                const placeholder = input.placeholder;
                if (placeholder && (placeholder === 'a' || placeholder === 'b' || placeholder === 'valeur')) {
                    // C'est un input pour value-slot qui peut recevoir variable/opérateur
                    // On doit quand même le valider s'il contient un nombre
                }
                
                // Sauvegarder la valeur initiale
                let previousValue = input.value || '10';
                
                // Enlever pattern et inputmode restrictifs pour permettre les négatifs
                input.removeAttribute('pattern');
                
                // Au focus : sélectionner tout le texte
                input.addEventListener('focus', function() {
                    this.select();
                    previousValue = this.value;
                });
                
                // À chaque saisie : valider en temps réel
                input.addEventListener('input', function() {
                    validateNumericInput(this);
                });
                
                // Au blur : restaurer si invalide
                input.addEventListener('blur', function() {
                    const value = this.value.trim();
                    
                    // Si vide, restaurer la valeur précédente
                    if (value === '') {
                        this.value = previousValue;
                        this.style.background = '';
                        this.style.border = '';
                        checkAllInputsValidity();
                        return;
                    }
                    
                    // Déterminer les limites selon le type de bloc
                    const block = this.closest('.block');
                    let minValue = 1;
                    let maxValue = 100;
                    
                    if (block && (block.classList.contains('variables') || 
                                 block.classList.contains('operators') || 
                                 block.classList.contains('sensing'))) {
                        minValue = -10000;
                        maxValue = 10000;
                    }
                    
                    // Si invalide, restaurer la valeur précédente
                    if (!isValidNumber(value, minValue, maxValue)) {
                        this.value = previousValue;
                        this.style.background = '';
                        this.style.border = '';
                        checkAllInputsValidity();
                    } else {
                        // Valide, sauvegarder comme nouvelle valeur précédente
                        previousValue = this.value;
                        this.style.background = '';
                        this.style.border = '';
                        checkAllInputsValidity();
                    }
                });
            });
        }
        
        // Valider un input numérique
        function validateNumericInput(input) {
            const value = input.value.trim();
            
            // Vide = en attente, jaune léger
            if (value === '') {
                input.style.background = '#FFF9C4'; // Jaune léger
                input.style.border = '2px solid #FBC02D';
                checkAllInputsValidity();
                return;
            }
            
            // Déterminer les limites selon le type de bloc
            const block = input.closest('.block');
            let minValue = 1;
            let maxValue = 100;
            
            // Blocs variables, opérateurs, condition : limites étendues
            if (block && (block.classList.contains('variables') || 
                         block.classList.contains('operators') || 
                         block.classList.contains('sensing'))) {
                minValue = -10000;
                maxValue = 10000;
            }
            
            // Valider
            if (!isValidNumber(value, minValue, maxValue)) {
                // Invalide = rouge
                input.style.background = '#FFCDD2';
                input.style.border = '2px solid #F44336';
            } else {
                // Valide = style normal (blanc)
                input.style.background = '';
                input.style.border = '';
            }
            
            checkAllInputsValidity();
        }
        
        // Vérifier si une valeur est un nombre valide
        function isValidNumber(value, minValue = 1, maxValue = 100) {
            // Autoriser les nombres négatifs si minValue est négatif
            const pattern = minValue < 0 ? /^-?\d+$/ : /^\d+$/;
            
            // Doit être un nombre (avec - optionnel si négatif autorisé)
            if (!pattern.test(value)) {
                return false;
            }
            
            const num = parseInt(value, 10);
            
            // Doit être dans les limites
            if (isNaN(num) || num < minValue || num > maxValue) {
                return false;
            }
            
            return true;
        }
        
        // Vérifier tous les inputs du programme
        function checkAllInputsValidity() {
            const programBlocks = document.getElementById('program-blocks');
            // TOUS les inputs text et number
            const allInputs = programBlocks.querySelectorAll('input[type="text"], input[type="number"]');
            
            let hasInvalidInput = false;
            
            allInputs.forEach(input => {
                const value = input.value.trim();
                
                // Si vide, ignorer (sera géré au blur)
                if (value === '') {
                    hasInvalidInput = true;
                    return;
                }
                
                // Ignorer si ce n'est pas un nombre (peut-être une variable ou opérateur inséré)
                if (!/^-?\d+$/.test(value)) {
                    return;
                }
                
                // Déterminer les limites selon le type de bloc
                const block = input.closest('.block');
                let minValue = 1;
                let maxValue = 100;
                
                // Blocs variables, opérateurs, condition : limites étendues
                if (block && (block.classList.contains('variables') || 
                             block.classList.contains('operators') || 
                             block.classList.contains('sensing'))) {
                    minValue = -10000;
                    maxValue = 10000;
                }
                
                // Vérifier la validité
                if (!isValidNumber(value, minValue, maxValue)) {
                    hasInvalidInput = true;
                }
            });
            
            // Griser/activer TOUS les boutons "Tester"
            const runButtons = document.querySelectorAll('button[onclick="executeProgram()"]');
            runButtons.forEach(runButton => {
                if (hasInvalidInput) {
                    runButton.disabled = true;
                    runButton.style.opacity = '0.5';
                    runButton.style.cursor = 'not-allowed';
                    runButton.title = 'Corrigez les valeurs invalides avant de tester';
                } else {
                    runButton.disabled = false;
                    runButton.style.opacity = '1';
                    runButton.style.cursor = 'pointer';
                    runButton.title = '';
                }
            });
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
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = function() {
                    blockElement.remove();
                    updateBlockCount();
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
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = function() {
                    blockElement.remove();
                    updateBlockCount();
                };
                block.appendChild(removeBtn);
            }
            
            // IMPORTANT: Initialiser la validation des inputs numériques
            setupNumericInputValidation(blockElement);
            
            // Rendre le bloc déplaçable dans la zone de programmation
            blockElement.draggable = true;
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
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = function() {
                    blockElement.remove();
                    updateBlockCount();
                    if (parentArea.children.length === 0) {
                        parentArea.classList.add('empty');
                    }
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
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = function() {
                    blockElement.remove();
                    updateBlockCount();
                    if (parentArea.children.length === 0) {
                        parentArea.classList.add('empty');
                    }
                };
                block.appendChild(removeBtn);
            }
            
            // IMPORTANT: Initialiser la validation des inputs numériques
            setupNumericInputValidation(blockElement);
            
            // Rendre le bloc déplaçable même s'il est imbriqué
            blockElement.draggable = true;
            blockElement.ondragstart = function(e) {
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
        }

        // Exécution du programme
        function executeProgram() {
            // Récupérer les blocs du programme
            const blocks = document.getElementById('program-blocks').querySelectorAll(':scope > .program-block');
            
            // BLOQUER si le programme est vide en mode élève
            if (blocks.length === 0 && currentMode === 'student') {
                showResult('❌ Ton programme est vide ! Ajoute des blocs avant de valider.', false);
                return;
            }
            
            clearGrid();
            resetTurtle();
            variables = {};
            updateVariableDisplay();
            
            // Récupérer la grille active
            getActiveGrid();
            
            try {
                executeBlocks(blocks);
            } catch (error) {
                showResult('Erreur dans le programme: ' + error.message, false);
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

        function executeBlocks(blocks) {
            for (let block of blocks) {
                const blockElement = block.querySelector('.block');
                const type = blockElement.dataset.type;
                
                switch(type) {
                    case 'color':
                        turtle.color = blockElement.dataset.value;
                        // Colorier UNIQUEMENT la case actuelle, sans activer drawMode
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
                        const valueSlotRepeat = blockElement.querySelector('.value-slot');
                        let times = Math.round(evaluateValueSlot(valueSlotRepeat)) || 1;
                        
                        // S'assurer que times est au moins 1
                        if (times < 1) times = 1;
                        
                        const nestedArea = block.querySelector('.nested-blocks');
                        if (nestedArea) {
                            // CORRECTION: Sélectionner uniquement les enfants directs, pas tous les descendants
                            const nestedBlocks = Array.from(nestedArea.children).filter(child => child.classList.contains('program-block'));
                            for (let i = 0; i < times; i++) {
                                executeBlocks(nestedBlocks);
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
                                    executeBlocks(ifNestedBlocks);
                                }
                            }
                        }
                        break;
                    case 'operator':
                        // Les opérateurs sont plutôt utilisés dans les conditions
                        break;
                }
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
                        'pink': '#FF69B4',
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
            const resultMsg = document.getElementById('result-message');
            if (resultMsg) resultMsg.innerHTML = '';
            const teacherResultMsg = document.getElementById('teacher-result-message');
            if (teacherResultMsg) teacherResultMsg.innerHTML = '';
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
                    targetGrid.querySelectorAll('.cell').forEach(cell => {
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
            
            // Afficher le motif attendu dans target-grid
            displayTargetPattern(level);
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
            
            // MODE ÉLÈVE : Réinitialiser les variables (ne pas garder celles du prof)
            variables = {};
            createdVariables = [];
            
            // Masquer l'affichage des variables (l'élève n'a pas encore créé de variables)
            updateVariableDisplay();
            
            // Désactiver le mode aperçu
            window.isPreviewMode = false;
        }

        function validateLevel() {
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
            
            // Exécuter le programme de l'élève
            clearGrid();
            resetTurtle();
            getActiveGrid();
            executeBlocks(blocks);
            const studentGrid = getGridState();
            
            // Exécuter le programme du professeur (en interne, sans afficher)
            clearGrid();
            resetTurtle();
            getActiveGrid();
            const teacherBlocks = level.blocks;
            executeSavedBlocks(teacherBlocks);
            const teacherGrid = getGridState();
            
            // Comparer les grilles
            const isCorrect = compareGrids(studentGrid, teacherGrid);
            const blockCount = countTotalBlocks(blocks);
            const isOptimal = blockCount <= level.blockCount;
            
            // Si le programme est incorrect, restaurer la grille de l'élève
            if (!isCorrect) {
                clearGrid();
                resetTurtle();
                getActiveGrid();
                // Restaurer la grille de l'élève
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        if (studentGrid[i][j] !== 'white') {
                            grid[i][j] = studentGrid[i][j];
                        }
                    }
                }
                renderGrid();
                
                // Afficher un message d'erreur
                showResult('❌ Le motif n\'est pas correct. Essaie encore !', false);
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
                
                // Afficher la popup de félicitations
                showSuccessPopup(isOptimal, blockCount, level.blockCount, pointsEarned, wasAlreadyCompleted, wasAlreadyOptimal);
                
                _updateScoreDisplay();
                saveScore();
                saveCompletedLevels();
                
                // Mettre à jour uniquement les coches dans la liste sans recharger
                updateLevelChecks();
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
            // Vider le programme
            document.getElementById('program-blocks').innerHTML = '';
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
                // Tous les niveaux terminés
                showResult('🏆 Félicitations ! Tu as terminé tous les niveaux de ce cursus !', true);
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
                setTimeout(() => executeProgram(), 100);
            }
        }
        
        // Variable pour stocker le dernier niveau chargé
        let lastLoadedLevel = null;
        
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
                    blockHTML = `<div class="block ${blockClass}" data-type="color" data-value="${blockData.value}">couleur ${blockData.value.toUpperCase()}</div>`;
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

        // Affichage des variables
        function updateVariableDisplay() {
            const varDisplay = document.getElementById('variable-display');
            const varList = document.getElementById('variables-list');
            
            if (Object.keys(variables).length > 0) {
                varDisplay.style.display = 'block';
                varList.innerHTML = '';
                for (let [name, value] of Object.entries(variables)) {
                    const varItem = document.createElement('div');
                    varItem.textContent = `${name} = ${value}`;
                    varList.appendChild(varItem);
                }
            } else {
                varDisplay.style.display = 'none';
            }
            
            // Mettre à jour tous les sélecteurs de variables dans la palette
            updateVariableSelectors();
        }
        
        function updateVariableSelectors() {
            // Ne mettre à jour que les sélecteurs dans la palette (middle-panel), pas ceux dans la zone de programmation
            const palette = document.querySelector('.middle-panel');
            if (!palette) return;
            
            const varSelects = palette.querySelectorAll('.var-select');
            const lastVariable = createdVariables.length > 0 ? createdVariables[createdVariables.length - 1] : '';
            
            varSelects.forEach(select => {
                const currentValue = select.value;
                const hadNoValue = currentValue === '' || currentValue === 'variable';
                select.innerHTML = '<option value="">variable</option>';
                
                for (let varName of createdVariables) {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    
                    // Si c'était la valeur sélectionnée, la garder
                    if (varName === currentValue) {
                        option.selected = true;
                    }
                    // Sinon, si le sélecteur était vide, sélectionner la dernière variable
                    else if (hadNoValue && varName === lastVariable) {
                        option.selected = true;
                    }
                    
                    select.appendChild(option);
                }
                
                // S'assurer que la valeur est bien restaurée
                if (currentValue && createdVariables.includes(currentValue)) {
                    select.value = currentValue;
                }
            });
        }

        // Stockage local - Sauvegarder cursusData localement (pour ne pas perdre les niveaux non sauvegardés)
        function saveToStorage() {
            try {
                // Sauvegarder cursusData chiffré dans le localStorage
                const encrypted = _e({ cursusData: cursusData, timestamp: Date.now() });
                localStorage.setItem('_cd', encrypted);
                
                // NE PAS sauvegarder la version ici - elle sera sauvegardée uniquement 
                // après validation par checkVersionAndReset()
            } catch (e) {
            }
        }
        
        // Sauvegarder la version locale actuelle
        function saveLocalVersion() {
            let versionHash = '';
            for (let cursus in cursusData) {
                const version = cursusData[cursus].version || 1;
                versionHash += cursus + ':' + version + ';';
            }
            localStorage.setItem('version_local_preview', versionHash);
        }

        function loadFromStorage() {
            
            // Charger et déchiffrer le score
            const encryptedScore = localStorage.getItem('_s');
            
            if (encryptedScore) {
                const decrypted = _d(encryptedScore);
                
                if (decrypted && typeof decrypted.score === 'number') {
                    score = decrypted.score;
                } else {
                    // Données corrompues - réinitialiser
                    score = 0;
                }
            } else {
                // Pas de score sauvegardé
                score = 0;
            }
            
            // Mettre à jour l'affichage
            _updateScoreDisplay();
            
            // Charger et déchiffrer les niveaux complétés
            const encryptedLevels = localStorage.getItem('_cl');
            if (encryptedLevels) {
                const decrypted = _d(encryptedLevels);
                if (decrypted && decrypted.levels) {
                    completedLevels = decrypted.levels;
                } else {
                    // Données corrompues - réinitialiser
                    completedLevels = {};
                }
            } else {
                completedLevels = {};
            }
            
            // Charger et déchiffrer cursusData (niveaux du prof)
            const encryptedCursusData = localStorage.getItem('_cd');
            if (encryptedCursusData) {
                const decrypted = _d(encryptedCursusData);
                if (decrypted && decrypted.cursusData) {
                    cursusData = decrypted.cursusData;
                    
                    // Vérifier si des niveaux existent
                    let hasAnyLevels = false;
                    for (let cursus in cursusData) {
                        if (cursusData[cursus].levels && Object.keys(cursusData[cursus].levels).length > 0) {
                            hasAnyLevels = true;
                            break;
                        }
                    }
                    
                    // Si aucun niveau n'existe, réinitialiser le score et la progression
                    if (!hasAnyLevels) {
                        score = 0;
                        completedLevels = {};
                        _updateScoreDisplay();
                        saveScore();
                        saveCompletedLevels();
                    }
                    
                    // Initialiser la version locale si elle n'existe pas
                    if (!localStorage.getItem('version_local_preview')) {
                        saveLocalVersion();
                    }
                } else {
                }
            } else {
                // Première utilisation - initialiser la version
                saveLocalVersion();
            }
            
            // Nettoyer les anciennes clés non chiffrées (migration)
            localStorage.removeItem('score');
            localStorage.removeItem('completedLevels');
            localStorage.removeItem('cursusData'); // Ancienne clé non chiffrée
            
        }

        function saveScore() {
            const encrypted = _e({ score: score, timestamp: Date.now() });
            localStorage.setItem('_s', encrypted);
        }

        function saveCompletedLevels() {
            try {
                const encrypted = _e({ levels: completedLevels, timestamp: Date.now() });
                localStorage.setItem('_cl', encrypted);
            } catch (e) {
            }
        }

        // Messages
        function showResult(message, success) {
            const resultDiv = currentMode === 'student' ? 
                document.getElementById('result-message') : 
                document.getElementById('teacher-result-message');
            if (resultDiv) {
                resultDiv.textContent = message;
                resultDiv.className = success ? 'result-message success' : 'result-message error';
            }
        }

        // ========================================
        // SYSTÈME DE SAUVEGARDE EN LIGNE
        // ========================================
        
        let captchaNum1, captchaNum2, captchaAnswer;
        let generatedPassword = '';

        // Générer un code aléatoire de 8 caractères
        function generatePassword() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans O, 0, I, 1 pour éviter confusion
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        }

        // Copier le mot de passe dans le presse-papier
        function copyPassword() {
            const passwordInput = document.getElementById('save-password');
            passwordInput.select();
            document.execCommand('copy');
            
            // Feedback visuel
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✅ Copié !';
            button.style.background = '#4CAF50';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#2196F3';
            }, 2000);
        }

        // Générer un nouveau captcha
        function generateCaptcha() {
            captchaNum1 = Math.floor(Math.random() * 10) + 1;
            captchaNum2 = Math.floor(Math.random() * 10) + 1;
            captchaAnswer = captchaNum1 + captchaNum2;
            document.getElementById('captcha-question').textContent = `${captchaNum1} + ${captchaNum2} =`;
        }

        // Sauvegarder le niveau en cours puis ouvrir le modal de sauvegarde en ligne
        function saveLevelBeforeOnline() {
            const levelSelect = document.getElementById('teacher-level-select');
            
            // Si un niveau est en cours d'édition (pas "new"), le sauvegarder d'abord
            if (levelSelect && levelSelect.value !== 'new') {
                // Vérifier qu'il y a des blocs dans le programme
                const programBlocks = document.getElementById('program-blocks');
                const blocks = programBlocks.querySelectorAll(':scope > .program-block');
                
                if (blocks.length > 0) {
                    // Sauvegarder le niveau en cours dans cursusData
                    saveLevel();
                }
            }
            
            // Ouvrir le modal de sauvegarde en ligne
            openSaveOnlineModal();
        }

        // Ouvrir le modal de sauvegarde
        function openSaveOnlineModal() {
            document.getElementById('save-online-modal').classList.add('active');
            document.getElementById('save-prof-name').value = '';
            document.getElementById('captcha-answer').value = '';
            document.getElementById('save-message').innerHTML = '';
            document.getElementById('success-url').style.display = 'none';
            
            // Réinitialiser les boutons (au cas où on aurait sauvegardé avant)
            const buttonsDiv = document.getElementById('save-modal-buttons');
            buttonsDiv.innerHTML = `
                <button class="btn-confirm" onclick="confirmSaveOnline()">💾 Sauvegarder</button>
                <button class="btn-cancel" onclick="closeSaveOnlineModal()">Annuler</button>
            `;
            
            // Générer un nouveau code
            generatedPassword = generatePassword();
            document.getElementById('save-password').value = generatedPassword;
            
            generateCaptcha();
        }

        // Fermer le modal de sauvegarde
        function closeSaveOnlineModal() {
            document.getElementById('save-online-modal').classList.remove('active');
        }

        // Ouvrir le modal de chargement
        // Variables globales pour le tracking des modifications
        let loadedProfName = null;
        let hasModifications = false;
        
        // Ouvrir le modal de chargement des niveaux
        async function openLoadOnlineModal() {
            document.getElementById('load-online-modal').classList.add('active');
            document.getElementById('search-prof-name').value = '';
            document.getElementById('load-message').innerHTML = '';
            
            // Charger la liste des professeurs
            await loadProfessorsList();
        }

        // Fermer le modal de chargement
        function closeLoadOnlineModal() {
            document.getElementById('load-online-modal').classList.remove('active');
        }
        
        // Charger la liste de tous les professeurs
        async function loadProfessorsList() {
            const listDiv = document.getElementById('professors-list');
            listDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Chargement...</div>';
            
            try {
                const response = await fetch('api.php?action=list_professors');
                const result = await response.json();
                
                if (result.success && result.professors && result.professors.length > 0) {
                    listDiv.innerHTML = '';
                    result.professors.forEach(prof => {
                        const profDiv = document.createElement('div');
                        profDiv.className = 'professor-item';
                        profDiv.style.cssText = 'padding: 12px; margin: 5px 0; background: white; border: 2px solid #E0E0E0; border-radius: 6px; cursor: pointer; transition: all 0.2s;';
                        profDiv.innerHTML = `
                            <div style="font-weight: bold; font-size: 14px; color: #1976D2;">👤 ${prof}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">Cliquez pour charger les niveaux</div>
                        `;
                        profDiv.onmouseover = () => {
                            profDiv.style.background = '#E3F2FD';
                            profDiv.style.borderColor = '#2196F3';
                        };
                        profDiv.onmouseout = () => {
                            profDiv.style.background = 'white';
                            profDiv.style.borderColor = '#E0E0E0';
                        };
                        profDiv.onclick = () => loadProfessorLevels(prof);
                        listDiv.appendChild(profDiv);
                    });
                } else {
                    listDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Aucun professeur trouvé</div>';
                }
            } catch (error) {
                listDiv.innerHTML = '<div style="text-align: center; color: #f44336; padding: 20px;">❌ Erreur de chargement</div>';
            }
        }
        
        // Filtrer la liste des professeurs
        function filterProfessors() {
            const searchValue = document.getElementById('search-prof-name').value.toLowerCase();
            const items = document.querySelectorAll('.professor-item');
            
            items.forEach(item => {
                const profName = item.textContent.toLowerCase();
                if (profName.includes(searchValue)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        
        // Charger les niveaux d'un professeur
        async function loadProfessorLevels(profName) {
            const messageDiv = document.getElementById('load-message');
            messageDiv.innerHTML = '<div class="info-box">⏳ Chargement en cours...</div>';
            
            try {
                const response = await fetch(`api.php?action=load_public&profName=${profName}`);
                const result = await response.json();
                
                if (result.success) {
                    // Charger les données
                    cursusData = result.cursusData;
                    saveToStorage();
                    loadTeacherLevels();
                    
                    // Marquer comme chargé et sans modifications
                    loadedProfName = profName;
                    hasModifications = false;
                    updateCopyLinkButton();
                    
                    messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Niveaux chargés avec succès !</div>';
                    
                    setTimeout(() => {
                        closeLoadOnlineModal();
                        showResult(`✅ Niveaux de ${profName} chargés !`, true);
                    }, 1500);
                } else {
                    messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error-message">❌ Erreur de chargement</div>';
            }
        }
        
        // Mettre à jour la visibilité du bouton "Copier lien élève"
        function updateCopyLinkButton() {
            const copyBtn = document.getElementById('copy-student-link-btn');
            const deleteBtn = document.getElementById('delete-online-btn');
            const mobileCopyBtn = document.getElementById('mobile-copy-student-link-btn');
            const mobileDeleteBtn = document.getElementById('mobile-delete-online-btn');
            
            
            if (loadedProfName && !hasModifications) {
                copyBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'inline-block';
                // Utiliser setProperty avec !important pour surcharger le CSS
                if (mobileCopyBtn) mobileCopyBtn.style.setProperty('display', 'block', 'important');
                if (mobileDeleteBtn) mobileDeleteBtn.style.setProperty('display', 'block', 'important');
            } else {
                copyBtn.style.display = 'none';
                deleteBtn.style.display = 'none';
                // Utiliser setProperty avec !important pour surcharger le CSS
                if (mobileCopyBtn) mobileCopyBtn.style.setProperty('display', 'none', 'important');
                if (mobileDeleteBtn) mobileDeleteBtn.style.setProperty('display', 'none', 'important');
            }
            
            
            // Synchroniser aussi les boutons sauvegarder/charger en ligne mobile
            syncMobileTeacherButtons();
        }
        
        // Copier le lien élève
        function copyStudentLink() {
            if (!loadedProfName) {
                alert('❌ Aucun niveau chargé');
                return;
            }
            
            const studentUrl = `https://www.lejardindesoiseaux.com/p-blocks/index.html?prof=${loadedProfName}`;
            
            // Copier dans le presse-papier
            navigator.clipboard.writeText(studentUrl).then(() => {
                const btn = document.getElementById('copy-student-link-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copié !';
                btn.style.background = '#4CAF50';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '#FF9800';
                }, 2000);
            }).catch(err => {
                alert('Lien élève:\n' + studentUrl);
            });
        }
        
        // Ouvrir le modal de suppression
        function openDeleteOnlineModal() {
            if (!loadedProfName) {
                alert('❌ Aucune sauvegarde chargée');
                return;
            }
            document.getElementById('delete-online-modal').classList.add('active');
            document.getElementById('delete-password').value = '';
            document.getElementById('delete-message').innerHTML = '';
        }
        
        // Fermer le modal de suppression
        function closeDeleteOnlineModal() {
            document.getElementById('delete-online-modal').classList.remove('active');
        }
        
        // Confirmer la suppression
        async function confirmDeleteOnline() {
            const password = document.getElementById('delete-password').value;
            const messageDiv = document.getElementById('delete-message');
            
            if (!password) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez entrer votre code de sécurité</div>';
                return;
            }
            
            if (!loadedProfName) {
                messageDiv.innerHTML = '<div class="error-message">❌ Erreur : aucun nom de professeur</div>';
                return;
            }
            
            // Confirmation finale
            const confirmText = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer DÉFINITIVEMENT tous les niveaux de "${loadedProfName}".\n\nCette action est IRRÉVERSIBLE.\n\nVoulez-vous vraiment continuer ?`;
            if (!confirm(confirmText)) {
                return;
            }
            
            messageDiv.innerHTML = '<div class="info-box">⏳ Suppression en cours...</div>';
            
            try {
                const formData = new FormData();
                formData.append('action', 'delete');
                formData.append('profName', loadedProfName);
                formData.append('password', password);
                
                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Sauvegarde supprimée avec succès !</div>';
                    
                    // Réinitialiser les variables
                    loadedProfName = null;
                    hasModifications = false;
                    updateCopyLinkButton();
                    
                    setTimeout(() => {
                        closeDeleteOnlineModal();
                        showResult('✅ Votre sauvegarde en ligne a été supprimée', true);
                    }, 2000);
                } else {
                    messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion au serveur</div>';
            }
        }
        
        // Marquer qu'il y a eu des modifications (à appeler quand on modifie un niveau)
        function markAsModified() {
            hasModifications = true;
            updateCopyLinkButton();
        }

        // Confirmer le chargement en ligne (ancienne méthode avec mot de passe - gardée pour compatibilité)
        async function confirmLoadOnline() {
            // Cette fonction n'est plus utilisée mais gardée pour éviter les erreurs
        }

        // Confirmer la sauvegarde en ligne
        async function confirmSaveOnline() {
            const profName = document.getElementById('save-prof-name').value.trim();
            let password = document.getElementById('save-password').value; // Changé en let pour pouvoir réassigner
            const captchaUserAnswer = document.getElementById('captcha-answer').value;
            const messageDiv = document.getElementById('save-message');

            // Validations
            if (!profName) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez entrer votre nom</div>';
                return;
            }

            if (!/^[a-zA-Z0-9_-]+$/.test(profName)) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Le nom ne peut contenir que des lettres, chiffres, tirets et underscores</div>';
                return;
            }
            
            // Vérification de profanité
            if (!PROFANITY_FILTER.isClean(profName)) {
                const errorMsg = PROFANITY_FILTER.getErrorMessage(profName);
                messageDiv.innerHTML = `<div class="error-message">⚠️ ${errorMsg}</div>`;
                return;
            }

            if (parseInt(captchaUserAnswer) !== captchaAnswer) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Captcha incorrect</div>';
                generateCaptcha();
                return;
            }

            // Vérifier qu'il y a des niveaux à sauvegarder
            const hasLevels = Object.values(cursusData).some(cursus => {
                if (Array.isArray(cursus)) {
                    return cursus.length > 0;
                } else if (cursus.levels) {
                    return Object.keys(cursus.levels).length > 0;
                }
                return false;
            });
            if (!hasLevels) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Vous devez créer au moins un niveau avant de sauvegarder</div>';
                return;
            }

            // Vérifier si un fichier existe déjà (pour demander le mot de passe)
            try {
                const checkResponse = await fetch(`api.php?action=check&profName=${profName}`);
                const checkResult = await checkResponse.json();
                
                if (checkResult.exists) {
                    // Un fichier existe : demander le mot de passe pour vérifier
                    const existingPassword = prompt('⚠️ Ce nom est déjà utilisé !\n\nPour écraser cette sauvegarde, entrez le code de sécurité associé à ce nom :\n\n(Annuler pour revenir)');
                    
                    if (!existingPassword) {
                        // L'utilisateur a annulé
                        messageDiv.innerHTML = '<div class="error-message">⚠️ Sauvegarde annulée</div>';
                        return;
                    }
                    
                    // Vérifier que le mot de passe correspond
                    const verifyFormData = new FormData();
                    verifyFormData.append('action', 'verify_password');
                    verifyFormData.append('profName', profName);
                    verifyFormData.append('password', existingPassword);
                    
                    const verifyResponse = await fetch('api.php', {
                        method: 'POST',
                        body: verifyFormData
                    });
                    
                    const verifyResult = await verifyResponse.json();
                    
                    if (!verifyResult.success) {
                        messageDiv.innerHTML = '<div class="error-message">❌ Code de sécurité incorrect. Impossible d\'écraser cette sauvegarde.</div>';
                        return;
                    }
                    
                    // Le mot de passe est correct, on peut continuer
                    // Utiliser le mot de passe existant pour la sauvegarde
                    password = existingPassword;
                }
            } catch (error) {
                // Si erreur de vérification, continuer quand même
            }

            // Afficher un message de chargement
            messageDiv.innerHTML = '<div class="info-box">⏳ Sauvegarde en cours...</div>';

            try {
                // NE PAS chiffrer les données en ligne (pour compatibilité)
                // Le localStorage reste chiffré pour la protection locale
                
                // Préparer les données
                const formData = new FormData();
                formData.append('action', 'save');
                formData.append('profName', profName);
                formData.append('password', password);
                formData.append('captchaAnswer', captchaUserAnswer);
                formData.append('captchaExpected', captchaAnswer);
                formData.append('cursusData', JSON.stringify(cursusData)); // Envoyer en JSON non chiffré

                // Envoyer au serveur
                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ ' + result.message + '</div>';
                    const urlDiv = document.getElementById('success-url');
                    urlDiv.style.display = 'block';
                    urlDiv.innerHTML = `
                        <strong>🎉 Votre page est prête !</strong><br><br>
                        Partagez ce lien avec vos élèves :<br>
                        <a href="https://${result.url}" target="_blank">https://${result.url}</a>
                        <br><br>
                        <small>💡 Vous pouvez modifier vos niveaux à tout moment en rechargeant cette page et en cliquant sur "Charger les niveaux"</small>
                    `;
                    
                    // Activer le bouton "Copier lien élève"
                    loadedProfName = result.profName;
                    hasModifications = false;
                    updateCopyLinkButton();
                    
                    // Remplacer les boutons par un seul bouton "Fermer"
                    const buttonsDiv = document.getElementById('save-modal-buttons');
                    buttonsDiv.innerHTML = '<button class="btn-confirm" onclick="closeSaveOnlineModal()" style="width: 100%;">✅ Fermer</button>';
                } else {
                    messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
                    generateCaptcha(); // Regénérer le captcha en cas d'erreur
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion au serveur</div>';
                generateCaptcha();
            }
        }

        // Confirmer le chargement en ligne
        async function confirmLoadOnline() {
            const profName = document.getElementById('load-prof-name').value.trim();
            const password = document.getElementById('load-password').value;
            const messageDiv = document.getElementById('load-message');

            // Validations
            if (!profName || !password) {
                messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez remplir tous les champs</div>';
                return;
            }

            // Afficher un message de chargement
            messageDiv.innerHTML = '<div class="info-box">⏳ Chargement en cours...</div>';

            try {
                // Préparer les données
                const formData = new FormData();
                formData.append('action', 'load');
                formData.append('profName', profName);
                formData.append('password', password);

                // Envoyer au serveur
                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Charger les données dans l'application
                    cursusData = result.cursusData;
                    saveToStorage(); // Sauvegarder localement aussi
                    loadTeacherLevels(); // Recharger l'interface
                    
                    messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Niveaux chargés avec succès !</div>';
                    
                    setTimeout(() => {
                        closeLoadOnlineModal();
                        showResult('✅ Vos niveaux ont été chargés !', true);
                    }, 1500);
                } else {
                    messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion au serveur</div>';
            }
        }

        // Initialiser l'application
        window.onload = function() {
            init();
            checkProfParameter();
            // Initialiser l'affichage du header selon la résolution
            updateModeDisplay();
            
            // Vérifier si on doit afficher la popup de bienvenue preview
            setTimeout(() => {
                checkAndShowWelcomePreview();
            }, 500);
        };
        
        
        // ========================================
        // RESET SÉLECTIF DE LA PROGRESSION
        // ========================================
        
        // Calculer un hash simple d'un niveau basé sur son contenu
        function getLevelHash(levelData) {
            if (!levelData) return null;
            
            // Créer une représentation string du niveau
            const content = JSON.stringify({
                blocks: levelData.blocks,
                gridState: levelData.gridState,
                paintedCells: levelData.paintedCells,
                variables: levelData.variables
            });
            
            // Hash simple (même algo que _h mais sans clé)
            let hash = 0;
            for (let i = 0; i < content.length; i++) {
                const char = content.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
        
        // Nettoyer la progression des niveaux modifiés ou supprimés
        function cleanupModifiedLevels() {
            
            let pointsRemoved = 0;
            const levelsToRemove = [];
            
            // Parcourir tous les niveaux complétés
            for (let levelKey in completedLevels) {
                const [cursusName, levelNum] = levelKey.split('-');
                const levelData = completedLevels[levelKey];
                
                // Extraire les points (rétrocompatibilité)
                const levelPoints = typeof levelData === 'object' ? levelData.points : levelData;
                
                // Vérifier si le niveau existe encore
                if (!cursusData[cursusName] || !cursusData[cursusName].levels[levelNum]) {
                    levelsToRemove.push(levelKey);
                    pointsRemoved += levelPoints;
                    continue;
                }
                
                // Si ancien format (pas d'objet), impossible de comparer, on garde
                if (typeof levelData !== 'object' || !levelData.hash) {
                    continue;
                }
                
                // Calculer le hash actuel du niveau
                const currentHash = getLevelHash(cursusData[cursusName].levels[levelNum]);
                
                // Récupérer le hash stocké
                const storedHash = levelData.hash;
                
                // Si le hash a changé, le niveau a été modifié
                if (currentHash !== storedHash) {
                    levelsToRemove.push(levelKey);
                    pointsRemoved += levelPoints;
                }
            }
            
            // Supprimer les niveaux modifiés/supprimés de la progression
            levelsToRemove.forEach(key => {
                delete completedLevels[key];
            });
            
            // Mettre à jour le score
            if (pointsRemoved > 0) {
                score = Math.max(0, score - pointsRemoved);
                _updateScoreDisplay();
                saveScore();
                saveCompletedLevels();
            } else {
            }
        }
        
        // ========================================
        // POPUPS PÉDAGOGIQUES
        // ========================================
        
        // Popup Preview Élève (à chaque chargement)
        function checkAndShowWelcomePreview() {
            if (!window.isStudentLoadMode) {
                document.getElementById('welcome-preview-modal').classList.add('active');
            }
        }
        
        function closeWelcomePreviewModal() {
            document.getElementById('welcome-preview-modal').classList.remove('active');
        }
        
        function goToTeacherMode() {
            closeWelcomePreviewModal();
            switchMode('teacher');
        }
        
        // Popup URL Élève (à chaque chargement)
        function checkAndShowWelcomeStudent() {
            if (window.isStudentLoadMode) {
                document.getElementById('welcome-student-modal').classList.add('active');
            }
        }
        
        function closeWelcomeStudentModal() {
            document.getElementById('welcome-student-modal').classList.remove('active');
        }
        
        // Popup Aide Mode Création
        function showHelpTeacherModal() {
            document.getElementById('help-teacher-modal').classList.add('active');
        }
        
        function closeHelpTeacherModal() {
            document.getElementById('help-teacher-modal').classList.remove('active');
        }
        
        // Vérifier si on doit montrer l'animation du bouton aide (à chaque fois)
        function checkAndAnimateHelpButton() {
            if (currentMode === 'teacher') {
                // Animer le bouton d'aide à CHAQUE chargement
                setTimeout(() => {
                    const helpBtn = document.getElementById('help-button');
                    if (helpBtn) {
                        // Animation super visible : 3 rebonds pendant 3 secondes
                        helpBtn.style.animation = 'attention-grab 3s ease-out 1';
                        
                        // Retirer l'animation après pour pouvoir la rejouer
                        setTimeout(() => {
                            helpBtn.style.animation = 'none';
                        }, 3000);
                    }
                }, 500);
            }
        }
        
        // ========================================
        // RÉINITIALISATION MANUELLE DE LA PROGRESSION
        // ========================================
        
        // Réinitialiser la progression et le score (bouton manuel)
        async function resetProgress() {
            const confirmed = await customConfirm('⚠️ Réinitialiser le score et la progression ?\n\nTous les niveaux validés seront marqués comme non complétés.\n\nCette action est irréversible.', true);
            
            if (confirmed) {
                
                // Réinitialiser le score
                score = 0;
                _updateScoreDisplay();
                saveScore();
                
                // Réinitialiser les niveaux complétés
                completedLevels = {};
                saveCompletedLevels();
                
                // Recharger l'affichage des niveaux pour mettre à jour les coches
                if (currentMode === 'student') {
                    loadCursusLevels();
                }
                
                showResult('✅ Score et progression réinitialisés !', true);
            }
        }
        
        // ========================================
        // SYSTÈME DE VERSIONING AUTOMATIQUE
        // ========================================
        
        // Incrémenter automatiquement la version d'un cursus
        function incrementVersion(cursusName) {
            if (cursusData[cursusName]) {
                if (!cursusData[cursusName].version) {
                    cursusData[cursusName].version = 1;
                }
                cursusData[cursusName].version++;
            }
        }
        
        // Vérifier la version des niveaux et réinitialiser si elle a changé
        function checkVersionAndReset(profName) {
            // Calculer un hash de toutes les versions des cursus
            let versionHash = '';
            for (let cursus in cursusData) {
                const version = cursusData[cursus].version || 1;
                versionHash += cursus + ':' + version + ';';
            }
            
            // Clé de stockage spécifique au prof
            const versionKey = `version_${profName}`;
            const storedVersion = localStorage.getItem(versionKey);
            
            
            if (storedVersion !== versionHash) {
                
                // Sauvegarder la nouvelle version (sans reset complet)
                localStorage.setItem(versionKey, versionHash);
            } else {
            }
        }
        
        // Charger les niveaux d'un prof pour un élève
        async function loadProfLevelsForStudent(profName) {
            
            try {
                const response = await fetch(`api.php?action=load_public&profName=${profName}`);
                
                const result = await response.json();
                
                if (result.success) {
                    
                    // Charger les données du prof (en JSON non chiffré depuis le serveur)
                    let loadedData = result.cursusData;
                    
                    
                    // Les données en ligne ne sont plus chiffrées
                    cursusData = loadedData;
                    
                    // VÉRIFICATION DE VERSION : Reset automatique si version différente
                    checkVersionAndReset(profName);
                    
                    // VÉRIFICATION CRITIQUE : s'assurer que cursusData est valide
                    if (!cursusData || typeof cursusData !== 'object') {
                        alert('❌ Les données chargées sont corrompues. Impossible de continuer.');
                        return;
                    }
                    
                    // Forcer le mode élève
                    currentMode = 'student';
                    
                    // Masquer les boutons prof par ID (pas par index pour éviter de masquer les boutons élève)
                    document.getElementById('save-online-btn').style.display = 'none';
                    document.getElementById('load-levels-btn').style.display = 'none';
                    
                    // Masquer les boutons Aperçu mode élève et Création de niveaux
                    const allModeBtns = document.querySelectorAll('.mode-btn');
                    allModeBtns.forEach(btn => {
                        if (btn.textContent.includes('Aperçu mode élève') || btn.textContent.includes('Création de niveaux')) {
                            btn.style.setProperty('display', 'none', 'important');
                        }
                    });
                    
                    // Masquer spécifiquement les boutons mobiles par ID avec !important
                    const mobileStudentBtn = document.getElementById('mobile-student-mode-btn');
                    const mobileTeacherBtn = document.getElementById('mobile-teacher-mode-btn');
                    if (mobileStudentBtn) mobileStudentBtn.style.setProperty('display', 'none', 'important');
                    if (mobileTeacherBtn) mobileTeacherBtn.style.setProperty('display', 'none', 'important');
                    
                    // MOBILE : Afficher le DIV élève avec les bons boutons
                    const mobileStudentButtonsDiv = document.getElementById('mobile-student-buttons');
                    if (mobileStudentButtonsDiv) mobileStudentButtonsDiv.style.setProperty('display', 'block', 'important');
                    
                    // MOBILE : Cacher le DIV professeur
                    const mobileTeacherButtonsDiv = document.getElementById('mobile-teacher-buttons');
                    if (mobileTeacherButtonsDiv) mobileTeacherButtonsDiv.style.setProperty('display', 'none', 'important');

                    // Masquer le bouton réinitialiser (les élèves ne doivent pas pouvoir reset)
                    const resetBtn = document.getElementById('reset-progress-btn');
                    if (resetBtn) resetBtn.style.display = 'none';
                    
                    // Définir un flag global pour indiquer qu'on est en mode chargement élève
                    window.isStudentLoadMode = true;
                    
                    // Afficher les boutons de sauvegarde élève
                    const studentButtons = document.getElementById('student-save-buttons');
                    if (studentButtons) {
                        studentButtons.style.display = 'block';
                    } else {
                    }
                    
                    // Afficher un message discret indiquant le prof
                    const headerSubtitle = document.getElementById('header-subtitle');
                    headerSubtitle.textContent = `Niveaux de ${profName}`;
                    headerSubtitle.style.display = 'block';
                    headerSubtitle.style.opacity = '0.7';
                    headerSubtitle.style.fontSize = '12px';
                    
                    // Charger les niveaux
                    loadCursusLevels();
                    
                    // Afficher la popup de bienvenue élève
                    setTimeout(() => {
                        checkAndShowWelcomeStudent();
                    }, 500);
                    
                    // Mettre à jour la date d'accès côté serveur
                    fetch(`api.php?action=access&prof=${profName}`);
                } else {
                    alert('❌ Impossible de charger les niveaux de ce professeur.');
                }
            } catch (error) {
                alert('❌ Erreur de connexion au serveur: ' + error.message);
            }
        }
        
        // Vérifier si un paramètre ?prof= est présent dans l'URL
        function checkProfParameter() {
            const urlParams = new URLSearchParams(window.location.search);
            const profName = urlParams.get('prof');
            
            
            if (profName) {
                // CRITIQUE : Définir le flag IMMÉDIATEMENT avant tout appel async
                window.isStudentLoadMode = true;
                
                // Mode élève forcé avec chargement automatique des niveaux du prof
                loadProfLevelsForStudent(profName);
            } else {
            }
        }
        
        // ============================================
        // SYSTÈME DE DRAG TACTILE MOBILE
        // ============================================
        
        let touchDragState = {
            active: false,
            ghost: null,
            sourceBlock: null,
            placeholder: null,
            lastTargetBlock: null,
            lastPosition: null,
            lastMoveTime: 0,  // Pour throttling
            moveThreshold: 50, // ms entre chaque repositionnement
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
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
                    
                        blockTop: rect.top,
                        blockBottom: rect.bottom,
                        middle: middle,
                        touchY: touch.clientY,
                        diffFromMiddle: touch.clientY - middle,
                        isNewBlock: targetBlock !== touchDragState.lastTargetBlock,
                        lastPosition: touchDragState.lastPosition
                    });
                    
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
                        
                            needsMove: needsMove,
                            oldPosition: touchDragState.lastPosition,
                            newPosition: newPosition
                        });
                        
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
            const blockData = {
                type: sourceBlock.dataset.type,
                html: sourceBlock.outerHTML,
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
                
                // Augmenter la taille pour mobile SEULEMENT sur le bloc interne
                const innerBlock = newBlock.querySelector('.block');
                if (innerBlock) {
                    innerBlock.style.minHeight = '56px';
                    innerBlock.style.fontSize = '16px';
                    innerBlock.style.padding = '14px';
                }
                
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
            
            // Retirer les listeners
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchmove', handleProgramBlockTouchMove);
            document.removeEventListener('touchend', handleProgramBlockTouchEnd);
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
            
            // Ajouter les listeners
            document.addEventListener('touchmove', handleProgramBlockTouchMove, { passive: false });
            document.addEventListener('touchend', handleProgramBlockTouchEnd, { passive: false });
            
        }
        
        function handleProgramBlockTouchMove(e) {
            if (!programDragState.active) return;
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
            
            document.removeEventListener('touchmove', handleProgramBlockTouchMove);
            document.removeEventListener('touchend', handleProgramBlockTouchEnd);
            
        }
        
        // Initialiser le drag sur les blocs existants (y compris imbriqués)
        function initProgramBlocksDrag() {
            // Récupérer TOUS les program-block, même ceux dans nested-blocks
            const blocks = document.querySelectorAll('#program-blocks .program-block');
            blocks.forEach(block => {
                // Supprimer l'ancien listener s'il existe pour éviter les doublons
                block.removeEventListener('touchstart', handleProgramBlockTouchStart);
                // Ajouter le listener
                block.addEventListener('touchstart', handleProgramBlockTouchStart, { passive: false });
            });
        }
        
        // Appeler au chargement
        document.addEventListener('DOMContentLoaded', function() {
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
        
        // Initialiser au chargement
        window.addEventListener('DOMContentLoaded', () => {
            // Attendre que tout soit chargé
            setTimeout(() => {
                if (window.innerWidth <= 768) {
                    populateMobileBlocks();
                }
            }, 500);
        });
        
        // Re-peupler quand on change de mode
        const originalSwitchMode = window.switchMode;
        window.switchMode = function(mode) {
            if (originalSwitchMode) {
                originalSwitchMode(mode);
            }
            // Re-peupler le menu mobile
            setTimeout(() => {
                if (window.innerWidth <= 768) {
                    populateMobileBlocks();
                }
            }, 300);
        };
