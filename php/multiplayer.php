<?php
// ============================================
// P-BLOCKS - MULTIPLAYER API
// Description: Gestion temps réel des parties multijoueur
// Inspiré de Qwest pour la robustesse
// ============================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

// Configuration
define('SESSIONS_DIR', __DIR__ . '/data/multiplayer_sessions');
define('SESSION_TIMEOUT', 1800); // 30 minutes
define('PING_TIMEOUT', 120); // 120 secondes
define('ACTIVE_PLAYER_THRESHOLD', 60); // 60 secondes pour être considéré actif
define('LEVEL_TIMEOUT_GRACE', 5); // 5 secondes de grâce après le timeout

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
    
    case 'get_state':
        getGameState();
        break;
    
    case 'validate':
        validateLevel();
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
    
    case 'check_level_completion':
        checkLevelCompletion();
        break;
    
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Action non reconnue'
        ]);
        break;
}

// ========================================
// FONCTIONS DE JEU
// ========================================

/**
 * Créer une nouvelle partie
 */
function createGame() {
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    $numLevels = isset($_POST['numLevels']) ? intval($_POST['numLevels']) : 5;
    $maxSquares = isset($_POST['maxSquares']) ? intval($_POST['maxSquares']) : 5;
    $deviceId = isset($_POST['deviceId']) ? trim($_POST['deviceId']) : '';
    
    if (empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Pseudo requis']);
        return;
    }
    
    // Limiter les valeurs
    $numLevels = max(1, min(10, $numLevels));
    $maxSquares = max(2, min(8, $maxSquares));
    
    // Générer un code unique
    $playCode = generatePlayCode();
    
    // Créer la session
    $session = [
        'playCode' => $playCode,
        'hostNickname' => $nickname,
        'hostDeviceId' => $deviceId,
        'numLevels' => $numLevels,
        'maxSquares' => $maxSquares,
        'state' => 'waiting', // waiting, playing, finished
        'currentLevel' => -1,
        'levels' => [],
        'players' => [
            [
                'nickname' => $nickname,
                'deviceId' => $deviceId,
                'score' => 0,
                'isHost' => true,
                'connected' => true,
                'lastPing' => time(),
                'joinedAt' => time(),
                'levelResults' => []
            ]
        ],
        'deviceAnimals' => [],
        'pendingAnimals' => [],
        'levelStartTime' => null,
        'levelCompleted' => false,
        'createdAt' => time()
    ];
    
    saveSession($playCode, $session);
    
    echo json_encode([
        'success' => true,
        'playCode' => $playCode,
        'message' => 'Partie créée'
    ]);
}

/**
 * Rejoindre une partie
 */
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
    
    // Vérifier si le pseudo existe déjà
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
    echo json_encode(['success' => true]);
}

/**
 * Quitter une partie
 */
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

/**
 * Démarrer une partie
 */
function startGame() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    $levels = isset($_POST['levels']) ? json_decode($_POST['levels'], true) : [];
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Partie introuvable']);
        return;
    }
    
    // Vérifier que c'est l'hôte
    if ($session['hostNickname'] !== $nickname) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Seul l\'hôte peut lancer la partie']);
        return;
    }
    
    // Stocker les niveaux générés côté client
    $session['levels'] = $levels;
    $session['state'] = 'playing';
    $session['currentLevel'] = 0;
    $session['levelStartTime'] = time();
    $session['levelCompleted'] = false;
    
    // Réinitialiser les résultats de niveau pour tous les joueurs
    foreach ($session['players'] as &$player) {
        $player['levelResults'] = [];
    }
    unset($player);
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true, 'message' => 'Partie lancée']);
}

/**
 * Obtenir l'état de la partie
 */
