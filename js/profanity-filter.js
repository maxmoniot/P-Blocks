/**
 * Filtre de profanité pour Programmation Motifs
 * Liste de mots interdits en français (contexte scolaire)
 */

const PROFANITY_FILTER = {
    // Liste de mots interdits (en minuscules)
    blacklist: [
        // Insultes et vulgarités courantes
        'merde', 'putain', 'con', 'connard', 'connasse', 'salaud', 'salope',
        'enculé', 'encule', 'pute', 'bordel', 'chier', 'foutre',
        
        // Termes offensants
        'crétin', 'débile', 'abruti', 'idiot', 'imbécile', 'imbecile',
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
        'heroine', 'héroïne', 'ecstasy',
        
        // Variantes avec leet speak ou caractères spéciaux
        'c0n', 'p*te', 'm3rd3', 'f*ck', 'sh*t',
        
        // Termes problématiques en contexte scolaire
        'nazi', 'hitler', 'raciste', 'fasciste',
        
        // Ajouts contextuels
        'nul', 'pourri', 'moche', 'laid'
    ],
    
    /**
     * Vérifie si un texte contient des mots interdits
     * @param {string} text - Le texte à vérifier
     * @returns {boolean} - true si le texte est propre, false sinon
     */
    isClean: function(text) {
        if (!text || typeof text !== 'string') {
            return true;
        }
        
        const normalizedText = this.normalize(text);
        
        // Vérifier chaque mot interdit
        for (let word of this.blacklist) {
            // Utiliser des limites de mots pour éviter les faux positifs
            // Par exemple, "assassin" ne doit pas détecter "ass"
            const regex = new RegExp('\\b' + word + '\\b', 'i');
            if (regex.test(normalizedText)) {
                return false;
            }
        }
        
        return true;
    },
    
    /**
     * Normalise le texte pour la vérification
     * @param {string} text - Le texte à normaliser
     * @returns {string} - Le texte normalisé
     */
    normalize: function(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
            .replace(/[^a-z0-9\s]/g, '') // Retirer caractères spéciaux
            .replace(/\s+/g, ' ') // Normaliser les espaces
            .trim();
    },
    
    /**
     * Trouve les mots interdits dans un texte
     * @param {string} text - Le texte à analyser
     * @returns {Array} - Liste des mots interdits trouvés
     */
    findBadWords: function(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }
        
        const normalizedText = this.normalize(text);
        const found = [];
        
        for (let word of this.blacklist) {
            const regex = new RegExp('\\b' + word + '\\b', 'i');
            if (regex.test(normalizedText)) {
                found.push(word);
            }
        }
        
        return found;
    },
    
    /**
     * Affiche un message d'erreur approprié
     * @param {string} text - Le texte problématique
     * @returns {string} - Message d'erreur
     */
    getErrorMessage: function(text) {
        const badWords = this.findBadWords(text);
        if (badWords.length === 0) {
            return '';
        }
        
        return 'Le nom contient des termes inappropriés pour un contexte scolaire. Veuillez choisir un nom respectueux.';
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PROFANITY_FILTER;
}
