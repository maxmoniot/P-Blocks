
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
let currentMode = 'teacher'; // Par défaut en mode création de niveaux

// Fonction pour définir le mode courant (synchronise local et window)
function setCurrentMode(mode) {
    currentMode = mode;
    window.currentMode = mode;
}
window.setCurrentMode = setCurrentMode;
window.currentMode = currentMode; // Exposer pour le mode multijoueur

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
// ===== SAUVEGARDE PROGRESSION ÉLÈVE PAR FICHIER =====

// Clé secrète pour la signature (combinée avec profName)
const SIGNATURE_SALT = 'PB2025_';

// Variable pour stocker le fichier sélectionné
let selectedProgressFile = null;

// Calculer un hash simple mais efficace pour la signature
async function computeSignature(data, profName) {
    const dataString = JSON.stringify(data) + profName + SIGNATURE_SALT;
    // Utiliser l'API Web Crypto pour un hash SHA-256
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Collecter tous les programmes de l'élève depuis le localStorage
function collectAllStudentPrograms() {
    const programs = {};
    const prefix = '_sp_URL_';
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            // Extraire cursus et niveau de la clé
            const keyPart = key.substring(prefix.length);
            programs[keyPart] = localStorage.getItem(key);
        }
    }
    
    return programs;
}

// Télécharger la progression de l'élève
async function downloadStudentProgress() {
    const urlParams = new URLSearchParams(window.location.search);
    const profName = urlParams.get('prof');
    
    if (!profName) {
        alert('❌ Impossible de sauvegarder : aucun professeur détecté');
        return;
    }
    
    // Collecter toutes les données
    const progressData = {
        score: score,
        completedLevels: { ...completedLevels },
        programs: collectAllStudentPrograms(),
        currentCursus: currentCursus
    };
    
    // Calculer la signature
    const signature = await computeSignature(progressData, profName);
    
    // Créer le fichier complet
    const saveFile = {
        version: 2,
        profName: profName,
        timestamp: Date.now(),
        data: progressData,
        signature: signature
    };
    
    // Convertir en JSON et télécharger
    const jsonString = JSON.stringify(saveFile, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Créer le lien de téléchargement
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `progression-pblocks-${date}.pblocks`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Fermer la popup
    closeStudentSaveModal();
    
    // Afficher confirmation
    alert('✅ Fichier de sauvegarde téléchargé !');
}

function closeStudentSaveModal() {
    document.getElementById('student-save-modal').classList.remove('active');
}

function openLoadProgressModal() {
    document.getElementById('student-load-modal').classList.add('active');
    document.getElementById('student-load-message').innerHTML = '';
    document.getElementById('selected-file-name').textContent = 'Aucun fichier sélectionné';
    document.getElementById('load-file-btn').disabled = true;
    document.getElementById('load-file-btn').style.opacity = '0.5';
    selectedProgressFile = null;
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById('student-file-input');
    if (fileInput) fileInput.value = '';
}

function closeLoadProgressModal() {
    document.getElementById('student-load-modal').classList.remove('active');
    selectedProgressFile = null;
}

// Gérer la sélection du fichier
function handleStudentFileSelect(event) {
    const file = event.target.files[0];
    const messageDiv = document.getElementById('student-load-message');
    const fileNameDiv = document.getElementById('selected-file-name');
    const loadBtn = document.getElementById('load-file-btn');
    
    if (!file) {
        fileNameDiv.textContent = 'Aucun fichier sélectionné';
        loadBtn.disabled = true;
        loadBtn.style.opacity = '0.5';
        selectedProgressFile = null;
        return;
    }
    
    // Vérifier l'extension
    if (!file.name.endsWith('.pblocks') && !file.name.endsWith('.json')) {
        messageDiv.innerHTML = '<div class="error-message">❌ Format de fichier non supporté. Utilisez un fichier .pblocks</div>';
        fileNameDiv.textContent = 'Fichier invalide';
        loadBtn.disabled = true;
        loadBtn.style.opacity = '0.5';
        return;
    }
    
    fileNameDiv.textContent = '📄 ' + file.name;
    messageDiv.innerHTML = '';
    selectedProgressFile = file;
    loadBtn.disabled = false;
    loadBtn.style.opacity = '1';
}

// Charger la progression depuis le fichier
async function loadStudentProgressFromFile() {
    const messageDiv = document.getElementById('student-load-message');
    
    if (!selectedProgressFile) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez sélectionner un fichier</div>';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentProfName = urlParams.get('prof');
    
    if (!currentProfName) {
        messageDiv.innerHTML = '<div class="error-message">❌ Aucun professeur détecté</div>';
        return;
    }
    
    try {
        // Lire le fichier
        const fileContent = await selectedProgressFile.text();
        const saveFile = JSON.parse(fileContent);
        
        // Vérifier la version
        if (!saveFile.version || saveFile.version < 2) {
            messageDiv.innerHTML = '<div class="error-message">❌ Format de fichier obsolète</div>';
            return;
        }
        
        // Vérifier que c'est le bon professeur
        if (saveFile.profName !== currentProfName) {
            messageDiv.innerHTML = '<div class="error-message">❌ Ce fichier appartient à un autre cours (prof: ' + saveFile.profName + ')</div>';
            return;
        }
        
        // Vérifier la signature
        const expectedSignature = await computeSignature(saveFile.data, currentProfName);
        if (saveFile.signature !== expectedSignature) {
            messageDiv.innerHTML = '<div class="error-message">❌ Fichier corrompu ou modifié. Impossible de charger.</div>';
            return;
        }
        
        // Charger les données
        const data = saveFile.data;
        
        // Restaurer le score et les niveaux complétés
        score = data.score || 0;
        completedLevels = data.completedLevels || {};
        
        // Restaurer le cursus
        if (data.currentCursus) {
            currentCursus = data.currentCursus;
            document.getElementById('cursus-select').value = currentCursus;
        }
        
        // Restaurer tous les programmes
        if (data.programs) {
            const prefix = '_sp_URL_';
            for (let key in data.programs) {
                localStorage.setItem(prefix + key, data.programs[key]);
            }
        }
        
        // Sauvegarder et mettre à jour l'affichage
        saveToStorage();
        document.getElementById('score').textContent = score;
        loadCursusLevels();
        
        messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Progression chargée avec succès !</div>';
        
        setTimeout(() => closeLoadProgressModal(), 1500);
        
    } catch (error) {
        console.error('Erreur de chargement:', error);
        messageDiv.innerHTML = '<div class="error-message">❌ Fichier invalide ou corrompu</div>';
    }
}

// Fonction legacy pour compatibilité (ne fait plus rien)
function generateStudentCode() {
    downloadStudentProgress();
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
        'rgb(255, 105, 180)': 'pink',
        '#FF69B4': 'pink',
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
    // Synchroniser avec window.currentMode si défini (pour le mode multijoueur)
    if (typeof window.currentMode !== 'undefined') {
        currentMode = window.currentMode;
    }
    
    const studentLeft = document.getElementById('student-left');
    const teacherLeft = document.getElementById('teacher-left');
    const headerScore = document.getElementById('header-score-display');
    const appHeader = document.getElementById('app-header');
    const headerSubtitle = document.getElementById('header-subtitle');
    const headerMainTitle = document.getElementById('header-main-title');
    const loadLevelsBtn = document.getElementById('load-levels-btn');
    const saveOnlineBtn = document.getElementById('save-online-btn');

    if (currentMode === 'student') {
        // MODE ÉLÈVE (utilisé uniquement pour le jeu multijoueur)
        studentLeft.style.display = 'block';
        teacherLeft.style.display = 'none';
        
        // Header
        if (headerMainTitle) {
            headerMainTitle.textContent = '🎨 P-Blocks';
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
        
        // Cacher le bouton de soutien en mode élève
        const supportBtn = document.getElementById('support-button');
        if (supportBtn) supportBtn.style.display = 'none';
        
        // Cacher le bouton d'accueil en mode élève
        const homeBtn = document.getElementById('home-button');
        if (homeBtn) homeBtn.style.display = 'none';
        
        // Ne recharger les niveaux que si ce n'est pas un mode URL élève ou multijoueur
        if (!window.isStudentLoadMode && !window.isMultiplayerMode) {
            loadCursusLevels();
        }
        
        // Mettre à jour l'affichage des variables pour ce mode
        updateVariableBlocksVisibility();
        updateAllVariableSelectors();
    } else {
        // MODE PROFESSEUR (Création de niveaux)
        studentLeft.style.display = 'none';
        teacherLeft.style.display = 'block';
        
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
        
        // Afficher le bouton de soutien en mode professeur
        const supportBtn = document.getElementById('support-button');
        if (supportBtn) supportBtn.style.display = 'block';
        
        // Afficher le bouton d'accueil en mode professeur
        const homeBtn = document.getElementById('home-button');
        if (homeBtn) homeBtn.style.display = 'block';
        
        // Animer le bouton d'aide au premier chargement
        checkAndAnimateHelpButton();
        
        setTimeout(() => {
            initPaintMode();
        }, 100);
        
        // Charger les variables professeur
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
    currentY: 0,
    // Auto-scroll
    autoScrollInterval: null,
    autoScrollSpeed: 0
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
    
    // Initialiser le curseur de vitesse
    initSpeedControl();
    
    // Initialiser l'observer du programme
    initProgramObserver();
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
// CURSEUR DE VITESSE D'EXÉCUTION
// ============================================

function initSpeedControl() {
    // Curseur professeur
    const speedSlider = document.getElementById('execution-speed');
    const speedLabel = document.getElementById('speed-label');
    
    // Curseur élève
    const studentSpeedSlider = document.getElementById('student-execution-speed');
    const studentSpeedLabel = document.getElementById('student-speed-label');
    
    // Fonction pour mettre à jour le label
    function updateSpeedLabel(value, labelElement) {
        const speed = parseInt(value);
        
        if (speed >= 90) {
            labelElement.textContent = 'Très rapide';
            labelElement.style.color = '#28a745'; // Vert
        } else if (speed >= 70) {
            labelElement.textContent = 'Rapide';
            labelElement.style.color = '#5cb85c';
        } else if (speed >= 50) {
            labelElement.textContent = 'Normal';
            labelElement.style.color = '#ffc107'; // Jaune
        } else if (speed >= 30) {
            labelElement.textContent = 'Lent';
            labelElement.style.color = '#ff9800';
        } else {
            labelElement.textContent = 'Très lent';
            labelElement.style.color = '#dc3545'; // Rouge
        }
    }
    
    // Initialiser le curseur professeur
    if (speedSlider && speedLabel) {
        speedSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            updateSpeedLabel(value, speedLabel);
            
            // Mettre à jour la vitesse d'exécution
            if (window.updateExecutionSpeed) {
                window.updateExecutionSpeed(value);
            }
        });
        
        // Initialiser le label
        updateSpeedLabel(speedSlider.value, speedLabel);
    }
    
    // Initialiser le curseur élève
    if (studentSpeedSlider && studentSpeedLabel) {
        studentSpeedSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            updateSpeedLabel(value, studentSpeedLabel);
            
            // Mettre à jour la vitesse d'exécution
            if (window.updateExecutionSpeed) {
                window.updateExecutionSpeed(value);
            }
        });
        
        // Initialiser le label
        updateSpeedLabel(studentSpeedSlider.value, studentSpeedLabel);
    }
}

