// ============================================
// MODULE: AUTO LEVEL CREATOR
// Description: Système de génération automatique de niveaux
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: cursusData, PATTERNS, MAX_TOTAL_LEVELS, MAX_LEVELS_PER_INPUT_ALL, MAX_LEVELS_PER_INPUT_SINGLE
//   - Fonctions: generateRandomPattern(), setSelectedPattern(), clearProgram(), saveCursusData(), loadTeacherLevels()
// Fonctions EXPORTÉES (vers window):
//   - customConfirm(), openAutoCreateModal(), closeAutoCreateModal()
//   - generateWorldsAutomatically()
// ============================================

(function() {
    'use strict';
    
    
function customConfirm(message, isDangerous = false) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-confirm-overlay');
        const modal = document.getElementById('custom-confirm-modal');
        const messageDiv = document.getElementById('custom-confirm-message');
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');
        
        messageDiv.textContent = message;
        overlay.style.display = 'block';
        modal.style.display = 'block';
        
        // Changer la couleur du bouton selon le danger
        if (isDangerous) {
            okBtn.style.background = '#dc3545'; // Rouge pour danger
        } else {
            okBtn.style.background = '#4CAF50'; // Vert pour normal
        }
        
        const handleOk = () => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };
        
        const handleCancel = () => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

function openAutoCreateModal() {
    const modal = document.getElementById('auto-create-modal');
    
    // Synchroniser le cursus avec le select principal (par défaut)
    const currentCursus = document.getElementById('teacher-cursus-select').value;
    document.getElementById('auto-cursus-select').value = currentCursus;
    
    // Initialiser la configuration
    autoCreateConfig = {
        numWorlds: 3,
        levelsPerWorld: 10,
        worlds: []
    };
    
    // Initialiser les mondes avec des valeurs par défaut
    for (let i = 0; i < 3; i++) {
        autoCreateConfig.worlds.push({
            pointsRequired: i === 0 ? 0 : 10 * i,
            difficulty1: Math.floor(autoCreateConfig.levelsPerWorld / 3),
            difficulty2: Math.floor(autoCreateConfig.levelsPerWorld / 3),
            difficulty3: autoCreateConfig.levelsPerWorld - 2 * Math.floor(autoCreateConfig.levelsPerWorld / 3)
        });
    }
    
    document.getElementById('auto-num-worlds').value = autoCreateConfig.numWorlds;
    document.getElementById('auto-levels-per-world').value = autoCreateConfig.levelsPerWorld;
    
    // Initialiser les limites selon le cursus
    updateAutoLimits();
    
    modal.classList.add('active');
    
    // Ajouter la sélection automatique sur tous les inputs number de la modal
    setTimeout(() => {
        const numberInputs = modal.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.select();
            });
        });
    }, 100);
}

// Mettre à jour les limites des compteurs selon le cursus sélectionné
function updateAutoLimits() {
    const cursusSelect = document.getElementById('auto-cursus-select');
    const numWorldsInput = document.getElementById('auto-num-worlds');
    const levelsPerWorldInput = document.getElementById('auto-levels-per-world');
    
    const isAll = cursusSelect.value === 'all';
    
    // Cursus "Tous" = max 100 par compteur (car × 3 cursus)
    // Cursus individuel = max MAX_TOTAL_LEVELS
    numWorldsInput.max = isAll ? MAX_LEVELS_PER_INPUT_ALL : MAX_LEVELS_PER_INPUT_SINGLE;
    levelsPerWorldInput.max = isAll ? MAX_LEVELS_PER_INPUT_ALL : MAX_LEVELS_PER_INPUT_SINGLE;
    
    // Ajuster les valeurs si elles dépassent la nouvelle limite
    if (parseInt(numWorldsInput.value) > parseInt(numWorldsInput.max)) {
        numWorldsInput.value = numWorldsInput.max;
    }
    if (parseInt(levelsPerWorldInput.value) > parseInt(levelsPerWorldInput.max)) {
        levelsPerWorldInput.value = levelsPerWorldInput.max;
    }
    
    updateAutoWorldsConfig();
}

