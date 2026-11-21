// ============================================
// MODULE: DRAG & DROP HANDLER
// Description: Gestion du drag & drop des blocs
// Dépendances ENTRANTES (doivent exister dans app-new.js):
//   - Variables globales: aucune
//   - Fonctions: addBlockToProgram(), addNestedBlock(), updateBlockCount()
// Fonctions EXPORTÉES (vers window):
//   - allowDrop(), drag(), drop(), dropCondition()
//   - setupNestedAreaDrop()
// ============================================

(function() {
    'use strict';
    
    
function allowDrop(ev) {
    console.log('allowDrop appelé');
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
    
    // Vérifier si on drag un bloc existant du programme
    const dragging = document.querySelector('.dragging');
    
    if (dragging) {
        console.log('Réorganisation de bloc existant');
        // RÉORGANISATION : bloc existant déplacé dans le programme
        const targetBlock = ev.target.closest('.program-block');
        
        if (targetBlock && targetBlock !== dragging) {
            // Nettoyer les anciens indicateurs
            document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Calculer la position
            const rect = targetBlock.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            // Ajouter l'indicateur
            if (ev.clientY < midpoint) {
                targetBlock.classList.add('drag-over-top');
            } else {
                targetBlock.classList.add('drag-over-bottom');
            }
        }
    } else {
        console.log('Ajout depuis la palette');
        // AJOUT : nouveau bloc depuis la palette
        const targetBlock = ev.target.closest('.program-block');
        
        if (targetBlock) {
            // Nettoyer les anciens indicateurs
            document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Calculer la position
            const rect = targetBlock.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            // Ajouter l'indicateur
            if (ev.clientY < midpoint) {
                console.log('Indicateur top ajouté');
                targetBlock.classList.add('drag-over-top');
            } else {
                console.log('Indicateur bottom ajouté');
                targetBlock.classList.add('drag-over-bottom');
            }
        }
    }
}

function dragLeave(ev) {
    if (ev.target.classList.contains('program-area')) {
        ev.target.classList.remove('drag-over');
    }
}

function drag(ev) {
    // Bloquer le scroll pendant le drag (mobile) — sauf à la souris, où la molette doit faire défiler la page
    if (window.innerWidth <= 768 && !(window.glisserSouris && window.glisserSouris.occupe())) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
    
    const blockData = {
        type: ev.target.dataset.type,
        value: ev.target.dataset.value,
        op: ev.target.dataset.op,
        html: ev.target.outerHTML
    };
    
    // Capturer les valeurs des select pour les conserver
    const selects = ev.target.querySelectorAll('select');
    const selectValues = [];
    selects.forEach(select => {
        selectValues.push(select.value);
    });
    blockData.selectValues = selectValues;
    
    // Capturer les valeurs des inputs pour les conserver
    const inputs = ev.target.querySelectorAll('input[type="number"], input[type="text"]');
    const inputValues = [];
    inputs.forEach(input => {
        inputValues.push(input.value);
    });
    blockData.inputValues = inputValues;
    
    ev.dataTransfer.setData('text', JSON.stringify(blockData));
}

function drop(ev) {
    ev.preventDefault();
    ev.stopPropagation(); // Empêcher la propagation pour éviter les doublons
    ev.currentTarget.classList.remove('drag-over');
    
    // Réactiver le scroll (mobile)
    if (window.innerWidth <= 768) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }
    
    const dataText = ev.dataTransfer.getData('text');
    if (!dataText) return;
    
    let data;
    try {
        data = JSON.parse(dataText);
    } catch (e) {
        return;
    }
    
    // Empêcher le dépôt des blocs opérateurs et var-value dans la zone principale
    if (data.type === 'operator' || data.type === 'var-value') {
        return;
    }
    
    // Vérifier si on déplace un bloc existant ou si on en ajoute un nouveau depuis la palette
    const dragging = document.querySelector('.dragging');
    const programArea = document.getElementById('program-blocks');
    
    if (dragging) {
        // C'est un bloc existant qui est déplacé
        const targetBlock = ev.target.closest('.program-block');
        
        // Si on drop sur un autre bloc (pas sur lui-même)
        if (targetBlock && targetBlock !== dragging) {
            const rect = targetBlock.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            // Déterminer si on insère avant ou après
            if (ev.clientY < midpoint) {
                targetBlock.parentNode.insertBefore(dragging, targetBlock);
            } else {
                targetBlock.parentNode.insertBefore(dragging, targetBlock.nextSibling);
            }
        } else if (!targetBlock) {
            // Drop dans la zone vide de program-blocks → ajouter à la fin
            programArea.appendChild(dragging);
        }
        
        // Sauvegarder si en mode élève
        if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
            const levelNum = document.getElementById('level-select').value;
            if (levelNum && currentCursus) {
                saveStudentProgram(currentCursus, levelNum);
            }
        }
        
        return;
    }
    
    // C'est un nouveau bloc depuis la palette
    const targetBlock = ev.target.closest('.program-block');
    
    // Créer le nouveau bloc
    addBlockToProgram(data);
    const newBlock = programArea.lastElementChild;
    
    // Si on a un bloc cible, insérer à la bonne position
    if (targetBlock && programArea.contains(targetBlock)) {
        const rect = targetBlock.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (ev.clientY < midpoint) {
            programArea.insertBefore(newBlock, targetBlock);
        } else {
            programArea.insertBefore(newBlock, targetBlock.nextSibling);
        }
    }
    // Sinon le bloc reste à la fin (comportement par défaut d'appendChild)
}