function getGameState() {
    $playCode = isset($_GET['playCode']) ? strtoupper(trim($_GET['playCode'])) : '';
    $nickname = isset($_GET['nickname']) ? trim($_GET['nickname']) : '';
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Partie introuvable']);
        return;
    }
    
    // Mettre à jour le ping du joueur
    $playerFound = false;
    $playerIndex = -1;
    foreach ($session['players'] as $index => &$player) {
        if ($player['nickname'] === $nickname) {
            $player['lastPing'] = time();
            $player['connected'] = true;
            $playerFound = true;
            $playerIndex = $index;
            break;
        }
    }
    unset($player);
    
    if (!$playerFound) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Joueur non trouvé', 'kicked' => true]);
        return;
    }
    
    // Vérifier si le niveau est terminé (tous ont validé ou timeout)
    if ($session['state'] === 'playing' && !$session['levelCompleted']) {
        checkAndCompleteLevelIfNeeded($session);
    }
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    // Préparer la réponse
    $connectedPlayers = array_filter($session['players'], function($p) {
        return $p['connected'] && (time() - $p['lastPing'] < PING_TIMEOUT);
    });
    
    $response = [
        'success' => true,
        'state' => $session['state'],
        'hostNickname' => $session['hostNickname'],
        'players' => array_values($connectedPlayers),
        'allPlayers' => $session['players'],
        'currentLevel' => $session['currentLevel'],
        'numLevels' => $session['numLevels'],
        'levelCompleted' => $session['levelCompleted'] ?? false
    ];
    
    // Si en jeu, envoyer le niveau actuel
    if ($session['state'] === 'playing' && isset($session['levels'][$session['currentLevel']])) {
        $response['level'] = $session['levels'][$session['currentLevel']];
        $response['levelStartTime'] = $session['levelStartTime'];
    }
    
    // Si niveau terminé, envoyer les résultats
    if ($session['levelCompleted'] && isset($session['levelResults'])) {
        $response['levelResults'] = $session['levelResults'];
    }
    
    // Si partie terminée
    if ($session['state'] === 'finished') {
        $response['finalResults'] = calculateFinalResults($session);
    }
    
    echo json_encode($response);
}

/**
 * Valider un niveau (élève a réussi)
 */
function validateLevel() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    $timeSpent = isset($_POST['timeSpent']) ? intval($_POST['timeSpent']) : 0;
    $blockCount = isset($_POST['blockCount']) ? intval($_POST['blockCount']) : 0;
    $isCorrect = isset($_POST['isCorrect']) ? ($_POST['isCorrect'] === 'true' || $_POST['isCorrect'] === '1') : false;
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Données manquantes']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Partie introuvable']);
        return;
    }
    
    $currentLevel = $session['currentLevel'];
    $levelData = $session['levels'][$currentLevel] ?? null;
    
    // Trouver le joueur et enregistrer son résultat
    foreach ($session['players'] as &$player) {
        if ($player['nickname'] === $nickname) {
            // Éviter les doublons
            if (!isset($player['levelResults'][$currentLevel])) {
                // Calculer les points
                $points = 0;
                if ($isCorrect) {
                    // Points basés sur le temps (comme Qwest)
                    // 1000 points max, -1 point par 100ms
                    $points = max(100, 1000 - floor($timeSpent / 100));
                    
                    // Bonus si optimal (moins de blocs que requis)
                    if ($levelData && $blockCount <= $levelData['optimalBlocks']) {
                        $points += 200; // Bonus optimal
                    }
                }
                
                $player['levelResults'][$currentLevel] = [
                    'timeSpent' => $timeSpent,
                    'blockCount' => $blockCount,
                    'isCorrect' => $isCorrect,
                    'points' => $points,
                    'timestamp' => time()
                ];
                
                if ($isCorrect) {
                    $player['score'] += $points;
                }
            }
            $player['lastPing'] = time();
            break;
        }
    }
    unset($player);
    
    // Vérifier si tous les joueurs actifs ont terminé
    checkAndCompleteLevelIfNeeded($session);
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true]);
}

