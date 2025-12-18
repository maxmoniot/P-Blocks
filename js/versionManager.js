// ============================================
// MODULE: VERSION MANAGER
// Description: Gestion des versions, reset progression, paramètres URL prof
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: cursusData, completedLevels, score, currentMode
//   - Fonctions: customConfirm(), saveToStorage(), loadCursusLevels()
// Fonctions EXPORTÉES (vers window):
//   - resetProgress(), incrementVersion(), checkVersionAndReset()
//   - loadProfLevelsForStudent(), checkProfParameter()
// ============================================

(function() {
    'use strict';
    
    
// RÉINITIALISATION MANUELLE DE LA PROGRESSION
// ========================================

// Réinitialiser la progression et le score (bouton manuel)
async function resetProgress() {
    const confirmed = await customConfirm('⚠️ Réinitialiser le score et la progression ?\n\nTous les niveaux validés seront marqués comme non complétés.\n\nCette action est irréversible.', true);
    
    if (confirmed) {
        
        // Réinitialiser le score
        score = 0;
        _updateScoreDisplay();
        saveScore();
        
        // Réinitialiser les niveaux complétés
        completedLevels = {};
        saveCompletedLevels();
        
        // Recharger l'affichage des niveaux pour mettre à jour les coches
        if (currentMode === 'student') {
            loadCursusLevels();
        }
        
        showResult('✅ Score et progression réinitialisés !', true);
    }
}

// ========================================
// SYSTÈME DE VERSIONING AUTOMATIQUE
// ========================================

// Incrémenter automatiquement la version d'un cursus
function incrementVersion(cursusName) {
    if (cursusData[cursusName]) {
        if (!cursusData[cursusName].version) {
            cursusData[cursusName].version = 1;
        }
        cursusData[cursusName].version++;
    }
}

// Vérifier la version des niveaux et réinitialiser si elle a changé
function checkVersionAndReset(profName) {
    // Calculer un hash de toutes les versions des cursus
    let versionHash = '';
    for (let cursus in cursusData) {
        const version = cursusData[cursus].version || 1;
        versionHash += cursus + ':' + version + ';';
    }
    
    // Clé de stockage spécifique au prof
    const versionKey = `version_${profName}`;
    const storedVersion = localStorage.getItem(versionKey);
    
    
    if (storedVersion !== versionHash) {
        
        // Sauvegarder la nouvelle version (sans reset complet)
        localStorage.setItem(versionKey, versionHash);
    } else {
    }
}

// Charger les niveaux d'un prof pour un élève
async function loadProfLevelsForStudent(profName) {
    
    try {
        const response = await fetch(`php/api.php?action=load_public&profName=${profName}`);
        
        const result = await response.json();
        
        if (result.success) {
            
            // Charger les données du prof (en JSON non chiffré depuis le serveur)
            let loadedData = result.cursusData;
            
            
            // Les données en ligne ne sont plus chiffrées
            cursusData = loadedData;
            
            // VÉRIFICATION DE VERSION : Reset automatique si version différente
            checkVersionAndReset(profName);
            
            // VÉRIFICATION CRITIQUE : s'assurer que cursusData est valide
            if (!cursusData || typeof cursusData !== 'object') {
                alert('❌ Les données chargées sont corrompues. Impossible de continuer.');
                return;
            }
            
            // Forcer le mode élève
            currentMode = 'student';
            
            // Masquer les boutons prof par ID (pas par index pour éviter de masquer les boutons élève)
            document.getElementById('save-online-btn').style.display = 'none';
            document.getElementById('load-levels-btn').style.display = 'none';
            
            // Masquer les boutons Aperçu mode élève et Création de niveaux
            const allModeBtns = document.querySelectorAll('.mode-btn');
            allModeBtns.forEach(btn => {
                if (btn.textContent.includes('Aperçu mode élève') || btn.textContent.includes('Création de niveaux')) {
                    btn.style.setProperty('display', 'none', 'important');
                }
            });
            
            // Masquer spécifiquement les boutons mobiles par ID avec !important
            const mobileStudentBtn = document.getElementById('mobile-student-mode-btn');
            const mobileTeacherBtn = document.getElementById('mobile-teacher-mode-btn');
            if (mobileStudentBtn) mobileStudentBtn.style.setProperty('display', 'none', 'important');
            if (mobileTeacherBtn) mobileTeacherBtn.style.setProperty('display', 'none', 'important');
            
            // MOBILE : Afficher le DIV élève avec les bons boutons
            const mobileStudentButtonsDiv = document.getElementById('mobile-student-buttons');
            if (mobileStudentButtonsDiv) mobileStudentButtonsDiv.style.setProperty('display', 'block', 'important');
            
            // MOBILE : Cacher le DIV professeur
            const mobileTeacherButtonsDiv = document.getElementById('mobile-teacher-buttons');
            if (mobileTeacherButtonsDiv) mobileTeacherButtonsDiv.style.setProperty('display', 'none', 'important');

            // Masquer le bouton réinitialiser (les élèves ne doivent pas pouvoir reset)
            const resetBtn = document.getElementById('reset-progress-btn');
            if (resetBtn) resetBtn.style.display = 'none';
            
            // Définir un flag global pour indiquer qu'on est en mode chargement élève
            window.isStudentLoadMode = true;
            
            // Afficher les boutons de sauvegarde élève
            const studentButtons = document.getElementById('student-save-buttons');
            if (studentButtons) {
                studentButtons.style.display = 'block';
            } else {
            }
            
            // Afficher un message discret indiquant le prof
            const headerSubtitle = document.getElementById('header-subtitle');
            headerSubtitle.textContent = `Niveaux de ${profName}`;
            headerSubtitle.style.display = 'block';
            headerSubtitle.style.opacity = '0.7';
            headerSubtitle.style.fontSize = '12px';
            
            // NE PAS appeler loadCursusLevels() ici car déjà appelé dans init()
            // loadCursusLevels(); // ❌ RETIRÉ - sera appelé par init()
            
            // Afficher la popup de bienvenue élève
            setTimeout(() => {
                checkAndShowWelcomeStudent();
            }, 500);
            
            // Mettre à jour la date d'accès côté serveur
            fetch(`php/api.php?action=access&prof=${profName}`);
        } else {
            alert('❌ Impossible de charger les niveaux de ce professeur.');
        }
    } catch (error) {
        alert('❌ Erreur de connexion au serveur: ' + error.message);
    }
}

// Vérifier si un paramètre ?prof= est présent dans l'URL
async function checkProfParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const profName = urlParams.get('prof');
    
    
    if (profName) {
        // CRITIQUE : Définir le flag IMMÉDIATEMENT avant tout appel async
        window.isStudentLoadMode = true;
        
        // IMPORTANT : Recharger les données avec les bonnes clés URL
        // Réinitialiser d'abord pour éviter toute contamination de la preview
        score = 0;
        completedLevels = {};
        _updateScoreDisplay();
        
        // Puis charger les données URL
        loadFromStorage();
        
        // Mode élève forcé avec chargement automatique des niveaux du prof
        await loadProfLevelsForStudent(profName);
    } else {
    }
}

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.resetProgress = resetProgress;
    window.incrementVersion = incrementVersion;
    window.checkVersionAndReset = checkVersionAndReset;
    window.loadProfLevelsForStudent = loadProfLevelsForStudent;
    window.checkProfParameter = checkProfParameter;
    
    
})();
