<?php
// ============================================
// P-BLOCKS - GAME API (Gestion des parties multijoueur)
// Description: Gestion temps réel des sessions de jeu
// ============================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

// Configuration
define('SESSIONS_DIR', __DIR__ . '/data/sessions');
define('SESSION_TIMEOUT', 86400); // 24 heures
define('PING_TIMEOUT', 120); // 120 secondes
define('ACTIVE_PLAYER_THRESHOLD', 15); // 15 secondes pour être considéré actif

// Créer le dossier des sessions
if (!file_exists(SESSIONS_DIR)) {
    mkdir(SESSIONS_DIR, 0755, true);
}

// Nettoyer les anciennes sessions
cleanOldSessions();

// Récupérer l'action
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

// Router les actions
switch ($action) {
    case 'create':
        createGame();
        break;
    case 'join':
        joinGame();
        break;
    case 'leave':
        leaveGame();
        break;
    case 'start':
        startGame();
        break;
    case 'validate':
        validateLevel();
        break;
    case 'get_state':
        getGameState();
        break;
    case 'next_level':
        nextLevel();
        break;
    case 'force_level_complete':
        forceLevelComplete();
        break;
    case 'end_game':
        endGame();
        break;
    case 'get_animals':
        getUniqueAnimals();
        break;
    case 'check_game':
        checkGameExists();
        break;
    case 'check_level_timeout':
        checkLevelTimeout();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
        break;
}

// ========================================
// FONCTIONS DE JEU
// ========================================

function createGame() {
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    $numLevels = isset($_POST['numLevels']) ? intval($_POST['numLevels']) : 5;
    $maxSquares = isset($_POST['maxSquares']) ? intval($_POST['maxSquares']) : 5;
    $deviceId = isset($_POST['deviceId']) ? trim($_POST['deviceId']) : '';
    
    if (empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Pseudo requis']);
        return;
    }
    
    $numLevels = max(1, min(10, $numLevels));
    $maxSquares = max(2, min(5, $maxSquares));
    
    // Compte à rebours de fin de niveau (déclenché quand le premier joueur valide)
    $finishCountdown = isset($_POST['finishCountdown']) ? (int)$_POST['finishCountdown'] : 30;
    $finishCountdownEnabled = isset($_POST['finishCountdownEnabled']) ? ($_POST['finishCountdownEnabled'] === 'true') : true;
    $finishCountdown = max(30, min(120, $finishCountdown));
    
    $playCode = generateUniqueCode();
    
    $session = [
        'playCode' => $playCode,
        'hostNickname' => $nickname,
        'hostDeviceId' => $deviceId,
        'state' => 'waiting',
        'numLevels' => $numLevels,
        'maxSquares' => $maxSquares,
        'finishCountdown' => $finishCountdown,
        'finishCountdownEnabled' => $finishCountdownEnabled,
        'currentLevel' => -1,
        'levels' => [],
        'players' => [[
            'nickname' => $nickname,
            'deviceId' => $deviceId,
            'score' => 0,
            'isHost' => true,
            'connected' => true,
            'lastPing' => time(),
            'joinedAt' => time(),
            'levelResults' => []
        ]],
        'levelStartTime' => null,
        'levelCompleted' => false,
        'levelCompletedTime' => null,
        'firstValidationTime' => null,
        'createdAt' => time(),
        'deviceAnimals' => [],
        'pendingAnimals' => []
    ];
    
    saveSession($playCode, $session);
    
    echo json_encode([
        'success' => true,
        'playCode' => $playCode,
        'nickname' => $nickname
    ]);
}

function joinGame() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    $deviceId = isset($_POST['deviceId']) ? trim($_POST['deviceId']) : '';
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    $session = loadSession($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Code de partie invalide']);
        return;
    }
    
    if ($session['state'] !== 'waiting') {
        echo json_encode(['success' => false, 'message' => 'La partie a déjà commencé']);
        return;
    }
    
    $playerExists = false;
    foreach ($session['players'] as &$player) {
        if ($player['nickname'] === $nickname) {
            $playerExists = true;
            $player['lastPing'] = time();
            $player['connected'] = true;
            $player['deviceId'] = $deviceId;
            break;
        }
    }
    unset($player);
    
    if (!$playerExists) {
        $session['players'][] = [
            'nickname' => $nickname,
            'deviceId' => $deviceId,
            'score' => 0,
            'isHost' => false,
            'connected' => true,
            'lastPing' => time(),
            'joinedAt' => time(),
            'levelResults' => []
        ];
    }
    
    saveSession($playCode, $session);
    echo json_encode(['success' => true, 'nickname' => $nickname]);
}

function leaveGame() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode) || empty($nickname)) return;
    
    $session = loadSession($playCode);
    if (!$session) return;
    
    foreach ($session['players'] as &$player) {
        if ($player['nickname'] === $nickname) {
            $player['connected'] = false;
            break;
        }
    }
    unset($player);
    
    saveSession($playCode, $session);
    echo json_encode(['success' => true]);
}

