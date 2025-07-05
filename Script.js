        const BOARD_SIZE = 8;
        let gameBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
        let score = 0;
        let highScore = 0;
        let currentPieces = [];
        let draggedPiece = null;
        let draggedPieceIndex = -1;
        let comboCount = 0;
        let isNewHighScore = false;
        
        // Load high score from memory
        let gameData = {
            highScore: 0,
            gamesPlayed: 0,
            totalScore: 0
        };
        
        const pieceShapes = [
            // Single block
            [[true]],
            // 2x1 horizontal
            [[true, true]],
            // 2x1 vertical
            [[true], [true]],
            // 3x1 horizontal
            [[true, true, true]],
            // 3x1 vertical
            [[true], [true], [true]],
            // L-shape
            [[true, true], [true, false]],
            // L-shape rotated
            [[true, false], [true, true]],
            // 2x2 square
            [[true, true], [true, true]],
            // T-shape
            [[true, true, true], [false, true, false]],
            // Z-shape
            [[true, true, false], [false, true, true]]
        ];
        
        function initGame() {
            loadGameData();
            createBoard();
            generateNewPieces();
            updateScore();
            updateHighScore();
        }
        
        function loadGameData() {
            // In a real environment, this would load from localStorage
            // For now, we'll keep it in memory during the session
            highScore = gameData.highScore;
        }
        
        function saveGameData() {
            // In a real environment, this would save to localStorage
            gameData.highScore = highScore;
            gameData.gamesPlayed++;
            gameData.totalScore += score;
        }
        
        function createBoard() {
            const board = document.getElementById('gameBoard');
            board.innerHTML = '';
            
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = Math.floor(i / BOARD_SIZE);
                cell.dataset.col = i % BOARD_SIZE;
                
                cell.addEventListener('dragover', handleDragOver);
                cell.addEventListener('drop', handleDrop);
                
                board.appendChild(cell);
            }
        }
        
        function generateNewPieces() {
            currentPieces = [];
            for (let i = 0; i < 3; i++) {
                const randomShape = pieceShapes[Math.floor(Math.random() * pieceShapes.length)];
                currentPieces.push(randomShape);
            }
            renderPieces();
        }
        
        function renderPieces() {
            const container = document.getElementById('piecesContainer');
            container.innerHTML = '';
            
            currentPieces.forEach((piece, index) => {
                if (piece) {
                    const pieceElement = createPieceElement(piece, index);
                    container.appendChild(pieceElement);
                }
            });
        }
        
        function createPieceElement(shape, index) {
            const piece = document.createElement('div');
            piece.className = 'piece';
            piece.draggable = true;
            piece.dataset.pieceIndex = index;
            
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('dragend', handleDragEnd);
            
            const grid = document.createElement('div');
            grid.className = 'piece-grid';
            grid.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;
            
            shape.forEach(row => {
                row.forEach(cell => {
                    const cellElement = document.createElement('div');
                    cellElement.className = `piece-cell ${cell ? 'filled' : 'empty'}`;
                    grid.appendChild(cellElement);
                });
            });
            
            piece.appendChild(grid);
            return piece;
        }
        
        function handleDragStart(e) {
            draggedPieceIndex = parseInt(e.target.dataset.pieceIndex);
            draggedPiece = currentPieces[draggedPieceIndex];
            e.target.classList.add('dragging');
        }
        
        function handleDragEnd(e) {
            e.target.classList.remove('dragging');
            clearHighlights();
        }
        
        function handleDragOver(e) {
            e.preventDefault();
            clearHighlights();
            
            if (draggedPiece) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (canPlacePiece(draggedPiece, row, col)) {
                    highlightValidPlacement(draggedPiece, row, col);
                } else {
                    highlightInvalidPlacement(row, col);
                }
            }
        }
        
        function handleDrop(e) {
            e.preventDefault();
            
            if (draggedPiece) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (canPlacePiece(draggedPiece, row, col)) {
                    placePiece(draggedPiece, row, col);
                    currentPieces[draggedPieceIndex] = null;
                    
                    clearLines();
                    updateBoard();
                    renderPieces();
                    
                    if (currentPieces.every(piece => piece === null)) {
                        generateNewPieces();
                    }
                    
                    if (isGameOver()) {
                        showGameOver();
                    }
                }
            }
            
            clearHighlights();
        }
        
        function canPlacePiece(piece, startRow, startCol) {
            for (let i = 0; i < piece.length; i++) {
                for (let j = 0; j < piece[i].length; j++) {
                    if (piece[i][j]) {
                        const row = startRow + i;
                        const col = startCol + j;
                        
                        if (row >= BOARD_SIZE || col >= BOARD_SIZE || gameBoard[row][col]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        
        function placePiece(piece, startRow, startCol) {
            let blocksPlaced = 0;
            for (let i = 0; i < piece.length; i++) {
                for (let j = 0; j < piece[i].length; j++) {
                    if (piece[i][j]) {
                        gameBoard[startRow + i][startCol + j] = true;
                        blocksPlaced++;
                    }
                }
            }
            
            // Add points for placing blocks
            score += blocksPlaced * 10;
            updateScore();
        }
        
        function clearLines() {
            let linesCleared = 0;
            let rowsCleared = [];
            let colsCleared = [];
            
            // Check rows
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (gameBoard[row].every(cell => cell)) {
                    rowsCleared.push(row);
                    linesCleared++;
                }
            }
            
            // Check columns
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (gameBoard.every(row => row[col])) {
                    colsCleared.push(col);
                    linesCleared++;
                }
            }
            
            if (linesCleared > 0) {
                // Show clear effect
                showLineClearEffect(rowsCleared, colsCleared);
                
                // Clear the lines
                rowsCleared.forEach(row => {
                    gameBoard[row].fill(false);
                });
                colsCleared.forEach(col => {
                    for (let row = 0; row < BOARD_SIZE; row++) {
                        gameBoard[row][col] = false;
                    }
                });
                
                // Calculate score with combo multiplier
                comboCount++;
                let baseScore = linesCleared * 100;
                let comboBonus = comboCount > 1 ? (comboCount - 1) * 50 : 0;
                let totalScore = baseScore + comboBonus;
                
                score += totalScore;
                updateScore();
                
                // Show combo display
                if (comboCount > 1) {
                    showComboDisplay(comboCount, totalScore);
                }
                
                // Check for new high score
                if (score > highScore) {
                    highScore = score;
                    updateHighScore();
                    if (!isNewHighScore) {
                        isNewHighScore = true;
                        showNewHighScoreEffect();
                    }
                }
                
                // Trigger score animation
                document.getElementById('score').classList.add('score-animation');
                setTimeout(() => {
                    document.getElementById('score').classList.remove('score-animation');
                }, 800);
            } else {
                comboCount = 0;
            }
        }
        
        function showLineClearEffect(rows, cols) {
            setTimeout(() => {
                rows.forEach(row => {
                    for (let col = 0; col < BOARD_SIZE; col++) {
                        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add('line-clear-effect');
                        }
                    }
                });
                
                cols.forEach(col => {
                    for (let row = 0; row < BOARD_SIZE; row++) {
                        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add('line-clear-effect');
                        }
                    }
                });
                
                setTimeout(() => {
                    document.querySelectorAll('.line-clear-effect').forEach(cell => {
                        cell.classList.remove('line-clear-effect');
                    });
                }, 1000);
            }, 200);
        }
        
        function showComboDisplay(combo, points) {
            const comboDisplay = document.getElementById('comboDisplay');
            comboDisplay.textContent = `COMBO x${combo}! +${points}`;
            comboDisplay.classList.add('combo-animation');
            
            setTimeout(() => {
                comboDisplay.classList.remove('combo-animation');
            }, 2000);
        }
        
        function showNewHighScoreEffect() {
            const highScoreElement = document.getElementById('highScore');
            highScoreElement.parentElement.classList.add('new-highscore');
        }
        
        function updateBoard() {
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                if (gameBoard[row][col]) {
                    cell.classList.add('filled');
                } else {
                    cell.classList.remove('filled');
                }
            });
        }
        
        function highlightValidPlacement(piece, startRow, startCol) {
            for (let i = 0; i < piece.length; i++) {
                for (let j = 0; j < piece[i].length; j++) {
                    if (piece[i][j]) {
                        const row = startRow + i;
                        const col = startCol + j;
                        
                        if (row < BOARD_SIZE && col < BOARD_SIZE) {
                            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                            if (cell) {
                                cell.classList.add('valid-drop');
                            }
                        }
                    }
                }
            }
        }
        
        function highlightInvalidPlacement(row, col) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('invalid-drop');
            }
        }
        
        function clearHighlights() {
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('valid-drop', 'invalid-drop', 'highlight');
            });
        }
        
        function isGameOver() {
            for (let piece of currentPieces) {
                if (piece) {
                    for (let row = 0; row < BOARD_SIZE; row++) {
                        for (let col = 0; col < BOARD_SIZE; col++) {
                            if (canPlacePiece(piece, row, col)) {
                                return false;
                            }
                        }
                    }
                }
            }
            return currentPieces.some(piece => piece !== null);
        }
        
        function showGameOver() {
            // Check if it's a new high score
            if (score > gameData.highScore) {
                document.getElementById('newHighScoreMsg').style.display = 'block';
            } else {
                document.getElementById('newHighScoreMsg').style.display = 'none';
            }
            
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOverScreen').classList.remove('hidden');
            saveGameData();
        }
        
        function hideGameOver() {
            document.getElementById('gameOverScreen').classList.add('hidden');
        }
        
        function updateScore() {
            document.getElementById('score').textContent = score.toLocaleString();
        }
        
        function updateHighScore() {
            document.getElementById('highScore').textContent = highScore.toLocaleString();
        }
        
        function newGame() {
            gameBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
            score = 0;
            comboCount = 0;
            isNewHighScore = false;
            currentPieces = [];
            
            // Remove high score effect
            document.getElementById('highScore').parentElement.classList.remove('new-highscore');
            
            hideGameOver();
            initGame();
        }
        
        function clearBoard() {
            gameBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
            comboCount = 0;
            updateBoard();
        }
        
        // Initialize game
        initGame();