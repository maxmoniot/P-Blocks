<?php
/**
 * API Backend pour Programmation Motifs
 * Gestion sécurisée des cursus professeurs
 */

// Import du filtre de profanité
require_once 'profanity-filter.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration
define('DATA_DIR', __DIR__ . '/data/');
define('MAX_REQUESTS_PER_HOUR', 10);
define('CLEANUP_DAYS', 365); // Supprimer les fichiers non accédés depuis 1 an
define('RATE_LIMIT_FILE', DATA_DIR . '.rate_limits.json');
define('MAX_TOTAL_LEVELS', 100); // Limite maximale de niveaux - MODIFIEZ CETTE VALEUR POUR CHANGER LA LIMITE (doit correspondre à MAX_TOTAL_LEVELS dans index.html)

// Créer le dossier data si inexistant
if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// Protection anti-bots : vérification du captcha
function verifyCaptcha($answer, $expected) {
    return intval($answer) === intval($expected);
}

// Limitation de requêtes par IP
function checkRateLimit($ip) {
    $limits = [];
    if (file_exists(RATE_LIMIT_FILE)) {
        $limits = json_decode(file_get_contents(RATE_LIMIT_FILE), true) ?: [];
    }
    
    $currentTime = time();
    $oneHourAgo = $currentTime - 3600;
    
    // Nettoyer les anciennes entrées
    $limits = array_filter($limits, function($timestamp) use ($oneHourAgo) {
        return $timestamp > $oneHourAgo;
    });
    
    // Vérifier le nombre de requêtes
    $ipRequests = array_filter($limits, function($timestamp, $key) use ($ip, $oneHourAgo) {
        return strpos($key, $ip) === 0 && $timestamp > $oneHourAgo;
    }, ARRAY_FILTER_USE_BOTH);
    
    if (count($ipRequests) >= MAX_REQUESTS_PER_HOUR) {
        return false;
    }
    
    // Ajouter cette requête
    $limits[$ip . '_' . $currentTime] = $currentTime;
    file_put_contents(RATE_LIMIT_FILE, json_encode($limits));
    
    return true;
}

// Nettoyer le nom du professeur (sécurité)
function cleanProfName($name) {
    // Supprimer les caractères dangereux
    $name = preg_replace('/[^a-zA-Z0-9_-]/', '', $name);
    // Limiter la longueur
    $name = substr(strtolower($name), 0, 30);
    return $name;
}

// Hasher le mot de passe
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Vérifier le mot de passe
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Nettoyer les fichiers anciens (300 jours)
function cleanupOldFiles() {
    $files = glob(DATA_DIR . '*.json');
    $cutoffTime = time() - (CLEANUP_DAYS * 24 * 60 * 60);
    $cleaned = 0;
    
    foreach ($files as $file) {
        if (basename($file) === '.rate_limits.json') continue;
        
        $data = json_decode(file_get_contents($file), true);
        if ($data && isset($data['last_access'])) {
            $lastAccess = strtotime($data['last_access']);
            if ($lastAccess < $cutoffTime) {
                // Supprimer uniquement le JSON (plus de fichier HTML)
                unlink($file);
                $cleaned++;
            }
        }
    }
    
    return $cleaned;
}

// Mettre à jour la date d'accès
function updateLastAccess($profName) {
    $jsonFile = DATA_DIR . $profName . '.json';
    if (file_exists($jsonFile)) {
        $data = json_decode(file_get_contents($jsonFile), true);
        $data['last_access'] = date('Y-m-d H:i:s');
        file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT));
    }
}

// Récupérer l'IP du client
function getClientIP() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }
    return $ip;
}