function startGame() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    if ($session['hostNickname'] !== $nickname) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Seul l\'hôte peut démarrer']);
        return;
    }
    
    $session['levels'] = generateLevels($session['numLevels'], $session['maxSquares']);
    $session['state'] = 'countdown';
    $session['countdownStartTime'] = time();
    $session['currentLevel'] = 0;
    $session['levelStartTime'] = null;
    $session['levelCompleted'] = false;
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true]);
}

function validateLevel() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    $levelIndex = isset($_POST['levelIndex']) ? intval($_POST['levelIndex']) : -1;
    $gridState = isset($_POST['gridState']) ? $_POST['gridState'] : '';
    $blockCount = isset($_POST['blockCount']) ? intval($_POST['blockCount']) : 0;
    $timeSpent = isset($_POST['timeSpent']) ? intval($_POST['timeSpent']) : 0;
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    $playerIndex = -1;
    foreach ($session['players'] as $idx => $player) {
        if ($player['nickname'] === $nickname) {
            $playerIndex = $idx;
            break;
        }
    }
    
    if ($playerIndex === -1) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Joueur non trouvé']);
        return;
    }
    
    if ($levelIndex !== $session['currentLevel']) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Niveau incorrect']);
        return;
    }
    
    if (isset($session['players'][$playerIndex]['levelResults'][$levelIndex])) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => true, 'alreadyValidated' => true]);
        return;
    }
    
    $level = $session['levels'][$levelIndex];
    $targetGrid = $level['targetGrid'];
    $studentGrid = json_decode($gridState, true);
    
    $isCorrect = compareGrids($studentGrid, $targetGrid);
    
    $points = 0;
    $isOptimal = false;
    
    if ($isCorrect) {
        // Points de base: 1000 - (temps en ms / 100), min 100
        $points = max(100, 1000 - floor($timeSpent / 100));
        
        $expectedBlocks = $level['expectedBlocks'];
        if ($blockCount < $expectedBlocks) {
            $points += 200;
            $isOptimal = true;
        } else if ($blockCount === $expectedBlocks) {
            $points += 100;
        }
    }
    
    $session['players'][$playerIndex]['levelResults'][$levelIndex] = [
        'correct' => $isCorrect,
        'timeSpent' => $timeSpent,
        'blockCount' => $blockCount,
        'points' => $points,
        'isOptimal' => $isOptimal,
        'timestamp' => time()
    ];
    
    if ($isCorrect) {
        $session['players'][$playerIndex]['score'] += $points;

        // Décompte déclenché uniquement sur validation correcte
        if (!isset($session['firstValidationTime']) || $session['firstValidationTime'] === null) {
            $session['firstValidationTime'] = time();
        }
    }

    $session['players'][$playerIndex]['lastPing'] = time();
    $session['players'][$playerIndex]['connected'] = true;
    
    checkAndCompleteLevelIfAllDone($session, $levelIndex);
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode([
        'success' => true,
        'correct' => $isCorrect,
        'points' => $points,
        'isOptimal' => $isOptimal
    ]);
}

function checkAndCompleteLevelIfAllDone(&$session, $levelIndex) {
    if ($session['levelCompleted']) return false;
    
    $allDone = true;
    $activeCount = 0;
    
    foreach ($session['players'] as $player) {
        $isActive = $player['connected'] && (time() - $player['lastPing'] < ACTIVE_PLAYER_THRESHOLD);
        
        if ($isActive) {
            $activeCount++;
            if (!isset($player['levelResults'][$levelIndex])) {
                $allDone = false;
            }
        }
    }
    
    if ($allDone && $activeCount > 0) {
        $session['levelCompleted'] = true;
        $session['levelCompletedTime'] = time();
        return true;
    }
    
    // Vérifier si le compte à rebours de fin est activé et expiré
    $finishCountdownEnabled = $session['finishCountdownEnabled'] ?? true;
    $firstValidationTime = $session['firstValidationTime'] ?? null;
    $finishCountdown = $session['finishCountdown'] ?? 30;
    
    if ($finishCountdownEnabled && $firstValidationTime !== null && $activeCount > 0) {
        $elapsed = time() - $firstValidationTime;
        if ($elapsed >= $finishCountdown) {
            $session['levelCompleted'] = true;
            $session['levelCompletedTime'] = time();
            return true;
        }
    }
    
    return false;
}

// Force la clôture du niveau courant sans avancer (l'hôte déblocage si jeu coincé)
function forceLevelComplete() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    if ($session['hostNickname'] !== $nickname) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Seul l\'hôte peut forcer']);
        return;
    }
    
    $session['levelCompleted'] = true;
    $session['levelCompletedTime'] = time();
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true]);
}