window.initSpeedControl = initSpeedControl;

// ============================================
// OBSERVER DES MODIFICATIONS DU PROGRAMME
// ============================================

function initProgramObserver() {
    const programBlocks = document.getElementById('program-blocks');
    if (!programBlocks) {
        console.log('Observer: program-blocks non trouvé');
        return;
    }
    
    console.log('Observer: initialisé sur program-blocks');
    
    // Créer un observer pour détecter les changements
    const observer = new MutationObserver(() => {
        // Vérifier si le programme est maintenant vide
        const blocks = programBlocks.querySelectorAll(':scope > .program-block');
        
        console.log('Observer: mutation détectée, nombre de blocs:', blocks.length);
        
        if (blocks.length === 0) {
            console.log('Observer: programme vide détecté, appel stopExecution');
            
            // Effacer la grille
            if (window.clearGrid) {
                window.clearGrid();
            }
            
            // Programme vide → arrêter l'exécution si en cours
            if (window.stopExecution) {
                window.stopExecution();
            } else {
                console.log('Observer: stopExecution non disponible');
            }
        }
    });
    
    // Observer les changements dans la zone de programme
    observer.observe(programBlocks, {
        childList: true,  // Détecter ajout/suppression de blocs
        subtree: false    // Seulement les enfants directs
    });
}

