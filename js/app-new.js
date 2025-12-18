
// ========================================
// VARIABLES GLOBALES PARTAGÉES
// ========================================

// Liste des variables créées
let createdVariables = [];
let levelToDelete = null; // Pour stocker le niveau à supprimer

// Variables pour levelManager.js
let tempWorldsConfig = null;
let tempLevelsData = null;

// Variables pour teacherMode.js
let lastLoadedLevel = null;

// Module Pinceau
let selectedPaintColor = 'red'; // Couleur par défaut
let isPainting = false; // Pour savoir si on est en train de peindre
let paintedCells = {}; // Stockage des cellules peintes : {row-col: 'color'}

// Configuration
// Hash SHA-256 du mot de passe professeur (prof123)
// Pour changer le mot de passe : utilisez un calculateur SHA-256 en ligne
const TEACHER_PASSWORD_HASH = '00624b02e1f9b996a3278f559d5d55313552ad2c0bafc82adfd975c12df61eaf';

// Fonction pour hasher un mot de passe avec SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Wrapper synchrone pour checkPassword
function checkPassword() {
    _checkPasswordAsync();
}

// Version async de checkPassword
async function _checkPasswordAsync() {
    const password = document.getElementById('teacher-password').value;
    const passwordHash = await hashPassword(password);
    
    if (passwordHash === TEACHER_PASSWORD_HASH) {
        currentMode = 'teacher';
        
        // Désactiver les modes élève
        window.isPreviewMode = false;
        // Ne pas toucher à isStudentLoadMode qui reste actif si on était en URL élève
        
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

// Wrapper synchrone pour checkPasswordAuto
function checkPasswordAuto() {
    _checkPasswordAutoAsync();
}

// Version async de checkPasswordAuto
async function _checkPasswordAutoAsync() {
    const password = document.getElementById('teacher-password').value;
    const passwordHash = await hashPassword(password);
    
    if (passwordHash === TEACHER_PASSWORD_HASH) {
        currentMode = 'teacher';
        
        // Désactiver les modes élève
        window.isPreviewMode = false;
        
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
const GRID_SIZE = 10;
const MAX_TOTAL_LEVELS = 100; // Limite maximale de niveaux (tous cursus confondus) - MODIFIEZ CETTE VALEUR POUR CHANGER LA LIMITE
const MAX_LEVELS_PER_INPUT_ALL = 33; // Limite pour cursus "Tous" (sera multiplié par 3 = 99 max)
const MAX_LEVELS_PER_INPUT_SINGLE = MAX_TOTAL_LEVELS; // Limite pour cursus individuel


// ========================================
// GESTION DES VARIABLES
// ========================================
// Ce module a été déplacé vers js/variableManager.js
// Fonctions: createNewVariable(), dropVariable(), dropValueOrOperator(), etc.

// État global
let currentMode = 'student';
let currentCursus = '5eme';
let currentLevelIndex = 0;
// ========================================
// SYSTÈME ANTI-TRICHE - Chiffrement & Checksum
// ========================================
// Ce module a été déplacé vers js/antiCheat.js
// Fonctions: _h(), _e(), _d(), _updateScoreDisplay()

let score = 0;
let grid = [];
let turtle = { x: 5, y: 9, direction: 0, color: 'black', drawMode: false };
let variables = {};
let programBlocks = [];

// Suivi des niveaux complétés par l'élève
// Structure: { '5eme': { 0: {completed: true, optimal: true}, 1: {completed: true, optimal: false}, ... }, ... }
let completedLevels = {
    '5eme': {},
    '4eme': {},
    '3eme': {}
};

// Structure des niveaux par cursus
let cursusData = {
    '5eme': { version: 1, worlds: 1, levelsPerWorld: 10, pointsPerWorld: [0], levels: {} },
    '4eme': { version: 1, worlds: 1, levelsPerWorld: 10, pointsPerWorld: [0], levels: {} },
    '3eme': { version: 1, worlds: 1, levelsPerWorld: 10, pointsPerWorld: [0], levels: {} }
};

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
    setupProgramAreaDrop();
}

// Configuration du drop sur la zone de programme
function setupProgramAreaDrop() {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    programArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    programArea.addEventListener('drop', function(e) {
        e.preventDefault();
        
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            // C'est un bloc existant qui est déplacé - le placer à la fin
            programArea.appendChild(dragging);
        }
    });
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
        
        // Si on n'est pas en mode URL élève, on est en mode PREVIEW
        // Il faut recharger les données PREVIEW
        if (!window.isStudentLoadMode) {
            // Activer le mode preview
            window.isPreviewMode = true;
            
            // Réinitialiser pour éviter contamination
            score = 0;
            completedLevels = {};
            _updateScoreDisplay();
            
            // Recharger les données PREVIEW
            loadFromStorage();
        }
        
        updateModeDisplay();
        
        // Lancer l'animation de la tortue après un court délai (pour que la grille soit affichée)
        setTimeout(() => {
            animatePinkArrow();
        }, 500);
    }
}


// Nettoyer les fichiers inactifs (> 1 an)
async function cleanupOldLevels() {
    try {
        const response = await fetch('php/api.php?action=cleanup');
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
// Ce module a été déplacé vers js/levelManager.js
// Fonctions: openLevelManagerModal(), updateWorldsConfig(), updateLevelsList(), etc.

let autoCreateConfig = null;

// Fonction de confirmation personnalisée

// ===== CRÉATION AUTOMATISÉE =====
// Ce module a été déplacé vers js/autoLevelCreator.js
// Fonctions: customConfirm(), openAutoCreateModal(), generateWorldsAutomatically(), etc.


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
        // En mode URL élève, cacher aussi le bouton "Création de niveaux"
        if (window.isStudentLoadMode) {
            if (teacherModeBtn) teacherModeBtn.style.display = 'none';
        } else {
            if (teacherModeBtn) teacherModeBtn.style.display = 'inline-block'; // Afficher "Création de niveaux"
        }
        
        // Gérer les boutons mobile
        if (mobileStudentModeBtn) mobileStudentModeBtn.style.display = 'none';
        if (mobileTeacherModeBtn) mobileTeacherModeBtn.style.display = 'block';
        
        // Header PC et mobile
        if (headerMainTitle) {
            if (window.isStudentLoadMode) {
                // URL élève : juste "P-Blocks"
                headerMainTitle.textContent = '🎨 P-Blocks';
            } else if (window.innerWidth > 768) {
                // Preview desktop : avec "Aperçu mode élève"
                headerMainTitle.textContent = '🎨 P-Blocks - Aperçu mode élève';
            } else {
                // Preview mobile : version courte
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
        
        // Ne recharger les niveaux que si ce n'est pas un mode URL élève (déjà chargé dans init)
        if (!window.isStudentLoadMode) {
            loadCursusLevels();
        }
        
        // Mettre à jour l'affichage des variables pour ce mode (sans recharger)
        updateVariableBlocksVisibility();
        updateAllVariableSelectors();
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
                headerMainTitle.textContent = '🎨 P-Blocks - Mode création de niveaux';
            } else {
                headerMainTitle.textContent = '✏️ Mode création de niveaux';
            }
        }
        
        headerScore.style.display = 'none';
        appHeader.classList.add('teacher-mode');
        document.body.classList.add('teacher-mode');
        
        // Subtitle : afficher uniquement en mobile
        if (window.innerWidth <= 768) {
            headerSubtitle.style.display = 'block';
        } else {
            headerSubtitle.style.display = 'none';
        }
        
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
        
        // Charger les variables professeur uniquement lors du vrai basculement vers ce mode
        // (pas au premier updateModeDisplay au démarrage)
        loadCreatedVariables('TEACHER');
        
        // Mettre à jour l'affichage des variables
        updateVariableBlocksVisibility();
        updateAllVariableSelectors();
    }
    
    // Mettre à jour les boutons mobiles
    updateMobileModeButtons();
    
    // Ne PAS effacer le programme en mode élève (il vient d'être chargé par loadLevel)
    if (currentMode !== 'student') {
        clearProgram();
        clearGrid();
        clearPaintedCells();
    }
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

// ========================================
// DRAG & DROP
// ========================================
// Ce module a été déplacé vers js/dragDropHandler.js
// Fonctions: allowDrop(), drag(), drop(), setupNestedAreaDrop(), etc.


// Fonction pour valider et gérer les inputs numériques dans les blocs

// ========================================
// VALIDATION MANAGER
// ========================================
// Ce module a été déplacé vers js/validationManager.js
// Fonctions: setupNumericInputValidation(), validateNumericInput(),
//            isValidNumber(), checkAllInputsValidity()


// Supprimer un bloc imbriqué et sauvegarder le programme
// Fonctions removeNestedBlockAndSave et removeBlockAndSave déplacées vers js/studentProgramStorage.js


// ========================================
// BLOCK MANAGEMENT
// ========================================
// Ce module a été déplacé vers js/blockManagement.js
// Fonctions: addBlockToProgram(), addNestedBlock(), extractBlockData(), 
//            countTotalBlocks(), setupNestedAreaDrop()


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

// ========================================
// GESTION DE LA SAUVEGARDE DU SCORE ET PROGRESSION
// ========================================
// Ce module a été déplacé vers js/storageManager.js
// Fonctions: loadFromStorage(), saveScore(), saveCompletedLevels()

// Messages
function showResult(message, success) {
    // En mode preview ou student, afficher dans result-message
    // En mode teacher (hors preview), afficher dans teacher-result-message
    const isStudentView = currentMode === 'student' || window.isPreviewMode;
    const resultDiv = isStudentView ? 
        document.getElementById('result-message') : 
        document.getElementById('teacher-result-message');
    if (resultDiv) {
        resultDiv.textContent = message;
        resultDiv.className = success ? 'result-message success' : 'result-message error';
    }
}

function clearResult() {
    // Effacer les messages de résultat
    const resultMsg = document.getElementById('result-message');
    const teacherResultMsg = document.getElementById('teacher-result-message');
    if (resultMsg) {
        resultMsg.textContent = '';
        resultMsg.className = 'result-message';
    }
    if (teacherResultMsg) {
        teacherResultMsg.textContent = '';
        teacherResultMsg.className = 'result-message';
    }
}


// ========================================
// SYSTÈME DE SAUVEGARDE EN LIGNE
// ========================================
// Ce module a été déplacé vers js/onlineSaveManager.js
// Fonctions: saveLevelBeforeOnline(), openSaveOnlineModal(), filterProfessors(), etc.


// ========================================
// RESET SÉLECTIF DE LA PROGRESSION
// ========================================
// Ce module a été déplacé vers js/progressionManager.js
// Fonctions: getLevelHash(), cleanupModifiedLevels()


// ========================================
// POPUPS PÉDAGOGIQUES
// ========================================
// Ce module a été déplacé vers js/pedagogicalPopups.js
// Fonctions: checkAndShowWelcomePreview(), showCongratulationsModal(), etc.

// ========================================

// ========================================
// VERSION MANAGER
// ========================================
// Ce module a été déplacé vers js/versionManager.js
// Fonctions: resetProgress(), incrementVersion(), checkVersionAndReset(), etc.


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


// ========================================
// TOUCH & DRAG MANAGER
// ========================================
// Ce module a été déplacé vers js/touchDragManager.js
// Fonctions: initMobileTouchDrag(), populateMobileBlocks(), handleDropInValueSlot(), etc.


// Initialiser au chargement
window.addEventListener('DOMContentLoaded', () => {
    // Attendre que tout soit chargé
    setTimeout(() => {
        if (window.innerWidth <= 768) {
            populateMobileBlocks();
        }
        // Adapter les blocs existants à la taille d'écran
        adaptBlocksToScreenSize();
    }, 500);
});

// Adapter les blocs quand on redimensionne
window.addEventListener('resize', () => {
    adaptBlocksToScreenSize();
});

// Fonction pour adapter les blocs à la taille d'écran actuelle
function adaptBlocksToScreenSize() {
    const isMobile = window.innerWidth <= 768;
    const allBlocks = document.querySelectorAll('#program-blocks .block');
    
    allBlocks.forEach(block => {
        if (isMobile) {
            block.classList.add('mobile-block');
        } else {
            block.classList.remove('mobile-block');
        }
    });
    
}

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

// ============================================
// MODAL REMERCIEMENTS
// ============================================

function openThanksModal() {
    document.getElementById('thanks-modal').classList.add('active');
    // Fermer le menu mobile si ouvert
    if (window.innerWidth <= 768) {
        closeMobileMenus();
    }
}

function closeThanksModal() {
    document.getElementById('thanks-modal').classList.remove('active');
}

window.openThanksModal = openThanksModal;
window.closeThanksModal = closeThanksModal;