/**
 * Vérifier et compléter le niveau si nécessaire
 */
function checkAndCompleteLevelIfNeeded(&$session) {
    if ($session['levelCompleted']) {
        return;
    }
    
    $currentLevel = $session['currentLevel'];
    $allCompleted = true;
    $activeCount = 0;
    
    foreach ($session['players'] as $player) {
        $isActive = $player['connected'] && (time() - $player['lastPing'] < ACTIVE_PLAYER_THRESHOLD);
        
        if ($isActive) {
            $activeCount++;
            if (!isset($player['levelResults'][$currentLevel])) {
                $allCompleted = false;
            }
        }
    }
    
    // Si tous les actifs ont terminé
    if ($allCompleted && $activeCount > 0) {
        completeLevelResults($session);
    }
}

/**
 * Compléter les résultats du niveau
 */
function completeLevelResults(&$session) {
    $currentLevel = $session['currentLevel'];
    
    // Calculer le classement pour ce niveau
    $results = [];
    foreach ($session['players'] as $player) {
        if (isset($player['levelResults'][$currentLevel])) {
            $result = $player['levelResults'][$currentLevel];
            $results[] = [
                'nickname' => $player['nickname'],
                'timeSpent' => $result['timeSpent'],
                'blockCount' => $result['blockCount'],
                'isCorrect' => $result['isCorrect'],
                'points' => $result['points']
            ];
        } else {
            // Joueur déconnecté
            $results[] = [
                'nickname' => $player['nickname'],
                'timeSpent' => 0,
                'blockCount' => 0,
                'isCorrect' => false,
                'points' => 0,
                'disconnected' => true
            ];
        }
    }
    
    // Trier par points décroissants
    usort($results, function($a, $b) {
        return $b['points'] - $a['points'];
    });
    
    $session['levelResults'] = [
        'levelIndex' => $currentLevel,
        'ranking' => $results,
        'top3' => array_slice($results, 0, 3)
    ];
    
    $session['levelCompleted'] = true;
}

/**
 * Vérifier la complétion du niveau (appelé par le watchdog client)
 */
function checkLevelCompletion() {
    $playCode = isset($_GET['playCode']) ? strtoupper(trim($_GET['playCode'])) : '';
    $nickname = isset($_GET['nickname']) ? trim($_GET['nickname']) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Partie introuvable']);
        return;
    }
    
    // Mettre à jour le ping si nickname fourni
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
    
    // Forcer la vérification
    checkAndCompleteLevelIfNeeded($session);
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    $response = [
        'success' => true,
        'levelCompleted' => $session['levelCompleted'] ?? false
    ];
    
    if ($session['levelCompleted'] && isset($session['levelResults'])) {
        $response['levelResults'] = $session['levelResults'];
    }
    
    echo json_encode($response);
}

/**
 * Passer au niveau suivant (appelé par l'hôte ou automatiquement)
 */
function nextLevel() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Partie introuvable']);
        return;
    }
    
    $session['currentLevel']++;
    
    if ($session['currentLevel'] >= $session['numLevels']) {
        // Partie terminée
        $session['state'] = 'finished';
    } else {
        // Niveau suivant
        $session['levelStartTime'] = time();
        $session['levelCompleted'] = false;
        $session['levelResults'] = null;
    }
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode(['success' => true]);
}

/**
 * Terminer la partie (appelé par l'hôte)
 */
function endGame() {
    $playCode = isset($_POST['playCode']) ? strtoupper(trim($_POST['playCode'])) : '';
    $nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';
    
    if (empty($playCode) || empty($nickname)) {
        echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
        return;
    }
    
    list($session, $fp) = loadSessionForUpdate($playCode);
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Partie introuvable']);
        return;
    }
    
    // Vérifier que c'est l'hôte
    if ($session['hostNickname'] !== $nickname) {
        if ($fp) { flock($fp, LOCK_UN); fclose($fp); }
        echo json_encode(['success' => false, 'message' => 'Seul l\'hôte peut terminer la partie']);
        return;
    }
    
    $session['state'] = 'finished';
    
    saveSessionAndUnlock($playCode, $session, $fp);
    
    echo json_encode([
        'success' => true,
        'finalResults' => calculateFinalResults($session)
    ]);
}

