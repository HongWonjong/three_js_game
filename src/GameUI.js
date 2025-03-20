export class GameUI {
    constructor(game) {
        this.game = game;
        this.setupUI();
    }

    setupUI() {
        // 자원 UI
        const ui = document.createElement('div');
        ui.style.position = 'absolute';
        ui.style.top = '10px';
        ui.style.right = '10px';
        ui.style.color = '#fff';
        ui.style.fontFamily = 'Arial, sans-serif';
        ui.style.fontSize = '20px';
        ui.style.background = 'rgba(0, 0, 0, 0.7)';
        ui.style.padding = '10px';
        ui.style.borderRadius = '5px';
        ui.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
        ui.id = 'resources';
        document.body.appendChild(ui);

        // 경고 UI
        const warning = document.createElement('div');
        warning.style.position = 'absolute';
        warning.style.top = '50%';
        warning.style.left = '50%';
        warning.style.transform = 'translate(-50%, -50%)';
        warning.style.color = '#ff4444';
        warning.style.fontFamily = 'Arial, sans-serif';
        warning.style.fontSize = '24px';
        warning.style.background = 'rgba(0, 0, 0, 0.8)';
        warning.style.padding = '15px';
        warning.style.borderRadius = '5px';
        warning.style.display = 'none';
        warning.id = 'warning';
        document.body.appendChild(warning);

        // 완료 메시지 UI
        const completion = document.createElement('div');
        completion.style.position = 'absolute';
        completion.style.top = '60%'; // 경고와 겹치지 않게 약간 아래
        completion.style.left = '50%';
        completion.style.transform = 'translate(-50%, -50%)';
        completion.style.color = '#00ff00'; // 초록색으로 완료 느낌 강조
        completion.style.fontFamily = 'Arial, sans-serif';
        completion.style.fontSize = '24px';
        completion.style.background = 'rgba(0, 0, 0, 0.8)';
        completion.style.padding = '15px';
        completion.style.borderRadius = '5px';
        completion.style.display = 'none';
        completion.id = 'completion';
        document.body.appendChild(completion);

        // 안내 UI (우측 하단)
        const guide = document.createElement('div');
        guide.style.position = 'absolute';
        guide.style.bottom = '10px';
        guide.style.right = '10px';
        guide.style.color = '#fff';
        guide.style.fontFamily = 'Arial, sans-serif';
        guide.style.fontSize = '16px';
        guide.style.background = 'rgba(0, 0, 0, 0.7)';
        guide.style.padding = '8px';
        guide.style.borderRadius = '5px';
        guide.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
        guide.id = 'guide';
        guide.innerHTML = `
            Press <b>F</b> to toggle laser<br>
            <b>Right-click</b> to build
        `;
        document.body.appendChild(guide);

        this.updateUI();
    }

    updateUI() {
        const ui = document.getElementById('resources');
        ui.innerText = `Wood: ${this.game.resources.wood} | Stone: ${this.game.resources.stone}`;
    }

    showWarning(message) {
        const warning = document.getElementById('warning');
        warning.innerText = message;
        warning.style.display = 'block';
        setTimeout(() => {
            warning.style.display = 'none';
        }, 2000);
    }

    showCompletion(message) {
        const completion = document.getElementById('completion');
        completion.innerText = message;
        completion.style.display = 'block';
        setTimeout(() => {
            completion.style.display = 'none';
        }, 2000); // 2초 동안 표시
    }
}