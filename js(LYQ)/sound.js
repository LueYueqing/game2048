// 音效管理类
export class SoundManager {
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