function updateAutoWorldsConfig(shouldUpdatePoints = true) {
    const cursusSelect = document.getElementById('auto-cursus-select');
    const numWorldsInput = document.getElementById('auto-num-worlds');
    const levelsPerWorldInput = document.getElementById('auto-levels-per-world');
    const numWorlds = parseInt(numWorldsInput.value);
    const levelsPerWorld = parseInt(levelsPerWorldInput.value);
    
    // Calculer le multiplicateur selon le cursus
    const isAll = cursusSelect.value === 'all';
    const multiplier = isAll ? 3 : 1; // "Tous" = 3 cursus
    
    // VALIDATION : Vérifier que le total ne dépasse pas MAX_TOTAL_LEVELS niveaux
    const totalLevels = numWorlds * levelsPerWorld * multiplier;
    if (totalLevels > MAX_TOTAL_LEVELS) {
        numWorldsInput.style.border = '2px solid #FF0000';
        numWorldsInput.style.background = '#FFE0E0';
        levelsPerWorldInput.style.border = '2px solid #FF0000';
        levelsPerWorldInput.style.background = '#FFE0E0';
        const cursusInfo = isAll ? ` × 3 cursus` : '';
        alert(`❌ Limite dépassée !\n\n${numWorlds} mondes × ${levelsPerWorld} niveaux/monde${cursusInfo} = ${totalLevels} niveaux\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux au total.\n\nLes valeurs ont été ajustées automatiquement.`);
        
        // Ajuster automatiquement les valeurs
        // Stratégie : réduire levelsPerWorld en priorité
        let adjustedLevelsPerWorld = Math.floor(MAX_TOTAL_LEVELS / (numWorlds * multiplier));
        if (adjustedLevelsPerWorld < 1) {
            // Si même avec 1 niveau par monde c'est trop, réduire le nombre de mondes
            adjustedLevelsPerWorld = 1;
            const adjustedNumWorlds = Math.floor(MAX_TOTAL_LEVELS / multiplier);
            numWorldsInput.value = adjustedNumWorlds;
        }
        levelsPerWorldInput.value = adjustedLevelsPerWorld;
        
        // Réinitialiser les styles
        numWorldsInput.style.border = '2px solid #E0E0E0';
        numWorldsInput.style.background = 'white';
        levelsPerWorldInput.style.border = '2px solid #E0E0E0';
        levelsPerWorldInput.style.background = 'white';
        
        // Utiliser les valeurs ajustées pour la suite
        autoCreateConfig.numWorlds = parseInt(numWorldsInput.value);
        autoCreateConfig.levelsPerWorld = parseInt(levelsPerWorldInput.value);
    } else {
        // Réinitialiser les styles si OK
        numWorldsInput.style.border = '2px solid #E0E0E0';
        numWorldsInput.style.background = 'white';
        levelsPerWorldInput.style.border = '2px solid #E0E0E0';
        levelsPerWorldInput.style.background = 'white';
        
        autoCreateConfig.numWorlds = numWorlds;
        autoCreateConfig.levelsPerWorld = levelsPerWorld;
    }
    
    // Ajuster le tableau des mondes
    while (autoCreateConfig.worlds.length < numWorlds) {
        const worldIndex = autoCreateConfig.worlds.length;
        autoCreateConfig.worlds.push({
            pointsRequired: worldIndex === 0 ? 0 : 10 * worldIndex,
            difficulty1: Math.floor(levelsPerWorld / 3),
            difficulty2: Math.floor(levelsPerWorld / 3),
            difficulty3: levelsPerWorld - 2 * Math.floor(levelsPerWorld / 3)
        });
    }
    autoCreateConfig.worlds = autoCreateConfig.worlds.slice(0, numWorlds);
    
    // Mettre à jour les valeurs pour correspondre au nouveau levelsPerWorld
    autoCreateConfig.worlds.forEach((world, i) => {
        const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
        if (total !== levelsPerWorld) {
            // Répartir équitablement
            world.difficulty1 = Math.floor(levelsPerWorld / 3);
            world.difficulty2 = Math.floor(levelsPerWorld / 3);
            world.difficulty3 = levelsPerWorld - 2 * Math.floor(levelsPerWorld / 3);
        }
        
        // AJUSTEMENT AUTOMATIQUE DES POINTS REQUIS
        if (shouldUpdatePoints && i > 0) {
            const previousLevels = i * levelsPerWorld;
            const maxPointsAvailable = previousLevels * 2;
            
            // Utiliser la formule incrémentale : (levelsPerWorld + 1) × index
            // Monde 2 : (10 + 1) × 1 = 11
            // Monde 3 : (10 + 1) × 2 = 22
            const recommendedPoints = (levelsPerWorld + 1) * i;
            
            // Si les points actuels dépassent le max OU si shouldUpdatePoints = true, ajuster
            if (world.pointsRequired > maxPointsAvailable || shouldUpdatePoints) {
                // Utiliser les points recommandés s'ils sont atteignables, sinon le max
                world.pointsRequired = Math.min(recommendedPoints, maxPointsAvailable);
            }
        }
    });
    
    // Mettre à jour les champs de configuration rapide pour refléter la nouvelle répartition
    if (autoCreateConfig.worlds.length > 0) {
        document.getElementById('quick-diff1').value = autoCreateConfig.worlds[0].difficulty1;
        document.getElementById('quick-diff2').value = autoCreateConfig.worlds[0].difficulty2;
        document.getElementById('quick-diff3').value = autoCreateConfig.worlds[0].difficulty3;
        
        // Ajuster les points requis SEULEMENT si shouldUpdatePoints = true
        if (shouldUpdatePoints) {
            document.getElementById('quick-points').value = levelsPerWorld + 1;
        }
    }
    
    // Générer l'interface
    const configDiv = document.getElementById('auto-worlds-config');
    configDiv.innerHTML = '';
    
    for (let i = 0; i < numWorlds; i++) {
        const worldDiv = document.createElement('div');
        worldDiv.style.cssText = 'margin-bottom: 15px; padding: 12px; background: white; border-radius: 4px; border: 2px solid #E0E0E0;';
        
        // Titre du monde
        const worldTitle = document.createElement('div');
        worldTitle.style.cssText = 'font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #1976D2;';
        worldTitle.textContent = `🌍 Monde ${i + 1}`;
        worldDiv.appendChild(worldTitle);
        
        // Points requis
        const pointsDiv = document.createElement('div');
        pointsDiv.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
        
        const pointsLabel = document.createElement('label');
        pointsLabel.style.cssText = 'font-size: 12px; min-width: 120px;';
        pointsLabel.textContent = 'Points requis:';
        
        const pointsInput = document.createElement('input');
        pointsInput.type = 'number';
        pointsInput.min = '0';
        pointsInput.max = '10000';
        pointsInput.value = autoCreateConfig.worlds[i].pointsRequired;
        pointsInput.style.cssText = 'width: 80px; padding: 4px; border: 2px solid #E0E0E0; border-radius: 4px; font-size: 12px;';
        pointsInput.disabled = i === 0;
        
        // Ajouter la sélection automatique au focus
        pointsInput.addEventListener('focus', function() {
            this.select();
        });
        
        pointsInput.onchange = () => {
            const newPoints = parseInt(pointsInput.value) || 0;
            
            // Vérifier que les points sont atteignables (seulement pour monde 2+)
            if (i > 0) {
                // Calculer le maximum de points disponibles dans les mondes précédents
                const previousLevels = i * levelsPerWorld;
                const maxPointsAvailable = previousLevels * 2; // 2 points max par niveau
                
                if (newPoints > maxPointsAvailable) {
                    pointsInput.style.border = '2px solid #FF0000';
                    pointsInput.style.background = '#FFE0E0';
                    alert(`❌ Impossible !\n\nPour débloquer le Monde ${i + 1}, vous demandez ${newPoints} points.\n\nMais les ${previousLevels} niveaux des mondes précédents donnent au maximum ${maxPointsAvailable} points (${previousLevels} × 2).\n\nLe maximum atteignable est ${maxPointsAvailable} points.`);
                    pointsInput.value = autoCreateConfig.worlds[i].pointsRequired;
                    return;
                }
                
                // Réinitialiser le style si OK
                pointsInput.style.border = '2px solid #E0E0E0';
                pointsInput.style.background = 'white';
            }
            
            autoCreateConfig.worlds[i].pointsRequired = newPoints;
        };
        
        pointsDiv.appendChild(pointsLabel);
        pointsDiv.appendChild(pointsInput);
        
        if (i === 0) {
            const note = document.createElement('span');
            note.style.cssText = 'font-size: 11px; color: #999;';
            note.textContent = '(toujours accessible)';
            pointsDiv.appendChild(note);
        }
        
        worldDiv.appendChild(pointsDiv);
        
        // Difficultés
        const difficultiesDiv = document.createElement('div');
        difficultiesDiv.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;';
        
        ['difficulty1', 'difficulty2', 'difficulty3'].forEach((key, idx) => {
            const diffDiv = document.createElement('div');
            diffDiv.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
            
            const diffLabel = document.createElement('label');
            diffLabel.style.cssText = 'font-size: 11px; font-weight: bold;';
            diffLabel.textContent = `Difficulté ${idx + 1}:`;
            
            const diffInput = document.createElement('input');
            diffInput.type = 'number';
            diffInput.min = '0';
            diffInput.max = levelsPerWorld.toString();
            diffInput.value = autoCreateConfig.worlds[i][key];
            diffInput.dataset.worldIndex = i;
            diffInput.dataset.key = key;
            diffInput.style.cssText = 'width: 100%; padding: 4px; border: 2px solid #E0E0E0; border-radius: 4px; font-size: 12px;';
            
            // Ajouter la sélection automatique au focus
            diffInput.addEventListener('focus', function() {
                this.select();
            });
            
            diffInput.onchange = (e) => {
                const newValue = parseInt(e.target.value) || 0;
                
                // Obtenir le multiplicateur selon le cursus
                const cursusSelect = document.getElementById('auto-cursus-select');
                const isAll = cursusSelect.value === 'all';
                const multiplier = isAll ? 3 : 1;
                
                // Calculer le total si on applique ce changement
                const tempWorld = {...autoCreateConfig.worlds[i]};
                tempWorld[key] = newValue;
                const worldTotal = tempWorld.difficulty1 + tempWorld.difficulty2 + tempWorld.difficulty3;
                
                // Calculer le total global
                let globalTotal = 0;
                autoCreateConfig.worlds.forEach((w, idx) => {
                    if (idx === i) {
                        globalTotal += worldTotal;
                    } else {
                        globalTotal += (w.difficulty1 + w.difficulty2 + w.difficulty3);
                    }
                });
                
                // Appliquer le multiplicateur
                globalTotal *= multiplier;
                
                // Vérifier la limite de 300
                if (globalTotal > MAX_TOTAL_LEVELS) {
                    e.target.style.border = '2px solid #FF0000';
                    e.target.style.background = '#FFE0E0';
                    const cursusInfo = isAll ? ' (× 3 cursus)' : '';
                    alert(`❌ Limite dépassée !\n\nCe changement porterait le total à ${globalTotal} niveaux${cursusInfo}.\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux au total.\n\nVeuillez réduire les niveaux dans d'autres mondes ou ajuster la configuration générale.`);
                    e.target.value = autoCreateConfig.worlds[i][key];
                    // Réinitialiser les styles après restauration
                    e.target.style.border = '2px solid #E0E0E0';
                    e.target.style.background = 'white';
                    return;
                }
                
                // Si OK, appliquer le changement
                autoCreateConfig.worlds[i][key] = newValue;
                validateDifficulties(i);
            };
            
            diffDiv.appendChild(diffLabel);
            diffDiv.appendChild(diffInput);
            difficultiesDiv.appendChild(diffDiv);
        });
        
        worldDiv.appendChild(difficultiesDiv);
        
        // Message d'erreur
        const errorMsg = document.createElement('div');
        errorMsg.id = `world-${i}-error`;
        errorMsg.style.cssText = 'font-size: 11px; color: #f44336; margin-top: 5px; display: none;';
        worldDiv.appendChild(errorMsg);
        
        configDiv.appendChild(worldDiv);
    }
}

