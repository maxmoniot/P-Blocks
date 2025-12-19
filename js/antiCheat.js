// ============================================
// MODULE: ANTI-CHEAT SYSTEM
// Description: Système de chiffrement et validation pour éviter la triche
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: score
//   - Variables window: window.isStudentLoadMode
// Fonctions EXPORTÉES (vers window):
//   - _h() - Hash pour checksum
//   - _e() - Chiffrement
//   - _d() - Déchiffrement
//   - _updateScoreDisplay() - Affichage sécurisé du score
// ============================================

(function() {
    'use strict';
    
    
    // ========================================
    // SYSTÈME ANTI-TRICHE - Chiffrement & Checksum
    // ========================================
    
    // Clé de chiffrement (mélangée pour rendre la recherche plus difficile)
    const _k = 'Pr0gM0t1f5_2024_S3cur3';
    
    // Fonction de hachage simple pour checksum
    function _h(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    // Chiffrement XOR simple mais efficace
    function _e(data) {
        const str = JSON.stringify(data);
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ _k.charCodeAt(i % _k.length));
        }
        const encoded = btoa(result); // Base64
        const checksum = _h(str + _k);
        return encoded + '.' + checksum;
    }
    
    // Déchiffrement avec vérification checksum
    function _d(encrypted) {
        try {
            const parts = encrypted.split('.');
            if (parts.length !== 2) return null;
            
            const encoded = parts[0];
            const checksum = parts[1];
            
            const result = atob(encoded);
            let str = '';
            for (let i = 0; i < result.length; i++) {
                str += String.fromCharCode(result.charCodeAt(i) ^ _k.charCodeAt(i % _k.length));
            }
            
            // Vérifier le checksum
            if (_h(str + _k) !== checksum) {
                return null;
            }
            
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }
    
    // Fonction pour afficher le score de manière obfusquée
    function _updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            // Stocker la vraie valeur dans un attribut data
            scoreElement.setAttribute('data-v', score);
            // Afficher la valeur en texte
            scoreElement.textContent = score;
        }
    }
    
    // Validation périodique pour détecter les modifications suspectes
    let _lastScore = 0;
    let _lastCheck = Date.now();
    
    setInterval(() => {
        const scoreElement = document.getElementById('score');
        
        // Resynchroniser l'affichage du score
        if (scoreElement) {
            const displayedScore = parseInt(scoreElement.textContent) || 0;
            const dataScore = parseInt(scoreElement.getAttribute('data-v')) || 0;
            
            // Si l'affichage ou l'attribut data a été modifié
            if (displayedScore !== score || dataScore !== score) {
                _updateScoreDisplay();
            }
        }
        
        // Vérifier si le score a changé de manière suspecte
        const scoreKey = window.isStudentLoadMode ? '_s_URL' : '_s_PREVIEW';
        const encryptedScore = localStorage.getItem(scoreKey);
        if (encryptedScore) {
            const decrypted = _d(encryptedScore);
            if (decrypted && typeof decrypted.score === 'number') {
                // Si le score en mémoire est différent du score sauvegardé
                if (score !== decrypted.score && Date.now() - _lastCheck > 5000) {
                    // Probable modification via console - réinitialiser
                    score = decrypted.score;
                    _updateScoreDisplay();
                }
            }
        }
        _lastScore = score;
        _lastCheck = Date.now();
    }, 1000); // Vérifier toutes les secondes
    
    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    // Rendre les fonctions accessibles globalement
    window._h = _h;
    window._e = _e;
    window._d = _d;
    window._updateScoreDisplay = _updateScoreDisplay;
    
    
})();