window.initProgramObserver = initProgramObserver;

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

// ============================================
// MODAL SOUTIEN
// ============================================

function openSupportModal() {
    document.getElementById('support-modal').classList.add('active');
    // Fermer le menu mobile si ouvert
    if (window.innerWidth <= 768) {
        closeMobileMenus();
    }
}

function closeSupportModal() {
    document.getElementById('support-modal').classList.remove('active');
}

window.openSupportModal = openSupportModal;
window.closeSupportModal = closeSupportModal;

// ============================================
// INTÉGRATION MULTIJOUEUR
// ============================================

// Fonction pour basculer vers l'interface de programmation
function showProgrammingInterface() {
    document.getElementById('multiplayer-container').style.display = 'none';
    document.querySelector('.app-wrapper').style.display = 'block';
    
    // Passer en mode élève
    currentMode = 'student';
    updateModeDisplay();
    
    // Cacher le header et les contrôles de niveau
    document.getElementById('app-header').style.display = 'none';
    document.getElementById('student-left').querySelector('.cursus-selector').style.display = 'none';
    document.getElementById('student-left').querySelector('.level-selector').style.display = 'none';
    document.getElementById('header-score-display').style.display = 'none';
    
    // Cacher le bouton de validation normal
    const validateBtn = document.querySelector('#student-left .btn-success');
    if (validateBtn) validateBtn.style.display = 'none';
}