function validateQuickConfig() {
    const diff1 = parseInt(document.getElementById('quick-diff1').value) || 0;
    const diff2 = parseInt(document.getElementById('quick-diff2').value) || 0;
    const diff3 = parseInt(document.getElementById('quick-diff3').value) || 0;
    const levelsPerWorld = autoCreateConfig.levelsPerWorld;
    const total = diff1 + diff2 + diff3;
    
    const errorMsg = document.getElementById('quick-config-error');
    const applyBtn = document.getElementById('quick-apply-btn');
    const inputs = [
        document.getElementById('quick-diff1'),
        document.getElementById('quick-diff2'),
        document.getElementById('quick-diff3')
    ];
    
    if (total > levelsPerWorld) {
        errorMsg.textContent = `⚠️ Total: ${total} / ${levelsPerWorld} niveaux (trop de niveaux !)`;
        errorMsg.style.display = 'block';
        inputs.forEach(input => {
            input.style.borderColor = '#f44336';
            input.style.color = '#f44336';
        });
        // Désactiver le bouton
        applyBtn.disabled = true;
        applyBtn.style.opacity = '0.5';
        applyBtn.style.cursor = 'not-allowed';
        applyBtn.style.background = '#9E9E9E';
    } else {
        errorMsg.style.display = 'none';
        inputs.forEach(input => {
            input.style.borderColor = '#E0E0E0';
            input.style.color = '#000';
        });
        // Réactiver le bouton
        applyBtn.disabled = false;
        applyBtn.style.opacity = '1';
        applyBtn.style.cursor = 'pointer';
        applyBtn.style.background = '#4CAF50';
    }
}

