// ============================================
// MODULE: ONLINE SAVE MANAGER
// Description: Système de sauvegarde en ligne des niveaux
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: cursusData, generatedPassword
//   - Fonctions: saveLevel(), showResult(), loadTeacherLevels()
// Fonctions EXPORTÉES (vers window):
//   - saveLevelBeforeOnline(), openSaveOnlineModal(), closeSaveOnlineModal()
//   - openDeleteOnlineModal(), filterProfessors(), copyStudentLink()
// ============================================

(function() {
    'use strict';
    
    
// ========================================
// SYSTÈME DE SAUVEGARDE EN LIGNE
// ========================================

let captchaNum1, captchaNum2, captchaAnswer;
let generatedPassword = '';

// Générer un code aléatoire de 8 caractères
function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans O, 0, I, 1 pour éviter confusion
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Copier le mot de passe dans le presse-papier
function copyPassword() {
    const passwordInput = document.getElementById('save-password');
    passwordInput.select();
    document.execCommand('copy');
    
    // Feedback visuel
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✅ Copié !';
    button.style.background = '#4CAF50';
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#2196F3';
    }, 2000);
}

// Générer un nouveau captcha
function generateCaptcha() {
    captchaNum1 = Math.floor(Math.random() * 10) + 1;
    captchaNum2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = captchaNum1 + captchaNum2;
    document.getElementById('captcha-question').textContent = `${captchaNum1} + ${captchaNum2} =`;
}

// Sauvegarder le niveau en cours puis ouvrir le modal de sauvegarde en ligne
function saveLevelBeforeOnline() {
    const levelSelect = document.getElementById('teacher-level-select');
    
    // Si un niveau est en cours d'édition (pas "new"), le sauvegarder d'abord
    if (levelSelect && levelSelect.value !== 'new') {
        // Vérifier qu'il y a des blocs dans le programme
        const programBlocks = document.getElementById('program-blocks');
        const blocks = programBlocks.querySelectorAll(':scope > .program-block');
        
        if (blocks.length > 0) {
            // Sauvegarder le niveau en cours dans cursusData
            saveLevel();
        }
    }
    
    // Ouvrir le modal de sauvegarde en ligne
    openSaveOnlineModal();
}

// Ouvrir le modal de sauvegarde
function openSaveOnlineModal() {
    document.getElementById('save-online-modal').classList.add('active');
    document.getElementById('save-prof-name').value = '';
    document.getElementById('captcha-answer').value = '';
    document.getElementById('save-message').innerHTML = '';
    document.getElementById('success-url').style.display = 'none';
    
    // Réinitialiser les boutons (au cas où on aurait sauvegardé avant)
    const buttonsDiv = document.getElementById('save-modal-buttons');
    buttonsDiv.innerHTML = `
        <button class="btn-confirm" onclick="confirmSaveOnline()">💾 Sauvegarder</button>
        <button class="btn-cancel" onclick="closeSaveOnlineModal()">Annuler</button>
    `;
    
    // Générer un nouveau code
    generatedPassword = generatePassword();
    document.getElementById('save-password').value = generatedPassword;
    
    generateCaptcha();
}

// Fermer le modal de sauvegarde
function closeSaveOnlineModal() {
    document.getElementById('save-online-modal').classList.remove('active');
}

// Ouvrir le modal de chargement
// Variables globales pour le tracking des modifications
let loadedProfName = null;
let hasModifications = false;

// Ouvrir le modal de chargement des niveaux
async function openLoadOnlineModal() {
    document.getElementById('load-online-modal').classList.add('active');
    document.getElementById('search-prof-name').value = '';
    document.getElementById('load-message').innerHTML = '';
    
    // Charger la liste des professeurs
    await loadProfessorsList();
}

// Fermer le modal de chargement
function closeLoadOnlineModal() {
    document.getElementById('load-online-modal').classList.remove('active');
}

// Charger la liste de tous les professeurs
async function loadProfessorsList() {
    const listDiv = document.getElementById('professors-list');
    listDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Chargement...</div>';
    
    try {
        const response = await fetch('php/api.php?action=list_professors');
        const result = await response.json();
        
        if (result.success && result.professors && result.professors.length > 0) {
            listDiv.innerHTML = '';
            result.professors.forEach(prof => {
                const profDiv = document.createElement('div');
                profDiv.className = 'professor-item';
                profDiv.style.cssText = 'padding: 12px; margin: 5px 0; background: white; border: 2px solid #E0E0E0; border-radius: 6px; cursor: pointer; transition: all 0.2s;';
                profDiv.innerHTML = `
                    <div style="font-weight: bold; font-size: 14px; color: #1976D2;">👤 ${prof}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Cliquez pour charger les niveaux</div>
                `;
                profDiv.onmouseover = () => {
                    profDiv.style.background = '#E3F2FD';
                    profDiv.style.borderColor = '#2196F3';
                };
                profDiv.onmouseout = () => {
                    profDiv.style.background = 'white';
                    profDiv.style.borderColor = '#E0E0E0';
                };
                profDiv.onclick = () => loadProfessorLevels(prof);
                listDiv.appendChild(profDiv);
            });
        } else {
            listDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Aucun professeur trouvé</div>';
        }
    } catch (error) {
        listDiv.innerHTML = '<div style="text-align: center; color: #f44336; padding: 20px;">❌ Erreur de chargement</div>';
    }
}

