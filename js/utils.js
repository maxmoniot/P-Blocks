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
            const encryptedScore = localStorage.getItem('_s');
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
        // FIN SYSTÈME ANTI-TRICHE
        // ========================================
        
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