function nextLevel() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    if (!empty($nickname) && $session['hostNickname'] !== $nickname) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Seul l\'hôte peut passer au niveau suivant']);
        return;
    }
    
    $session['currentLevel']++;
    
    if ($session['currentLevel'] >= $session['numLevels']) {
        $session['state'] = 'finished';
    } else {
        $session['levelStartTime'] = time();
        $session['levelCompleted'] = false;
        $session['levelCompletedTime'] = null;
        $session['firstValidationTime'] = null;
    }
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true]);
}

function endGame() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    if ($session['hostNickname'] !== $nickname) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Seul l\'hôte peut terminer']);
        return;
    }
    
    $session['state'] = 'finished';
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true, 'finalResults' => calculateFinalResults($session)]);
}

function getGameState() {
    $playCode = isset($_GET['playCode']) ? strtoupper(trim($_GET['playCode'])) : '';
    $nickname = isset($_GET['nickname']) ? trim($_GET['nickname']) : '';
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    $playerExists = false;
    $playerIndex = -1;
    
    foreach ($session['players'] as $index => $player) {
        if ($player['nickname'] === $nickname) {
            $playerExists = true;
            $playerIndex = $index;
            break;
        }
    }
    
    if (!$playerExists) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Joueur non trouvé', 'kicked' => true]);
        return;
    }
    
    $session['players'][$playerIndex]['lastPing'] = time();
    $session['players'][$playerIndex]['connected'] = true;
    
    // Gestion du countdown
    if ($session['state'] === 'countdown') {
        $elapsed = time() - $session['countdownStartTime'];
        if ($elapsed >= 4) {
            $session['state'] = 'playing';
            $session['levelStartTime'] = time();
        }
    }
    
    checkAndForceLevelCompletion($session);
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    $response = [
        'success' => true,
        'state' => $session['state'],
        'players' => getConnectedPlayers($session),
        'currentLevel' => $session['currentLevel'],
        'numLevels' => $session['numLevels'],
        'isHost' => ($session['hostNickname'] === $nickname),
        'hostNickname' => $session['hostNickname'],
        'levelCompleted' => $session['levelCompleted'] ?? false,
        'firstValidationTime' => $session['firstValidationTime'] ?? null,
        'finishCountdown' => $session['finishCountdown'] ?? 30,
        'finishCountdownEnabled' => $session['finishCountdownEnabled'] ?? true
    ];
    
    if ($session['state'] === 'countdown') {
        $response['countdownStartTime'] = $session['countdownStartTime'];
    }
    
    if (($session['state'] === 'playing' || $session['state'] === 'countdown') && $session['currentLevel'] >= 0) {
        $levelIdx = $session['currentLevel'];
        if (isset($session['levels'][$levelIdx])) {
            $level = $session['levels'][$levelIdx];
            $response['level'] = [
                'index' => $levelIdx,
                'targetGrid' => $level['targetGrid'],
                'expectedBlocks' => $level['expectedBlocks'],
                'startTime' => $session['levelStartTime']
            ];
        }
    }
    
    if ($session['levelCompleted'] && $session['currentLevel'] >= 0) {
        $response['levelResults'] = calculateLevelResults($session, $session['currentLevel']);
    }
    
    if ($session['state'] === 'finished') {
        $response['finalResults'] = calculateFinalResults($session);
    }
    
    echo json_encode($response);
}

function checkAndForceLevelCompletion(&$session) {
    if ($session['levelCompleted'] || $session['state'] !== 'playing') return false;
    return checkAndCompleteLevelIfAllDone($session, $session['currentLevel']);
}

function checkLevelTimeout() {
    $playCode = isset($_GET['playCode']) ? strtoupper(trim($_GET['playCode'])) : '';
    $nickname = isset($_GET['nickname']) ? trim($_GET['nickname']) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
        return;
    }
    
    $session = loadSession($playCode);
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    if (!empty($nickname)) {
        foreach ($session['players'] as &$player) {
            if ($player['nickname'] === $nickname) {
                $player['lastPing'] = time();
                $player['connected'] = true;
                break;
            }
        }
        unset($player);
    }
    
    checkAndForceLevelCompletion($session);
    saveSession($playCode, $session);
    
    $response = [
        'success' => true,
        'levelCompleted' => $session['levelCompleted'] ?? false
    ];
    
    if ($session['levelCompleted'] && $session['currentLevel'] >= 0) {
        $response['results'] = calculateLevelResults($session, $session['currentLevel']);
    }
    
    echo json_encode($response);
}

function checkGameExists() {
    $playCode = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'exists' => false]);
        return;
    }
    
    $session = loadSession($playCode);
    
    if ($session) {
        echo json_encode([
            'success' => true,
            'exists' => true,
            'state' => $session['state'],
            'numLevels' => $session['numLevels'],
            'playerCount' => count($session['players'])
        ]);
    } else {
        echo json_encode(['success' => true, 'exists' => false]);
    }
}

