/**
 * Bibliothèque de motifs pour Programmation Motifs
 * Contient tous les motifs disponibles pour les difficultés 1, 2 et 3
 */

const PATTERNS = {
    // ========================================
    // PATTERNS DÉBUTANTS - Pour premiers niveaux uniquement
    // ========================================
    
    // Patterns très simples à 4 blocs (pour niveau 1-1 de chaque cursus)
    beginner_4blocks: {
        ids: [
            'simple_line_horizontal', 'simple_line_vertical', 'simple_L', 'simple_corner',
            'simple_T', 'simple_cross', 'simple_diagonal', 'simple_square_2x2',
            'simple_dots_3', 'simple_stairs_3', 'simple_zigzag_small', 'simple_plus_small',
            'simple_arrow_up_small', 'simple_triangle_small', 'simple_rectangle_2x3'
        ],
        
        getData: function(id) {
            const patterns = {
                simple_line_horizontal: [
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}
                ],
                simple_line_vertical: [
                    {row: 2, col: 4}, {row: 3, col: 4}, {row: 4, col: 4}, {row: 5, col: 4}
                ],
                simple_L: [
                    {row: 3, col: 3}, {row: 4, col: 3}, {row: 5, col: 3}, {row: 5, col: 4}
                ],
                simple_corner: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 4, col: 3}, {row: 5, col: 3}
                ],
                simple_T: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 4, col: 4}
                ],
                simple_cross: [
                    {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}
                ],
                simple_diagonal: [
                    {row: 2, col: 2}, {row: 3, col: 3}, {row: 4, col: 4}, {row: 5, col: 5}
                ],
                simple_square_2x2: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}
                ],
                simple_dots_3: [
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8}
                ],
                simple_stairs_3: [
                    {row: 3, col: 2}, {row: 4, col: 3}, {row: 5, col: 4}, {row: 6, col: 5}
                ],
                simple_zigzag_small: [
                    {row: 3, col: 3}, {row: 4, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}
                ],
                simple_plus_small: [
                    {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}
                ],
                simple_arrow_up_small: [
                    {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}
                ],
                simple_triangle_small: [
                    {row: 4, col: 4}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}
                ],
                simple_rectangle_2x3: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}
                ]
            };
            return patterns[id] || [];
        }
    },
    
    // Patterns simples à 6 blocs (pour niveau 1-2 de chaque cursus)
    beginner_6blocks: {
        ids: [
            'medium_line_horizontal', 'medium_line_vertical', 'medium_L_shape', 'medium_T_shape',
            'medium_cross_big', 'medium_square_hollow', 'medium_stairs_4', 'medium_zigzag',
            'medium_arrow_up', 'medium_arrow_down', 'medium_diagonal_long', 'medium_rectangle',
            'medium_plus_big', 'medium_corner_extended', 'medium_dots_pattern'
        ],
        
        getData: function(id) {
            const patterns = {
                medium_line_horizontal: [
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, 
                    {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}
                ],
                medium_line_vertical: [
                    {row: 2, col: 4}, {row: 3, col: 4}, {row: 4, col: 4}, 
                    {row: 5, col: 4}, {row: 6, col: 4}, {row: 7, col: 4}
                ],
                medium_L_shape: [
                    {row: 2, col: 3}, {row: 3, col: 3}, {row: 4, col: 3}, 
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}
                ],
                medium_T_shape: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, 
                    {row: 4, col: 4}, {row: 5, col: 4}, {row: 6, col: 4}
                ],
                medium_cross_big: [
                    {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}, 
                    {row: 4, col: 5}, {row: 5, col: 4}, {row: 6, col: 4}
                ],
                medium_square_hollow: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, 
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}
                ],
                medium_stairs_4: [
                    {row: 2, col: 2}, {row: 3, col: 3}, {row: 4, col: 4}, 
                    {row: 5, col: 5}, {row: 6, col: 6}, {row: 7, col: 7}
                ],
                medium_zigzag: [
                    {row: 3, col: 3}, {row: 4, col: 4}, {row: 5, col: 5}, 
                    {row: 5, col: 6}, {row: 6, col: 7}, {row: 7, col: 8}
                ],
                medium_arrow_up: [
                    {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}, 
                    {row: 4, col: 5}, {row: 5, col: 4}, {row: 6, col: 4}
                ],
                medium_arrow_down: [
                    {row: 3, col: 4}, {row: 4, col: 4}, {row: 5, col: 4}, 
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}
                ],
                medium_diagonal_long: [
                    {row: 2, col: 2}, {row: 3, col: 3}, {row: 4, col: 4}, 
                    {row: 5, col: 5}, {row: 6, col: 6}, {row: 7, col: 7}
                ],
                medium_rectangle: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, 
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}
                ],
                medium_plus_big: [
                    {row: 2, col: 4}, {row: 3, col: 4}, {row: 4, col: 3}, 
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 5, col: 4}
                ],
                medium_corner_extended: [
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, 
                    {row: 4, col: 3}, {row: 5, col: 3}, {row: 6, col: 3}
                ],
                medium_dots_pattern: [
                    {row: 3, col: 2}, {row: 3, col: 4}, {row: 3, col: 6}, 
                    {row: 5, col: 2}, {row: 5, col: 4}, {row: 5, col: 6}
                ]
            };
            return patterns[id] || [];
        }
    },
    
    // ========================================
    // DIFFICULTÉS 1 ET 2 - Motifs par peinture
    // ========================================
    
    difficulty1_2: {
        // Liste des identifiants de motifs
        ids: [
            'horizontal_lines', 'vertical_lines', 'rectangle', 'grid', 'stairs',
            'alternating_lines', 'cross', 'border', 'L_shape', 'T_shape',
            'zigzag_horizontal', 'zigzag_vertical', 'checkerboard', 'arrow_up',
            'arrow_down', 'arrow_left', 'arrow_right', 'diamond', 'plus_sign',
            'frame', 'corners', 'diagonal_line', 'X_shape', 'triangle_up',
            'triangle_down', 'house', 'heart', 'smiley',
            // Jeux vidéo (29-43)
            'space_invader_1', 'space_invader_2', 'space_invader_3', 'pacman', 'ghost',
            'mushroom', 'star', 'tetris_L', 'tetris_T', 'tetris_Z', 'tetris_S',
            'tetris_I', 'tetris_O', 'pixel_sword', 'pixel_shield',
            // Animaux (44-63)
            'cat', 'dog', 'bird', 'fish', 'butterfly', 'snail', 'turtle', 'rabbit',
            'mouse', 'frog', 'owl', 'bee', 'ladybug', 'spider', 'crab', 'octopus',
            'penguin', 'duck', 'chicken', 'pig',
            // Nature (64-73)
            'tree', 'flower', 'sun', 'cloud', 'star_5_points', 'moon', 'leaf',
            'cactus', 'tulip', 'mushroom_toad',
            // Symboles (74-88, sans 101)
            'musical_note', 'heart_outline', 'star_outline', 'question_mark',
            'exclamation', 'letter_A', 'letter_B', 'number_1', 'number_2',
            'number_3', 'peace_sign', 'infinity', 'lightning', 'anchor', 'key',
            // Objets quotidien (89-100)
            'cup', 'ice_cream', 'pizza_slice', 'cake', 'apple', 'banana',
            'balloon', 'umbrella', 'envelope', 'phone', 'glasses', 'crown',
            // Géométriques avancés (104-117, sans 107, 110-113, 118)
            'hexagon', 'pentagon', 'octagon', 'concentric_squares',
            'concentric_circles', 'double_arrow_horizontal', 'double_arrow_vertical',
            'hourglass', 'bowtie',
            // Expressions (119-128, sans 123)
            'smiley_sad', 'smiley_wink', 'smiley_surprised', 'smiley_cool',
            'alien', 'robot_face', 'pumpkin', 'christmas_tree', 'gift',
            // Formes abstraites (129-146, sans 136, 143, 147)
            'dots_scattered', 'dots_circle', 'cross_pattern', 'brick_wall',
            'herringbone', 'greek_key', 'celtic_knot', 'pixel_explosion',
            'snowflake', 'asterisk', 'hash', 'percent', 'ampersand',
            'brackets', 'parentheses', 'equals', 'vertical_stripes',
            'horizontal_stripes', 'polka_dots'
        ],
        
        // Générateurs de motifs
        generators: {
            horizontal_lines: (gridSize) => {
                const positions = [];
                const numLines = Math.floor(Math.random() * 3) + 2;
                const lineLength = Math.floor(Math.random() * 5) + 3;
                const spacing = Math.floor(Math.random() * 2) + 1;
                const startRow = Math.floor(Math.random() * 3) + 2;
                const startCol = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < numLines; i++) {
                    const row = startRow + i * (1 + spacing);
                    if (row < gridSize) {
                        for (let col = startCol; col < startCol + lineLength && col < gridSize; col++) {
                            positions.push({row, col});
                        }
                    }
                }
                return positions;
            },
            
            vertical_lines: (gridSize) => {
                const positions = [];
                const numLines = Math.floor(Math.random() * 3) + 2;
                const lineLength = Math.floor(Math.random() * 5) + 3;
                const spacing = Math.floor(Math.random() * 2) + 1;
                const startRow = Math.floor(Math.random() * 3) + 1;
                const startCol = Math.floor(Math.random() * 3) + 2;
                
                for (let i = 0; i < numLines; i++) {
                    const col = startCol + i * (1 + spacing);
                    if (col < gridSize) {
                        for (let row = startRow; row < startRow + lineLength && row < gridSize; row++) {
                            positions.push({row, col});
                        }
                    }
                }
                return positions;
            },
            
            rectangle: (gridSize) => {
                const positions = [];
                const width = Math.floor(Math.random() * 4) + 3;
                const height = Math.floor(Math.random() * 4) + 3;
                const startRow = Math.floor(Math.random() * (gridSize - height - 1)) + 1;
                const startCol = Math.floor(Math.random() * (gridSize - width - 1)) + 1;
                
                for (let row = startRow; row < startRow + height; row++) {
                    for (let col = startCol; col < startCol + width; col++) {
                        positions.push({row, col});
                    }
                }
                return positions;
            },
            
            grid: (gridSize) => {
                const positions = [];
                const numRows = Math.floor(Math.random() * 3) + 3;
                const numCols = Math.floor(Math.random() * 3) + 3;
                const startRow = 2;
                const startCol = 2;
                const spacingRow = Math.floor(Math.random() * 2) + 1;
                const spacingCol = Math.floor(Math.random() * 2) + 1;
                
                for (let i = 0; i < numRows; i++) {
                    for (let j = 0; j < numCols; j++) {
                        const row = startRow + i * spacingRow;
                        const col = startCol + j * spacingCol;
                        if (row < gridSize && col < gridSize) {
                            positions.push({row, col});
                        }
                    }
                }
                return positions;
            },
            
            stairs: (gridSize) => {
                const positions = [];
                const numSteps = Math.floor(Math.random() * 4) + 4;
                const stepWidth = Math.floor(Math.random() * 2) + 2;
                let startRow = 2;
                let startCol = 2;
                
                for (let i = 0; i < numSteps; i++) {
                    const row = startRow + i;
                    const col = startCol + i;
                    if (row < gridSize && col < gridSize) {
                        for (let w = 0; w < stepWidth && col + w < gridSize; w++) {
                            positions.push({row, col: col + w});
                        }
                    }
                }
                return positions;
            },
            
            alternating_lines: (gridSize) => {
                const positions = [];
                const numLines = Math.floor(Math.random() * 3) + 3;
                const lineLength = Math.floor(Math.random() * 4) + 4;
                const startRow = 2;
                const startCol = 2;
                
                for (let i = 0; i < numLines; i++) {
                    const row = startRow + i;
                    if (row < gridSize) {
                        for (let col = startCol; col < startCol + lineLength && col < gridSize; col++) {
                            positions.push({row, col});
                        }
                    }
                }
                return positions;
            },
            
            cross: (gridSize) => {
                const positions = [];
                const size = Math.floor(Math.random() * 2) + 3;
                const center = 5;
                
                for (let i = -size; i <= size; i++) {
                    if (center + i >= 0 && center + i < gridSize) {
                        positions.push({row: center + i, col: center});
                        positions.push({row: center, col: center + i});
                    }
                }
                return positions;
            },
            
            border: (gridSize) => {
                const positions = [];
                const margin = Math.floor(Math.random() * 2) + 1;
                
                for (let col = margin; col < gridSize - margin; col++) {
                    positions.push({row: margin, col});
                    positions.push({row: gridSize - margin - 1, col});
                }
                for (let row = margin; row < gridSize - margin; row++) {
                    positions.push({row, col: margin});
                    positions.push({row, col: gridSize - margin - 1});
                }
                return positions;
            },
            
            L_shape: (gridSize) => {
                const positions = [];
                const size = Math.floor(Math.random() * 3) + 4;
                const startRow = 2;
                const startCol = 2;
                
                for (let row = startRow; row < startRow + size && row < gridSize; row++) {
                    positions.push({row, col: startCol});
                }
                for (let col = startCol; col < startCol + size && col < gridSize; col++) {
                    positions.push({row: startRow + size - 1, col});
                }
                return positions;
            },
            
            T_shape: (gridSize) => {
                const positions = [];
                const width = Math.floor(Math.random() * 3) + 4;
                const height = Math.floor(Math.random() * 2) + 3;
                const startRow = 2;
                const startCol = 3;
                
                for (let col = startCol; col < startCol + width && col < gridSize; col++) {
                    positions.push({row: startRow, col});
                }
                const midCol = startCol + Math.floor(width / 2);
                for (let row = startRow; row < startRow + height && row < gridSize; row++) {
                    positions.push({row, col: midCol});
                }
                return positions;
            },
            
            zigzag_horizontal: (gridSize) => {
                const positions = [];
                const length = Math.floor(Math.random() * 3) + 4;
                let row = 3;
                let col = 2;
                let goingDown = true;
                
                for (let i = 0; i < length; i++) {
                    if (row < gridSize && col < gridSize) {
                        positions.push({row, col});
                    }
                    col++;
                    if (goingDown) {
                        row++;
                        if (row >= 7) goingDown = false;
                    } else {
                        row--;
                        if (row <= 3) goingDown = true;
                    }
                }
                return positions;
            },
            
            zigzag_vertical: (gridSize) => {
                const positions = [];
                const length = Math.floor(Math.random() * 3) + 4;
                let row = 2;
                let col = 3;
                let goingRight = true;
                
                for (let i = 0; i < length; i++) {
                    if (row < gridSize && col < gridSize) {
                        positions.push({row, col});
                    }
                    row++;
                    if (goingRight) {
                        col++;
                        if (col >= 7) goingRight = false;
                    } else {
                        col--;
                        if (col <= 3) goingRight = true;
                    }
                }
                return positions;
            },
            
            checkerboard: (gridSize) => {
                const positions = [];
                const size = Math.floor(Math.random() * 2) + 4;
                const startRow = 2;
                const startCol = 2;
                
                for (let row = startRow; row < startRow + size && row < gridSize; row++) {
                    for (let col = startCol; col < startCol + size && col < gridSize; col++) {
                        if ((row + col) % 2 === 0) {
                            positions.push({row, col});
                        }
                    }
                }
                return positions;
            },
            
            arrow_up: (gridSize) => {
                const positions = [];
                const centerCol = 5;
                const startRow = 5;
                
                positions.push({row: startRow, col: centerCol});
                positions.push({row: startRow + 1, col: centerCol - 1});
                positions.push({row: startRow + 1, col: centerCol});
                positions.push({row: startRow + 1, col: centerCol + 1});
                positions.push({row: startRow + 2, col: centerCol - 2});
                positions.push({row: startRow + 2, col: centerCol + 2});
                for (let i = 0; i < 3; i++) {
                    positions.push({row: startRow + 3 + i, col: centerCol});
                }
                return positions;
            },
            
            arrow_down: (gridSize) => {
                const positions = [];
                const centerCol = 5;
                const startRow = 2;
                
                for (let i = 0; i < 3; i++) {
                    positions.push({row: startRow + i, col: centerCol});
                }
                positions.push({row: startRow + 3, col: centerCol - 2});
                positions.push({row: startRow + 3, col: centerCol + 2});
                positions.push({row: startRow + 4, col: centerCol - 1});
                positions.push({row: startRow + 4, col: centerCol});
                positions.push({row: startRow + 4, col: centerCol + 1});
                positions.push({row: startRow + 5, col: centerCol});
                return positions;
            },
            
            arrow_left: (gridSize) => {
                const positions = [];
                const centerRow = 5;
                const startCol = 5;
                
                positions.push({row: centerRow, col: startCol});
                positions.push({row: centerRow - 1, col: startCol + 1});
                positions.push({row: centerRow, col: startCol + 1});
                positions.push({row: centerRow + 1, col: startCol + 1});
                positions.push({row: centerRow - 2, col: startCol + 2});
                positions.push({row: centerRow + 2, col: startCol + 2});
                for (let i = 0; i < 3; i++) {
                    positions.push({row: centerRow, col: startCol + 3 + i});
                }
                return positions;
            },
            
            arrow_right: (gridSize) => {
                const positions = [];
                const centerRow = 5;
                const startCol = 2;
                
                for (let i = 0; i < 3; i++) {
                    positions.push({row: centerRow, col: startCol + i});
                }
                positions.push({row: centerRow - 2, col: startCol + 3});
                positions.push({row: centerRow + 2, col: startCol + 3});
                positions.push({row: centerRow - 1, col: startCol + 4});
                positions.push({row: centerRow, col: startCol + 4});
                positions.push({row: centerRow + 1, col: startCol + 4});
                positions.push({row: centerRow, col: startCol + 5});
                return positions;
            },
            
            diamond: (gridSize) => {
                const positions = [];
                const center = 5;
                const size = 3;
                
                for (let i = 0; i <= size; i++) {
                    for (let j = 0; j <= size - i; j++) {
                        positions.push({row: center - i, col: center + j});
                        positions.push({row: center - i, col: center - j});
                        positions.push({row: center + i, col: center + j});
                        positions.push({row: center + i, col: center - j});
                    }
                }
                return positions;
            },
            
            plus_sign: (gridSize) => {
                const positions = [];
                const center = 5;
                const armLength = 2;
                
                for (let i = -armLength; i <= armLength; i++) {
                    positions.push({row: center + i, col: center});
                    positions.push({row: center, col: center + i});
                }
                return positions;
            },
            
            frame: (gridSize) => {
                const positions = [];
                
                for (let col = 1; col <= 8; col++) {
                    positions.push({row: 1, col});
                    positions.push({row: 8, col});
                }
                for (let row = 1; row <= 8; row++) {
                    positions.push({row, col: 1});
                    positions.push({row, col: 8});
                }
                return positions;
            },
            
            corners: (gridSize) => {
                const positions = [];
                const cornerSize = 3;
                
                for (let i = 0; i < cornerSize; i++) {
                    positions.push({row: 1, col: 1 + i});
                    positions.push({row: 1 + i, col: 1});
                }
                for (let i = 0; i < cornerSize; i++) {
                    positions.push({row: 1, col: 8 - i});
                    positions.push({row: 1 + i, col: 8});
                }
                for (let i = 0; i < cornerSize; i++) {
                    positions.push({row: 8, col: 1 + i});
                    positions.push({row: 8 - i, col: 1});
                }
                for (let i = 0; i < cornerSize; i++) {
                    positions.push({row: 8, col: 8 - i});
                    positions.push({row: 8 - i, col: 8});
                }
                return positions;
            },
            
            diagonal_line: (gridSize) => {
                const positions = [];
                const length = Math.floor(Math.random() * 2) + 6;
                const startRow = 2;
                const startCol = 2;
                
                for (let i = 0; i < length; i++) {
                    if (startRow + i < gridSize && startCol + i < gridSize) {
                        positions.push({row: startRow + i, col: startCol + i});
                    }
                }
                return positions;
            },
            
            X_shape: (gridSize) => {
                const positions = [];
                const size = 4;
                const center = 5;
                
                for (let i = -size; i <= size; i++) {
                    if (center + i >= 0 && center + i < gridSize) {
                        positions.push({row: center + i, col: center + i});
                        positions.push({row: center + i, col: center - i});
                    }
                }
                return positions;
            },
            
            triangle_up: (gridSize) => {
                const positions = [];
                const base = 5;
                const startRow = 6;
                
                for (let i = 0; i <= 4; i++) {
                    const width = 2 * i + 1;
                    const startCol = base - i;
                    for (let j = 0; j < width; j++) {
                        if (startRow - i >= 0 && startCol + j < gridSize) {
                            positions.push({row: startRow - i, col: startCol + j});
                        }
                    }
                }
                return positions;
            },
            
            triangle_down: (gridSize) => {
                const positions = [];
                const base = 5;
                const startRow = 2;
                
                for (let i = 0; i <= 4; i++) {
                    const width = 2 * i + 1;
                    const startCol = base - i;
                    for (let j = 0; j < width; j++) {
                        if (startRow + i < gridSize && startCol + j < gridSize) {
                            positions.push({row: startRow + i, col: startCol + j});
                        }
                    }
                }
                return positions;
            },
            
            house: (gridSize) => {
                const positions = [];
                
                positions.push({row: 2, col: 5});
                positions.push({row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6});
                positions.push({row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7});
                
                for (let row = 5; row <= 7; row++) {
                    for (let col = 3; col <= 7; col++) {
                        positions.push({row, col});
                    }
                }
                return positions;
            },
            
            heart: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            smiley: (gridSize) => {
                return [
                    {row: 1, col: 4}, {row: 1, col: 5}, {row: 1, col: 6},
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 7},
                    {row: 8, col: 4}, {row: 8, col: 5}, {row: 8, col: 6},
                    {row: 4, col: 4}, {row: 4, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            // === JEUX VIDÉO (29-43) ===
            space_invader_1: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 4}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 5}, {row: 5, col: 7}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            space_invader_2: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 5}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 2}, {row: 7, col: 4}, {row: 7, col: 6}, {row: 7, col: 8}
                ];
            },
            
            space_invader_3: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 5}, {row: 6, col: 7},
                    {row: 7, col: 4}, {row: 7, col: 6}
                ];
            },
            
            pacman: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            ghost: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 3}, {row: 7, col: 5}, {row: 7, col: 7}
                ];
            },
            
            mushroom: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            star: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 5}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            tetris_L: (gridSize) => {
                return [
                    {row: 3, col: 4},
                    {row: 4, col: 4},
                    {row: 5, col: 4},
                    {row: 5, col: 5}, {row: 5, col: 6}
                ];
            },
            
            tetris_T: (gridSize) => {
                return [
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 4}
                ];
            },
            
            tetris_Z: (gridSize) => {
                return [
                    {row: 4, col: 3}, {row: 4, col: 4},
                    {row: 5, col: 4}, {row: 5, col: 5}
                ];
            },
            
            tetris_S: (gridSize) => {
                return [
                    {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 3}, {row: 5, col: 4}
                ];
            },
            
            tetris_I: (gridSize) => {
                return [
                    {row: 3, col: 5},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 5}
                ];
            },
            
            tetris_O: (gridSize) => {
                return [
                    {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 4}, {row: 5, col: 5}
                ];
            },
            
            pixel_sword: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            pixel_shield: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            // === ANIMAUX (44-63) ===
            cat: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            dog: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5},
                    {row: 7, col: 3}, {row: 7, col: 6}
                ];
            },
            
            bird: (gridSize) => {
                return [
                    {row: 3, col: 4}, {row: 3, col: 5},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 5},
                    {row: 7, col: 4}, {row: 7, col: 6}
                ];
            },
            
            fish: (gridSize) => {
                return [
                    {row: 4, col: 2},
                    {row: 3, col: 3}, {row: 4, col: 3}, {row: 5, col: 3},
                    {row: 3, col: 4}, {row: 4, col: 4}, {row: 5, col: 4},
                    {row: 3, col: 5}, {row: 4, col: 5}, {row: 5, col: 5},
                    {row: 2, col: 6}, {row: 6, col: 6},
                    {row: 1, col: 7}, {row: 7, col: 7}
                ];
            },
            
            butterfly: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            snail: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 7}, {row: 6, col: 8}
                ];
            },
            
            turtle: (gridSize) => {
                return [
                    {row: 3, col: 5},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 2}, {row: 7, col: 8}
                ];
            },
            
            rabbit: (gridSize) => {
                return [
                    {row: 1, col: 3}, {row: 1, col: 7},
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            mouse: (gridSize) => {
                return [
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5},
                    {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            frog: (gridSize) => {
                return [
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 2}, {row: 7, col: 8}
                ];
            },
            
            owl: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 6}, {row: 3, col: 7}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            bee: (gridSize) => {
                return [
                    {row: 3, col: 4}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 5}
                ];
            },
            
            ladybug: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            spider: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 2}, {row: 7, col: 8}
                ];
            },
            
            crab: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            octopus: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 2}, {row: 6, col: 4}, {row: 6, col: 6}, {row: 6, col: 8},
                    {row: 7, col: 2}, {row: 7, col: 4}, {row: 7, col: 6}, {row: 7, col: 8}
                ];
            },
            
            penguin: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            duck: (gridSize) => {
                return [
                    {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 4}, {row: 7, col: 7}
                ];
            },
            
            chicken: (gridSize) => {
                return [
                    {row: 2, col: 6},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 5},
                    {row: 7, col: 4}, {row: 7, col: 6}
                ];
            },
            
            pig: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            // === NATURE (64-73) ===
            tree: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            flower: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            sun: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 2}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 8},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 5}
                ];
            },
            
            cloud: (gridSize) => {
                return [
                    {row: 3, col: 4}, {row: 3, col: 5},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7}, {row: 5, col: 8}
                ];
            },
            
            star_5_points: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            moon: (gridSize) => {
                return [
                    {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 4}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5}
                ];
            },
            
            leaf: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 6}
                ];
            },
            
            cactus: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 5},
                    {row: 7, col: 5}
                ];
            },
            
            tulip: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 6},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            mushroom_toad: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            // === SYMBOLES (74-88, sans 101) ===
            musical_note: (gridSize) => {
                return [
                    {row: 1, col: 6},
                    {row: 2, col: 6},
                    {row: 3, col: 6},
                    {row: 4, col: 6},
                    {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 4}, {row: 7, col: 5}
                ];
            },
            
            heart_outline: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 5}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            star_outline: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 7}
                ];
            },
            
            question_mark: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 6},
                    {row: 5, col: 5},
                    {row: 7, col: 5}
                ];
            },
            
            exclamation: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 5},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 7, col: 5}
                ];
            },
            
            letter_A: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 3}, {row: 7, col: 7}
                ];
            },
            
            letter_B: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            number_1: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5},
                    {row: 3, col: 5},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}, {row: 7, col: 7}
                ];
            },
            
            number_2: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 7},
                    {row: 4, col: 6},
                    {row: 5, col: 5},
                    {row: 6, col: 4},
                    {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}, {row: 7, col: 7}
                ];
            },
            
            number_3: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 7},
                    {row: 6, col: 7},
                    {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}, {row: 7, col: 7}
                ];
            },
            
            peace_sign: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            infinity: (gridSize) => {
                return [
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 4}, {row: 5, col: 6}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 5}, {row: 6, col: 7}
                ];
            },
            
            lightning: (gridSize) => {
                return [
                    {row: 1, col: 6},
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 5},
                    {row: 5, col: 4},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5},
                    {row: 7, col: 4}
                ];
            },
            
            anchor: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 3}, {row: 6, col: 5}, {row: 6, col: 7},
                    {row: 7, col: 2}, {row: 7, col: 3}, {row: 7, col: 7}, {row: 7, col: 8}
                ];
            },
            
            key: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4},
                    {row: 3, col: 2}, {row: 3, col: 5},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 5}, {row: 6, col: 6},
                    {row: 7, col: 5}
                ];
            },
            
            // === OBJETS QUOTIDIEN (89-100) ===
            cup: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            ice_cream: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 5},
                    {row: 7, col: 5}
                ];
            },
            
            pizza_slice: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 6},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 5}
                ];
            },
            
            cake: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 5},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8},
                    {row: 7, col: 2}, {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}, {row: 7, col: 7}, {row: 7, col: 8}
                ];
            },
            
            apple: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            banana: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5},
                    {row: 3, col: 3}, {row: 3, col: 4},
                    {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 6}, {row: 6, col: 7},
                    {row: 7, col: 6}
                ];
            },
            
            balloon: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 5}
                ];
            },
            
            umbrella: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 5}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 5}, {row: 4, col: 8},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 4}
                ];
            },
            
            envelope: (gridSize) => {
                return [
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 5}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8}
                ];
            },
            
            phone: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            glasses: (gridSize) => {
                return [
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 5}, {row: 5, col: 7}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 7}, {row: 6, col: 8}
                ];
            },
            
            crown: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 5}, {row: 2, col: 7},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7}, {row: 5, col: 8}
                ];
            },
            
            // === GÉOMÉTRIQUES AVANCÉS (104-117, sans 107, 110-113, 118) ===
            hexagon: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            pentagon: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 4}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            octagon: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}
                ];
            },
            
            concentric_squares: (gridSize) => {
                return [
                    {row: 1, col: 2}, {row: 1, col: 3}, {row: 1, col: 4}, {row: 1, col: 5}, {row: 1, col: 6}, {row: 1, col: 7}, {row: 1, col: 8},
                    {row: 2, col: 2}, {row: 2, col: 8},
                    {row: 3, col: 2}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 8},
                    {row: 7, col: 2}, {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}, {row: 7, col: 7}, {row: 7, col: 8}
                ];
            },
            
            concentric_circles: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            double_arrow_horizontal: (gridSize) => {
                return [
                    {row: 4, col: 1}, {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4},
                    {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4},
                    {row: 3, col: 7}, {row: 3, col: 8},
                    {row: 7, col: 7}, {row: 7, col: 8}
                ];
            },
            
            double_arrow_vertical: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 5},
                    {row: 4, col: 5},
                    {row: 5, col: 5},
                    {row: 6, col: 5},
                    {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6},
                    {row: 8, col: 5}
                ];
            },
            
            hourglass: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 6},
                    {row: 5, col: 5},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 7},
                    {row: 8, col: 2}, {row: 8, col: 3}, {row: 8, col: 4}, {row: 8, col: 5}, {row: 8, col: 6}, {row: 8, col: 7}, {row: 8, col: 8}
                ];
            },
            
            bowtie: (gridSize) => {
                return [
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 2}, {row: 7, col: 8}
                ];
            },
            
            // === EXPRESSIONS (119-128, sans 123) ===
            smiley_sad: (gridSize) => {
                return [
                    {row: 1, col: 4}, {row: 1, col: 5}, {row: 1, col: 6},
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 7},
                    {row: 8, col: 4}, {row: 8, col: 5}, {row: 8, col: 6}
                ];
            },
            
            smiley_wink: (gridSize) => {
                return [
                    {row: 1, col: 4}, {row: 1, col: 5}, {row: 1, col: 6},
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 7},
                    {row: 8, col: 4}, {row: 8, col: 5}, {row: 8, col: 6}
                ];
            },
            
            smiley_surprised: (gridSize) => {
                return [
                    {row: 1, col: 4}, {row: 1, col: 5}, {row: 1, col: 6},
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 5}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 5}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 7},
                    {row: 8, col: 4}, {row: 8, col: 5}, {row: 8, col: 6}
                ];
            },
            
            smiley_cool: (gridSize) => {
                return [
                    {row: 1, col: 4}, {row: 1, col: 5}, {row: 1, col: 6},
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 7},
                    {row: 8, col: 4}, {row: 8, col: 5}, {row: 8, col: 6}
                ];
            },
            
            alien: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6},
                    {row: 7, col: 3}, {row: 7, col: 5}, {row: 7, col: 7}
                ];
            },
            
            robot_face: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8},
                    {row: 7, col: 4}, {row: 7, col: 6}
                ];
            },
            
            pumpkin: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 2}, {row: 3, col: 8},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}
                ];
            },
            
            christmas_tree: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6}, {row: 5, col: 7},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8},
                    {row: 7, col: 5}
                ];
            },
            
            gift: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 2}, {row: 5, col: 5}, {row: 5, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 5}, {row: 6, col: 8},
                    {row: 7, col: 2}, {row: 7, col: 3}, {row: 7, col: 4}, {row: 7, col: 5}, {row: 7, col: 6}, {row: 7, col: 7}, {row: 7, col: 8}
                ];
            },
            
            // === FORMES ABSTRAITES (129-146, sans 136, 143, 147) ===
            dots_scattered: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 7},
                    {row: 3, col: 5},
                    {row: 4, col: 2}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 7},
                    {row: 7, col: 5}
                ];
            },
            
            dots_circle: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6}
                ];
            },
            
            cross_pattern: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 5}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 6},
                    {row: 4, col: 4}, {row: 4, col: 7},
                    {row: 5, col: 2}, {row: 5, col: 5}, {row: 5, col: 8},
                    {row: 6, col: 3}, {row: 6, col: 6},
                    {row: 7, col: 4}, {row: 7, col: 7}
                ];
            },
            
            brick_wall: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 7}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 5}, {row: 5, col: 7},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8}
                ];
            },
            
            herringbone: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 5}, {row: 2, col: 8},
                    {row: 3, col: 3}, {row: 3, col: 6},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 6},
                    {row: 6, col: 2}, {row: 6, col: 5}, {row: 6, col: 8},
                    {row: 7, col: 3}, {row: 7, col: 6}
                ];
            },
            
            greek_key: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5},
                    {row: 3, col: 5},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 3},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}
                ];
            },
            
            celtic_knot: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}
                ];
            },
            
            pixel_explosion: (gridSize) => {
                return [
                    {row: 2, col: 5},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 2}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 8},
                    {row: 5, col: 3}, {row: 5, col: 5}, {row: 5, col: 7},
                    {row: 6, col: 5}
                ];
            },
            
            snowflake: (gridSize) => {
                return [
                    {row: 1, col: 5},
                    {row: 2, col: 3}, {row: 2, col: 5}, {row: 2, col: 7},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 2}, {row: 4, col: 5}, {row: 4, col: 8},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 5}, {row: 6, col: 7},
                    {row: 7, col: 5}
                ];
            },
            
            asterisk: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 5}, {row: 2, col: 7},
                    {row: 3, col: 4}, {row: 3, col: 5}, {row: 3, col: 6},
                    {row: 4, col: 3}, {row: 4, col: 5}, {row: 4, col: 7},
                    {row: 5, col: 4}, {row: 5, col: 5}, {row: 5, col: 6},
                    {row: 6, col: 3}, {row: 6, col: 5}, {row: 6, col: 7}
                ];
            },
            
            hash: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 3}, {row: 3, col: 5}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 5}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}
                ];
            },
            
            percent: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 3},
                    {row: 3, col: 2}, {row: 3, col: 3}, {row: 3, col: 4},
                    {row: 4, col: 5},
                    {row: 5, col: 6}, {row: 5, col: 7}, {row: 5, col: 8},
                    {row: 6, col: 7}, {row: 6, col: 8}
                ];
            },
            
            ampersand: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 5},
                    {row: 3, col: 3}, {row: 3, col: 6},
                    {row: 4, col: 4}, {row: 4, col: 5},
                    {row: 5, col: 3}, {row: 5, col: 6},
                    {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 7}
                ];
            },
            
            brackets: (gridSize) => {
                return [
                    {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 7},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 6}, {row: 6, col: 7}
                ];
            },
            
            parentheses: (gridSize) => {
                return [
                    {row: 2, col: 4}, {row: 2, col: 6},
                    {row: 3, col: 3}, {row: 3, col: 7},
                    {row: 4, col: 3}, {row: 4, col: 7},
                    {row: 5, col: 3}, {row: 5, col: 7},
                    {row: 6, col: 4}, {row: 6, col: 6}
                ];
            },
            
            equals: (gridSize) => {
                return [
                    {row: 4, col: 2}, {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5}, {row: 4, col: 6}, {row: 4, col: 7}, {row: 4, col: 8},
                    {row: 6, col: 2}, {row: 6, col: 3}, {row: 6, col: 4}, {row: 6, col: 5}, {row: 6, col: 6}, {row: 6, col: 7}, {row: 6, col: 8}
                ];
            },
            
            vertical_stripes: (gridSize) => {
                const positions = [];
                for (let col = 2; col <= 8; col += 2) {
                    for (let row = 2; row <= 7; row++) {
                        positions.push({row, col});
                    }
                }
                return positions;
            },
            
            horizontal_stripes: (gridSize) => {
                const positions = [];
                for (let row = 2; row <= 7; row += 2) {
                    for (let col = 2; col <= 8; col++) {
                        positions.push({row, col});
                    }
                }
                return positions;
            },
            
            polka_dots: (gridSize) => {
                return [
                    {row: 2, col: 2}, {row: 2, col: 5}, {row: 2, col: 8},
                    {row: 4, col: 3}, {row: 4, col: 6},
                    {row: 6, col: 2}, {row: 6, col: 5}, {row: 6, col: 8}
                ];
            }
        }
    },
    
    // ========================================
    // DIFFICULTÉ 3 - Motifs géométriques
    // ========================================
    
    difficulty3: {
        ids: ['square', 'spiral', 'zigzag', 'stairs', 'checkerboard', 'cross']
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PATTERNS;
}
