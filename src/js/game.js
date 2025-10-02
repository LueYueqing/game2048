import { SoundManager } from './sound.js';

export class Game2048 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048-best-score')) || 0;
        this.gameOver = false;
        this.won = false;
        this.gameStats = this.loadGameStats();
        this.history = []; // 存储游戏历史状态
        this.historyIndex = -1; // 当前历史索引
        this.swapUses = 1; // 交换次数
        this.swapMode = false; // 是否处于交换模式
        this.selectedTile = null; // 选中的方块
        this.soundManager = new SoundManager(); // 音效管理器
        this.currentTheme = localStorage.getItem('2048-theme') || 'light'; // 当前主题
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.applyTheme(); // 应用主题
        this.updateDisplay();
        this.addRandomTile();
        this.addRandomTile();
        this.saveState(); // 保存初始状态
        this.bindEvents();
        this.updateBestScore();
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('2048-theme', this.currentTheme);
        this.applyTheme();
        
        // 更新主题按钮
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.setAttribute('data-theme', this.currentTheme);
        }
    }
    
    createBoard() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.renderBoard();
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;
        
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
    
    addTile(row, col, value, isNew = false) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (!cell) return;
        
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        
        // 添加点击事件用于交换模式
        if (this.swapMode) {
            tile.style.cursor = 'pointer';
            tile.addEventListener('click', () => this.selectTile(row, col));
        }
        
        // 高亮选中的方块
        if (this.selectedTile && this.selectedTile.row === row && this.selectedTile.col === col) {
            tile.style.boxShadow = '0 0 0 3px #ff6b6b';
        }
        
        cell.appendChild(tile);
        
        // 添加出现动画
        if (isNew) {
            tile.classList.add('tile-appearing');
            setTimeout(() => {
                tile.classList.remove('tile-appearing');
            }, 200);
        }
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
            this.addTile(randomCell.row, randomCell.col, this.board[randomCell.row][randomCell.col], true);
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
            this.soundManager.play('move'); // 播放移动音效
            this.addRandomTile();
            this.saveState(); // 保存移动后的状态
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
                this.soundManager.play('merge'); // 播放合并音效
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
        const scoreElement = document.getElementById('score');
        const bestScoreElement = document.getElementById('bestScore');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (bestScoreElement) bestScoreElement.textContent = this.bestScore;
        
        this.updateTiles();
        this.updateUndoButton();
    }
    
    saveState() {
        // 保存当前游戏状态到历史记录
        const state = {
            board: this.board.map(row => [...row]),
            score: this.score,
            gameOver: this.gameOver,
            won: this.won
        };
        
        // 删除当前位置之后的所有历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // 添加新状态
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        
        // 限制历史记录数量（最多保存50步）
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            
            this.board = state.board.map(row => [...row]);
            this.score = state.score;
            this.gameOver = state.gameOver;
            this.won = state.won;
            
            this.updateDisplay();
            this.updateBestScore();
        }
    }
    
    updateUndoButton() {
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
    }
    
    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048-best-score', this.bestScore.toString());
        }
        const bestScoreElement = document.getElementById('bestScore');
        if (bestScoreElement) {
            bestScoreElement.textContent = this.bestScore;
        }
    }
    
    showWinMessage() {
        // 添加胜利动画
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.classList.add('win-animation');
        }
        
        // 播放胜利音效
        this.soundManager.play('win');
        
        // 显示胜利消息
        alert('Congratulations! You reached 2048!');
        
        // 停止胜利动画
        setTimeout(() => {
            if (gameBoard) {
                gameBoard.classList.remove('win-animation');
            }
        }, 3000);
    }
    
    showGameOver() {
        // 播放游戏结束音效
        this.soundManager.play('gameOver');
        
        // 添加游戏结束动画
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.classList.add('game-over-animation');
            setTimeout(() => {
                gameBoard.classList.remove('game-over-animation');
            }, 500);
        }
        
        const gameMessage = document.getElementById('gameMessage');
        if (gameMessage) {
            gameMessage.style.display = 'flex';
        }
    }
    
    reset() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.history = [];
        this.historyIndex = -1;
        
        this.createBoard();
        this.addRandomTile();
        this.addRandomTile();
        this.saveState();
        this.updateDisplay();
        this.updateBestScore();
        
        const gameMessage = document.getElementById('gameMessage');
        if (gameMessage) {
            gameMessage.style.display = 'none';
        }
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
                case 'u':
                case 'U':
                    e.preventDefault();
                    this.undo();
                    break;
            }
        });
        
        // 触摸事件（移动端支持）
        let startX, startY;
        const gameBoard = document.getElementById('gameBoard');
        
        if (gameBoard) {
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
        }
        
        // 按钮事件
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.reset();
            });
        }
        
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }
        
        const tryAgainBtn = document.getElementById('tryAgainBtn');
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                this.reset();
            });
        }
        
        // 音效按钮事件
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const enabled = this.soundManager.toggle();
                soundToggle.classList.toggle('muted', !enabled);
            });
            
            // 初始化音效按钮状态
            soundToggle.classList.toggle('muted', !this.soundManager.enabled);
        }
        
        // 主题按钮事件
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 设置面板事件
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsPanel = document.getElementById('settingsPanel');
        const closeSettings = document.getElementById('closeSettings');
        
        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', () => {
                settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
            });
        }
        
        if (closeSettings && settingsPanel) {
            closeSettings.addEventListener('click', () => {
                settingsPanel.style.display = 'none';
            });
        }
    }
}