function getUniqueAnimals() {
    $ALL_ANIMALS = [
        '🦁 Lion', '🐯 Tigre', '🐻 Ours', '🐼 Panda', '🦊 Renard',
        '🐺 Loup', '🦝 Raton', '🐨 Koala', '🐹 Hamster', '🐰 Lapin',
        '🦔 Hérisson', '🐿️ Écureuil', '🦫 Castor', '🦘 Kangourou', '🦙 Lama',
        '🦒 Girafe', '🦏 Rhino', '🦛 Hippo', '🐘 Éléphant', '🐆 Léopard',
        '🦓 Zèbre', '🦌 Cerf', '🐄 Vache', '🐎 Cheval', '🐖 Cochon',
        '🐑 Mouton', '🐐 Chèvre', '🐕 Chien', '🐈 Chat', '🐇 Lapinou',
        '🐋 Baleine', '🐬 Dauphin', '🦈 Requin', '🐙 Pieuvre', '🦑 Calmar',
        '🦀 Crabe', '🦞 Homard', '🐠 Poisson', '🐢 Tortue', '🦭 Phoque',
        '🦅 Aigle', '🦉 Hibou', '🦚 Paon', '🐧 Pingouin', '🦢 Cygne',
        '🦜 Perroquet', '🦩 Flamant', '🐓 Coq', '🦆 Canard', '🦇 Chauve',
        '🐝 Abeille', '🦋 Papillon', '🐌 Escargot', '🐞 Coccinelle', '🦗 Criquet',
        '🕷️ Araignée', '🦂 Scorpion', '🐜 Fourmi', '🐍 Serpent', '🐸 Grenouille',
        '🦎 Lézard', '🐊 Croco', '🦕 Diplo', '🦖 T-Rex', '🐉 Dragon',
        '🦄 Licorne', '🐲 Dragon2', '🦓 Okapi', '🦘 Wallaby', '🦙 Alpaga'
    ];
    
    $playCode = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';
    $deviceId = isset($_GET['deviceId']) ? trim($_GET['deviceId']) : '';
    
    if (empty($playCode)) {
        shuffle($ALL_ANIMALS);
        echo json_encode(['success' => true, 'animals' => array_slice($ALL_ANIMALS, 0, 3)]);
        return;
    }
    
    $sessionFile = SESSIONS_DIR . '/' . $playCode . '.json';
    
    if (!file_exists($sessionFile)) {
        shuffle($ALL_ANIMALS);
        echo json_encode(['success' => true, 'animals' => array_slice($ALL_ANIMALS, 0, 3)]);
        return;
    }
    
    $fp = fopen($sessionFile, 'r+');
    if (!$fp || !flock($fp, LOCK_EX)) {
        shuffle($ALL_ANIMALS);
        echo json_encode(['success' => true, 'animals' => array_slice($ALL_ANIMALS, 0, 3)]);
        return;
    }
    
    $content = stream_get_contents($fp);
    $session = json_decode($content, true);
    
    $deviceHash = md5($playCode . '|' . ($deviceId ?: $_SERVER['REMOTE_ADDR']));
    
    $deviceAnimals = $session['deviceAnimals'] ?? [];
    
    if (isset($deviceAnimals[$deviceHash])) {
        $selected = $deviceAnimals[$deviceHash]['animals'];
        $confirmedAnimals = array_map(function($p) { return $p['nickname']; }, $session['players']);
        $stillAvailable = array_values(array_diff($selected, $confirmedAnimals));
        
        if (count($stillAvailable) > 0) {
            flock($fp, LOCK_UN);
            fclose($fp);
            echo json_encode(['success' => true, 'animals' => $stillAvailable]);
            return;
        }
    }
    
    $confirmedAnimals = array_map(function($p) { return $p['nickname']; }, $session['players']);
    $pendingReservations = $session['pendingAnimals'] ?? [];
    
    $now = time();
    $validReservations = [];
    foreach ($pendingReservations as $animal => $timestamp) {
        if (($now - $timestamp) < 60) {
            $validReservations[$animal] = $timestamp;
        }
    }
    
    $unavailable = array_merge($confirmedAnimals, array_keys($validReservations));
    $available = array_values(array_diff($ALL_ANIMALS, $unavailable));
    
    if (count($available) < 3) {
        $available = array_values(array_diff($ALL_ANIMALS, $confirmedAnimals));
    }
    
    shuffle($available);
    $selected = array_slice($available, 0, 3);
    
    foreach ($selected as $animal) {
        $validReservations[$animal] = $now;
    }
    $session['pendingAnimals'] = $validReservations;
    
    $deviceAnimals[$deviceHash] = ['animals' => $selected, 'timestamp' => $now];
    $session['deviceAnimals'] = $deviceAnimals;
    
    fseek($fp, 0);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($session, JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    echo json_encode(['success' => true, 'animals' => $selected]);
}

// ========================================
// GÉNÉRATION DE NIVEAUX
// ========================================

function generateLevels($numLevels, $maxSquares) {
    $levels = [];
    
    for ($i = 0; $i < $numLevels; $i++) {
        $numSquares = rand(2, $maxSquares);
        $pattern = generatePattern($numSquares, $i);
        
        $levels[] = [
            'targetGrid' => $pattern['grid'],
            'expectedBlocks' => $pattern['expectedBlocks'],
            'patternType' => $pattern['type']
        ];
    }
    
    return $levels;
}

function generatePattern($numSquares, $seed = 0) {
    $patternTypes = ['symmetric', 'geometric', 'letter', 'object', 'random_art'];
    $type = $patternTypes[($seed + rand(0, 100)) % count($patternTypes)];
    
    $grid = array_fill(0, 10, array_fill(0, 10, 'white'));
    $positions = [];
    
    switch ($type) {
        case 'symmetric':
            $positions = generateSymmetricPattern($numSquares);
            break;
        case 'geometric':
            $positions = generateGeometricPattern($numSquares);
            break;
        case 'letter':
            $positions = generateLetterPattern($numSquares);
            break;
        case 'object':
            $positions = generateObjectPattern($numSquares);
            break;
        default:
            $positions = generateRandomArtPattern($numSquares);
    }
    
    $colors = ['red', 'blue', 'green', 'yellow', 'pink', 'black'];
    $chosenColor = $colors[array_rand($colors)];
    
    foreach ($positions as $pos) {
        if ($pos['y'] >= 0 && $pos['y'] < 10 && $pos['x'] >= 0 && $pos['x'] < 10) {
            $grid[$pos['y']][$pos['x']] = $chosenColor;
        }
    }
    
    // Calcul plus réaliste de expectedBlocks :
    // - 1 bloc couleur minimum
    // - Environ 2 blocs par case (mouvement + action)
    // - Quelques blocs de rotation
    $numPositions = count($positions);
    $expectedBlocks = max(5, $numPositions * 2 + 3);
    
    return [
        'grid' => $grid,
        'expectedBlocks' => $expectedBlocks,
        'type' => $type
    ];
}

function generateSymmetricPattern($numSquares) {
    $positions = [];
    $halfSquares = ceil($numSquares / 2);
    $placed = 0;
    
    while ($placed < $halfSquares && count($positions) < $numSquares) {
        $x = rand(0, 4);
        $y = rand(0, 9);
        
        $alreadyExists = false;
        foreach ($positions as $p) {
            if ($p['x'] == $x && $p['y'] == $y) {
                $alreadyExists = true;
                break;
            }
        }
        
        if (!$alreadyExists) {
            $positions[] = ['x' => $x, 'y' => $y];
            $symX = 9 - $x;
            if ($symX != $x && count($positions) < $numSquares) {
                $positions[] = ['x' => $symX, 'y' => $y];
            }
            $placed++;
        }
    }
    
    return array_slice($positions, 0, $numSquares);
}

function generateGeometricPattern($numSquares) {
    $shapes = ['line_h', 'line_v', 'line_diag', 'square', 'l_shape', 't_shape', 'cross', 'stairs'];
    $shape = $shapes[array_rand($shapes)];
    
    $positions = [];
    $startX = rand(1, 5);
    $startY = rand(1, 5);
    
    switch ($shape) {
        case 'line_h':
            for ($i = 0; $i < $numSquares; $i++) {
                $positions[] = ['x' => min(9, $startX + $i), 'y' => $startY];
            }
            break;
        case 'line_v':
            for ($i = 0; $i < $numSquares; $i++) {
                $positions[] = ['x' => $startX, 'y' => min(9, $startY + $i)];
            }
            break;
        case 'line_diag':
            for ($i = 0; $i < $numSquares; $i++) {
                $positions[] = ['x' => min(9, $startX + $i), 'y' => min(9, $startY + $i)];
            }
            break;
        case 'square':
            $size = ceil(sqrt($numSquares));
            $count = 0;
            for ($dy = 0; $dy < $size && $count < $numSquares; $dy++) {
                for ($dx = 0; $dx < $size && $count < $numSquares; $dx++) {
                    $positions[] = ['x' => min(9, $startX + $dx), 'y' => min(9, $startY + $dy)];
                    $count++;
                }
            }
            break;
        case 'l_shape':
            $vLength = ceil($numSquares / 2);
            for ($i = 0; $i < $vLength; $i++) {
                $positions[] = ['x' => $startX, 'y' => min(9, $startY + $i)];
            }
            $hLength = $numSquares - $vLength;
            for ($i = 1; $i <= $hLength; $i++) {
                $positions[] = ['x' => min(9, $startX + $i), 'y' => min(9, $startY + $vLength - 1)];
            }
            break;
        case 't_shape':
            $topLength = ceil($numSquares / 2);
            $startTopX = max(0, $startX - floor($topLength / 2));
            for ($i = 0; $i < $topLength; $i++) {
                $x = min(9, $startTopX + $i);
                $positions[] = ['x' => $x, 'y' => $startY];
            }
            $vLength = $numSquares - $topLength;
            for ($i = 1; $i <= $vLength; $i++) {
                $positions[] = ['x' => $startX, 'y' => min(9, $startY + $i)];
            }
            break;
        case 'cross':
            $positions[] = ['x' => $startX, 'y' => $startY];
            $remaining = $numSquares - 1;
            $arms = ceil($remaining / 4);
            for ($i = 1; $i <= $arms && count($positions) < $numSquares; $i++) {
                if (count($positions) < $numSquares) $positions[] = ['x' => $startX, 'y' => max(0, $startY - $i)];
                if (count($positions) < $numSquares) $positions[] = ['x' => $startX, 'y' => min(9, $startY + $i)];
                if (count($positions) < $numSquares) $positions[] = ['x' => max(0, $startX - $i), 'y' => $startY];
                if (count($positions) < $numSquares) $positions[] = ['x' => min(9, $startX + $i), 'y' => $startY];
            }
            break;
        case 'stairs':
            for ($i = 0; $i < $numSquares; $i++) {
                $positions[] = ['x' => min(9, $startX + $i), 'y' => min(9, $startY + floor($i / 2))];
            }
            break;
    }
    
    return array_slice($positions, 0, $numSquares);
}

function generateLetterPattern($numSquares) {
    $letters = [
        'I' => [[0,0], [0,1], [0,2], [0,3]],
        'L' => [[0,0], [0,1], [0,2], [1,2]],
        'T' => [[0,0], [1,0], [2,0], [1,1], [1,2]],
        'O' => [[0,0], [1,0], [2,0], [0,1], [2,1], [0,2], [1,2], [2,2]],
        'C' => [[1,0], [0,0], [0,1], [0,2], [1,2]],
        'U' => [[0,0], [0,1], [0,2], [1,2], [2,2], [2,1], [2,0]],
        'V' => [[0,0], [0,1], [1,2], [2,1], [2,0]],
        'X' => [[0,0], [2,0], [1,1], [0,2], [2,2]],
        'Z' => [[0,0], [1,0], [1,1], [1,2], [2,2]],
        'S' => [[1,0], [0,0], [0,1], [1,1], [1,2], [0,2]],
        'F' => [[0,0], [1,0], [0,1], [1,1], [0,2]],
        'E' => [[0,0], [1,0], [0,1], [1,1], [0,2], [1,2]],
        'H' => [[0,0], [0,1], [0,2], [1,1], [2,0], [2,1], [2,2]],
        'N' => [[0,0], [0,1], [0,2], [1,1], [2,0], [2,1], [2,2]],
        'P' => [[0,0], [0,1], [0,2], [1,0], [1,1]],
        'J' => [[1,0], [1,1], [1,2], [0,2]],
        'Y' => [[0,0], [1,1], [2,0], [1,2]],
        'K' => [[0,0], [0,1], [0,2], [1,1], [2,0], [2,2]]
    ];
    
    $suitable = [];
    foreach ($letters as $name => $coords) {
        if (count($coords) <= $numSquares + 1 && count($coords) >= $numSquares - 1) {
            $suitable[$name] = $coords;
        }
    }
    
    if (empty($suitable)) $suitable = $letters;
    
    $letterName = array_rand($suitable);
    $coords = $suitable[$letterName];
    
    $offsetX = rand(2, 5);
    $offsetY = rand(2, 5);
    
    $positions = [];
    foreach ($coords as $coord) {
        $positions[] = ['x' => $coord[0] + $offsetX, 'y' => $coord[1] + $offsetY];
    }
    
    return array_slice($positions, 0, $numSquares);
}

function generateObjectPattern($numSquares) {
    $objects = [
        'heart' => [[1,0], [3,0], [0,1], [2,1], [4,1], [0,2], [4,2], [1,3], [3,3], [2,4]],
        'arrow_up' => [[2,0], [1,1], [2,1], [3,1], [2,2], [2,3], [2,4]],
        'arrow_right' => [[4,2], [3,1], [3,2], [3,3], [2,2], [1,2], [0,2]],
        'star' => [[2,0], [2,1], [0,2], [1,2], [2,2], [3,2], [4,2], [2,3], [2,4], [1,3], [3,3]],
        'plus' => [[2,0], [2,1], [0,2], [1,2], [2,2], [3,2], [4,2], [2,3], [2,4]],
        'diamond' => [[2,0], [1,1], [3,1], [0,2], [4,2], [1,3], [3,3], [2,4]],
        'house' => [[2,0], [1,1], [3,1], [0,2], [1,2], [2,2], [3,2], [4,2], [1,3], [3,3], [1,4], [3,4]],
        'tree' => [[2,0], [1,1], [2,1], [3,1], [0,2], [1,2], [2,2], [3,2], [4,2], [2,3], [2,4]],
        'boat' => [[2,0], [2,1], [0,2], [1,2], [2,2], [3,2], [4,2], [1,3], [2,3], [3,3]],
        'fish' => [[0,2], [1,1], [1,2], [1,3], [2,2], [3,1], [3,2], [3,3], [4,2]],
        'cup' => [[0,0], [2,0], [0,1], [1,1], [2,1], [3,1], [1,2], [1,3]],
        'flag' => [[0,0], [1,0], [2,0], [0,1], [1,1], [0,2], [0,3], [0,4]],
        'check' => [[0,2], [1,3], [2,2], [3,1], [4,0]]
    ];
    
    $suitable = [];
    foreach ($objects as $name => $coords) {
        if (count($coords) >= $numSquares - 2 && count($coords) <= $numSquares + 2) {
            $suitable[$name] = $coords;
        }
    }
    
    if (empty($suitable)) $suitable = $objects;
    
    $objectName = array_rand($suitable);
    $coords = $suitable[$objectName];
    
    shuffle($coords);
    $coords = array_slice($coords, 0, $numSquares);
    
    $offsetX = rand(2, 4);
    $offsetY = rand(2, 4);
    
    $positions = [];
    foreach ($coords as $coord) {
        $positions[] = ['x' => min(9, $coord[0] + $offsetX), 'y' => min(9, $coord[1] + $offsetY)];
    }
    
    return $positions;
}

function generateRandomArtPattern($numSquares) {
    $positions = [];
    $placed = 0;
    $attempts = 0;
    
    $startX = rand(2, 7);
    $startY = rand(2, 7);
    $positions[] = ['x' => $startX, 'y' => $startY];
    $placed++;
    
    while ($placed < $numSquares && $attempts < 100) {
        $base = $positions[array_rand($positions)];
        $dirs = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [-1,-1], [1,-1], [-1,1]];
        shuffle($dirs);
        
        foreach ($dirs as $dir) {
            $newX = $base['x'] + $dir[0];
            $newY = $base['y'] + $dir[1];
            
            if ($newX >= 0 && $newX < 10 && $newY >= 0 && $newY < 10) {
                $exists = false;
                foreach ($positions as $p) {
                    if ($p['x'] == $newX && $p['y'] == $newY) {
                        $exists = true;
                        break;
                    }
                }
                
                if (!$exists) {
                    $positions[] = ['x' => $newX, 'y' => $newY];
                    $placed++;
                    break;
                }
            }
        }
        
        $attempts++;
    }
    
    return array_slice($positions, 0, $numSquares);
}

