class Game2048 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048-best-score')) || 0;
        this.gameOver = false;
        this.won = false;
        this.gameStats = this.loadGameStats();
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.updateDisplay();
        this.addRandomTile();
        this.addRandomTile();
        this.bindEvents();
        this.updateBestScore();
    }
    
    createBoard() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.renderBoard();
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${i}-${j}`;
                gameBoard.appendChild(cell);
            }
        }
        
        this.updateTiles();
    }
    
    updateTiles() {
        // 清除所有现有方块
        document.querySelectorAll('.tile').forEach(tile => tile.remove());
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] !== 0) {
                    this.addTile(i, j, this.board[i][j]);
                }
            }
        }
    }
    
    addTile(row, col, value) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        cell.appendChild(tile);
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    move(direction) {
        if (this.gameOver) return false;
        
        const oldBoard = this.board.map(row => [...row]);
        let moved = false;
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        if (moved) {
            this.addRandomTile();
            this.updateDisplay();
            this.checkGameOver();
        }
        
        return moved;
    }
    
    moveLeft() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = this.board[i].filter(val => val !== 0);
            const merged = this.mergeRow(row);
            const newRow = [...merged, ...Array(4 - merged.length).fill(0)];
            
            if (JSON.stringify(this.board[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.board[i] = newRow;
        }
        return moved;
    }
    
    moveRight() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = this.board[i].filter(val => val !== 0);
            const merged = this.mergeRow(row);
            const newRow = [...Array(4 - merged.length).fill(0), ...merged];
            
            if (JSON.stringify(this.board[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.board[i] = newRow;
        }
        return moved;
    }
    
    moveUp() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const column = [];
            for (let i = 0; i < 4; i++) {
                if (this.board[i][j] !== 0) {
                    column.push(this.board[i][j]);
                }
            }
            const merged = this.mergeRow(column);
            const newColumn = [...merged, ...Array(4 - merged.length).fill(0)];
            
            for (let i = 0; i < 4; i++) {
                if (this.board[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.board[i][j] = newColumn[i];
            }
        }
        return moved;
    }
    
    moveDown() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const column = [];
            for (let i = 0; i < 4; i++) {
                if (this.board[i][j] !== 0) {
                    column.push(this.board[i][j]);
                }
            }
            const merged = this.mergeRow(column);
            const newColumn = [...Array(4 - merged.length).fill(0), ...merged];
            
            for (let i = 0; i < 4; i++) {
                if (this.board[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.board[i][j] = newColumn[i];
            }
        }
        return moved;
    }
    
    mergeRow(row) {
        const merged = [];
        let i = 0;
        
        while (i < row.length) {
            if (i < row.length - 1 && row[i] === row[i + 1]) {
                const mergedValue = row[i] * 2;
                merged.push(mergedValue);
                this.score += mergedValue;
                i += 2;
            } else {
                merged.push(row[i]);
                i++;
            }
        }
        
        return merged;
    }
    
    checkGameOver() {
        // 检查是否获胜
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 2048 && !this.won) {
                    this.won = true;
                    this.showWinMessage();
                }
            }
        }
        
        // 检查是否游戏结束
        if (this.isBoardFull() && !this.canMove()) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    isBoardFull() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    canMove() {
        // 检查是否有相邻的相同数字
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.board[i][j];
                if (current === 0) return true;
                
                // 检查右边
                if (j < 3 && this.board[i][j + 1] === current) return true;
                // 检查下边
                if (i < 3 && this.board[i + 1][j] === current) return true;
            }
        }
        return false;
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        this.updateTiles();
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        document.getElementById('total-games').textContent = this.gameStats.totalGames;
        document.getElementById('average-score').textContent = this.gameStats.averageScore;
        document.getElementById('games-won').textContent = this.gameStats.gamesWon;
        document.getElementById('highest-tile').textContent = this.gameStats.highestTile;
    }
    
    loadGameStats() {
        const defaultStats = {
            totalGames: 0,
            totalScore: 0,
            gamesWon: 0,
            bestScore: 0,
            averageScore: 0,
            highestTile: 0,
            totalMoves: 0
        };
        
        try {
            const savedStats = localStorage.getItem('2048-game-stats');
            return savedStats ? { ...defaultStats, ...JSON.parse(savedStats) } : defaultStats;
        } catch (e) {
            return defaultStats;
        }
    }
    
    saveGameStats() {
        try {
            localStorage.setItem('2048-game-stats', JSON.stringify(this.gameStats));
        } catch (e) {
            console.warn('Unable to save game statistics:', e);
        }
    }
    
    updateGameStats() {
        this.gameStats.totalGames++;
        this.gameStats.totalScore += this.score;
        this.gameStats.averageScore = Math.round(this.gameStats.totalScore / this.gameStats.totalGames);
        
        if (this.score > this.gameStats.bestScore) {
            this.gameStats.bestScore = this.score;
        }
        
        // 检查是否获胜
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 2048) {
                    this.gameStats.gamesWon++;
                    break;
                }
            }
        }
        
        // 找到最高方块
        let highestTile = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] > highestTile) {
                    highestTile = this.board[i][j];
                }
            }
        }
        if (highestTile > this.gameStats.highestTile) {
            this.gameStats.highestTile = highestTile;
        }
        
        this.saveGameStats();
    }
    
    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048-best-score', this.bestScore.toString());
        }
        document.getElementById('best-score').textContent = this.bestScore;
    }
    
    showWinMessage() {
        alert('Congratulations! You reached 2048!');
    }
    
    showGameOver() {
        this.updateGameStats();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'flex';
    }
    
    reset() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
        this.updateBestScore();
        document.getElementById('game-over').style.display = 'none';
    }
    
    clearStats() {
        if (confirm('Are you sure you want to clear all game statistics? This action cannot be undone!')) {
            this.gameStats = {
                totalGames: 0,
                totalScore: 0,
                gamesWon: 0,
                bestScore: 0,
                averageScore: 0,
                highestTile: 0,
                totalMoves: 0
            };
            this.saveGameStats();
            this.updateStatsDisplay();
            alert('Statistics cleared!');
        }
    }
    
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
            }
        });
        
        // 触摸事件（移动端支持）
        let startX, startY;
        const gameBoard = document.getElementById('game-board');
        
        gameBoard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        gameBoard.addEventListener('touchend', (e) => {
            if (this.gameOver) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (Math.abs(diffX) > 30) {
                    if (diffX > 0) {
                        this.move('left');
                    } else {
                        this.move('right');
                    }
                }
            } else {
                // 垂直滑动
                if (Math.abs(diffY) > 30) {
                    if (diffY > 0) {
                        this.move('up');
                    } else {
                        this.move('down');
                    }
                }
            }
        });
        
        // 按钮事件
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('clear-stats-btn').addEventListener('click', () => {
            this.clearStats();
        });
    }
}

// 性能优化：使用requestAnimationFrame优化动画
const initGame = () => {
    new Game2048();
};

// 优化加载性能
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