// Gérer les requêtes
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'save':
        // Sauvegarder un nouveau cursus ou écraser un existant
        $profName = cleanProfName($_POST['profName'] ?? '');
        $password = $_POST['password'] ?? '';
        $captchaAnswer = $_POST['captchaAnswer'] ?? '';
        $captchaExpected = $_POST['captchaExpected'] ?? '';
        $cursusData = $_POST['cursusData'] ?? '';
        
        // Validations
        if (empty($profName)) {
            echo json_encode(['success' => false, 'message' => 'Nom du professeur requis']);
            exit;
        }
        
        // Vérification de profanité
        if (!ProfanityFilter::isClean($profName)) {
            $errorMsg = ProfanityFilter::getErrorMessage($profName);
            echo json_encode(['success' => false, 'message' => $errorMsg]);
            exit;
        }
        
        if (strlen($password) < 4) {
            echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 4 caractères']);
            exit;
        }
        
        if (!verifyCaptcha($captchaAnswer, $captchaExpected)) {
            echo json_encode(['success' => false, 'message' => 'Captcha incorrect']);
            exit;
        }
        
        $clientIP = getClientIP();
        if (!checkRateLimit($clientIP)) {
            echo json_encode(['success' => false, 'message' => 'Trop de tentatives. Réessayez dans 1 heure.']);
            exit;
        }
        
        if (empty($cursusData)) {
            echo json_encode(['success' => false, 'message' => 'Données du cursus manquantes']);
            exit;
        }
        
        // VÉRIFICATION DE L'ESPACE DE STOCKAGE (95 Mo max)
        $maxStorageBytes = 95 * 1024 * 1024; // 95 Mo en octets
        $currentTotalSize = 0;
        
        // Calculer la taille actuelle de tous les fichiers JSON
        $files = glob(DATA_DIR . '*.json');
        foreach ($files as $file) {
            if (basename($file) === '.rate_limits.json') continue;
            $currentTotalSize += filesize($file);
        }
        
        // Calculer la taille des nouvelles données
        $newDataSize = strlen(json_encode([
            'prof' => $profName,
            'password_hash' => hashPassword($password),
            'created' => date('Y-m-d H:i:s'),
            'last_access' => date('Y-m-d H:i:s'),
            'cursusData' => json_decode($cursusData, true)
        ], JSON_PRETTY_PRINT));
        
        $jsonFile = DATA_DIR . $profName . '.json';
        $htmlFile = DATA_DIR . $profName . '.html';
        
        // Si le fichier existe déjà, soustraire sa taille actuelle
        $existingFileSize = 0;
        if (file_exists($jsonFile)) {
            $existingFileSize = filesize($jsonFile);
        }
        
        // Calculer la taille finale après sauvegarde
        $finalTotalSize = $currentTotalSize - $existingFileSize + $newDataSize;
        
        // Vérifier si on dépasse la limite
        if ($finalTotalSize > $maxStorageBytes) {
            $currentMB = round($currentTotalSize / 1024 / 1024, 2);
            $finalMB = round($finalTotalSize / 1024 / 1024, 2);
            $maxMB = round($maxStorageBytes / 1024 / 1024, 2);
            echo json_encode([
                'success' => false, 
                'message' => "Espace de stockage insuffisant.\n\nEspace utilisé: {$currentMB} Mo\nAprès sauvegarde: {$finalMB} Mo\nLimite maximale: {$maxMB} Mo\n\nVeuillez contacter l'administrateur."
            ]);
            exit;
        }
        
        // Vérifier si le fichier existe déjà (pour demander le mot de passe)
        if (file_exists($jsonFile)) {
            $existingData = json_decode(file_get_contents($jsonFile), true);
            if (!verifyPassword($password, $existingData['password_hash'])) {
                echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect pour ce professeur']);
                exit;
            }
        }
        
        // Préparer les données
        $data = [
            'prof' => $profName,
            'password_hash' => hashPassword($password),
            'created' => date('Y-m-d H:i:s'),
            'last_access' => date('Y-m-d H:i:s'),
            'cursusData' => json_decode($cursusData, true)
        ];
        
        // Sauvegarder le JSON
        file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT));
        
        // NE PLUS générer de fichier HTML - on utilise index.html?prof=xxx à la place
        
        // Construire l'URL pour les élèves
        $url = 'www.lejardindesoiseaux.com/jeumotif/index.html?prof=' . urlencode($profName);
        echo json_encode([
            'success' => true, 
            'message' => 'Niveaux sauvegardés avec succès !',
            'url' => $url,
            'profName' => $profName
        ]);
        break;
        
    case 'load':
        // Charger un cursus existant
        $profName = cleanProfName($_POST['profName'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($profName) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Nom et mot de passe requis']);
            exit;
        }
        
        $jsonFile = DATA_DIR . $profName . '.json';
        
        if (!file_exists($jsonFile)) {
            echo json_encode(['success' => false, 'message' => 'Aucun cursus trouvé pour ce nom']);
            exit;
        }
        
        $data = json_decode(file_get_contents($jsonFile), true);
        
        if (!verifyPassword($password, $data['password_hash'])) {
            echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect']);
            exit;
        }
        
        // Mettre à jour la date d'accès
        updateLastAccess($profName);
        
        echo json_encode([
            'success' => true,
            'cursusData' => $data['cursusData'],
            'profName' => $profName
        ]);
        break;
    
    case 'load_public':
        // Charger un cursus pour affichage public (SANS authentification)
        $profName = cleanProfName($_GET['profName'] ?? '');
        
        if (empty($profName)) {
            echo json_encode(['success' => false, 'message' => 'Nom requis']);
            exit;
        }
        
        $jsonFile = DATA_DIR . $profName . '.json';
        
        if (!file_exists($jsonFile)) {
            echo json_encode(['success' => false, 'message' => 'Aucun cursus trouvé pour ce nom']);
            exit;
        }
        
        $data = json_decode(file_get_contents($jsonFile), true);
        
        // Mettre à jour la date d'accès
        updateLastAccess($profName);
        
        echo json_encode([
            'success' => true,
            'cursusData' => $data['cursusData']
        ]);
        break;
        
    case 'access':
        // Un élève accède à une page (mise à jour last_access)
        $profName = cleanProfName($_GET['prof'] ?? '');
        if (!empty($profName)) {
            updateLastAccess($profName);
            echo json_encode(['success' => true]);
        }
        break;
    
    case 'check':
        // Vérifier si un cursus existe déjà
        $profName = cleanProfName($_GET['profName'] ?? '');
        if (empty($profName)) {
            echo json_encode(['success' => false, 'exists' => false]);
            exit;
        }
        
        $jsonFile = DATA_DIR . $profName . '.json';
        echo json_encode(['success' => true, 'exists' => file_exists($jsonFile)]);
        break;
    
    case 'verify_password':
        // Vérifier si un mot de passe est correct pour un prof
        $profName = cleanProfName($_POST['profName'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($profName) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Nom et mot de passe requis']);
            exit;
        }
        
        $jsonFile = DATA_DIR . $profName . '.json';
        
        if (!file_exists($jsonFile)) {
            echo json_encode(['success' => false, 'message' => 'Cursus non trouvé']);
            exit;
        }
        
        $data = json_decode(file_get_contents($jsonFile), true);
        
        if (verifyPassword($password, $data['password_hash'])) {
            echo json_encode(['success' => true, 'message' => 'Mot de passe correct']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect']);
        }
        break;
        
    case 'cleanup':
        // Nettoyage manuel (peut être appelé par un cron job)
        $cleaned = cleanupOldFiles();
        echo json_encode(['success' => true, 'cleaned' => $cleaned]);
        break;
    
    case 'list_professors':
        // Lister tous les professeurs disponibles
        $files = glob(DATA_DIR . '*.json');
        $professors = [];
        
        foreach ($files as $file) {
            $basename = basename($file, '.json');
            if ($basename !== '.rate_limits') {
                $professors[] = $basename;
            }
        }
        
        sort($professors);
        echo json_encode(['success' => true, 'professors' => $professors]);
        break;
    
    case 'load_public':
        // Charger les niveaux d'un professeur SANS mot de passe (lecture seule)
        $profName = cleanProfName($_GET['profName'] ?? '');
        
        if (empty($profName)) {
            echo json_encode(['success' => false, 'message' => 'Nom de professeur requis']);
            exit;
        }
        
        $jsonFile = DATA_DIR . $profName . '.json';
        
        if (!file_exists($jsonFile)) {
            echo json_encode(['success' => false, 'message' => 'Professeur non trouvé']);
            exit;
        }
        
        $data = json_decode(file_get_contents($jsonFile), true);
        
        // Mettre à jour la date d'accès
        updateLastAccess($profName);
        
        echo json_encode([
            'success' => true,
            'cursusData' => $data['cursusData']
        ]);
        break;
    
    case 'delete':
        // Supprimer une sauvegarde en ligne (avec vérification du mot de passe)
        $profName = cleanProfName($_POST['profName'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($profName) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Nom et mot de passe requis']);
            exit;
        }
        
        $jsonFile = DATA_DIR . $profName . '.json';
        
        if (!file_exists($jsonFile)) {
            echo json_encode(['success' => false, 'message' => 'Sauvegarde non trouvée']);
            exit;
        }
        
        // Vérifier le mot de passe
        $data = json_decode(file_get_contents($jsonFile), true);
        if (!verifyPassword($password, $data['password_hash'])) {
            echo json_encode(['success' => false, 'message' => 'Code de sécurité incorrect']);
            exit;
        }
        
        // Supprimer le fichier
        if (unlink($jsonFile)) {
            echo json_encode(['success' => true, 'message' => 'Sauvegarde supprimée avec succès']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
        }
        break;
        
    case 'cleanup':
        // Nettoyer les vieux fichiers (appelé à l'ouverture du mode professeur)
        $cleaned = cleanupOldFiles();
        echo json_encode([
            'success' => true,
            'cleaned' => $cleaned,
            'message' => $cleaned > 0 ? "$cleaned fichier(s) inactif(s) supprimé(s)" : "Aucun fichier à nettoyer"
        ]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
}
?>