// ========================================
// CALCUL DES RÉSULTATS
// ========================================

function calculateLevelResults($session, $levelIndex) {
    $results = [];
    
    foreach ($session['players'] as $player) {
        if (isset($player['levelResults'][$levelIndex])) {
            $lr = $player['levelResults'][$levelIndex];
            $results[] = [
                'nickname' => $player['nickname'],
                'correct' => $lr['correct'],
                'timeSpent' => $lr['timeSpent'],
                'blockCount' => $lr['blockCount'],
                'points' => $lr['points'],
                'isOptimal' => $lr['isOptimal'] ?? false
            ];
        } else {
            $isActive = $player['connected'] && (time() - $player['lastPing'] < ACTIVE_PLAYER_THRESHOLD);
            $results[] = [
                'nickname' => $player['nickname'],
                'correct' => false,
                'timeSpent' => 0,
                'blockCount' => 0,
                'points' => 0,
                'notFinished' => true,
                'disconnected' => !$isActive
            ];
        }
    }
    
    usort($results, function($a, $b) {
        if ($a['points'] != $b['points']) {
            return $b['points'] - $a['points'];
        }
        return $a['timeSpent'] - $b['timeSpent'];
    });
    
    $top3 = array_slice($results, 0, 3);
    
    $correctResults = array_filter($results, function($r) { return $r['correct']; });
    usort($correctResults, function($a, $b) { return $a['timeSpent'] - $b['timeSpent']; });
    $top5Fastest = array_slice(array_values($correctResults), 0, 5);
    
    return [
        'levelIndex' => $levelIndex,
        'top3' => $top3,
        'top5Fastest' => $top5Fastest,
        'allResults' => $results,
        'totalPlayers' => count($session['players'])
    ];
}

