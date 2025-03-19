import * as THREE from 'three';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { Game } from './src/Game.js';

console.log('main.js loaded successfully');
console.log('THREE:', THREE);
console.log('GLTFLoader:', GLTFLoader);
console.log('Game class:', Game);

console.log('Adding load event listener...');
window.addEventListener('load', startGame);

// load 이벤트가 늦어질 경우를 대비해 즉시 실행 시도
console.log('Attempting to start game immediately...');
startGame();

function startGame() {
    try {
        const game = new Game();
        console.log('Game instance created:', game);

        const lockScreen = document.getElementById('lockScreen');
        if (lockScreen) {
            lockScreen.addEventListener('click', () => {
                console.log('Lock screen clicked, requesting pointer lock...');
                document.body.requestPointerLock();
                lockScreen.style.display = 'none';
            });
        } else {
            console.error('lockScreen element not found');
        }
    } catch (error) {
        console.error('Failed to create Game instance:', error);
    }
}