/**
 * Calculer les résultats finaux
 */
function calculateFinalResults($session) {
    $players = $session['players'];
    
    // Trier par score décroissant
    usort($players, function($a, $b) {
        return ($b['score'] ?? 0) - ($a['score'] ?? 0);
    });
    
    return [
        'players' => $players,
        'top3' => array_slice($players, 0, 3),
        'numLevels' => $session['numLevels'],
        'levelsPlayed' => $session['currentLevel'] + 1
    ];
}

/**
 * Obtenir 3 animaux uniques pour un joueur
 */
function getUniqueAnimals() {
    $ALL_ANIMALS = [
        // Mammifères (30)
        '🦁 Lion', '🐯 Tigre', '🐻 Ours', '🐼 Panda', '🦊 Renard',
        '🐺 Loup', '🦝 Raton', '🐨 Koala', '🐹 Hamster', '🐰 Lapin',
        '🦔 Hérisson', '🐿️ Écureuil', '🦫 Castor', '🦘 Kangourou', '🦙 Lama',
        '🦒 Girafe', '🦏 Rhino', '🦛 Hippo', '🐘 Éléphant', '🐆 Léopard',
        '🦓 Zèbre', '🦌 Cerf', '🐃 Buffle', '🐂 Bœuf', '🐄 Vache',
        '🐎 Cheval', '🦬 Bison', '🐖 Cochon', '🐏 Mouton', '🐐 Chèvre',
        
        // Petits animaux (15)
        '🐁 Souris', '🐀 Rat', '🦡 Blaireau', '🦨 Mouffette', '🦦 Loutre',
        '🐕 Chien', '🐩 Caniche', '🐈 Chat', '🐇 Lapinou', '🐾 Patoune',
        '🦎 Lézard', '🐢 Tortue', '🐊 Croco', '🦎 Gecko', '🐸 Grenouille',
        
        // Oiseaux (20)
        '🦅 Aigle', '🦉 Hibou', '🦚 Paon', '🦤 Dodo', '🐧 Pingouin',
        '🐦 Oiseau', '🐤 Poussin', '🐥 Caneton', '🦢 Cygne', '🕊️ Colombe',
        '🦃 Dinde', '🦜 Perroquet', '🦩 Flamant', '🐓 Coq', '🦆 Canard',
        '🦅 Faucon', '🦉 Chouette', '🐦‍⬛ Corbeau', '🦇 Chauve', '🦜 Ara',
        
        // Marins (15)
        '🐋 Baleine', '🐳 Cachalot', '🐬 Dauphin', '🦈 Requin', '🐙 Pieuvre',
        '🦑 Calmar', '🦀 Crabe', '🦞 Homard', '🐠 Poisson', '🐡 Fugu',
        '🐟 Némo', '🦭 Phoque', '🦐 Crevette', '🦪 Huître', '🐚 Coquille',
        
        // Insectes (10)
        '🐝 Abeille', '🦋 Papillon', '🐌 Escargot', '🐞 Coccinelle', '🦗 Criquet',
        '🕷️ Araignée', '🦂 Scorpion', '🪲 Scarabée', '🐜 Fourmi', '🐛 Chenille'
    ];
    
    $playCode = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';
    $deviceId = isset($_GET['deviceId']) ? trim($_GET['deviceId']) : '';
    
    if (empty($playCode)) {
        echo json_encode(['success' => false, 'message' => 'Code manquant']);
        return;
    }
    
    $sessionFile = SESSIONS_DIR . '/' . $playCode . '.json';
    
    if (!file_exists($sessionFile)) {
        echo json_encode(['success' => false, 'message' => 'Session introuvable']);
        return;
    }
    
    // Verrouillage pour éviter les conflits
    $fp = fopen($sessionFile, 'r+');
    if (!$fp || !flock($fp, LOCK_EX)) {
        echo json_encode(['success' => false, 'message' => 'Serveur occupé']);
        return;
    }
    
    $content = stream_get_contents($fp);
    $session = json_decode($content, true);
    
    // Hash unique par poste
    $deviceHash = !empty($deviceId) ? md5($playCode . '|' . $deviceId) : md5($playCode . '|' . getClientIP());
    
    // Vérifier si ce poste a déjà des animaux attribués
    $deviceAnimals = $session['deviceAnimals'] ?? [];
    
    if (isset($deviceAnimals[$deviceHash])) {
        $selected = $deviceAnimals[$deviceHash]['animals'];
        
        // Vérifier qu'ils ne sont pas déjà pris
        $confirmedAnimals = array_map(function($p) { return $p['nickname']; }, $session['players']);
        $stillAvailable = array_values(array_diff($selected, $confirmedAnimals));
        
        if (count($stillAvailable) > 0) {
            flock($fp, LOCK_UN);
            fclose($fp);
            echo json_encode(['success' => true, 'animals' => $stillAvailable]);
            return;
        }
    }
    
    // Attribuer de nouveaux animaux
    $confirmedAnimals = array_map(function($p) { return $p['nickname']; }, $session['players']);
    $pendingReservations = $session['pendingAnimals'] ?? [];
    
    // Nettoyer les réservations expirées (60s)
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
        $validReservations = [];
        $available = array_values(array_diff($ALL_ANIMALS, $confirmedAnimals));
        if (count($available) < 3) {
            $available = $ALL_ANIMALS;
        }
    }
    
    shuffle($available);
    $selected = array_slice($available, 0, 3);
    
    // Réserver
    foreach ($selected as $animal) {
        $validReservations[$animal] = $now;
    }
    $session['pendingAnimals'] = $validReservations;
    
    // Enregistrer pour ce poste
    $deviceAnimals[$deviceHash] = ['animals' => $selected, 'timestamp' => $now];
    $session['deviceAnimals'] = $deviceAnimals;
    
    // Sauvegarder
    fseek($fp, 0);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($session, JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    echo json_encode(['success' => true, 'animals' => $selected]);
}

