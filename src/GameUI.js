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
}