function applyQuickConfig() {
    const cursusSelect = document.getElementById('auto-cursus-select');
    const isAll = cursusSelect.value === 'all';
    const multiplier = isAll ? 3 : 1;
    
    const pointsIncrement = parseInt(document.getElementById('quick-points').value) || 10;
    const diff1 = parseInt(document.getElementById('quick-diff1').value) || 0;
    const diff2 = parseInt(document.getElementById('quick-diff2').value) || 0;
    const diff3 = parseInt(document.getElementById('quick-diff3').value) || 0;
    const levelsPerWorld = autoCreateConfig.levelsPerWorld;
    
    
    // Vérifier que le total correspond au nombre de niveaux par monde
    const total = diff1 + diff2 + diff3;
    if (total !== levelsPerWorld) {
        alert(`⚠️ Le total des difficultés (${total}) doit être égal au nombre de niveaux par monde (${levelsPerWorld})`);
        return;
    }
    
    // VALIDATION : Vérifier que le total ne dépasse pas 300 niveaux
    const totalLevels = autoCreateConfig.numWorlds * levelsPerWorld * multiplier;
    if (totalLevels > MAX_TOTAL_LEVELS) {
        const cursusInfo = isAll ? ` × 3 cursus` : '';
        alert(`❌ Configuration impossible !\n\n${autoCreateConfig.numWorlds} mondes × ${levelsPerWorld} niveaux/monde${cursusInfo} = ${totalLevels} niveaux\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux au total.\n\nVeuillez d'abord ajuster le nombre de mondes ou de niveaux par monde dans "Configuration générale".`);
        return;
    }
    
    // VALIDATION : Vérifier que les points requis sont atteignables pour tous les mondes
    for (let i = 1; i < autoCreateConfig.numWorlds; i++) {
        const previousLevels = i * levelsPerWorld;
        const maxPointsAvailable = previousLevels * 2;
        const requiredPoints = pointsIncrement * i; // Incrément cumulatif : monde 2 = 11, monde 3 = 22
        
        
        if (requiredPoints > maxPointsAvailable) {
            alert(`❌ Impossible !\n\nLe Monde ${i + 1} nécessiterait ${requiredPoints} points avec cette configuration.\n\nMais les ${previousLevels} niveaux précédents donnent au maximum ${maxPointsAvailable} points (${previousLevels} × 2).\n\nVeuillez réduire les points requis à maximum ${Math.floor(maxPointsAvailable / i)}.`);
            return;
        }
    }
    
    
    // Appliquer à tous les mondes
    autoCreateConfig.worlds.forEach((world, index) => {
        if (index === 0) {
            world.pointsRequired = 0;
        } else {
            // Incrément cumulatif : monde 2 = 11, monde 3 = 22, monde 4 = 33
            world.pointsRequired = pointsIncrement * index;
        }
        
        world.difficulty1 = diff1;
        world.difficulty2 = diff2;
        world.difficulty3 = diff3;
    });
    
    
    // Régénérer l'interface SANS mettre à jour les points
    updateAutoWorldsConfig(false);
    
}

