// ============================================
// MODULE: PEDAGOGICAL POPUPS
// Description: Popups pédagogiques (bienvenue, félicitations, aide)
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: currentMode, window.isStudentLoadMode
//   - Fonctions: switchMode()
// Fonctions EXPORTÉES (vers window):
//   - checkAndShowWelcomePreview(), closeWelcomePreviewModal()
//   - checkAndShowWelcomeStudent(), showCongratulationsModal()
//   - checkAndAnimateHelpButton(), etc.
// ============================================

(function() {
    'use strict';
    
    
// ========================================
// POPUPS PÉDAGOGIQUES
// ========================================

// Popup Preview Élève (à chaque chargement)
function checkAndShowWelcomePreview() {
    if (!window.isStudentLoadMode) {
        document.getElementById('welcome-preview-modal').classList.add('active');
    } else {
        // Pas de popup preview = lancer directement l'animation
        // (attendre un peu pour que la page soit bien chargée)
        setTimeout(() => {
            animatePinkArrow();
        }, 1000);
    }
}

function closeWelcomePreviewModal() {
    document.getElementById('welcome-preview-modal').classList.remove('active');
    // Lancer l'animation après fermeture de la popup
    setTimeout(() => {
        animatePinkArrow();
    }, 300);
}

function goToTeacherMode() {
    closeWelcomePreviewModal();
    switchMode('teacher');
}

// Popup URL Élève (à chaque chargement)
function checkAndShowWelcomeStudent() {
    if (window.isStudentLoadMode) {
        document.getElementById('welcome-student-modal').classList.add('active');
    }
}

function closeWelcomeStudentModal() {
    document.getElementById('welcome-student-modal').classList.remove('active');
    // Lancer l'animation après fermeture de la popup
    setTimeout(() => {
        animatePinkArrow();
    }, 300);
}

function selectCursusAndStart(cursus) {
    // Changer le cursus
    const cursusSelect = document.getElementById('cursus-select');
    if (cursusSelect) {
        cursusSelect.value = cursus;
        // Recharger les niveaux pour le nouveau cursus
        if (typeof loadCursusLevels === 'function') {
            loadCursusLevels();
        }
    }
    // Fermer la popup
    closeWelcomeStudentModal();
}

function showCongratulationsModal() {
    // Mettre à jour le score final
    document.getElementById('final-score').textContent = score;
    
    // Afficher la popup
    document.getElementById('congratulations-modal').classList.add('active');
}

function closeCongratulationsModal() {
    document.getElementById('congratulations-modal').classList.remove('active');
}

// Animation de la tortue rose
function animatePinkArrow() {
    
    // S'assurer que la grille est initialisée
    getActiveGrid();
    
    // Dessiner manuellement la tortue pour l'animation (même en mode preview)
    const arrows = ['▲', '▶', '▼', '◀'];
    const studentGrid = document.getElementById('student-grid');
    
    if (!studentGrid) {
        return;
    }
    
    // Dessiner la tortue à sa position initiale (0,0)
    if (turtle.y >= 0 && turtle.y < GRID_SIZE && turtle.x >= 0 && turtle.x < GRID_SIZE) {
        if (grid[turtle.y] && grid[turtle.y][turtle.x] && grid[turtle.y][turtle.x].element) {
            const turtleCell = grid[turtle.y][turtle.x].element;
            turtleCell.innerHTML = arrows[turtle.direction];
            turtleCell.style.fontSize = '20px';
            turtleCell.style.display = 'flex';
            turtleCell.style.alignItems = 'center';
            turtleCell.style.justifyContent = 'center';
            turtleCell.style.color = '#ff1493';
            
            
            // Attendre un court instant que le DOM soit mis à jour
            setTimeout(() => {
                
                // Retirer l'ancienne animation si elle existe
                turtleCell.classList.remove('turtle-pulse');
                
                // Forcer un reflow pour relancer l'animation
                void turtleCell.offsetWidth;
                
                // Ajouter la classe d'animation
                turtleCell.classList.add('turtle-pulse');
                
                // Retirer la classe après l'animation (2 cycles × 0.8s = 1.6s)
                setTimeout(() => {
                    turtleCell.classList.remove('turtle-pulse');
                }, 1600);
            }, 100);
        } else {
        }
    } else {
    }
}

// Popup Aide Mode Création
function showHelpTeacherModal() {
    document.getElementById('help-teacher-modal').classList.add('active');
}

function closeHelpTeacherModal() {
    document.getElementById('help-teacher-modal').classList.remove('active');
}

// Vérifier si on doit montrer l'animation du bouton aide (à chaque fois)
function checkAndAnimateHelpButton() {
    if (currentMode === 'teacher') {
        // Animer le bouton d'aide à CHAQUE chargement
        setTimeout(() => {
            const helpBtn = document.getElementById('help-button');
            if (helpBtn) {
                // Animation super visible : 3 rebonds pendant 3 secondes
                helpBtn.style.animation = 'attention-grab 3s ease-out 1';
                
                // Retirer l'animation après pour pouvoir la rejouer
                setTimeout(() => {
                    helpBtn.style.animation = 'none';
                }, 3000);
            }
        }, 500);
    }
}


    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.checkAndShowWelcomePreview = checkAndShowWelcomePreview;
    window.closeWelcomePreviewModal = closeWelcomePreviewModal;
    window.goToTeacherMode = goToTeacherMode;
    window.checkAndShowWelcomeStudent = checkAndShowWelcomeStudent;
    window.closeWelcomeStudentModal = closeWelcomeStudentModal;
    window.selectCursusAndStart = selectCursusAndStart;
    window.showCongratulationsModal = showCongratulationsModal;
    window.closeCongratulationsModal = closeCongratulationsModal;
    window.animatePinkArrow = animatePinkArrow;
    window.showHelpTeacherModal = showHelpTeacherModal;
    window.closeHelpTeacherModal = closeHelpTeacherModal;
    window.checkAndAnimateHelpButton = checkAndAnimateHelpButton;
    
    
})();
