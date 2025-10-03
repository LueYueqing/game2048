// 音效管理类 
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = localStorage.getItem('2048-sound-enabled') !== 'false';
        this.initSounds();
    }
    
    initSounds() {
        // 创建音效上下文
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            return;
        }
        
        // 生成音效
        this.sounds = {
            move: this.createTone(200, 0.1, 'sine'),
            merge: this.createTone(400, 0.2, 'square'),
            win: this.createMelody([523, 659, 784, 1047], 0.3),
            gameOver: this.createTone(150, 0.5, 'sawtooth')
        };
    }
    
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    createMelody(frequencies, noteDuration) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    this.createTone(freq, noteDuration, 'sine')();
                }, index * noteDuration * 1000);
            });
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('2048-sound-enabled', this.enabled);
        return this.enabled;
    }
}

class Game2048 {
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
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.setAttribute('data-theme', this.currentTheme);
            const themeText = themeBtn.querySelector('.theme-text');
            if (themeText) {
                themeText.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            }
        }
    }
    
    shareScore(platform) {
        const score = this.score;
        const bestScore = this.bestScore;
        const url = window.location.href;
        
        let shareText = '';
        let shareUrl = '';
        
        switch(platform) {
            case 'twitter':
                shareText = `I just scored ${score} points in 2048! Can you beat my score? Play now: ${url}`;
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                break;
            case 'facebook':
                shareText = `I scored ${score} points in 2048! My best score is ${bestScore}. Play now: ${url}`;
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`;
                break;
            case 'copy':
                shareText = `I scored ${score} points in 2048! My best score is ${bestScore}. Play now: ${url}`;
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('Score copied to clipboard!');
                }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = shareText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Score copied to clipboard!');
                });
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    showShareModal() {
        // 创建分享弹窗
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.style.cssText = `
            background: var(--bg-color);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        modal.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: var(--text-color); font-size: 24px;">Share Your Score!</h2>
            <p style="margin: 0 0 30px 0; color: var(--text-color); font-size: 16px;">
                You scored <strong>${this.score}</strong> points!<br>
                Best score: <strong>${this.bestScore}</strong>
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button id="share-twitter" style="
                    background: #1da1f2;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">🐦 Twitter</button>
                <button id="share-facebook" style="
                    background: #4267B2;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">📘 Facebook</button>
                <button id="share-copy" style="
                    background: var(--button-bg);
                    color: var(--tile-text);
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">📋 Copy Link</button>
                <button id="close-share" style="
                    background: #f67c5f;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 添加按钮事件
        document.getElementById('share-twitter').addEventListener('click', () => {
            this.shareScore('twitter');
            document.body.removeChild(overlay);
        });
        
        document.getElementById('share-facebook').addEventListener('click', () => {
            this.shareScore('facebook');
            document.body.removeChild(overlay);
        });
        
        document.getElementById('share-copy').addEventListener('click', () => {
            this.shareScore('copy');
            document.body.removeChild(overlay);
        });
        
        document.getElementById('close-share').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // 点击遮罩层关闭弹窗
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
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
    
    addTile(row, col, value, isNew = false) {
        const cell = document.getElementById(`cell-${row}-${col}`);
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
        this.updateBestScore(); // 实时更新最佳分数
        this.updateUndoButton();
        this.updateSwapButton();
        this.checkForSwapUses();
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
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
    }
    
    toggleSwapMode() {
        if (this.swapUses <= 0) {
            alert('No swap uses remaining! Make a 256 tile to get more uses.');
            return;
        }
        
        this.swapMode = !this.swapMode;
        this.selectedTile = null;
        this.updateSwapButton();
        this.updateTiles();
    }
    
    selectTile(row, col) {
        if (!this.swapMode) return;
        
        if (this.selectedTile === null) {
            // 选择第一个方块
            this.selectedTile = { row, col };
            this.updateTiles();
        } else {
            // 选择第二个方块，进行交换
            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                // 取消选择
                this.selectedTile = null;
            } else {
                // 执行交换
                this.swapTiles(this.selectedTile.row, this.selectedTile.col, row, col);
                this.swapUses--;
                this.swapMode = false;
                this.selectedTile = null;
                this.saveState();
                this.updateDisplay();
            }
        }
    }
    
    swapTiles(row1, col1, row2, col2) {
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
    }
    
    updateSwapButton() {
        const swapBtn = document.getElementById('swap-btn');
        if (swapBtn) {
            swapBtn.textContent = this.swapMode ? 'Cancel Swap' : `Swap Tiles (${this.swapUses} uses)`;
            swapBtn.disabled = this.swapUses <= 0;
        }
    }
    
    checkForSwapUses() {
        // 检查是否达到了256方块，给予更多交换次数
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 256) {
                    this.swapUses += 2; // 获得2次额外交换机会
                    this.updateSwapButton();
                    return;
                }
            }
        }
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
        // 更新最佳分数
        this.updateBestScore();
        
        // 添加胜利动画
        const gameBoard = document.getElementById('game-board');
        gameBoard.classList.add('win-animation');
        
        // 播放胜利音效
        this.soundManager.play('win');
        
        // 显示胜利消息
        alert('Congratulations! You reached 2048!');
        
        // 停止胜利动画
        setTimeout(() => {
            gameBoard.classList.remove('win-animation');
        }, 3000);
    }
    
    showGameOver() {
        this.updateGameStats();
        this.updateBestScore(); // 更新最佳分数
        document.getElementById('final-score').textContent = this.score;
        
        // 播放游戏结束音效
        this.soundManager.play('gameOver');
        
        // 添加游戏结束动画
        const gameBoard = document.getElementById('game-board');
        gameBoard.classList.add('game-over-animation');
        setTimeout(() => {
            gameBoard.classList.remove('game-over-animation');
        }, 500);
        
        document.getElementById('game-over').style.display = 'flex';
    }
    
    confirmNewGame() {
        // 检查是否有游戏进度
        const hasProgress = this.score > 0 || this.board.some(row => row.some(cell => cell > 0));
        
        if (!hasProgress) {
            // 如果没有进度，直接开始新游戏
            this.reset();
            return;
        }
        
        // 创建自定义确认弹窗
        this.showNewGameConfirmation();
    }
    
    showNewGameConfirmation() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.style.cssText = `
            background: #faf8ef;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        modal.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #776e65; font-size: 24px;">New Game</h2>
            <p style="margin: 0 0 30px 0; color: #776e65; font-size: 16px; line-height: 1.5;">
                Are you sure you want to start a new game?<br>
                <strong>All progress will be lost.</strong>
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirm-new-game" style="
                    background: #8f7a66;
                    color: #f9f6f2;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">Start New Game</button>
                <button id="cancel-new-game" style="
                    background: #f67c5f;
                    color: #f9f6f2;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">Cancel</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 添加按钮事件
        document.getElementById('confirm-new-game').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.reset();
        });
        
        document.getElementById('cancel-new-game').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // 点击遮罩层关闭弹窗
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
        
        // 添加按钮悬停效果
        const confirmBtn = document.getElementById('confirm-new-game');
        const cancelBtn = document.getElementById('cancel-new-game');
        
        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.background = '#9f8a76';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.background = '#8f7a66';
        });
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#f78c6c';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = '#f67c5f';
        });
    }
    
    reset() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.history = [];
        this.historyIndex = -1;
        this.swapUses = 1;
        this.swapMode = false;
        this.selectedTile = null;
        
        this.createBoard();
        this.addRandomTile();
        this.addRandomTile();
        this.saveState();
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
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'u':
                case 'U':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'n':
                case 'N':
                    e.preventDefault();
                    this.newGame();
                    break;
            }
        });
        
        // 触摸事件（移动端支持）
        let startX, startY;
        const gameBoard = document.getElementById('game-board');
        
        gameBoard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            e.preventDefault(); // 阻止默认行为，避免页面滚动
        }, { passive: false });
        
        gameBoard.addEventListener('touchend', (e) => {
            if (this.gameOver) return;
            
            e.preventDefault(); // 阻止默认行为
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // 需要足够的滑动距离才触发移动
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        this.move('left');
                    } else {
                        this.move('right');
                    }
                }
            } else {
                // 垂直滑动
                if (Math.abs(diffY) > 50) {
                    if (diffY > 0) {
                        this.move('up');  // 向上滑动 = 向上移动
                    } else {
                        this.move('down'); // 向下滑动 = 向下移动
                    }
                }
            }
        }, { passive: false });
        
        // 按钮事件
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.confirmNewGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('clear-stats-btn').addEventListener('click', () => {
            this.clearStats();
        });
        
        // 添加撤销按钮事件
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }
        
        // 添加交换按钮事件
        const swapBtn = document.getElementById('swap-btn');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                this.toggleSwapMode();
            });
        }
        
        // 添加音效按钮事件
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const enabled = this.soundManager.toggle();
                soundBtn.textContent = enabled ? '🔊' : '🔇';
                soundBtn.classList.toggle('muted', !enabled);
            });
            
            // 初始化音效按钮状态
            soundBtn.textContent = this.soundManager.enabled ? '🔊' : '🔇';
            soundBtn.classList.toggle('muted', !this.soundManager.enabled);
        }
        
        // 添加主题按钮事件
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // 初始化主题按钮状态
            themeBtn.setAttribute('data-theme', this.currentTheme);
            const themeText = themeBtn.querySelector('.theme-text');
            if (themeText) {
                themeText.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            }
        }
        
        // 添加分享按钮事件
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.showShareModal();
            });
        }
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