// Fonction pour revenir à la homepage multijoueur
function showMultiplayerHomepage() {
    document.querySelector('.app-wrapper').style.display = 'none';
    document.getElementById('multiplayer-container').style.display = 'block';
    
    // Restaurer le header
    document.getElementById('app-header').style.display = 'flex';
    document.getElementById('student-left').querySelector('.cursus-selector').style.display = 'block';
    document.getElementById('student-left').querySelector('.level-selector').style.display = 'block';
    document.getElementById('header-score-display').style.display = 'flex';
    
    // Restaurer le bouton de validation
    const validateBtn = document.querySelector('#student-left .btn-success');
    if (validateBtn) validateBtn.style.display = 'block';
}

// Fonction pour récupérer l'état de la grille
function getGridState() {
    const gridId = currentMode === 'teacher' ? 'teacher-grid' : 'student-grid';
    const grid = document.getElementById(gridId);
    if (!grid) return null;
    
    const cells = grid.querySelectorAll('.grid-cell');
    if (cells.length === 0) return null;
    
    const state = [];
    for (let y = 0; y < 10; y++) {
        const row = [];
        for (let x = 0; x < 10; x++) {
            // Les cellules sont créées avec data-x et data-y, pas data-row et data-col
            const cellIndex = y * 10 + x;
            const cell = cells[cellIndex];
            if (cell) {
                const bgColor = cell.style.backgroundColor || cell.style.background;
                row.push(colorNameFromRgb(bgColor) || 'white');
            } else {
                row.push('white');
            }
        }
        state.push(row);
    }
    return state;
}