function validateDifficulties(worldIndex) {
    const world = autoCreateConfig.worlds[worldIndex];
    const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
    const levelsPerWorld = autoCreateConfig.levelsPerWorld;
    const errorMsg = document.getElementById(`world-${worldIndex}-error`);
    
    // Trouver tous les inputs de ce monde
    const inputs = document.querySelectorAll(`input[data-world-index="${worldIndex}"]`);
    
    if (total > levelsPerWorld) {
        errorMsg.textContent = `⚠️ Total: ${total} / ${levelsPerWorld} niveaux (trop de niveaux !)`;
        errorMsg.style.display = 'block';
        inputs.forEach(input => {
            input.style.borderColor = '#f44336';
            input.style.color = '#f44336';
        });
    } else {
        errorMsg.style.display = 'none';
        inputs.forEach(input => {
            input.style.borderColor = '#E0E0E0';
            input.style.color = 'inherit';
        });
        if (total < levelsPerWorld) {
            errorMsg.textContent = `ℹ️ Total: ${total} / ${levelsPerWorld} niveaux`;
            errorMsg.style.display = 'block';
            errorMsg.style.color = '#2196F3';
        }
    }
    
    // Vérifier tous les mondes pour activer/désactiver les boutons de génération
    checkAllWorlds();
}

function checkAllWorlds() {
    const levelsPerWorld = autoCreateConfig.levelsPerWorld;
    let hasError = false;
    
    // Vérifier chaque monde
    autoCreateConfig.worlds.forEach((world) => {
        const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
        if (total > levelsPerWorld) {
            hasError = true;
        }
    });
    
    // Activer/désactiver les boutons de génération
    const btnTop = document.getElementById('generate-btn-top');
    const btnBottom = document.getElementById('generate-btn-bottom');
    
    if (hasError) {
        // Désactiver les boutons
        btnTop.disabled = true;
        btnTop.style.opacity = '0.5';
        btnTop.style.cursor = 'not-allowed';
        btnTop.style.background = '#9E9E9E';
        
        btnBottom.disabled = true;
        btnBottom.style.opacity = '0.5';
        btnBottom.style.cursor = 'not-allowed';
        btnBottom.style.background = '#9E9E9E';
    } else {
        // Réactiver les boutons
        btnTop.disabled = false;
        btnTop.style.opacity = '1';
        btnTop.style.cursor = 'pointer';
        btnTop.style.background = '#4CAF50';
        
        btnBottom.disabled = false;
        btnBottom.style.opacity = '1';
        btnBottom.style.cursor = 'pointer';
        btnBottom.style.background = '#4CAF50';
    }
}

