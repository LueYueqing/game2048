// 主入口文件
import '../../style.css';
import { SoundManager } from './sound.js';
import { Game2048 } from './game.js';

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

// 导出供其他模块使用
export { SoundManager, Game2048 };