// Fonction pour convertir RGB en nom de couleur (palette officielle)
function colorNameFromRgb(rgb) {
    if (!rgb || rgb === '' || rgb === 'white') return 'white';
    
    // Normaliser la chaîne
    const normalized = rgb.toLowerCase().replace(/\s/g, '');
    
    // Blanc
    if (normalized === 'rgb(255,255,255)' || normalized === '#ffffff' || normalized === 'white') return 'white';
    
    // Rouge (#dc3545 = rgb(220, 53, 69))
    if (normalized === 'rgb(220,53,69)' || normalized === '#dc3545' || normalized === 'red' || normalized === 'rgb(255,0,0)') return 'red';
    
    // Jaune (#ffc107 = rgb(255, 193, 7))
    if (normalized === 'rgb(255,193,7)' || normalized === '#ffc107' || normalized === 'yellow' || normalized === 'rgb(255,255,0)') return 'yellow';
    
    // Vert (#28a745 = rgb(40, 167, 69))
    if (normalized === 'rgb(40,167,69)' || normalized === '#28a745' || normalized === 'green' || normalized === 'rgb(0,128,0)' || normalized === 'rgb(0,255,0)') return 'green';
    
    // Bleu (#007bff = rgb(0, 123, 255))
    if (normalized === 'rgb(0,123,255)' || normalized === '#007bff' || normalized === 'blue' || normalized === 'rgb(0,0,255)') return 'blue';
    
    // Rose (#FF69B4 = rgb(255, 105, 180))
    if (normalized === 'rgb(255,105,180)' || normalized === '#ff69b4' || normalized.includes('pink')) return 'pink';
    
    // Noir (#343a40 = rgb(52, 58, 64))
    if (normalized === 'rgb(52,58,64)' || normalized === '#343a40' || normalized === 'black' || normalized === 'rgb(0,0,0)') return 'black';
    
    return 'white';
}

// Fonction pour effacer le programme
function clearProgram() {
    const programBlocks = document.getElementById('program-blocks');
    if (programBlocks) {
        programBlocks.innerHTML = '';
    }
}

// Fonction pour compter le nombre total de blocs
function countTotalBlocks(blocks) {
    let count = 0;
    blocks.forEach(block => {
        count++;
        // Compter les blocs imbriqués dans les boucles
        const nested = block.querySelector('.repeat-body');
        if (nested) {
            const nestedBlocks = nested.querySelectorAll(':scope > .program-block');
            count += countTotalBlocks(nestedBlocks);
        }
    });
    return count;
}

// Exposer les fonctions pour le mode multijoueur
window.getGridState = getGridState;
window.clearProgram = clearProgram;
window.countTotalBlocks = countTotalBlocks;
window.showProgrammingInterface = showProgrammingInterface;
window.showMultiplayerHomepage = showMultiplayerHomepage;
window.updateModeDisplay = updateModeDisplay;

// Fonction pour changer le mode depuis l'extérieur
function setCurrentMode(mode) {
    currentMode = mode;
}
window.setCurrentMode = setCurrentMode;

// Fonction pour récupérer le mode actuel
function getCurrentMode() {
    return currentMode;
}
window.getCurrentMode = getCurrentMode;

// Exports pour la sauvegarde/chargement élève par fichier
window.downloadStudentProgress = downloadStudentProgress;
window.closeStudentSaveModal = closeStudentSaveModal;
window.openLoadProgressModal = openLoadProgressModal;
window.closeLoadProgressModal = closeLoadProgressModal;
window.handleStudentFileSelect = handleStudentFileSelect;
window.loadStudentProgressFromFile = loadStudentProgressFromFile;
window.generateStudentCode = generateStudentCode; // Alias pour compatibilité