async function generateWorldsAutomatically() {
    
    // Vérifier que la config existe
    if (!autoCreateConfig) {
        alert('❌ Erreur: Configuration non initialisée. Veuillez fermer et rouvrir la popup.');
        return;
    }
    
    
    const selectedCursus = document.getElementById('auto-cursus-select').value;
    const cursusList = selectedCursus === 'all' ? ['5eme', '4eme', '3eme'] : [selectedCursus];
    
    // VÉRIFICATION PRIORITAIRE : Calculer le nombre total de niveaux qui seront créés
    let totalLevelsToCreate = 0;
    for (const cursus of cursusList) {
        // Nombre de niveaux par monde * nombre de mondes = niveaux par cursus
        const levelsPerCursus = autoCreateConfig.numWorlds * autoCreateConfig.levelsPerWorld;
        totalLevelsToCreate += levelsPerCursus;
    }
    
    // Compter les niveaux existants dans les cursus NON affectés
    let existingLevelsInOtherCursus = 0;
    for (let cursusName in cursusData) {
        if (!cursusList.includes(cursusName)) {
            existingLevelsInOtherCursus += Object.keys(cursusData[cursusName].levels).length;
        }
    }
    
    const totalFinalLevels = totalLevelsToCreate + existingLevelsInOtherCursus;
    
    if (totalFinalLevels > MAX_TOTAL_LEVELS) {
        alert(`❌ Limite dépassée !\n\nCette génération créerait ${totalLevelsToCreate} niveau(x).\nAvec les ${existingLevelsInOtherCursus} niveau(x) existant(s) dans les autres cursus, cela ferait ${totalFinalLevels} niveaux au total.\n\nLa limite maximale est de ${MAX_TOTAL_LEVELS} niveaux (tous cursus confondus).\n\nVeuillez réduire le nombre de mondes ou de niveaux par monde.`);
        return;
    }
    
    // Vérifier les configurations pour tous les cursus
    for (let i = 0; i < autoCreateConfig.worlds.length; i++) {
        const world = autoCreateConfig.worlds[i];
        const total = world.difficulty1 + world.difficulty2 + world.difficulty3;
        
        if (total > autoCreateConfig.levelsPerWorld) {
            alert(`❌ Erreur: Le monde ${i + 1} a trop de niveaux (${total}/${autoCreateConfig.levelsPerWorld})`);
            return;
        }
        
        // Vérifier que les points requis sont atteignables (pour monde 2+)
        if (i > 0) {
            const previousLevels = i * autoCreateConfig.levelsPerWorld;
            const maxPointsAvailable = previousLevels * 2;
            
            if (world.pointsRequired > maxPointsAvailable) {
                alert(`❌ Erreur: Le Monde ${i + 1} demande ${world.pointsRequired} points pour être débloqué.\n\nMais les ${previousLevels} niveaux des mondes précédents donnent au maximum ${maxPointsAvailable} points.\n\nVeuillez ajuster les points requis.`);
                return;
            }
        }
    }
    
    // Message de confirmation
    let confirmMessage = '';
    let totalExistingLevels = 0;
    
    for (const cursus of cursusList) {
        const existingLevels = Object.keys(cursusData[cursus].levels || {});
        totalExistingLevels += existingLevels.length;
    }
    
    if (totalExistingLevels > 0) {
        const cursusText = cursusList.length > 1 ? `les ${cursusList.length} cursus` : `le cursus ${cursusList[0]}`;
        confirmMessage = `⚠️ ATTENTION\n\nVous avez ${totalExistingLevels} niveau(x) existant(s) dans ${cursusText}.\nLa génération entraînera leur suppression.\nCette action est irréversible.\n\nVoulez-vous continuer ?`;
    } else {
        const cursusText = cursusList.length > 1 ? `les ${cursusList.length} cursus` : `le cursus ${cursusList[0]}`;
        confirmMessage = `Voulez-vous générer ${autoCreateConfig.numWorlds} monde(s) avec ${autoCreateConfig.levelsPerWorld} niveaux par monde pour ${cursusText} ?\n\nCela va créer les niveaux automatiquement selon la configuration choisie.`;
    }
    
    const userConfirmed = await customConfirm(confirmMessage, totalExistingLevels > 0);
    
    if (!userConfirmed) {
        return;
    }
    
    
    // Calculer le nombre total de niveaux à créer pour la barre de progression
    let totalLevelsForProgress = 0;
    for (const cursus of cursusList) {
        for (let worldIdx = 0; worldIdx < autoCreateConfig.numWorlds; worldIdx++) {
            const worldConfig = autoCreateConfig.worlds[worldIdx];
            totalLevelsForProgress += worldConfig.difficulty1 + worldConfig.difficulty2 + worldConfig.difficulty3;
        }
    }
    
    // Afficher un message de progression avec barre
    const progressMsg = document.createElement('div');
    progressMsg.id = 'progress-message';
    progressMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10004; text-align: center; min-width: 300px;';
    progressMsg.innerHTML = `
        <h3>⏳ Génération en cours...</h3>
        <p style="margin-top: 10px;" id="progress-text">0 / ${totalLevelsForProgress} niveaux créés</p>
        <div style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; margin-top: 15px; overflow: hidden;">
            <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s;"></div>
        </div>
    `;
    document.body.appendChild(progressMsg);
    
    // Attendre un peu pour que le message s'affiche
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        let totalLevelsCreated = 0;
        
        // Fonction pour mettre à jour la progression
        function updateProgress() {
            const progressText = document.getElementById('progress-text');
            const progressBar = document.getElementById('progress-bar');
            if (progressText && progressBar) {
                progressText.textContent = `${totalLevelsCreated} / ${totalLevelsForProgress} niveaux créés`;
                const percentage = (totalLevelsCreated / totalLevelsForProgress) * 100;
                progressBar.style.width = percentage + '%';
            }
        }
        
        // Boucle sur tous les cursus à générer
        for (const cursus of cursusList) {
            
            // Effacer tous les niveaux existants
            cursusData[cursus].levels = {};
            
            // Configurer les mondes
            cursusData[cursus].worlds = autoCreateConfig.numWorlds;
            cursusData[cursus].levelsPerWorld = autoCreateConfig.levelsPerWorld;
            cursusData[cursus].pointsPerWorld = autoCreateConfig.worlds.map(w => w.pointsRequired);
            
            
            // Générer les niveaux pour chaque monde
            let levelNumber = 1;
            
            for (let worldIdx = 0; worldIdx < autoCreateConfig.numWorlds; worldIdx++) {
                const worldConfig = autoCreateConfig.worlds[worldIdx];
                
                // Compteur de niveaux dans ce monde (pour détecter les 2 premiers)
                let levelInWorld = 0;
                
                // Compter le total de niveaux diff 1 et 2 dans le monde 1 pour savoir si on doit utiliser les patterns spéciaux
                const totalDiff1And2InWorld1 = worldIdx === 0 ? (worldConfig.difficulty1 + worldConfig.difficulty2) : 0;
                
                // Générer les niveaux de difficulté 1
                for (let i = 0; i < worldConfig.difficulty1; i++) {
                    await generateLevel(cursus, levelNumber, 1, worldIdx, levelInWorld, totalDiff1And2InWorld1);
                    levelNumber++;
                    levelInWorld++;
                    totalLevelsCreated++;
                    updateProgress();
                }
                
                // Générer les niveaux de difficulté 2
                for (let i = 0; i < worldConfig.difficulty2; i++) {
                    await generateLevel(cursus, levelNumber, 2, worldIdx, levelInWorld, totalDiff1And2InWorld1);
                    levelNumber++;
                    levelInWorld++;
                    totalLevelsCreated++;
                    updateProgress();
                }
                
                // Générer les niveaux de difficulté 3
                for (let i = 0; i < worldConfig.difficulty3; i++) {
                    await generateLevel(cursus, levelNumber, 3, worldIdx, levelInWorld, totalDiff1And2InWorld1);
                    levelNumber++;
                    levelInWorld++;
                    totalLevelsCreated++;
                    updateProgress();
                }
            }
        }
        
        // Sauvegarder
        saveToStorage();
        markAsModified(); // Marquer qu'il y a eu des modifications
        
        // Fermer les popups et recharger
        const progressElement = document.getElementById('progress-message');
        if (progressElement) {
            document.body.removeChild(progressElement);
        }
        closeAutoCreateModal();
        closeLevelManagerModal();
        loadTeacherLevels();
        
        // Initialiser le drag tactile sur TOUS les blocs générés (support mobile)
        setTimeout(() => {
            if (typeof initProgramBlocksDrag === 'function') {
                initProgramBlocksDrag();
            }
        }, 100);
        
        
    } catch (error) {
        const progressElement = document.getElementById('progress-message');
        if (progressElement) {
            document.body.removeChild(progressElement);
        }
        alert('❌ Erreur lors de la génération: ' + error.message);
    }
}