// Filtrer la liste des professeurs
function filterProfessors() {
    const searchValue = document.getElementById('search-prof-name').value.toLowerCase();
    const items = document.querySelectorAll('.professor-item');
    
    items.forEach(item => {
        const profName = item.textContent.toLowerCase();
        if (profName.includes(searchValue)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Charger les niveaux d'un professeur
async function loadProfessorLevels(profName) {
    const messageDiv = document.getElementById('load-message');
    messageDiv.innerHTML = '<div class="info-box">⏳ Chargement en cours...</div>';
    
    try {
        const response = await fetch(`php/api.php?action=load_public&profName=${profName}`);
        const result = await response.json();
        
        if (result.success) {
            // Charger les données
            cursusData = result.cursusData;
            saveToStorage();
            loadTeacherLevels();
            
            // Marquer comme chargé et sans modifications
            loadedProfName = profName;
            hasModifications = false;
            updateCopyLinkButton();
            
            messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Niveaux chargés avec succès !</div>';
            
            setTimeout(() => {
                closeLoadOnlineModal();
                showResult(`✅ Niveaux de ${profName} chargés !`, true);
            }, 1500);
        } else {
            messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error-message">❌ Erreur de chargement</div>';
    }
}

// Mettre à jour la visibilité du bouton "Copier lien élève"
function updateCopyLinkButton() {
    const copyBtn = document.getElementById('copy-student-link-btn');
    const deleteBtn = document.getElementById('delete-online-btn');
    const mobileCopyBtn = document.getElementById('mobile-copy-student-link-btn');
    const mobileDeleteBtn = document.getElementById('mobile-delete-online-btn');
    
    
    if (loadedProfName && !hasModifications) {
        copyBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        // Utiliser setProperty avec !important pour surcharger le CSS
        if (mobileCopyBtn) mobileCopyBtn.style.setProperty('display', 'block', 'important');
        if (mobileDeleteBtn) mobileDeleteBtn.style.setProperty('display', 'block', 'important');
    } else {
        copyBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        // Utiliser setProperty avec !important pour surcharger le CSS
        if (mobileCopyBtn) mobileCopyBtn.style.setProperty('display', 'none', 'important');
        if (mobileDeleteBtn) mobileDeleteBtn.style.setProperty('display', 'none', 'important');
    }
    
    
    // Synchroniser aussi les boutons sauvegarder/charger en ligne mobile
    syncMobileTeacherButtons();
}

// Copier le lien élève
function copyStudentLink() {
    if (!loadedProfName) {
        alert('❌ Aucun niveau chargé');
        return;
    }
    
    const studentUrl = `https://www.lejardindesoiseaux.com/jeumotif/index.html?prof=${loadedProfName}`;
    
    // Copier dans le presse-papier
    navigator.clipboard.writeText(studentUrl).then(() => {
        const btn = document.getElementById('copy-student-link-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copié !';
        btn.style.background = '#4CAF50';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#FF9800';
        }, 2000);
    }).catch(err => {
        alert('Lien élève:\n' + studentUrl);
    });
}

// Ouvrir le modal de suppression
function openDeleteOnlineModal() {
    if (!loadedProfName) {
        alert('❌ Aucune sauvegarde chargée');
        return;
    }
    document.getElementById('delete-online-modal').classList.add('active');
    document.getElementById('delete-password').value = '';
    document.getElementById('delete-message').innerHTML = '';
}

// Fermer le modal de suppression
function closeDeleteOnlineModal() {
    document.getElementById('delete-online-modal').classList.remove('active');
}

// Confirmer la suppression
async function confirmDeleteOnline() {
    const password = document.getElementById('delete-password').value;
    const messageDiv = document.getElementById('delete-message');
    
    if (!password) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez entrer votre code de sécurité</div>';
        return;
    }
    
    if (!loadedProfName) {
        messageDiv.innerHTML = '<div class="error-message">❌ Erreur : aucun nom de professeur</div>';
        return;
    }
    
    // Confirmation finale
    const confirmText = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer DÉFINITIVEMENT tous les niveaux de "${loadedProfName}".\n\nCette action est IRRÉVERSIBLE.\n\nVoulez-vous vraiment continuer ?`;
    if (!confirm(confirmText)) {
        return;
    }
    
    messageDiv.innerHTML = '<div class="info-box">⏳ Suppression en cours...</div>';
    
    try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('profName', loadedProfName);
        formData.append('password', password);
        
        const response = await fetch('php/api.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Sauvegarde supprimée avec succès !</div>';
            
            // Réinitialiser les variables
            loadedProfName = null;
            hasModifications = false;
            updateCopyLinkButton();
            
            setTimeout(() => {
                closeDeleteOnlineModal();
                showResult('✅ Votre sauvegarde en ligne a été supprimée', true);
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion au serveur</div>';
    }
}

// Marquer qu'il y a eu des modifications (à appeler quand on modifie un niveau)
function markAsModified() {
    hasModifications = true;
    updateCopyLinkButton();
}

// Confirmer le chargement en ligne (ancienne méthode avec mot de passe - gardée pour compatibilité)
async function confirmLoadOnline() {
    // Cette fonction n'est plus utilisée mais gardée pour éviter les erreurs
}

// Confirmer la sauvegarde en ligne
async function confirmSaveOnline() {
    const profName = document.getElementById('save-prof-name').value.trim();
    let password = document.getElementById('save-password').value; // Changé en let pour pouvoir réassigner
    const captchaUserAnswer = document.getElementById('captcha-answer').value;
    const messageDiv = document.getElementById('save-message');

    // Validations
    if (!profName) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez entrer votre nom</div>';
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(profName)) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Le nom ne peut contenir que des lettres, chiffres, tirets et underscores</div>';
        return;
    }
    
    // Vérification de profanité
    if (!PROFANITY_FILTER.isClean(profName)) {
        const errorMsg = PROFANITY_FILTER.getErrorMessage(profName);
        messageDiv.innerHTML = `<div class="error-message">⚠️ ${errorMsg}</div>`;
        return;
    }

    if (parseInt(captchaUserAnswer) !== captchaAnswer) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Captcha incorrect</div>';
        generateCaptcha();
        return;
    }

    // Vérifier qu'il y a des niveaux à sauvegarder
    const hasLevels = Object.values(cursusData).some(cursus => {
        if (Array.isArray(cursus)) {
            return cursus.length > 0;
        } else if (cursus.levels) {
            return Object.keys(cursus.levels).length > 0;
        }
        return false;
    });
    if (!hasLevels) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Vous devez créer au moins un niveau avant de sauvegarder</div>';
        return;
    }

    // Vérifier si un fichier existe déjà (pour demander le mot de passe)
    try {
        const checkResponse = await fetch(`php/api.php?action=check&profName=${profName}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
            // Un fichier existe : demander le mot de passe pour vérifier
            const existingPassword = prompt('⚠️ Ce nom est déjà utilisé !\n\nPour écraser cette sauvegarde, entrez le code de sécurité associé à ce nom :\n\n(Annuler pour revenir)');
            
            if (!existingPassword) {
                // L'utilisateur a annulé
                messageDiv.innerHTML = '<div class="error-message">⚠️ Sauvegarde annulée</div>';
                return;
            }
            
            // Vérifier que le mot de passe correspond
            const verifyFormData = new FormData();
            verifyFormData.append('action', 'verify_password');
            verifyFormData.append('profName', profName);
            verifyFormData.append('password', existingPassword);
            
            const verifyResponse = await fetch('php/api.php', {
                method: 'POST',
                body: verifyFormData
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (!verifyResult.success) {
                messageDiv.innerHTML = '<div class="error-message">❌ Code de sécurité incorrect. Impossible d\'écraser cette sauvegarde.</div>';
                return;
            }
            
            // Le mot de passe est correct, on peut continuer
            // Utiliser le mot de passe existant pour la sauvegarde
            password = existingPassword;
        }
    } catch (error) {
        // Si erreur de vérification, continuer quand même
    }

    // Afficher un message de chargement
    messageDiv.innerHTML = '<div class="info-box">⏳ Sauvegarde en cours...</div>';

    try {
        // NE PAS chiffrer les données en ligne (pour compatibilité)
        // Le localStorage reste chiffré pour la protection locale
        
        // Préparer les données
        const formData = new FormData();
        formData.append('action', 'save');
        formData.append('profName', profName);
        formData.append('password', password);
        formData.append('captchaAnswer', captchaUserAnswer);
        formData.append('captchaExpected', captchaAnswer);
        formData.append('cursusData', JSON.stringify(cursusData)); // Envoyer en JSON non chiffré

        // Envoyer au serveur
        const response = await fetch('php/api.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ ' + result.message + '</div>';
            const urlDiv = document.getElementById('success-url');
            urlDiv.style.display = 'block';
            urlDiv.innerHTML = `
                <strong>🎉 Votre page est prête !</strong><br><br>
                Partagez ce lien avec vos élèves :<br>
                <a href="https://${result.url}" target="_blank">https://${result.url}</a>
                <br><br>
                <small>💡 Vous pouvez modifier vos niveaux à tout moment en rechargeant cette page et en cliquant sur "Charger les niveaux"</small>
            `;
            
            // Activer le bouton "Copier lien élève"
            loadedProfName = result.profName;
            hasModifications = false;
            updateCopyLinkButton();
            
            // Remplacer les boutons par un seul bouton "Fermer"
            const buttonsDiv = document.getElementById('save-modal-buttons');
            buttonsDiv.innerHTML = '<button class="btn-confirm" onclick="closeSaveOnlineModal()" style="width: 100%;">✅ Fermer</button>';
        } else {
            messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
            generateCaptcha(); // Regénérer le captcha en cas d'erreur
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion au serveur</div>';
        generateCaptcha();
    }
}

// Confirmer le chargement en ligne
async function confirmLoadOnline() {
    const profName = document.getElementById('load-prof-name').value.trim();
    const password = document.getElementById('load-password').value;
    const messageDiv = document.getElementById('load-message');

    // Validations
    if (!profName || !password) {
        messageDiv.innerHTML = '<div class="error-message">⚠️ Veuillez remplir tous les champs</div>';
        return;
    }

    // Afficher un message de chargement
    messageDiv.innerHTML = '<div class="info-box">⏳ Chargement en cours...</div>';

    try {
        // Préparer les données
        const formData = new FormData();
        formData.append('action', 'load');
        formData.append('profName', profName);
        formData.append('password', password);

        // Envoyer au serveur
        const response = await fetch('php/api.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Charger les données dans l'application
            cursusData = result.cursusData;
            saveToStorage(); // Sauvegarder localement aussi
            loadTeacherLevels(); // Recharger l'interface
            
            messageDiv.innerHTML = '<div class="info-box" style="background: #E8F5E9; border-color: #4CAF50; color: #2E7D32;">✅ Niveaux chargés avec succès !</div>';
            
            setTimeout(() => {
                closeLoadOnlineModal();
                showResult('✅ Vos niveaux ont été chargés !', true);
            }, 1500);
        } else {
            messageDiv.innerHTML = '<div class="error-message">❌ ' + result.message + '</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion au serveur</div>';
    }
}

// Initialiser l'application
// Nettoyer tous les programmes élèves sauvegardés
// Fonction clearAllStudentPrograms déplacée vers js/studentProgramStorage.js

window.onload = async function() {
    
    // NE PLUS nettoyer automatiquement les programmes élèves au démarrage
    // car cela efface les programmes des élèves à chaque rechargement !
    // clearAllStudentPrograms(); // ❌ RETIRÉ
    
    // IMPORTANT : Vérifier le paramètre ?prof= AVANT init()
    // pour que window.isStudentLoadMode soit défini avant loadLevel()
    await checkProfParameter();
    
    init();
    // Initialiser l'affichage du header selon la résolution
    updateModeDisplay();
    
    // Vérifier si on doit afficher la popup de bienvenue preview
    setTimeout(() => {
        checkAndShowWelcomePreview();
    }, 500);
};


    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.generatePassword = generatePassword;
    window.copyPassword = copyPassword;
    window.generateCaptcha = generateCaptcha;
    window.saveLevelBeforeOnline = saveLevelBeforeOnline;
    window.openSaveOnlineModal = openSaveOnlineModal;
    window.closeSaveOnlineModal = closeSaveOnlineModal;
    window.confirmSaveOnline = confirmSaveOnline;
    window.openLoadOnlineModal = openLoadOnlineModal;
    window.closeLoadOnlineModal = closeLoadOnlineModal;
    window.confirmLoadOnline = confirmLoadOnline;
    window.loadProfessorsList = loadProfessorsList;
    window.loadProfessorLevels = loadProfessorLevels;
    window.filterProfessors = filterProfessors;
    window.updateCopyLinkButton = updateCopyLinkButton;
    window.copyStudentLink = copyStudentLink;
    window.openDeleteOnlineModal = openDeleteOnlineModal;
    window.closeDeleteOnlineModal = closeDeleteOnlineModal;
    window.confirmDeleteOnline = confirmDeleteOnline;
    window.markAsModified = markAsModified;
    
    
})();