function calculateFinalResults($session) {
    $players = [];
    
    foreach ($session['players'] as $player) {
        $levelsCompleted = 0;
        $totalTime = 0;
        
        foreach ($player['levelResults'] as $lr) {
            if ($lr['correct']) {
                $levelsCompleted++;
                $totalTime += $lr['timeSpent'];
            }
        }
        
        $players[] = [
            'nickname' => $player['nickname'],
            'score' => $player['score'],
            'levelsCompleted' => $levelsCompleted,
            'totalTime' => $totalTime,
            'isHost' => $player['isHost']
        ];
    }
    
    usort($players, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    return [
        'players' => $players,
        'numLevels' => $session['numLevels']
    ];
}

function compareGrids($grid1, $grid2) {
    if (!is_array($grid1) || !is_array($grid2)) {
        error_log("compareGrids: Une des grilles n'est pas un tableau");
        return false;
    }
    
    $differences = [];
    
    for ($y = 0; $y < 10; $y++) {
        for ($x = 0; $x < 10; $x++) {
            $c1 = isset($grid1[$y][$x]) ? $grid1[$y][$x] : 'white';
            $c2 = isset($grid2[$y][$x]) ? $grid2[$y][$x] : 'white';
            if ($c1 !== $c2) {
                $differences[] = "[$y][$x]: student='$c1' vs target='$c2'";
            }
        }
    }
    
    if (count($differences) > 0) {
        error_log("compareGrids: " . count($differences) . " différences trouvées");
        error_log("Premières différences: " . implode(", ", array_slice($differences, 0, 5)));
        return false;
    }
    
    return true;
}

function getConnectedPlayers($session) {
    $connected = [];
    
    foreach ($session['players'] as $player) {
        $isActive = $player['connected'] && (time() - $player['lastPing'] < PING_TIMEOUT);
        $connected[] = [
            'nickname' => $player['nickname'],
            'score' => $player['score'],
            'isHost' => $player['isHost'],
            'connected' => $isActive
        ];
    }
    
    return $connected;
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function generateUniqueCode() {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $attempts = 0;
    
    do {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[rand(0, strlen($chars) - 1)];
        }
        $attempts++;
    } while (file_exists(SESSIONS_DIR . '/' . $code . '.json') && $attempts < 100);
    
    return $code;
}

function loadSession($playCode) {
    $playCode = strtoupper(trim($playCode));
    $file = SESSIONS_DIR . '/' . $playCode . '.json';
    
    if (!file_exists($file)) return null;
    
    $content = @file_get_contents($file);
    if ($content === false) return null;
    
    return json_decode($content, true);
}

function loadSessionForUpdate($playCode) {
    $playCode = strtoupper(trim($playCode));
    $file = SESSIONS_DIR . '/' . $playCode . '.json';
    
    if (!file_exists($file)) return [null, null];
    
    $fp = @fopen($file, 'r+');
    if (!$fp) return [null, null];
    
    $lockAcquired = false;
    $startTime = time();
    while (!$lockAcquired && (time() - $startTime) < 5) {
        if (flock($fp, LOCK_EX | LOCK_NB)) {
            $lockAcquired = true;
        } else {
            usleep(50000);
        }
    }
    
    if (!$lockAcquired) flock($fp, LOCK_EX);
    
    $content = stream_get_contents($fp);
    if (empty($content)) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return [null, null];
    }
    
    $data = json_decode($content, true);
    if ($data === null) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return [null, null];
    }
    
    return [$data, $fp];
}