/**
 * Vérifier si une partie existe
 */
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

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function generatePlayCode() {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    
    // Vérifier unicité
    if (file_exists(SESSIONS_DIR . '/' . $code . '.json')) {
        return generatePlayCode();
    }
    
    return $code;
}

function getClientIP() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    return $ip;
}

function loadSession($playCode) {
    $playCode = strtoupper(trim($playCode));
    $file = SESSIONS_DIR . '/' . $playCode . '.json';
    
    if (!file_exists($file)) {
        return null;
    }
    
    $content = @file_get_contents($file);
    if ($content === false) {
        return null;
    }
    
    return json_decode($content, true);
}

function loadSessionForUpdate($playCode) {
    $playCode = strtoupper(trim($playCode));
    $file = SESSIONS_DIR . '/' . $playCode . '.json';
    
    if (!file_exists($file)) {
        return [null, null];
    }
    
    $fp = @fopen($file, 'r+');
    if (!$fp) {
        return [null, null];
    }
    
    // Attendre le verrou (max 5s)
    $startTime = time();
    while (!flock($fp, LOCK_EX | LOCK_NB) && (time() - $startTime) < 5) {
        usleep(50000);
    }
    flock($fp, LOCK_EX);
    
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
    
    foreach ($files as $file) {
        if ($now - filemtime($file) > SESSION_TIMEOUT) {
            @unlink($file);
        }
    }
}
?>
