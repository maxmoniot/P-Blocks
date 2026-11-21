<?php
/**
 * Filtre de profanité pour Programmation Motifs (version PHP)
 * Liste de mots interdits en français (contexte scolaire)
 */

class ProfanityFilter {
    // Liste de mots interdits (en minuscules)
    private static $blacklist = [
        // Insultes et vulgarités courantes
        'merde', 'putain', 'con', 'connard', 'connasse', 'salaud', 'salope',
        'enculé', 'encule', 'pute', 'bordel', 'chier', 'foutre',
        
        // Termes offensants
        'crétin', 'cretin', 'débile', 'debile', 'abruti', 'idiot', 'imbécile', 'imbecile',
        'taré', 'tare', 'dégénéré', 'degenere',
        
        // Termes sexuels
        'sexe', 'penis', 'pénis', 'vagin', 'bite', 'couilles',
        'cul', 'chatte', 'seins', 'nichons',
        
        // Termes discriminatoires
        'pédé', 'pede', 'tapette', 'gouine', 'nègre', 'negre',
        'youpin', 'bougnoule', 'arabe', 'bicot',
        
        // Termes violents
        'tuer', 'mort', 'suicide', 'bombe', 'arme', 'flingue',
        'poignard', 'couteau', 'terroriste',
        
        // Drogues
        'drogue', 'cannabis', 'shit', 'beuh', 'cocaine',
        'heroine', 'héroïne', 'heroine', 'ecstasy',
        
        // Variantes avec leet speak ou caractères spéciaux
        'c0n', 'p*te', 'm3rd3', 'f*ck', 'sh*t',
        
        // Termes problématiques en contexte scolaire
        'nazi', 'hitler', 'raciste', 'fasciste',
        
        // Ajouts contextuels
        'nul', 'pourri', 'moche', 'laid'
    ];
    
    /**
     * Normalise le texte pour la vérification
     * @param string $text Le texte à normaliser
     * @return string Le texte normalisé
     */
    private static function normalize($text) {
        // Convertir en minuscules
        $text = mb_strtolower($text, 'UTF-8');
        
        // Retirer les accents
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        
        // Retirer les caractères spéciaux (garder lettres, chiffres, espaces)
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);
        
        // Normaliser les espaces
        $text = preg_replace('/\s+/', ' ', $text);
        
        return trim($text);
    }
    
    /**
     * Vérifie si un texte contient des mots interdits
     * @param string $text Le texte à vérifier
     * @return bool true si le texte est propre, false sinon
     */
    public static function isClean($text) {
        if (empty($text)) {
            return true;
        }
        
        $normalizedText = self::normalize($text);
        
        // Vérifier chaque mot interdit
        foreach (self::$blacklist as $word) {
            // Utiliser des limites de mots pour éviter les faux positifs
            $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
            if (preg_match($pattern, $normalizedText)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Trouve les mots interdits dans un texte
     * @param string $text Le texte à analyser
     * @return array Liste des mots interdits trouvés
     */
    public static function findBadWords($text) {
        if (empty($text)) {
            return [];
        }
        
        $normalizedText = self::normalize($text);
        $found = [];
        
        foreach (self::$blacklist as $word) {
            $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
            if (preg_match($pattern, $normalizedText)) {
                $found[] = $word;
            }
        }
        
        return $found;
    }
    
    /**
     * Obtient un message d'erreur approprié
     * @param string $text Le texte problématique
     * @return string Message d'erreur
     */
    public static function getErrorMessage($text) {
        $badWords = self::findBadWords($text);
        if (empty($badWords)) {
            return '';
        }
        
        return 'Le nom contient des termes inappropriés pour un contexte scolaire. Veuillez choisir un nom respectueux.';
    }
}
?>