function saveSessionAndUnlock($playCode, $session, $fp = null) {
    $playCode = strtoupper(trim($playCode));
    $file = SESSIONS_DIR . '/' . $playCode . '.json';
    
    $content = json_encode($session, JSON_PRETTY_PRINT);
    
    if ($fp) {
        fseek($fp, 0);
        ftruncate($fp, 0);
        fwrite($fp, $content);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    } else {
        $tmpFile = $file . '.tmp.' . getmypid();
        if (file_put_contents($tmpFile, $content) !== false) {
            rename($tmpFile, $file);
        }
    }
}

function saveSession($playCode, $session) {
    saveSessionAndUnlock($playCode, $session, null);
}

function cleanOldSessions() {
    $files = glob(SESSIONS_DIR . '/*.json');
    $now = time();
    $deletedCount = 0;
    
    foreach ($files as $file) {
        $fileAge = $now - filemtime($file);
        $shouldDelete = false;
        
        // Règle 1: Supprimer toutes les sessions de plus de 24 heures
        if ($fileAge > SESSION_TIMEOUT) {
            $shouldDelete = true;
        }
        // Règle 2: Supprimer les sessions inactives de plus de 2 heures
        elseif ($fileAge > 7200) {
            $shouldDelete = true;
        }
        // Règle 3: Vérifier si la session est terminée ou vide
        else {
            $content = @file_get_contents($file);
            if ($content) {
                $session = json_decode($content, true);
                if ($session) {
                    // Supprimer les parties terminées après 15 minutes
                    if (isset($session['state']) && $session['state'] === 'finished' && $fileAge > 900) {
                        $shouldDelete = true;
                    }
                    // Supprimer les parties sans joueurs après 5 minutes
                    elseif (isset($session['players']) && count($session['players']) === 0 && $fileAge > 300) {
                        $shouldDelete = true;
                    }
                }
            } else {
                // Fichier illisible, supprimer après 10 minutes
                if ($fileAge > 600) {
                    $shouldDelete = true;
                }
            }
        }
        
        if ($shouldDelete) {
            @unlink($file);
            $deletedCount++;
        }
    }
    
    return $deletedCount;
}
?>
