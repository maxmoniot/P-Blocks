// ============================================
// MODULE: MULTIPLAYER MANAGER
// Description: Gestion côté client du mode multijoueur
// ============================================

(function() {
    'use strict';

    // ========================================
    // CONSTANTES ET ÉTAT
    // ========================================
    
    const POLLING_INTERVAL = 2000;
    const RECONNECT_THRESHOLD = 3;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECOVERY_RETRY_DELAY = 1000;
    
    const MP_STATE = {
        playCode: null,
        nickname: null,
        deviceId: null,
        isHost: false,
        gameState: 'idle',
        currentLevel: -1,
        numLevels: 0,
        players: [],
        levelStartTime: null,
        questionStartTime: null,
        serverQuestionStartTime: null,
        hasValidated: false,
        pollingInterval: null,
        consecutiveFailures: 0,
        reconnectAttempts: 0,
        pendingValidation: null,
        targetGrid: null,
        expectedBlocks: 0,
        timerInterval: null,
        countdownInterval: null,
        levelCountdownInterval: null,
        finishCountdown: 30,
        finishCountdownEnabled: true,
        firstValidationTime: null,
        finishCountdownInterval: null
    };
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    function initMultiplayer() {
        let deviceId = localStorage.getItem('pblocks_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('pblocks_device_id', deviceId);
        }
        MP_STATE.deviceId = deviceId;
        
        // Injecter les styles du header multijoueur
        injectMultiplayerStyles();
        
        // Envoyer un signal de déconnexion quand l'onglet est fermé
        function sendLeaveBeacon() {
            if (MP_STATE.playCode && MP_STATE.nickname) {
                navigator.sendBeacon('php/game.php', new URLSearchParams({
                    action: 'leave',
                    playCode: MP_STATE.playCode,
                    nickname: MP_STATE.nickname
                }));
            }
        }
        window.addEventListener('pagehide', sendLeaveBeacon);
        window.addEventListener('beforeunload', sendLeaveBeacon);
        
        // Vérifier si on est en mode URL élève (?prof=xxx)
        const urlParams = new URLSearchParams(window.location.search);
        const profName = urlParams.get('prof');
        
        if (!profName) {
            // Pas de paramètre prof = afficher la page d'accueil multijoueur
            showHomepage();
        }
        // Si profName existe, core.js/checkProfParameter() s'en charge
    }
    
    function injectMultiplayerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #mp-game-header {
                display: none;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: linear-gradient(135deg, #4C97FF 0%, #3373CC 100%);
                color: white;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            
            .mp-game-info-left, .mp-game-info-right {
                font-weight: bold;
                font-size: 14px;
            }
            
            .mp-game-timer {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 24px;
                font-weight: bold;
                background: rgba(255,255,255,0.2);
                padding: 6px 16px;
                border-radius: 20px;
            }
            
            .mp-game-actions {
                display: flex;
                gap: 10px;
            }
            
            .mp-header-btn {
                padding: 10px 20px;
                font-size: 14px;
                font-weight: bold;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mp-header-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            
            .mp-header-btn.mp-btn-success {
                background: #4CAF50;
                color: white;
            }
            
            .mp-header-btn.mp-btn-danger {
                background: #f44336;
                color: white;
            }
            
            .app-wrapper.mp-active {
                padding-top: 60px;
            }
            
            #mp-validation-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            .mp-validation-popup {
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 400px;
                animation: popIn 0.3s ease;
            }
            
            @keyframes popIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            .mp-validation-icon {
                font-size: 60px;
                margin-bottom: 15px;
            }
            
            .mp-validation-text {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .mp-validation-points {
                font-size: 32px;
                color: #4CAF50;
                font-weight: bold;
            }
            
            .mp-validation-bonus {
                font-size: 18px;
                color: #FF9800;
                margin: 10px 0;
            }
            
            .mp-validation-waiting {
                font-size: 14px;
                color: #666;
                margin-top: 15px;
                font-style: italic;
            }
            
            /* Cacher UNIQUEMENT le menu hamburger ORANGE en mode multijoueur (pas le bleu qui sert pour les blocs) */
            body.mp-game-active .mobile-mode-menu-btn,
            body.mp-game-active #mobile-mode-menu-btn {
                display: none !important;
            }
            
            /* Cacher les sélecteurs cursus et niveau en mode multijoueur */
            body.mp-game-active .cursus-selector,
            body.mp-game-active .level-selector,
            body.mp-game-active #student-left > .cursus-selector,
            body.mp-game-active #student-left > .level-selector {
                display: none !important;
            }
            
            /* Cacher result-message et help-me-btn en mode multijoueur (ils créent de l'espace inutile) */
            body.mp-game-active #result-message,
            body.mp-game-active #help-me-btn {
                display: none !important;
            }
            
            /* Indicateur d'objectif de blocs dans le panneau gauche (discret, centré) */
            #mp-block-objective {
                display: none;
                width: 100%;
                text-align: center !important;
                font-size: 13px;
                color: #666;
                margin: 0;
                padding: 0;
            }
            
            #mp-block-objective strong {
                color: #4C97FF;
            }
            
            /* Réduire les marges en mode multijoueur */
            body.mp-game-active #student-left .controls {
                margin-top: 5px !important;
                margin-bottom: 0 !important;
            }
            
            /* Réduire la marge du speed-control en mode multijoueur */
            body.mp-game-active #student-left .speed-control {
                margin: 5px 0 !important;
            }
            
            /* STYLES MOBILE POUR LE HEADER MULTIJOUEUR */
            @media (max-width: 768px) {
                #mp-game-header {
                    flex-wrap: nowrap;
                    padding: 8px 10px 8px 70px; /* padding-left pour éviter le menu hamburger */
                    gap: 6px;
                    justify-content: space-between;
                }
                
                .mp-game-info-left {
                    font-size: 11px;
                    white-space: nowrap;
                }
                
                .mp-game-timer {
                    font-size: 14px;
                    padding: 3px 8px;
                    gap: 4px;
                }
                
                .mp-game-timer .timer-icon {
                    font-size: 12px;
                }
                
                /* Cacher l'objectif de blocs dans le header sur mobile */
                .mp-game-info-right {
                    display: none;
                }
                
                /* Afficher l'objectif dans le panneau gauche sur mobile */
                #mp-block-objective {
                    display: block !important;
                    width: 100% !important;
                    text-align: center !important;
                    margin: 0 !important;
                    padding: 3px 0 !important;
                }
                
                .mp-game-actions {
                    gap: 4px;
                }
                
                .mp-header-btn {
                    padding: 5px 8px;
                    font-size: 11px;
                }
                
                .app-wrapper.mp-active {
                    padding-top: 50px;
                }
                
                /* Réduire les marges du speed-control en mobile multijoueur */
                body.mp-game-active #student-left > .speed-control {
                    margin: 3px 10px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========================================
    // ÉCRANS DE LA HOMEPAGE
    // ========================================
    
    function showHomepage() {
        hideAllScreens();
        hideMultiplayerGameUI();
        document.getElementById('multiplayer-container').style.display = 'block';
        document.getElementById('homepage-screen').style.display = 'flex';
    }
    
    function showCreateScreen() {
        hideAllScreens();
        document.getElementById('create-game-screen').style.display = 'flex';
        loadAnimalsForCreate();
    }
    
    function showJoinScreen() {
        hideAllScreens();
        document.getElementById('join-game-screen').style.display = 'flex';
        document.getElementById('join-code-input').value = '';
        document.getElementById('join-code-input').focus();
    }
    
    function showTeacherPasswordScreen() {
        hideAllScreens();
        document.getElementById('teacher-password-screen').style.display = 'flex';
        document.getElementById('mp-teacher-password').value = '';
        document.getElementById('mp-teacher-password').focus();
    }
    
    function hideAllScreens() {
        document.querySelectorAll('.mp-screen').forEach(s => s.style.display = 'none');
    }
    
    function hideMultiplayerGameUI() {
        const header = document.getElementById('mp-game-header');
        if (header) header.style.display = 'none';
        
        // Enlever la classe du mode multijoueur
        document.body.classList.remove('mp-game-active');
        
        const appWrapper = document.querySelector('.app-wrapper');
        if (appWrapper) {
            appWrapper.classList.remove('mp-active');
            appWrapper.style.display = 'none';
        }
        
        // Supprimer l'indicateur d'objectif mobile
        const blockObjective = document.getElementById('mp-block-objective');
        if (blockObjective) blockObjective.remove();
        
        // Restaurer l'interface normale
        const appHeader = document.getElementById('app-header');
        if (appHeader) appHeader.style.display = 'flex';
        
        const cursusSelector = document.querySelector('#student-left .cursus-selector');
        const levelSelector = document.querySelector('#student-left .level-selector');
        if (cursusSelector) cursusSelector.style.display = 'block';
        if (levelSelector) levelSelector.style.display = 'block';
        
        const scoreDisplay = document.getElementById('header-score-display');
        if (scoreDisplay) scoreDisplay.style.display = 'flex';
        
        const controls = document.querySelector('#student-left .controls');
        if (controls) {
            controls.querySelectorAll('.btn-success').forEach(b => b.style.display = 'block');
        }
        
        // Supprimer l'overlay de validation s'il existe
        const overlay = document.getElementById('mp-validation-overlay');
        if (overlay) overlay.remove();
    }
    
    // ========================================
    // CRÉATION DE PARTIE
    // ========================================
    
    async function loadAnimalsForCreate() {
        try {
            const response = await fetch(`php/game.php?action=get_animals&deviceId=${MP_STATE.deviceId}`);
            const data = await response.json();
            
            if (data.success && data.animals) {
                const container = document.getElementById('create-animal-choices');
                container.innerHTML = '';
                
                data.animals.forEach((animal, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'animal-choice-btn';
                    btn.textContent = animal;
                    btn.onclick = () => selectAnimal(btn, animal, 'create');
                    if (index === 0) {
                        btn.classList.add('selected');
                        document.getElementById('create-nickname-display').textContent = animal;
                    }
                    container.appendChild(btn);
                });
            }
        } catch (error) {
            console.error('Erreur chargement animaux:', error);
        }
    }
    
    function selectAnimal(btn, animal, context) {
        const container = btn.parentElement;
        container.querySelectorAll('.animal-choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        const displayId = context === 'create' ? 'create-nickname-display' : 'join-nickname-display';
        document.getElementById(displayId).textContent = animal;
    }
    
    async function createGame() {
        const nickname = document.getElementById('create-nickname-display').textContent;
        const numLevels = parseInt(document.getElementById('create-num-levels').value) || 5;
        const maxSquares = parseInt(document.getElementById('create-max-squares').value) || 5;
        const finishCountdownEnabled = document.getElementById('finish-countdown-enabled').checked;
        const finishCountdown = parseInt(document.getElementById('finish-countdown-duration').value) || 30;
        
        if (!nickname || nickname === 'Chargement...') {
            alert('Veuillez choisir un pseudo');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('nickname', nickname);
            formData.append('numLevels', numLevels);
            formData.append('maxSquares', maxSquares);
            formData.append('finishCountdownEnabled', finishCountdownEnabled ? 'true' : 'false');
            formData.append('finishCountdown', finishCountdown);
            formData.append('deviceId', MP_STATE.deviceId);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (data.success) {
                MP_STATE.playCode = data.playCode;
                MP_STATE.nickname = nickname;
                MP_STATE.isHost = true;
                MP_STATE.gameState = 'waiting';
                MP_STATE.numLevels = numLevels;
                MP_STATE.finishCountdown = finishCountdown;
                MP_STATE.finishCountdownEnabled = finishCountdownEnabled;
                
                showLobbyScreen();
                startPolling();
            } else {
                alert(data.message || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur création:', error);
            alert('Erreur de connexion');
        }
    }
    
    // ========================================
    // REJOINDRE UNE PARTIE
    // ========================================
    
    async function checkGameCode() {
        const code = document.getElementById('join-code-input').value.toUpperCase().trim();
        
        if (code.length !== 6) {
            document.getElementById('join-error-message').textContent = 'Le code doit contenir 6 caractères';
            document.getElementById('join-error-message').style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`php/game.php?action=check_game&code=${code}`);
            const data = await response.json();
            
            if (data.success && data.exists) {
                if (data.state !== 'waiting') {
                    document.getElementById('join-error-message').textContent = 'Cette partie a déjà commencé';
                    document.getElementById('join-error-message').style.display = 'block';
                    return;
                }
                
                MP_STATE.playCode = code;
                document.getElementById('join-error-message').style.display = 'none';
                showNicknameSelectionScreen();
            } else {
                document.getElementById('join-error-message').textContent = 'Code de partie invalide';
                document.getElementById('join-error-message').style.display = 'block';
            }
        } catch (error) {
            console.error('Erreur vérification:', error);
            document.getElementById('join-error-message').textContent = 'Erreur de connexion';
            document.getElementById('join-error-message').style.display = 'block';
        }
    }
    
    async function showNicknameSelectionScreen() {
        hideAllScreens();
        document.getElementById('nickname-selection-screen').style.display = 'flex';
        
        try {
            const response = await fetch(`php/game.php?action=get_animals&code=${MP_STATE.playCode}&deviceId=${MP_STATE.deviceId}`);
            const data = await response.json();
            
            if (data.success && data.animals) {
                const container = document.getElementById('join-animal-choices');
                container.innerHTML = '';
                
                data.animals.forEach((animal, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'animal-choice-btn';
                    btn.textContent = animal;
                    btn.onclick = () => selectAnimal(btn, animal, 'join');
                    if (index === 0) {
                        btn.classList.add('selected');
                        document.getElementById('join-nickname-display').textContent = animal;
                    }
                    container.appendChild(btn);
                });
            }
        } catch (error) {
            console.error('Erreur chargement animaux:', error);
        }
    }
    
    async function joinGame() {
        const nickname = document.getElementById('join-nickname-display').textContent;
        
        if (!nickname || nickname === 'Chargement...') {
            alert('Veuillez choisir un pseudo');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', 'join');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', nickname);
            formData.append('deviceId', MP_STATE.deviceId);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (data.success) {
                MP_STATE.nickname = nickname;
                MP_STATE.isHost = false;
                MP_STATE.gameState = 'waiting';
                
                showLobbyScreen();
                startPolling();
            } else {
                alert(data.message || 'Erreur lors de la connexion');
            }
        } catch (error) {
            console.error('Erreur connexion:', error);
            alert('Erreur de connexion');
        }
    }
    
    // ========================================
    // LOBBY (SALLE D'ATTENTE)
    // ========================================
    
    function showLobbyScreen() {
        hideAllScreens();
        document.getElementById('lobby-screen').style.display = 'flex';
        
        document.getElementById('lobby-code').textContent = MP_STATE.playCode;
        document.getElementById('lobby-settings').textContent = `${MP_STATE.numLevels} niveaux`;
        
        document.getElementById('start-game-btn').style.display = MP_STATE.isHost ? 'block' : 'none';
        document.getElementById('lobby-waiting-msg').style.display = MP_STATE.isHost ? 'none' : 'block';
        
        updateLobbyPlayerCount(1);
    }
    
    function updateLobbyPlayerCount(count) {
        const el = document.getElementById('lobby-player-count');
        const plural = document.getElementById('lobby-player-count-plural');
        const plural2 = document.getElementById('lobby-player-count-plural2');
        if (el) el.textContent = count;
        if (plural) plural.textContent = count > 1 ? 's' : '';
        if (plural2) plural2.textContent = count > 1 ? 's' : '';
    }
    
    function updateLobbyPlayers(players) {
        const container = document.getElementById('lobby-players');
        container.innerHTML = '';
        
        const connected = players.filter(p => p.connected !== false);
        updateLobbyPlayerCount(connected.length);
        
        players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'lobby-player';
            if (player.isHost) div.classList.add('host');
            if (!player.connected) div.classList.add('disconnected');
            
            div.innerHTML = `
                <span class="player-name">${player.nickname}</span>
                ${player.isHost ? '<span class="host-badge">👑 Hôte</span>' : ''}
            `;
            container.appendChild(div);
        });
    }
    
    function copyGameCode() {
        navigator.clipboard.writeText(MP_STATE.playCode).then(() => {
            const btn = document.getElementById('copy-code-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copié !';
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }
    
    async function startGameAsHost() {
        if (!MP_STATE.isHost) return;
        
        try {
            const formData = new FormData();
            formData.append('action', 'start');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (!data.success) {
                alert(data.message || 'Erreur lors du lancement');
            }
        } catch (error) {
            console.error('Erreur lancement:', error);
            alert('Erreur de connexion');
        }
    }
    
    // ========================================
    // COMPTE À REBOURS
    // ========================================
    
    function showCountdown(startTime) {
        hideAllScreens();
        document.getElementById('countdown-screen').style.display = 'flex';
        
        const countdownDisplay = document.getElementById('countdown-number');
        
        function updateCountdown() {
            const elapsed = Math.floor(Date.now() / 1000) - startTime;
            const remaining = 3 - elapsed;
            
            if (remaining <= 0) {
                countdownDisplay.textContent = 'GO !';
                countdownDisplay.style.color = '#4CAF50';
                
                setTimeout(() => {
                    MP_STATE.gameState = 'playing';
                }, 500);
            } else {
                countdownDisplay.textContent = remaining;
                countdownDisplay.style.color = remaining === 1 ? '#f44336' : '#FF9800';
            }
        }
        
        updateCountdown();
        if (MP_STATE.countdownInterval) clearInterval(MP_STATE.countdownInterval);
        MP_STATE.countdownInterval = setInterval(updateCountdown, 200);
    }
    
    // ========================================
    // ÉCRAN DE JEU
    // ========================================
    
    function showGameScreen(levelData) {
        if (MP_STATE.countdownInterval) {
            clearInterval(MP_STATE.countdownInterval);
            MP_STATE.countdownInterval = null;
        }
        if (MP_STATE.levelCountdownInterval) {
            clearInterval(MP_STATE.levelCountdownInterval);
            MP_STATE.levelCountdownInterval = null;
        }
        
        // Marquer qu'on est en mode multijoueur (pour désactiver les popups)
        window.isMultiplayerMode = true;
        
        // Cacher le conteneur multijoueur et montrer l'interface de programmation
        document.getElementById('multiplayer-container').style.display = 'none';
        
        const appWrapper = document.querySelector('.app-wrapper');
        if (appWrapper) {
            appWrapper.style.display = 'block';
            appWrapper.classList.add('mp-active');
        }
        
        // Fermer immédiatement toutes les popups pédagogiques qui pourraient apparaître
        const welcomePreviewModal = document.getElementById('welcome-preview-modal');
        if (welcomePreviewModal) {
            welcomePreviewModal.classList.remove('active');
        }
        const welcomeStudentModal = document.getElementById('welcome-student-modal');
        if (welcomeStudentModal) {
            welcomeStudentModal.classList.remove('active');
        }
        
        // Afficher le header de jeu multijoueur
        showMultiplayerGameHeader(levelData);
        
        MP_STATE.currentLevel = levelData.index;
        MP_STATE.targetGrid = levelData.targetGrid;
        MP_STATE.expectedBlocks = levelData.expectedBlocks;
        MP_STATE.hasValidated = false;
        
        MP_STATE.questionStartTime = Date.now();
        MP_STATE.serverQuestionStartTime = levelData.startTime * 1000;
        
        // Configurer l'interface élève pour le mode multijoueur
        setupMultiplayerStudentInterface(levelData);
        
        // Démarrer le chronomètre
        startTimer();
    }
    
    function showMultiplayerGameHeader(levelData) {
        let header = document.getElementById('mp-game-header');
        if (!header) {
            header = document.createElement('div');
            header.id = 'mp-game-header';
            document.body.insertBefore(header, document.body.firstChild);
        }
        
        header.innerHTML = `
            <div class="mp-game-info-left">
                <span>Niveau ${levelData.index + 1} / ${MP_STATE.numLevels}</span>
            </div>
            <div class="mp-game-timer">
                <span class="timer-icon">⏱️</span>
                <span id="mp-timer-display">00:00</span>
            </div>
            <div class="mp-game-info-right">
                <span>Objectif : ${levelData.expectedBlocks} blocs</span>
            </div>
            <div class="mp-game-actions">
                <button id="mp-validate-btn" class="mp-header-btn mp-btn-success" onclick="MP.validateMultiplayerLevel()">
                    ✅ Valider
                </button>
                ${MP_STATE.isHost ? '<button id="mp-force-results-btn" class="mp-header-btn mp-btn-warning" onclick="MP.forceLevelComplete()" title="Forcer l\'affichage des résultats si le jeu est bloqué">⚡ Stopper ce niveau</button>' : ''}
            </div>
        `;
        
        header.style.display = 'flex';
    }
    
    function setupMultiplayerStudentInterface(levelData) {
        // IMPORTANT: D'abord définir le mode student pour que les fonctions de grille fonctionnent
        if (window.setCurrentMode) {
            window.setCurrentMode('student');
        } else {
            window.currentMode = 'student';
        }
        
        // Ajouter la classe pour le mode multijoueur (cache les menus hamburger via CSS)
        document.body.classList.add('mp-game-active');
        
        // Ensuite enlever la classe teacher-mode du body et header
        // (les règles CSS avec !important bloquent sinon l'affichage)
        document.body.classList.remove('teacher-mode');
        const appHeader = document.getElementById('app-header');
        if (appHeader) {
            appHeader.classList.remove('teacher-mode');
            // Cacher le header normal de P-Blocks (on a le header multijoueur)
            appHeader.style.display = 'none';
        }
        
        // Maintenant forcer l'affichage du panneau élève (pas le panneau teacher)
        const studentLeft = document.getElementById('student-left');
        const teacherLeft = document.getElementById('teacher-left');
        if (studentLeft) studentLeft.style.display = 'block';
        if (teacherLeft) teacherLeft.style.display = 'none';
        
        // Cacher les sélecteurs
        const cursusSelector = document.querySelector('#student-left .cursus-selector');
        const levelSelector = document.querySelector('#student-left .level-selector');
        if (cursusSelector) cursusSelector.style.display = 'none';
        if (levelSelector) levelSelector.style.display = 'none';
        
        // Créer ou mettre à jour l'indicateur d'objectif de blocs pour mobile
        // Le positionner APRÈS les boutons .controls
        let blockObjective = document.getElementById('mp-block-objective');
        const controls = document.querySelector('#student-left .controls');
        if (!blockObjective) {
            blockObjective = document.createElement('div');
            blockObjective.id = 'mp-block-objective';
            // L'insérer APRÈS .controls
            if (controls && controls.parentNode) {
                controls.parentNode.insertBefore(blockObjective, controls.nextSibling);
            }
        }
        blockObjective.innerHTML = `🎯 Objectif : <strong>${levelData.expectedBlocks} blocs</strong>`;
        
        // Cacher le score et les boutons de validation normaux
        const scoreDisplay = document.getElementById('header-score-display');
        if (scoreDisplay) scoreDisplay.style.display = 'none';
        
        // NOTE: Les menus hamburger sont cachés via CSS (body.mp-game-active)
        // Pas de backup JS pour éviter les effets de bord
        
        if (controls) {
            controls.querySelectorAll('.btn-success').forEach(b => b.style.display = 'none');
        }
        
        const helpBtn = document.getElementById('help-me-btn');
        if (helpBtn) helpBtn.style.display = 'none';
        
        // Afficher tous les blocs (mode multijoueur = pas de restriction)
        document.querySelectorAll('.blocks-category').forEach(cat => {
            cat.style.display = 'block';
            const blocks = cat.querySelector('.category-blocks');
            if (blocks) blocks.style.display = 'block';
        });
        
        // Réinitialiser la grille élève et le programme AVANT d'afficher le motif cible
        if (window.clearGrid) window.clearGrid();
        if (window.clearProgram) window.clearProgram();
        if (window.resetTurtle) window.resetTurtle();
        
        // Maintenant afficher le motif cible
        displayTargetGridOnElement(levelData.targetGrid);
    }
    
    function displayTargetGridOnElement(gridData) {
        console.log('displayTargetGridOnElement appelé avec:', gridData);
        
        const targetGrid = document.getElementById('target-grid');
        if (!targetGrid) {
            console.error('target-grid non trouvé');
            return;
        }
        
        // Palette officielle (identique à blockExecution.js)
        const colorMap = {
            'red': '#dc3545',
            'yellow': '#ffc107',
            'green': '#28a745',
            'blue': '#007bff',
            'pink': '#FF69B4',
            'black': '#343a40',
            'white': '#ffffff'
        };
        
        const cells = targetGrid.querySelectorAll('.grid-cell');
        console.log('Nombre de cellules dans target-grid:', cells.length);
        
        if (cells.length === 0) {
            console.error('Aucune cellule dans target-grid - grille non initialisée?');
            return;
        }
        
        let coloredCount = 0;
        cells.forEach(cell => {
            // Utiliser data-x et data-y (pas data-row et data-col)
            const col = parseInt(cell.dataset.x);
            const row = parseInt(cell.dataset.y);
            if (gridData[row] && gridData[row][col]) {
                const color = colorMap[gridData[row][col]] || '#ffffff';
                cell.style.backgroundColor = color;
                if (gridData[row][col] !== 'white') {
                    coloredCount++;
                }
            } else {
                cell.style.backgroundColor = '#ffffff';
            }
        });
        
        console.log('Cellules colorées:', coloredCount);
    }
    
    function startTimer() {
        if (MP_STATE.timerInterval) clearInterval(MP_STATE.timerInterval);
        
        function updateTimer() {
            const elapsed = Date.now() - MP_STATE.questionStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            
            const display = document.getElementById('mp-timer-display');
            if (display) {
                display.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        }
        
        updateTimer();
        MP_STATE.timerInterval = setInterval(updateTimer, 100);
    }
    
    function stopTimer() {
        if (MP_STATE.timerInterval) {
            clearInterval(MP_STATE.timerInterval);
            MP_STATE.timerInterval = null;
        }
    }
    
    // ========================================
    // VALIDATION DU NIVEAU
    // ========================================
    
    async function validateMultiplayerLevel() {
        if (MP_STATE.hasValidated) {
            return;
        }
        
        const btn = document.getElementById('mp-validate-btn');
        btn.disabled = true;
        btn.textContent = '⏳ Test en cours...';
        
        // S'assurer que la grille student est bien la grille active
        if (window.setCurrentMode) {
            window.setCurrentMode('student');
        }
        if (window.getActiveGrid) {
            window.getActiveGrid();
        }
        
        // Vérifier qu'il y a des blocs dans le programme
        const programBlocks = document.getElementById('program-blocks');
        const blocks = programBlocks ? programBlocks.querySelectorAll(':scope > .program-block') : [];
        
        if (blocks.length === 0) {
            btn.disabled = false;
            btn.textContent = '✅ Valider';
            showValidationFeedback(false, 0, false);
            return;
        }
        
        // Sauvegarder la vitesse actuelle du slider (élève ou prof)
        const speedSlider = document.getElementById('student-execution-speed') || document.getElementById('execution-speed');
        const originalSpeed = speedSlider ? parseInt(speedSlider.value) : 90;
        
        // Mettre la vitesse à 95 (rapide mais visible)
        if (window.updateExecutionSpeed) {
            window.updateExecutionSpeed(95);
        }
        if (speedSlider) {
            speedSlider.value = 95;
        }
        
        // Exécuter le programme
        try {
            if (window.executeProgram) {
                await window.executeProgram();
            }
        } catch (error) {
            console.error('Erreur lors de l\'exécution:', error);
        }
        
        // Attendre un court délai pour s'assurer que la grille est mise à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Restaurer la vitesse originale
        if (window.updateExecutionSpeed) {
            window.updateExecutionSpeed(originalSpeed);
        }
        if (speedSlider) {
            speedSlider.value = originalSpeed;
        }
        
        // Maintenant lire la grille après exécution
        const timeSpent = Date.now() - MP_STATE.questionStartTime;
        
        // Rafraîchir la grille active
        if (window.getActiveGrid) {
            window.getActiveGrid();
        }
        
        const studentGrid = window.getGridState ? window.getGridState() : null;
        if (!studentGrid) {
            alert('Erreur: impossible de lire la grille');
            btn.disabled = false;
            btn.textContent = '✅ Valider';
            return;
        }
        
        console.log('Grille élève après exécution:', JSON.stringify(studentGrid));
        
        const blockCount = window.countTotalBlocks ? window.countTotalBlocks(blocks) : blocks.length;
        
        btn.textContent = '⏳ Envoi...';
        
        try {
            const formData = new FormData();
            formData.append('action', 'validate');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            formData.append('levelIndex', MP_STATE.currentLevel);
            formData.append('gridState', JSON.stringify(studentGrid));
            formData.append('blockCount', blockCount);
            formData.append('timeSpent', timeSpent);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (data.success) {
                MP_STATE.hasValidated = true;
                stopTimer();
                stopFinishCountdown(); // Plus besoin du compte à rebours
                
                if (data.alreadyValidated) {
                    btn.textContent = '🔒 Déjà validé';
                    btn.style.background = '#9E9E9E';
                } else if (data.correct) {
                    btn.textContent = `✅ +${data.points} pts`;
                    btn.style.background = '#4CAF50';
                    showValidationFeedback(true, data.points, data.isOptimal);
                } else {
                    btn.textContent = '🔒 Déjà validé';
                    btn.style.background = '#9E9E9E';
                    
                    showValidationFeedback(false, 0, false);
                }
            } else {
                btn.disabled = false;
                btn.textContent = '✅ Valider';
                console.error('Erreur validation:', data.message);
            }
        } catch (error) {
            console.error('Erreur envoi validation:', error);
            
            MP_STATE.pendingValidation = {
                levelIndex: MP_STATE.currentLevel,
                gridState: JSON.stringify(studentGrid),
                blockCount: blockCount,
                timeSpent: timeSpent
            };
            
            btn.disabled = false;
            btn.textContent = '🔄 Réessayer';
        }
    }
    
    function showValidationFeedback(success, points, isOptimal) {
        // Supprimer l'overlay existant
        let overlay = document.getElementById('mp-validation-overlay');
        if (overlay) overlay.remove();
        
        overlay = document.createElement('div');
        overlay.id = 'mp-validation-overlay';
        
        if (success) {
            overlay.innerHTML = `
                <div class="mp-validation-popup mp-success-popup">
                    <div class="mp-confetti-burst"></div>
                    <div class="mp-validation-icon mp-bounce">🎉</div>
                    <div class="mp-validation-title">BRAVO !</div>
                    <div class="mp-validation-points mp-pulse">+${points} points</div>
                    ${isOptimal ? '<div class="mp-validation-bonus">🌟 Solution optimale ! 🌟</div>' : ''}
                    <div class="mp-validation-divider"></div>
                    <div class="mp-validation-waiting">
                        <div class="mp-waiting-spinner"></div>
                        <span>En attente des autres joueurs...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Mini confettis dans la popup
            launchMiniConfetti(overlay.querySelector('.mp-confetti-burst'));
        } else {
            overlay.innerHTML = `
                <div class="mp-validation-popup mp-error-popup">
                    <div class="mp-validation-icon mp-shake">❌</div>
                    <div class="mp-validation-title">Incorrect</div>
                    <div class="mp-validation-message">Le motif ne correspond pas.</div>
                    <div class="mp-validation-hint">Ta réponse a été enregistrée, pas de deuxième essai !</div>
                    <div class="mp-validation-divider"></div>
                    <div class="mp-validation-waiting">
                        <div class="mp-waiting-spinner"></div>
                        <span>En attente des autres joueurs...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }
    
    function launchMiniConfetti(container) {
        if (!container) return;
        
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'mp-mini-confetti';
            confetti.style.left = (50 + (Math.random() - 0.5) * 100) + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            confetti.style.animationDuration = (1 + Math.random()) + 's';
            container.appendChild(confetti);
        }
    }
    
    // ========================================
    // RÉSULTATS DU NIVEAU
    // ========================================
    
    function showLevelResults(results) {
        stopTimer();
        hideMultiplayerGameUI();
        
        // Supprimer l'overlay de validation
        const validationOverlay = document.getElementById('mp-validation-overlay');
        if (validationOverlay) validationOverlay.remove();
        
        document.getElementById('multiplayer-container').style.display = 'block';
        hideAllScreens();
        document.getElementById('results-screen').style.display = 'flex';
        
        const isLastLevel = results.levelIndex >= MP_STATE.numLevels - 1;
        
        document.getElementById('results-level-title').textContent = isLastLevel 
            ? `Résultats - Dernier niveau !` 
            : `Résultats - Niveau ${results.levelIndex + 1}`;
        
        // Podium
        const podiumContainer = document.getElementById('results-podium');
        podiumContainer.innerHTML = '';
        
        const top3 = results.top3 || [];
        const podiumOrder = [1, 0, 2];
        
        podiumOrder.forEach((rank) => {
            const player = top3[rank];
            if (player) {
                const div = document.createElement('div');
                div.className = `podium-place place-${rank + 1}`;
                
                const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉';
                const isMe = player.nickname === MP_STATE.nickname;
                
                div.innerHTML = `
                    <div class="podium-medal">${medal}</div>
                    <div class="podium-name ${isMe ? 'is-me' : ''}">${player.nickname}</div>
                    <div class="podium-score">${player.points} pts</div>
                    ${player.correct ? `<div class="podium-time">${formatTime(player.timeSpent)}</div>` : '<div class="podium-status">Non terminé</div>'}
                    <div class="podium-bar"></div>
                `;
                podiumContainer.appendChild(div);
            }
        });
        
        // Top 5 plus rapides
        const fastestContainer = document.getElementById('results-fastest');
        fastestContainer.innerHTML = '<h4>⚡ Les plus rapides</h4>';
        
        const top5Fastest = results.top5Fastest || [];
        top5Fastest.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'fastest-player';
            const isMe = player.nickname === MP_STATE.nickname;
            
            div.innerHTML = `
                <span class="fastest-rank">${index + 1}.</span>
                <span class="fastest-name ${isMe ? 'is-me' : ''}">${player.nickname}</span>
                <span class="fastest-time">${formatTime(player.timeSpent)}</span>
            `;
            fastestContainer.appendChild(div);
        });
        
        // Compte à rebours de 5 secondes pour TOUS les niveaux
        const nextBtn = document.getElementById('next-level-btn');
        const waitingDiv = document.getElementById('results-waiting');
        const forceBtn = document.getElementById('force-next-btn');
        
        nextBtn.style.display = 'none';
        waitingDiv.style.display = 'block';
        
        // Bouton de forçage visible immédiatement pour l'hôte
        if (forceBtn) {
            forceBtn.style.display = MP_STATE.isHost ? 'block' : 'none';
            forceBtn.textContent = isLastLevel ? '⚡ Forcer le classement final' : '⚡ Forcer le niveau suivant';
        }
        
        let countdown = 5;
        const nextText = isLastLevel ? '🏆 Classement final' : '➡️ Niveau suivant';
        waitingDiv.innerHTML = `<div class="level-countdown">${nextText} dans <span id="level-countdown-number">${countdown}</span>s</div>`;
        
        // Stocker l'intervalle pour pouvoir l'annuler si nécessaire
        if (MP_STATE.levelCountdownInterval) {
            clearInterval(MP_STATE.levelCountdownInterval);
        }
        
        MP_STATE.levelCountdownInterval = setInterval(() => {
            countdown--;
            const countdownSpan = document.getElementById('level-countdown-number');
            if (countdownSpan) {
                countdownSpan.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(MP_STATE.levelCountdownInterval);
                MP_STATE.levelCountdownInterval = null;
                // L'hôte envoie la commande pour passer au niveau suivant
                if (MP_STATE.isHost) {
                    goToNextLevel();
                }
            }
        }, 1000);
    }
    
    async function goToNextLevel() {
        if (!MP_STATE.isHost) return;
        
        try {
            const formData = new FormData();
            formData.append('action', 'next_level');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            
            await fetch('php/game.php', { method: 'POST', body: formData });
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
    
    // Forçage depuis l'écran de jeu (si bloqué) : déclenche l'affichage des résultats
    async function forceLevelComplete() {
        if (!MP_STATE.isHost) return;
        
        const btn = document.getElementById('mp-force-results-btn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
        
        try {
            const formData = new FormData();
            formData.append('action', 'force_level_complete');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            
            await fetch('php/game.php', { method: 'POST', body: formData });
        } catch (error) {
            console.error('Erreur force_level_complete:', error);
            if (btn) { btn.disabled = false; btn.textContent = '⚡ Résultats'; }
        }
    }
    
    // Forçage depuis l'écran de résultats (si le passage automatique est bloqué)
    async function forceGoToNextLevel() {
        if (!MP_STATE.isHost) return;
        
        if (MP_STATE.levelCountdownInterval) {
            clearInterval(MP_STATE.levelCountdownInterval);
            MP_STATE.levelCountdownInterval = null;
        }
        
        const btn = document.getElementById('force-next-btn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Passage en cours...'; }
        
        await goToNextLevel();
    }
    
    // ========================================
    // RÉSULTATS FINAUX
    // ========================================
    
    function showFinalResults(results) {
        stopTimer();
        if (MP_STATE.pollingInterval) {
            clearInterval(MP_STATE.pollingInterval);
            MP_STATE.pollingInterval = null;
        }
        
        hideMultiplayerGameUI();
        document.getElementById('multiplayer-container').style.display = 'block';
        hideAllScreens();
        document.getElementById('final-results-screen').style.display = 'flex';
        
        const players = results.players || [];
        
        // Podium final
        const podiumContainer = document.getElementById('final-podium');
        podiumContainer.innerHTML = '';
        
        const podiumOrder = [1, 0, 2];
        podiumOrder.forEach((rank) => {
            const player = players[rank];
            if (player) {
                const div = document.createElement('div');
                div.className = `final-podium-place place-${rank + 1}`;
                
                const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉';
                const isMe = player.nickname === MP_STATE.nickname;
                
                div.innerHTML = `
                    <div class="final-podium-medal">${medal}</div>
                    <div class="final-podium-name ${isMe ? 'is-me' : ''}">${player.nickname}</div>
                    <div class="final-podium-score">${player.score} pts</div>
                    <div class="final-podium-levels">${player.levelsCompleted}/${results.numLevels} niveaux</div>
                    <div class="final-podium-bar"></div>
                `;
                podiumContainer.appendChild(div);
            }
        });
        
        // Confettis si top 3
        const myRank = players.findIndex(p => p.nickname === MP_STATE.nickname);
        if (myRank >= 0 && myRank < 3) {
            launchConfetti();
        }
        
        // Classement complet
        const rankingContainer = document.getElementById('final-ranking');
        rankingContainer.innerHTML = '<h4>📊 Classement complet</h4>';
        
        players.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'ranking-player';
            const isMe = player.nickname === MP_STATE.nickname;
            
            div.innerHTML = `
                <span class="ranking-position">${index + 1}</span>
                <span class="ranking-name ${isMe ? 'is-me' : ''}">${player.nickname}</span>
                <span class="ranking-score">${player.score} pts</span>
            `;
            rankingContainer.appendChild(div);
        });
    }
    
    function launchConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        
        container.innerHTML = '';
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
        
        setTimeout(() => container.innerHTML = '', 5000);
    }
    
    // ========================================
    // FIN DE PARTIE (HÔTE)
    // ========================================
    
    async function endGameAsHost() {
        if (!MP_STATE.isHost) return;
        
        if (!confirm('Terminer la partie maintenant ?')) return;
        
        try {
            const formData = new FormData();
            formData.append('action', 'end_game');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (data.success && data.finalResults) {
                showFinalResults(data.finalResults);
            }
        } catch (error) {
            console.error('Erreur fin partie:', error);
        }
    }
    
    // ========================================
    // MODE PROFESSEUR
    // ========================================
    
    async function checkTeacherPasswordAuto() {
        const password = document.getElementById('mp-teacher-password').value;
        
        // Cacher l'erreur pendant la saisie
        document.getElementById('mp-password-error').style.display = 'none';
        document.getElementById('mp-teacher-password').style.borderColor = '#e0e0e0';
        
        // Vérifier le mot de passe
        const passwordHash = await hashPassword(password);
        const TEACHER_PASSWORD_HASH = '00624b02e1f9b996a3278f559d5d55313552ad2c0bafc82adfd975c12df61eaf';
        
        if (passwordHash === TEACHER_PASSWORD_HASH) {
            // Fermer toutes les popups qui pourraient être ouvertes
            const welcomePreviewModal = document.getElementById('welcome-preview-modal');
            if (welcomePreviewModal) {
                welcomePreviewModal.classList.remove('active');
            }
            
            // Bon mot de passe : passer directement en mode création
            document.getElementById('multiplayer-container').style.display = 'none';
            document.querySelector('.app-wrapper').style.display = 'block';
            
            // Passer en mode professeur (création de niveaux)
            if (window.setCurrentMode) {
                window.setCurrentMode('teacher');
            } else {
                window.currentMode = 'teacher';
            }
            
            // Mettre à jour l'interface pour le mode création
            if (window.updateModeDisplay) {
                window.updateModeDisplay();
            }
            
            // Charger les niveaux du professeur
            if (window.loadTeacherLevels) {
                window.loadTeacherLevels();
            }
        }
    }
    
    async function checkTeacherPassword() {
        // Cette fonction n'est plus utilisée mais gardée pour compatibilité
        checkTeacherPasswordAuto();
    }
    
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // ========================================
    // COMPTE À REBOURS DE FIN DE NIVEAU
    // (déclenché quand le premier joueur valide)
    // ========================================
    
    function startFinishCountdown(firstValidationTimestamp) {
        stopFinishCountdown();
        
        // Calculer le temps restant depuis le serveur (timestamp en secondes)
        const deadline = firstValidationTimestamp * 1000 + MP_STATE.finishCountdown * 1000;
        
        function updateFinishCountdown() {
            const remaining = Math.ceil((deadline - Date.now()) / 1000);
            
            if (remaining <= 0) {
                stopFinishCountdown();
                updateFinishCountdownDisplay(0);
                return;
            }
            
            updateFinishCountdownDisplay(remaining);
        }
        
        updateFinishCountdown();
        MP_STATE.finishCountdownInterval = setInterval(updateFinishCountdown, 200);
    }
    
    function stopFinishCountdown() {
        if (MP_STATE.finishCountdownInterval) {
            clearInterval(MP_STATE.finishCountdownInterval);
            MP_STATE.finishCountdownInterval = null;
        }
        // Supprimer la bannière si elle existe
        const banner = document.getElementById('mp-finish-countdown-banner');
        if (banner) banner.remove();
    }
    
    function updateFinishCountdownDisplay(remaining) {
        // Chercher ou créer la bannière dans le header de jeu
        let banner = document.getElementById('mp-finish-countdown-banner');
        
        if (!banner) {
            const header = document.getElementById('mp-game-header');
            if (!header) return;
            
            const headerHeight = header.offsetHeight || 60;
            
            banner = document.createElement('div');
            banner.id = 'mp-finish-countdown-banner';
            banner.style.cssText = `
                position: fixed;
                top: ${headerHeight}px;
                left: 0;
                right: 0;
                z-index: 999;
                background: linear-gradient(90deg, #FF9800, #f44336);
                color: white;
                text-align: center;
                font-size: 15px;
                font-weight: bold;
                padding: 6px 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            `;
            document.body.appendChild(banner);
            
            // Décaler l'app-wrapper vers le bas
            const appWrapper = document.querySelector('.app-wrapper.mp-active');
            if (appWrapper) {
                const currentPadding = parseInt(appWrapper.style.paddingTop) || headerHeight;
                appWrapper.style.paddingTop = (currentPadding + banner.offsetHeight + 34) + 'px';
            }
        }
        
        const urgency = remaining <= 10 ? '🔴' : remaining <= 20 ? '🟠' : '⏳';
        banner.innerHTML = `${urgency} Un joueur a terminé ! Temps restant : <span style="font-size:18px; background:rgba(0,0,0,0.2); padding:2px 10px; border-radius:12px;">${remaining}s</span>`;
        
        // Effet pulsant si urgence
        if (remaining <= 10) {
            banner.style.animation = 'none';
            banner.style.background = `linear-gradient(90deg, #f44336, #b71c1c)`;
        }
        
        if (remaining <= 0) {
            banner.textContent = '⏱️ Temps écoulé !';
            setTimeout(() => { if (banner.parentNode) banner.remove(); }, 1500);
            // Restaurer padding
            const appWrapper = document.querySelector('.app-wrapper.mp-active');
            if (appWrapper) appWrapper.style.paddingTop = '';
        }
    }
    
    // ========================================
    // POLLING (SYNCHRONISATION)
    // ========================================
    
    function startPolling() {
        if (MP_STATE.pollingInterval) clearInterval(MP_STATE.pollingInterval);
        
        MP_STATE.pollingInterval = setInterval(pollGameState, POLLING_INTERVAL);
        pollGameState();
    }
    
    async function pollGameState() {
        if (!MP_STATE.playCode || !MP_STATE.nickname) return;
        
        try {
            const response = await fetch(
                `php/game.php?action=get_state&playCode=${MP_STATE.playCode}&nickname=${encodeURIComponent(MP_STATE.nickname)}`
            );
            
            const data = await response.json();
            
            if (!data.success) {
                if (data.kicked) {
                    alert('Vous avez été déconnecté de la partie');
                    returnToHomepage();
                }
                MP_STATE.consecutiveFailures++;
                if (MP_STATE.consecutiveFailures >= RECONNECT_THRESHOLD) {
                    attemptRecovery();
                }
                return;
            }
            
            MP_STATE.consecutiveFailures = 0;
            handleStateUpdate(data);
            
        } catch (error) {
            console.error('Erreur polling:', error);
            MP_STATE.consecutiveFailures++;
            if (MP_STATE.consecutiveFailures >= RECONNECT_THRESHOLD) {
                attemptRecovery();
            }
        }
    }
    
    function handleStateUpdate(data) {
        console.log('handleStateUpdate:', data.state, 'level:', data.level ? data.level.index : 'none');
        
        // Synchroniser les paramètres de countdown (utiles pour les joueurs qui rejoignent)
        if (data.finishCountdown !== undefined) MP_STATE.finishCountdown = data.finishCountdown;
        if (data.finishCountdownEnabled !== undefined) MP_STATE.finishCountdownEnabled = data.finishCountdownEnabled;
        
        if (data.players) {
            MP_STATE.players = data.players;
            if (MP_STATE.gameState === 'waiting') {
                updateLobbyPlayers(data.players);
            }
        }
        
        MP_STATE.numLevels = data.numLevels || MP_STATE.numLevels;
        
        const previousState = MP_STATE.gameState;
        
        if (data.state === 'countdown' && previousState !== 'countdown') {
            MP_STATE.gameState = 'countdown';
            showCountdown(data.countdownStartTime);
        }
        else if (data.state === 'playing') {
            if (data.levelCompleted && data.levelResults) {
                if (MP_STATE.gameState !== 'results' || MP_STATE.currentLevel !== data.levelResults.levelIndex) {
                    MP_STATE.gameState = 'results';
                    stopFinishCountdown();
                    showLevelResults(data.levelResults);
                }
            } else if (data.level) {
                console.log('Level data received:', data.level);
                if (MP_STATE.currentLevel !== data.level.index || (previousState !== 'playing' && previousState !== 'results')) {
                    MP_STATE.gameState = 'playing';
                    MP_STATE.firstValidationTime = null;
                    stopFinishCountdown();
                    showGameScreen(data.level);
                }
                
                // Démarrer le compte à rebours si le premier joueur vient de valider
                if (MP_STATE.finishCountdownEnabled &&
                    data.firstValidationTime &&
                    MP_STATE.firstValidationTime === null &&
                    !MP_STATE.hasValidated &&
                    MP_STATE.gameState === 'playing') {
                    MP_STATE.firstValidationTime = data.firstValidationTime;
                    startFinishCountdown(data.firstValidationTime);
                }
            }
        }
        else if (data.state === 'finished' && previousState !== 'finished') {
            MP_STATE.gameState = 'finished';
            stopFinishCountdown();
            if (data.finalResults) {
                showFinalResults(data.finalResults);
            }
        }
    }
    
    async function attemptRecovery() {
        if (MP_STATE.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            alert('Connexion perdue. Retour à l\'accueil.');
            returnToHomepage();
            return;
        }
        
        MP_STATE.reconnectAttempts++;
        
        try {
            const formData = new FormData();
            formData.append('action', 'join');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            formData.append('deviceId', MP_STATE.deviceId);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (data.success) {
                MP_STATE.consecutiveFailures = 0;
                MP_STATE.reconnectAttempts = 0;
                
                if (MP_STATE.pendingValidation) {
                    retryPendingValidation();
                }
            }
        } catch (error) {
            console.error('Erreur reconnexion:', error);
            setTimeout(attemptRecovery, RECOVERY_RETRY_DELAY);
        }
    }
    
    async function retryPendingValidation() {
        if (!MP_STATE.pendingValidation) return;
        
        const pending = MP_STATE.pendingValidation;
        
        try {
            const formData = new FormData();
            formData.append('action', 'validate');
            formData.append('playCode', MP_STATE.playCode);
            formData.append('nickname', MP_STATE.nickname);
            formData.append('levelIndex', pending.levelIndex);
            formData.append('gridState', pending.gridState);
            formData.append('blockCount', pending.blockCount);
            formData.append('timeSpent', pending.timeSpent);
            
            const response = await fetch('php/game.php', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (data.success) {
                MP_STATE.pendingValidation = null;
                MP_STATE.hasValidated = true;
            }
        } catch (error) {
            console.error('Erreur retry validation:', error);
        }
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const tenths = Math.floor((ms % 1000) / 100);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}.${tenths}s`;
        }
        return `${seconds}.${tenths}s`;
    }
    
    function returnToHomepage() {
        if (MP_STATE.pollingInterval) {
            clearInterval(MP_STATE.pollingInterval);
            MP_STATE.pollingInterval = null;
        }
        if (MP_STATE.timerInterval) {
            clearInterval(MP_STATE.timerInterval);
            MP_STATE.timerInterval = null;
        }
        if (MP_STATE.countdownInterval) {
            clearInterval(MP_STATE.countdownInterval);
            MP_STATE.countdownInterval = null;
        }
        stopFinishCountdown();
        
        // Réinitialiser le mode multijoueur
        window.isMultiplayerMode = false;
        
        if (MP_STATE.playCode && MP_STATE.nickname) {
            navigator.sendBeacon('php/game.php', new URLSearchParams({
                action: 'leave',
                playCode: MP_STATE.playCode,
                nickname: MP_STATE.nickname
            }));
        }
        
        MP_STATE.playCode = null;
        MP_STATE.nickname = null;
        MP_STATE.isHost = false;
        MP_STATE.gameState = 'idle';
        MP_STATE.currentLevel = -1;
        MP_STATE.players = [];
        MP_STATE.consecutiveFailures = 0;
        MP_STATE.reconnectAttempts = 0;
        MP_STATE.pendingValidation = null;
        
        showHomepage();
    }
    
    // ========================================
    // EXPORTS
    // ========================================
    
    window.MP = {
        init: initMultiplayer,
        showHomepage: showHomepage,
        showCreateScreen: showCreateScreen,
        showJoinScreen: showJoinScreen,
        showTeacherPasswordScreen: showTeacherPasswordScreen,
        createGame: createGame,
        checkGameCode: checkGameCode,
        joinGame: joinGame,
        copyGameCode: copyGameCode,
        startGameAsHost: startGameAsHost,
        validateMultiplayerLevel: validateMultiplayerLevel,
        goToNextLevel: goToNextLevel,
        forceLevelComplete: forceLevelComplete,
        forceGoToNextLevel: forceGoToNextLevel,
        endGameAsHost: endGameAsHost,
        checkTeacherPassword: checkTeacherPassword,
        checkTeacherPasswordAuto: checkTeacherPasswordAuto,
        returnToHomepage: returnToHomepage
    };
    
    document.addEventListener('DOMContentLoaded', initMultiplayer);
    
})();
