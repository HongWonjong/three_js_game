import * as THREE from 'three';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { Game } from './src/Game.js';

console.log('main.js loaded successfully');
console.log('THREE:', THREE);
console.log('GLTFLoader:', GLTFLoader);
console.log('Game class:', Game); // Game 클래스가 로드되었는지 확인

console.log('Adding load event listener...');
window.addEventListener('load', () => {
    console.log('Window loaded, starting game...');
    try {
        const game = new Game();
        console.log('Game instance created:', game);
        const lockScreen = document.getElementById('lockScreen');
        lockScreen.addEventListener('click', () => {
            console.log('Lock screen clicked, requesting pointer lock...');
            document.body.requestPointerLock();
            lockScreen.style.display = 'none';
        });
    } catch (error) { // 
        console.error('Failed to create Game instance:', error);
    }
});

// load 이벤트가 실행되지 않을 경우를 대비해 즉시 실행
console.log('Attempting to start game immediately...');
try {
    const game = new Game();
    console.log('Game instance created (immediate):', game);
    const lockScreen = document.getElementById('lockScreen');
    lockScreen.addEventListener('click', () => {
        console.log('Lock screen clicked (immediate), requesting pointer lock...');
        document.body.requestPointerLock();
        lockScreen.style.display = 'none';
    });
} catch (error) {
    console.error('Failed to create Game instance (immediate):', error);
}