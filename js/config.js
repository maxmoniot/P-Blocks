// ========================================
// CONFIGURATION ET VARIABLES GLOBALES
// ========================================

// Variables de jeu
let currentMode = 'student';
let currentCursus = '5eme';
let currentLevel = 1;
let score = 0;
let completedLevels = {};

// Variables de la grille et de la tortue
let grid = [];
let turtle = { x: 0, y: 0, direction: 0, penDown: true };

// Variables du programme
let variables = {};
let createdVariables = [];

// Module Pinceau
let selectedPaintColor = 'red';
let isPainting = false;
let paintedCells = {};

// Variable pour stocker le niveau à supprimer
let levelToDelete = null;

// Flags de mode
window.isPreviewMode = false;
window.isStudentLoadMode = false;

// Configuration
const TEACHER_PASSWORD = 'prof123';
const GRID_SIZE = 10;
const MAX_TOTAL_LEVELS = 100;
const MAX_LEVELS_PER_INPUT_ALL = 33;
const MAX_LEVELS_PER_INPUT_SINGLE = MAX_TOTAL_LEVELS;

// Directions de la tortue (0 = haut, 1 = droite, 2 = bas, 3 = gauche)
const DIRECTIONS = [
    { dx: 0, dy: -1 },  // Haut
    { dx: 1, dy: 0 },   // Droite
    { dx: 0, dy: 1 },   // Bas
    { dx: -1, dy: 0 }   // Gauche
];

// Flèches correspondantes
const ARROWS = ['▲', '▶', '▼', '◀'];

// Couleurs disponibles
const COLORS = ['red', 'yellow', 'green', 'blue', 'black', 'white'];

// Données des cursus (sera initialisé dans cursus-data.js ou chargé dynamiquement)
let cursusData = {
    '5eme': { name: '5ème', levels: {} },
    '4eme': { name: '4ème', levels: {} },
    '3eme': { name: '3ème', levels: {} }
};