function dropCondition(ev) {
    // Cette fonction n'est plus utilisée car le bloc if intègre maintenant directement la condition
    ev.preventDefault();
    ev.stopPropagation();
}

function setupNestedAreaDrop(nestedArea) {
    // Fonction pour gérer le drop et trouver où insérer
    const handleDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // Trouver la vraie nested-area parente
        const actualNestedArea = e.currentTarget.closest ? e.currentTarget.closest('.nested-blocks') : nestedArea;
        if (!actualNestedArea) return;
        
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            // Déplacer un bloc existant
            const targetBlock = e.target.closest('.program-block');
            if (targetBlock && targetBlock !== dragging && actualNestedArea.contains(targetBlock)) {
                // Insérer avant ou après le bloc cible selon la position Y
                const rect = targetBlock.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    actualNestedArea.insertBefore(dragging, targetBlock);
                } else {
                    actualNestedArea.insertBefore(dragging, targetBlock.nextSibling);
                }
            } else {
                // Ajouter à la fin
                actualNestedArea.appendChild(dragging);
            }
        } else {
            // Ajouter un nouveau bloc depuis la palette
            const dataText = e.dataTransfer.getData('text');
            if (!dataText) return;
            
            let nestedData;
            try {
                nestedData = JSON.parse(dataText);
            } catch (err) {
                return;
            }
            
            // Empêcher le dépôt des blocs opérateurs et var-value dans les zones imbriquées
            if (nestedData.type === 'operator' || nestedData.type === 'var-value') {
                return;
            }
            
            // Trouver le bloc cible pour insertion
            const targetBlock = e.target.closest('.program-block');
            if (targetBlock && actualNestedArea.contains(targetBlock)) {
                const rect = targetBlock.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                // Créer le nouveau bloc d'abord
                addNestedBlock(nestedData, actualNestedArea);
                const newBlock = actualNestedArea.lastElementChild;
                
                // Puis le déplacer à la bonne position
                if (e.clientY < midpoint) {
                    actualNestedArea.insertBefore(newBlock, targetBlock);
                } else {
                    actualNestedArea.insertBefore(newBlock, targetBlock.nextSibling);
                }
            } else {
                // Ajouter à la fin
                addNestedBlock(nestedData, actualNestedArea);
            }
        }
        actualNestedArea.classList.remove('empty');
        actualNestedArea.classList.remove('drag-over');
        
        // Sauvegarder après ajout/déplacement dans zone imbriquée
        if (currentMode === 'student' || window.isPreviewMode || window.isStudentLoadMode) {
            const levelNum = document.getElementById('level-select').value;
            if (levelNum && currentCursus) {
                saveStudentProgram(currentCursus, levelNum);
            }
        }
    };
    
    const handleDragOver = function(e) { 
        e.preventDefault(); 
        e.stopPropagation();
        const actualNestedArea = e.currentTarget.closest ? e.currentTarget.closest('.nested-blocks') : nestedArea;
        if (actualNestedArea) {
            actualNestedArea.classList.add('drag-over');
        }
    };
    
    const handleDragLeave = function(e) {
        if (e.target === nestedArea) {
            nestedArea.classList.remove('drag-over');
        }
    };
    
    // Ajouter les événements sur la zone elle-même
    nestedArea.ondrop = handleDrop;
    nestedArea.ondragover = handleDragOver;
    nestedArea.ondragleave = handleDragLeave;
    
    // Observer les nouveaux blocs ajoutés pour leur ajouter aussi les gestionnaires
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('program-block')) {
                    // Ajouter les gestionnaires sur le nouveau bloc
                    node.ondragover = handleDragOver;
                    node.ondrop = handleDrop;
                }
            });
        });
    });
    
    observer.observe(nestedArea, { childList: true });
}

