// ============================================
// MODULE: VALIDATION MANAGER
// Description: Validation des inputs numériques dans les blocs
// Dépendances ENTRANTES (doivent exister dans app-new.js ou modules):
//   - Variables globales: variables
//   - Fonctions: executeProgram() (juste pour référence dans querySelectorAll)
// Fonctions EXPORTÉES (vers window):
//   - setupNumericInputValidation()
//   - validateNumericInput()
//   - isValidNumber()
//   - checkAllInputsValidity()
// ============================================

(function() {
    'use strict';
    
    
function setupNumericInputValidation(blockElement) {
    // Attraper TOUS les inputs : dans le bloc ET dans les value-slots
    const inputs = blockElement.querySelectorAll('input[type="text"], input[type="number"]');
    
    inputs.forEach(input => {
        // Vérifier si déjà initialisé pour éviter les doublons
        if (input.dataset.validationInitialized === 'true') {
            return; // Déjà fait, passer au suivant
        }
        
        // Marquer comme initialisé
        input.dataset.validationInitialized = 'true';
        
        // Ignorer les inputs qui ont un placeholder mais pas de value (sélection de variable)
        const placeholder = input.placeholder;
        if (placeholder && (placeholder === 'a' || placeholder === 'b' || placeholder === 'valeur')) {
            // C'est un input pour value-slot qui peut recevoir variable/opérateur
            // On doit quand même le valider s'il contient un nombre
        }
        
        // Sauvegarder la valeur initiale
        let previousValue = input.value || '10';
        
        // Enlever pattern et inputmode restrictifs pour permettre les négatifs
        input.removeAttribute('pattern');
        
        // Au focus : sélectionner tout le texte
        input.addEventListener('focus', function() {
            this.select();
            previousValue = this.value;
        });
        
        // À chaque saisie : valider en temps réel
        input.addEventListener('input', function() {
            validateNumericInput(this);
        });
        
        // Au blur : restaurer si invalide
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            
            // Si vide, restaurer la valeur précédente
            if (value === '') {
                this.value = previousValue;
                this.style.background = '';
                this.style.border = '';
                checkAllInputsValidity();
                return;
            }
            
            // Déterminer les limites selon le type de bloc
            const block = this.closest('.block');
            let minValue = 1;
            let maxValue = 100;
            
            if (block && (block.classList.contains('variables') || 
                         block.classList.contains('operators') || 
                         block.classList.contains('sensing'))) {
                minValue = -10000;
                maxValue = 10000;
            }
            
            // Si invalide, restaurer la valeur précédente
            if (!isValidNumber(value, minValue, maxValue)) {
                this.value = previousValue;
                this.style.background = '';
                this.style.border = '';
                checkAllInputsValidity();
            } else {
                // Valide, sauvegarder comme nouvelle valeur précédente
                previousValue = this.value;
                this.style.background = '';
                this.style.border = '';
                checkAllInputsValidity();
            }
        });
    });
}

// Valider un input numérique
function validateNumericInput(input) {
    const value = input.value.trim();
    
    // Vide = en attente, jaune léger
    if (value === '') {
        input.style.background = '#FFF9C4'; // Jaune léger
        input.style.border = '2px solid #FBC02D';
        checkAllInputsValidity();
        return;
    }
    
    // Déterminer les limites selon le type de bloc
    const block = input.closest('.block');
    let minValue = 1;
    let maxValue = 100;
    
    // Blocs variables, opérateurs, condition : limites étendues
    if (block && (block.classList.contains('variables') || 
                 block.classList.contains('operators') || 
                 block.classList.contains('sensing'))) {
        minValue = -10000;
        maxValue = 10000;
    }
    
    // Valider
    if (!isValidNumber(value, minValue, maxValue)) {
        // Invalide = rouge
        input.style.background = '#FFCDD2';
        input.style.border = '2px solid #F44336';
    } else {
        // Valide = style normal (blanc)
        input.style.background = '';
        input.style.border = '';
    }
    
    checkAllInputsValidity();
}

// Vérifier si une valeur est un nombre valide
function isValidNumber(value, minValue = 1, maxValue = 100) {
    // Autoriser les nombres négatifs si minValue est négatif
    const pattern = minValue < 0 ? /^-?\d+$/ : /^\d+$/;
    
    // Doit être un nombre (avec - optionnel si négatif autorisé)
    if (!pattern.test(value)) {
        return false;
    }
    
    const num = parseInt(value, 10);
    
    // Doit être dans les limites
    if (isNaN(num) || num < minValue || num > maxValue) {
        return false;
    }
    
    return true;
}

// Vérifier tous les inputs du programme
function checkAllInputsValidity() {
    const programBlocks = document.getElementById('program-blocks');
    // TOUS les inputs text et number
    const allInputs = programBlocks.querySelectorAll('input[type="text"], input[type="number"]');
    
    let hasInvalidInput = false;
    
    allInputs.forEach(input => {
        const value = input.value.trim();
        
        // Si vide, ignorer (sera géré au blur)
        if (value === '') {
            hasInvalidInput = true;
            return;
        }
        
        // Ignorer si ce n'est pas un nombre (peut-être une variable ou opérateur inséré)
        if (!/^-?\d+$/.test(value)) {
            return;
        }
        
        // Déterminer les limites selon le type de bloc
        const block = input.closest('.block');
        let minValue = 1;
        let maxValue = 100;
        
        // Blocs variables, opérateurs, condition : limites étendues
        if (block && (block.classList.contains('variables') || 
                     block.classList.contains('operators') || 
                     block.classList.contains('sensing'))) {
            minValue = -10000;
            maxValue = 10000;
        }
        
        // Vérifier la validité
        if (!isValidNumber(value, minValue, maxValue)) {
            hasInvalidInput = true;
        }
    });
    
    // Griser/activer TOUS les boutons "Tester"
    const runButtons = document.querySelectorAll('button[onclick="executeProgram()"]');
    runButtons.forEach(runButton => {
        if (hasInvalidInput) {
            runButton.disabled = true;
            runButton.style.opacity = '0.5';
            runButton.style.cursor = 'not-allowed';
            runButton.title = 'Corrigez les valeurs invalides avant de tester';
        } else {
            runButton.disabled = false;
            runButton.style.opacity = '1';
            runButton.style.cursor = 'pointer';
            runButton.title = '';
        }
    });
}

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.setupNumericInputValidation = setupNumericInputValidation;
    window.validateNumericInput = validateNumericInput;
    window.isValidNumber = isValidNumber;
    window.checkAllInputsValidity = checkAllInputsValidity;
    
    
})();