async function generateLevel(cursus, levelNumber, difficulty, worldIdx = 0, levelInWorld = 0, totalDiff1And2InWorld1 = 0) {
    // Simuler un petit délai pour ne pas bloquer l'interface
    await new Promise(resolve => setTimeout(resolve, 10));
    
    
    // Sauvegarder l'état actuel
    const savedPaintedCells = { ...paintedCells };
    const savedSelectedPattern = getSelectedPattern();
    const savedDifficulty = document.getElementById('generation-difficulty').value;
    const savedCreatedVariables = [...createdVariables];
    const savedVariables = { ...variables };
    
    try {
        // Nettoyer complètement l'état
        paintedCells = {};
        createdVariables = [];
        variables = {};
        clearProgram();
        
        // Ajouter de l'aléatoire basé sur le cursus pour avoir des motifs différents
        // Chaque cursus aura une "seed" différente basée sur son nom
        const cursusSeeds = { '5eme': 17, '4eme': 37, '3eme': 53 };
        const seed = cursusSeeds[cursus] || 1;
        
        // Générer des appels aléatoires pour décaler la séquence Math.random()
        // Cela fait que chaque cursus aura des motifs différents
        for (let i = 0; i < seed + levelNumber; i++) {
            Math.random();
        }
        
        // Mettre la difficulté dans le select pour que generateRandomPattern l'utilise
        document.getElementById('generation-difficulty').value = difficulty;
        
        // PATTERNS SPÉCIAUX POUR LES 2 PREMIERS NIVEAUX DU MONDE 1 (diff 1 ou 2)
        if (worldIdx === 0 && (difficulty === 1 || difficulty === 2) && totalDiff1And2InWorld1 >= 1) {
            // On est dans le monde 1 avec au moins 1 niveau de diff 1 ou 2
            let useSpecialPattern = false;
            let specialPatternGroup = null;
            
            if (levelInWorld === 0 && totalDiff1And2InWorld1 >= 1) {
                // Premier niveau du monde 1 : pattern à 4 blocs
                specialPatternGroup = PATTERNS.beginner_4blocks;
                useSpecialPattern = true;
            } else if (levelInWorld === 1 && totalDiff1And2InWorld1 >= 2) {
                // Deuxième niveau du monde 1 : pattern à 6 blocs
                specialPatternGroup = PATTERNS.beginner_6blocks;
                useSpecialPattern = true;
            }
            
            if (useSpecialPattern && specialPatternGroup) {
                // Choisir un pattern au hasard
                const patternIds = specialPatternGroup.ids;
                const randomId = patternIds[Math.floor(Math.random() * patternIds.length)];
                const positions = specialPatternGroup.getData(randomId);
                
                
                // Nettoyer et appliquer le pattern
                clearPaintedCells();
                const cells = document.querySelectorAll('#teacher-grid .cell');
                const gridSize = 10;
                const allColors = ['red', 'yellow', 'green', 'blue', 'black'];
                const colorMap = {
                    'red': '#f44336', 'yellow': '#FFEB3B', 'green': '#4CAF50', 'blue': '#2196F3', 'black': '#343a40'
                };
                
                // Choisir 1 à 2 couleurs
                const numColors = Math.floor(Math.random() * 2) + 1;
                const shuffledColors = [...allColors].sort(() => Math.random() - 0.5);
                const colors = shuffledColors.slice(0, numColors);
                
                // Appliquer les couleurs
                positions.forEach((pos, index) => {
                    const posKey = `${pos.row}-${pos.col}`;
                    const colorIndex = index % colors.length;
                    const color = colors[colorIndex];
                    paintedCells[posKey] = color;
                    
                    const cellIndex = pos.row * gridSize + pos.col;
                    if (cellIndex < cells.length) {
                        cells[cellIndex].style.backgroundColor = colorMap[color];
                    }
                });
                
                // Générer le programme optimal directement
                generateProgramFromPaint();
            } else {
                // Génération normale (pas les 2 premiers niveaux)
                generateRandomPattern();
            }
        } else {
            // Génération normale (pas monde 1 ou pas diff 1/2)
            generateRandomPattern();
        }
        
        // Attendre que le programme soit généré
        const waitTime = difficulty === 3 ? 250 : 200;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Récupérer les blocs créés
        const programBlocks = document.getElementById('program-blocks');
        const blocks = programBlocks.querySelectorAll(':scope > .program-block');
        
        if (blocks.length === 0) {
            // Attendre encore un peu et réessayer
            await new Promise(resolve => setTimeout(resolve, 200));
            const blocksRetry = programBlocks.querySelectorAll(':scope > .program-block');
            if (blocksRetry.length === 0) {
                throw new Error('Aucun bloc généré même après 2 tentatives');
            }
        }
        
        const finalBlocks = programBlocks.querySelectorAll(':scope > .program-block');
        const savedBlocks = [];
        finalBlocks.forEach(block => {
            const blockData = extractBlockData(block);
            savedBlocks.push(blockData);
        });
        
        
        // Sauvegarder l'état de la grille et les cellules peintes
        const gridState = getGridState();
        const paintedCellsData = getPaintedCellsData();
        
        // Sauvegarder aussi les variables créées
        const savedVars = {
            createdVariables: [...createdVariables],
            variableValues: { ...variables }
        };
        
        // Créer le niveau
        const newLevel = {
            blocks: savedBlocks,
            blockCount: countTotalBlocks(finalBlocks),
            gridState: gridState,
            paintedCells: paintedCellsData,
            variables: savedVars
        };
        
        
        cursusData[cursus].levels[levelNumber.toString()] = newLevel;
        
    } catch (error) {
        throw error;
    } finally {
        // Restaurer l'état
        paintedCells = savedPaintedCells;
        setSelectedPattern(savedSelectedPattern);
        document.getElementById('generation-difficulty').value = savedDifficulty;
        createdVariables = savedCreatedVariables;
        variables = savedVariables;
    }
}

function closeAutoCreateModal() {
    document.getElementById('auto-create-modal').classList.remove('active');
    autoCreateConfig = null;
}


// ===== MODULE PINCEAU =====
// Ce module a été déplacé vers js/paintModule.js
// Fonctions: selectPaintColor(), handleDifficultyChange(), initPaintMode(), generateProgramFromPaint(), etc.


    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================
    
    window.customConfirm = customConfirm;
    window.openAutoCreateModal = openAutoCreateModal;
    window.closeAutoCreateModal = closeAutoCreateModal;
    window.updateAutoLimits = updateAutoLimits;
    window.updateAutoWorldsConfig = updateAutoWorldsConfig;
    window.validateQuickConfig = validateQuickConfig;
    window.applyQuickConfig = applyQuickConfig;
    window.validateDifficulties = validateDifficulties;
    window.checkAllWorlds = checkAllWorlds;
    window.generateWorldsAutomatically = generateWorldsAutomatically;
    
    
})();