// ============================================
// DÉFILEMENT PENDANT LE GLISSER (bords du programme)
// ============================================
// Quand on tient un bloc près du bord haut ou bas du programme, le programme
// défile tout seul (plus vite au ras du bord) ; une bande bleue le signale.
// Sert à la souris, au doigt (touchDragManager.js) et au glisser natif.
const autoDefilement = (function() {
    const HAUTEUR_BANDE = 56;
    let actif = false, proprietaire = null, aPosition = false, x = 0, y = 0;
    let reglages = null, rappel = null, raf = null, dernierTemps = 0, reste = 0;
    let bandeHaut = null, bandeBas = null;

    function estFenetre(sc) { return sc === window; }

    function peutDefiler(el) {
        if (el === document.body || el === document.documentElement) return false; // = la fenêtre
        const style = getComputedStyle(el);
        return /(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
    }

    function fenetrePeutDefiler() {
        const d = document.scrollingElement || document.documentElement;
        if (getComputedStyle(document.body).position === 'fixed') return false; // défilement bloqué (mobile)
        return d.scrollHeight > window.innerHeight + 1;
    }

    function zoneVisible(sc) {
        if (estFenetre(sc)) return { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
        const r = sc.getBoundingClientRect();
        return { left: r.left, right: r.right, top: Math.max(r.top, 0), bottom: Math.min(r.bottom, window.innerHeight) };
    }

    function position(sc) {
        if (estFenetre(sc)) {
            const d = document.scrollingElement || document.documentElement;
            return { haut: d.scrollTop, max: d.scrollHeight - window.innerHeight };
        }
        return { haut: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight };
    }

    // Conteneur qui fait défiler le programme (panneau de droite sur PC, la page sur téléphone)
    function defileurProgramme() {
        const prog = document.getElementById('program-blocks');
        if (!prog || !prog.getClientRects().length) return null;
        for (let n = prog.parentElement; n && n.nodeType === 1; n = n.parentElement) {
            if (peutDefiler(n)) return n;
        }
        return fenetrePeutDefiler() ? window : null;
    }

    // Conteneurs candidats, du plus proche du pointeur au plus lointain
    function candidats() {
        const liste = [];
        const ajouter = (n) => {
            for (; n && n.nodeType === 1; n = n.parentElement) {
                if (liste.indexOf(n) === -1 && peutDefiler(n)) liste.push(n);
            }
        };
        ajouter(document.elementFromPoint(x, y));
        ajouter(document.getElementById('program-blocks'));
        if (fenetrePeutDefiler()) liste.push(window);
        return liste;
    }

    // Vitesse en px/ms (négative = vers le haut), 0 si le pointeur n'est pas dans une zone de bord
    function vitesse(sc) {
        const r = zoneVisible(sc);
        if (x < r.left || x > r.right) return 0;
        const h = r.bottom - r.top;
        if (h < 80) return 0;
        const zone = Math.min(reglages.zone, h / 4);
        const p = position(sc);
        const v = (profondeur) => {
            const k = Math.min(1, Math.max(0, profondeur / zone));
            return reglages.vitesseMin + (reglages.vitesseMax - reglages.vitesseMin) * k * k;
        };
        if (y > r.bottom - zone && y <= r.bottom + zone && p.haut < p.max - 0.5) return v(y - (r.bottom - zone));
        if (y < r.top + zone && y >= r.top - zone && p.haut > 0.5) return -v((r.top + zone) - y);
        return 0;
    }

    function defiler(sc, pas) {
        if (estFenetre(sc)) window.scrollBy(0, pas);
        else sc.scrollTop += pas;
    }

    function creerBandes() {
        if (bandeHaut) return;
        bandeHaut = document.createElement('div');
        bandeHaut.className = 'pb-bande-defilement haut';
        bandeHaut.innerHTML = '<span>▲</span>';
        bandeBas = document.createElement('div');
        bandeBas.className = 'pb-bande-defilement bas';
        bandeBas.innerHTML = '<span>▼</span>';
        document.body.appendChild(bandeHaut);
        document.body.appendChild(bandeBas);
    }

    function cacherBandes() {
        if (!bandeHaut) return;
        bandeHaut.classList.remove('visible', 'actif');
        bandeBas.classList.remove('visible', 'actif');
    }

    function placerBandes(sc, sens) {
        if (!sc) { cacherBandes(); return; }
        const r = zoneVisible(sc);
        const p = position(sc);
        const placer = (bande, visible, haut) => {
            bande.classList.toggle('visible', visible);
            if (!visible) return;
            bande.style.left = r.left + 'px';
            bande.style.width = (r.right - r.left) + 'px';
            bande.style.top = (haut ? r.top : r.bottom - HAUTEUR_BANDE) + 'px';
        };
        placer(bandeHaut, p.haut > 0.5, true);
        placer(bandeBas, p.haut < p.max - 0.5, false);
        bandeHaut.classList.toggle('actif', sens < 0);
        bandeBas.classList.toggle('actif', sens > 0);
    }

    function boucle(t) {
        raf = requestAnimationFrame(boucle);
        const dt = dernierTemps ? Math.min(50, t - dernierTemps) : 16;
        dernierTemps = t;
        const prog = defileurProgramme();
        let sens = 0, aDefile = false;
        if (aPosition) {
            const liste = candidats();
            for (let i = 0; i < liste.length; i++) {
                const v = vitesse(liste[i]);
                if (!v) continue;
                reste += v * dt;
                const pas = reste > 0 ? Math.floor(reste) : Math.ceil(reste);
                if (pas) {
                    reste -= pas;
                    defiler(liste[i], pas);
                    aDefile = true;
                }
                if (liste[i] === prog) sens = v > 0 ? 1 : -1;
                break;
            }
            if (!sens) reste = 0;
        }
        placerBandes(prog, sens);
        if (aDefile && rappel) rappel();
    }

    return {
        // qui : 'souris' | 'doigt' | 'natif' ; auDefilement : rappelé après chaque pas de défilement
        start: function(qui, auDefilement) {
            if (actif) this.stop();
            actif = true;
            proprietaire = qui || 'natif';
            rappel = auDefilement || null;
            reglages = proprietaire === 'doigt'
                ? { zone: 80, vitesseMin: 0.12, vitesseMax: 0.8 }
                : { zone: 70, vitesseMin: 0.15, vitesseMax: 1.2 };
            aPosition = false;
            dernierTemps = 0;
            reste = 0;
            creerBandes();
            raf = requestAnimationFrame(boucle);
        },
        update: function(nx, ny) {
            if (!actif) return;
            x = nx;
            y = ny;
            aPosition = true;
        },
        stop: function() {
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            actif = false;
            proprietaire = null;
            rappel = null;
            aPosition = false;
            cacherBandes();
        },
        actifPour: function(qui) { return actif && proprietaire === qui; }
    };
})();

// Glisser natif du navigateur (gardé quand le glisser à la souris ci-dessous n'est pas possible)
document.addEventListener('dragstart', function(e) {
    if (!e.isTrusted || !e.target || !e.target.closest) return;
    if (glisserSouris && glisserSouris.occupe()) return; // c'est le glisser à la souris qui s'en charge
    if (e.target.closest('.block, .program-block')) autoDefilement.start('natif');
}, true);
document.addEventListener('dragover', function(e) {
    if (e.isTrusted && autoDefilement.actifPour('natif')) autoDefilement.update(e.clientX, e.clientY);
}, true);
['drop', 'dragend'].forEach(function(type) {
    document.addEventListener(type, function(e) {
        if (e.isTrusted && autoDefilement.actifPour('natif')) autoDefilement.stop();
    }, true);
});
// Sécurité : aucun mousemove n'arrive pendant un glisser natif, donc s'il en arrive un, le glisser est fini
document.addEventListener('mousemove', function() {
    if (autoDefilement.actifPour('natif')) autoDefilement.stop();
}, true);

// ============================================
// GLISSER À LA SOURIS (molette utilisable en tenant un bloc)
// ============================================
// Sous Windows, Chrome et Edge bloquent la molette pendant un glisser-déposer
// HTML5 natif. À la souris, les blocs sont donc glissés « à la main » : on
// envoie les mêmes événements dragstart / dragenter / dragover / dragleave /
// drop / dragend que le navigateur, avec un vrai DataTransfer, aux gestionnaires
// existants (drop(), allowDrop(), zones imbriquées, cases, palette = corbeille),
// qui fonctionnent donc exactement comme avant. Pendant ce temps, la molette
// fait défiler le programme normalement, et les bords le font défiler tout seuls.
const glisserSouris = (function() {
    try {
        new DragEvent('dragover', { dataTransfer: new DataTransfer() });
    } catch (err) {
        return null; // navigateur trop ancien : on garde le glisser natif
    }

    const SEUIL = 5; // px avant de considérer que c'est un glisser et pas un clic
    let enAttente = null;
    let enCours = null;
    let ignorerClic = false;

    function evenement(type, px, py, relatedTarget) {
        return new DragEvent(type, {
            bubbles: true,
            cancelable: type !== 'dragleave' && type !== 'dragend',
            composed: true,
            clientX: px,
            clientY: py,
            screenX: px + (window.screenX || 0),
            screenY: py + (window.screenY || 0),
            relatedTarget: relatedTarget || null,
            dataTransfer: enCours ? enCours.dt : null
        });
    }

    function sourceDuGlisser(e) {
        if (e.button !== 0 || enCours) return null;
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return null; // doigt : touchDragManager.js
        const t = e.target;
        if (!t || !t.closest) return null;
        if (t.closest('input, select, textarea, button, option, label, a, [contenteditable="true"]')) return null;
        const source = t.closest('[draggable="true"]');
        if (!source || !source.matches('.block, .program-block')) return null;
        if (source.closest('#mobile-blocks-list, .modal')) return null;
        return source;
    }

    function surAppui(e) {
        const source = sourceDuGlisser(e);
        if (!source) return;
        e.preventDefault(); // empêche le glisser natif (et la sélection de texte)
        // ... mais une case en cours de saisie doit perdre le focus comme avant (son « change » sauvegarde le programme)
        const actif = document.activeElement;
        if (actif && actif !== document.body && /^(INPUT|SELECT|TEXTAREA)$/.test(actif.tagName)) actif.blur();
        const r = source.getBoundingClientRect();
        enAttente = { source: source, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top };
        window.addEventListener('mousemove', surMouvement, true);
        window.addEventListener('mouseup', surRelache, true);
    }

    function creerFantome(source, px, py, dx, dy) {
        const r = source.getBoundingClientRect();
        const fantome = source.cloneNode(true);
        fantome.removeAttribute('id');
        fantome.removeAttribute('draggable');
        fantome.removeAttribute('ondragstart');
        fantome.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
        const champsSource = source.querySelectorAll('input, select');
        const champsFantome = fantome.querySelectorAll('input, select');
        champsSource.forEach((champ, i) => { if (champsFantome[i]) champsFantome[i].value = champ.value; });
        fantome.classList.remove('dragging', 'drag-over', 'drag-over-top', 'drag-over-bottom');
        fantome.classList.add('pb-fantome-glisser');
        fantome.style.width = r.width + 'px';
        fantome.style.left = (px - dx) + 'px';
        fantome.style.top = (py - dy) + 'px';
        document.body.appendChild(fantome);
        return fantome;
    }

    function demarrer(e) {
        const a = enAttente;
        enAttente = null;
        enCours = { source: a.source, dt: new DataTransfer(), cible: null, accepte: false, x: e.clientX, y: e.clientY, dx: a.dx, dy: a.dy, majPrevue: false };
        const accepte = a.source.dispatchEvent(evenement('dragstart', e.clientX, e.clientY));
        if (!accepte) { // un gestionnaire a refusé le glisser
            enCours = null;
            retirerEcouteurs();
            return false;
        }
        if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
            document.activeElement.blur();
        }
        enCours.fantome = creerFantome(a.source, e.clientX, e.clientY, a.dx, a.dy);
        document.documentElement.classList.add('pb-glisser-souris');
        autoDefilement.start('souris');
        document.addEventListener('scroll', surDefilement, true);
        window.addEventListener('keydown', surTouche, true);
        window.addEventListener('blur', surPerteFocus);
        return true;
    }

    // Envoie dragenter / dragleave / dragover à l'élément sous le pointeur
    function survoler(px, py) {
        const c = enCours;
        const el = document.elementFromPoint(px, py);
        if (el !== c.cible) {
            if (c.cible && c.cible.isConnected) c.cible.dispatchEvent(evenement('dragleave', px, py, el));
            if (el) el.dispatchEvent(evenement('dragenter', px, py, c.cible));
            c.cible = el;
        }
        c.accepte = el ? !el.dispatchEvent(evenement('dragover', px, py)) : false;
    }

    function surMouvement(e) {
        if (enAttente) {
            if (!(e.buttons & 1)) { annulerAttente(); return; }
            if (Math.abs(e.clientX - enAttente.x0) < SEUIL && Math.abs(e.clientY - enAttente.y0) < SEUIL) return;
            if (!demarrer(e)) return;
        }
        if (!enCours) return;
        if (!(e.buttons & 1)) { terminer(e.clientX, e.clientY, true); return; } // bouton relâché sans mouseup
        e.preventDefault();
        enCours.x = e.clientX;
        enCours.y = e.clientY;
        enCours.fantome.style.left = (e.clientX - enCours.dx) + 'px';
        enCours.fantome.style.top = (e.clientY - enCours.dy) + 'px';
        autoDefilement.update(e.clientX, e.clientY);
        survoler(e.clientX, e.clientY);
    }

    // Molette ou défilement automatique : le contenu bouge sous le pointeur, on remet à jour l'indicateur
    function surDefilement() {
        if (!enCours || enCours.majPrevue) return;
        enCours.majPrevue = true;
        requestAnimationFrame(function() {
            if (!enCours) return;
            enCours.majPrevue = false;
            survoler(enCours.x, enCours.y);
        });
    }

    function surRelache(e) {
        if (enAttente) { annulerAttente(); return; } // simple clic : rien à faire
        if (!enCours) return;
        e.preventDefault();
        terminer(e.clientX, e.clientY, true);
    }

    function surTouche(e) {
        if (e.key === 'Escape' && enCours) {
            e.preventDefault();
            e.stopPropagation();
            terminer(enCours.x, enCours.y, false);
        }
    }

    function surPerteFocus() {
        if (enCours) terminer(enCours.x, enCours.y, false);
    }

    function terminer(px, py, deposer) {
        const c = enCours;
        if (!c) return;
        if (deposer) {
            survoler(px, py);
            if (c.accepte && c.cible) c.cible.dispatchEvent(evenement('drop', px, py));
            else if (c.cible && c.cible.isConnected) c.cible.dispatchEvent(evenement('dragleave', px, py, null));
        } else if (c.cible && c.cible.isConnected) {
            c.cible.dispatchEvent(evenement('dragleave', px, py, null));
        }
        // dragend part même si le bloc source a été retiré (corbeille) : ses gestionnaires le reçoivent quand même
        c.source.dispatchEvent(evenement('dragend', px, py));
        nettoyer();
        ignorerClic = true;
        setTimeout(function() { ignorerClic = false; }, 0);
    }

    function nettoyer() {
        if (enCours && enCours.fantome) enCours.fantome.remove();
        enCours = null;
        document.documentElement.classList.remove('pb-glisser-souris');
        document.querySelectorAll('.drag-over, .drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });
        document.querySelectorAll('.delete-zone').forEach(el => el.classList.remove('delete-zone'));
        autoDefilement.stop();
        retirerEcouteurs();
    }

    function annulerAttente() {
        enAttente = null;
        retirerEcouteurs();
    }

    function retirerEcouteurs() {
        window.removeEventListener('mousemove', surMouvement, true);
        window.removeEventListener('mouseup', surRelache, true);
        document.removeEventListener('scroll', surDefilement, true);
        window.removeEventListener('keydown', surTouche, true);
        window.removeEventListener('blur', surPerteFocus);
    }

    document.addEventListener('mousedown', surAppui, true);

    // Un glisser terminé ne doit pas déclencher de clic sur ce qui est sous le pointeur
    window.addEventListener('click', function(e) {
        if (!ignorerClic) return;
        ignorerClic = false;
        e.preventDefault();
        e.stopPropagation();
    }, true);

    // Si malgré tout le navigateur lance son glisser natif pendant le nôtre, on l'annule
    document.addEventListener('dragstart', function(e) {
        if (e.isTrusted && (enAttente || enCours)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);

    return { occupe: function() { return !!(enAttente || enCours); } };
})();

    // ========================================
    // EXPORT VERS GLOBAL
    // ========================================

    window.DragAutoScroll = autoDefilement;
    window.glisserSouris = glisserSouris;
    window.allowDrop = allowDrop;
    window.dragLeave = dragLeave;
    window.drag = drag;
    window.drop = drop;
    window.dropCondition = dropCondition;
    window.setupNestedAreaDrop = setupNestedAreaDrop;
    
    // Sécurité : réactiver le scroll si le drag est annulé (dragend sans drop)
    document.addEventListener('dragend', function() {
        if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
    });
    
})();
