// by 9GreenRats, 2024, with vibes, inshallah and love

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const shipImage = new Image();
shipImage.src = 'images/ship.png';

const bulletImage = new Image();
bulletImage.src = 'images/bullet.png';

const formImage = new Image();
formImage.src = 'images/form.png';

let gameInterval;
let autoFireInterval;
let score = 0;
let deaths = 0;
let bulletSpeed = 12;
let fallingSpeedMultiplier = 1;

const ship = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 120,
    width: 100,
    height: 100,
    speed: 10,
    dx: 0,
    dy: 0,
    bullets: [],
    isExploding: false,
    shoot() {
        this.bullets.push({ x: this.x + this.width / 2 - 10, y: this.y, width: 20, height: 20, speed: bulletSpeed });
    }
};

// Event listeners for keyboard controls (WASD and arrow keys)
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        ship.dx = -ship.speed;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        ship.dx = ship.speed;
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        ship.dy = -ship.speed;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        ship.dy = ship.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
        ship.dx = 0;
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS') {
        ship.dy = 0;
    }
});

// Event listeners for touch controls
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', handleTouch);

function handleTouch(e) {
    const touch = e.touches[0] || e.changedTouches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (touchX < centerX) {
        ship.dx = -ship.speed;
    } else {
        ship.dx = ship.speed;
    }

    if (touchY < centerY) {
        ship.dy = -ship.speed;
    } else {
        ship.dy = ship.speed;
    }

    if (e.type === 'touchend') {
        ship.dx = 0;
        ship.dy = 0;
    }
}

function startGame() {
    document.getElementById('gameOverMessage').style.display = 'none';
    ship.bullets = [];
    ship.isExploding = false;
    fallingObjects.length = 0;
    loadScore();
    loadDeaths();
    bulletSpeed = 12;
    fallingSpeedMultiplier = 1;
    gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    autoFireInterval = setInterval(() => {
        if (!ship.isExploding) ship.shoot();
    }, 250); // Auto-fire
}

function restartGame() {
    ship.x = canvas.width / 2 - 50;
    ship.y = canvas.height - 120;
    ship.isExploding = false;
    startGame();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrixBackground(); // Matrix BG
    updateGameObjects();
    checkCollisions();
    drawGameObjects();
    increaseDifficulty();
}

function updateGameObjects() {
    if (!ship.isExploding) {
        ship.x += ship.dx;
        ship.y += ship.dy;
        if (ship.x < 0) {
            ship.x = canvas.width - ship.width;
        }
        if (ship.x + ship.width > canvas.width) {
            ship.x = 0;
        }
        if (ship.y < 0) {
            ship.y = canvas.height - ship.height;
        }
        if (ship.y + ship.height > canvas.height) {
            ship.y = 0;
        }
    }
}

function drawShip() {
    if (!ship.isExploding) {
        ctx.drawImage(shipImage, ship.x, ship.y, ship.width, ship.height);
    }
}

function drawBullets() {
    ship.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        if (bullet.y < 0) {
            ship.bullets.splice(index, 1);
        }
    });
}

const fallingObjects = [];

function createFallingObject() {
    const size = Math.random() * 20 + 20;
    const health = Math.floor(Math.random() * 3) + 3; // Health between 3 and 5
    fallingObjects.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: (Math.random() * 2 + 1) * fallingSpeedMultiplier,
        health: health,
        maxHealth: health
    });
}

setInterval(createFallingObject, 1000);

function drawFallingObjects() {
    fallingObjects.forEach((object, index) => {
        object.y += object.speed;
        ctx.drawImage(formImage, object.x, object.y, object.width, object.height);
        drawPowerBar(object);
        if (object.y > canvas.height) {
            fallingObjects.splice(index, 1);
        }
    });
}

function drawPowerBar(object) {
    ctx.fillStyle = 'white';
    ctx.fillRect(object.x, object.y - 10, object.width, 5);
    ctx.fillStyle = 'red';
    ctx.fillRect(object.x, object.y - 10, (object.width * object.health) / object.maxHealth, 5);
}

function drawGameObjects() {
    drawShip();
    drawBullets();
    drawFallingObjects();
}

function checkCollisions() {
    ship.bullets.forEach((bullet, bulletIndex) => {
        fallingObjects.forEach((object, objectIndex) => {
            if (bullet.y <= object.y + object.height &&
                bullet.x < object.x + object.width &&
                bullet.x + bullet.width > object.x) {
                object.health -= 1; // Decrease health by 1
                ship.bullets.splice(bulletIndex, 1);
                if (object.health <= 0) {
                    createExplosion(object.x, object.y, object.width, object.height);
                    fallingObjects.splice(objectIndex, 1);
                    score += 10; // Score Point
                    updateScore();
                    saveScore();
                }
            }
        });
    });

    fallingObjects.forEach((object, objectIndex) => {
        if (!ship.isExploding &&
            object.y + object.height >= ship.y &&
            object.x < ship.x + ship.width &&
            object.x + object.width > ship.x) {
            createExplosion(ship.x, ship.y, ship.width, ship.height);
            ship.isExploding = true;
            deaths++;
            updateDeaths();
            saveDeaths();
            setTimeout(() => {
                ship.isExploding = false;
                ship.x = canvas.width / 2 - 50;
                ship.y = canvas.height - 120;
            }, 2000); // Respawn Time
        }
    });
}

function createExplosion(x, y, width, height) {
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#fff';
        ctx.font = '20px Bebas Neue';
        ctx.fillText('grmpz', x + Math.random() * width, y + Math.random() * height);
    }
}

function updateScore() {
    document.getElementById('scoreboard').textContent = `Score: ${score}`;
}

function updateDeaths() {
    document.getElementById('deathboard').textContent = `Deaths: ${deaths}`;
}

function saveScore() {
    localStorage.setItem('score', score);
}

function loadScore() {
    const savedScore = localStorage.getItem('score');
    if (savedScore !== null) {
        score = parseInt(savedScore);
        updateScore();
    }
}

function saveDeaths() {
    localStorage.setItem('deaths', deaths);
}

function loadDeaths() {
    const savedDeaths = localStorage.getItem('deaths');
    if (savedDeaths !== null) {
        deaths = parseInt(savedDeaths);
        updateDeaths();
    }
}

// Function for Matrix BG
const letters = Array(256).join('grmpz').split('');
const fontSize = 14;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(0);

function drawMatrixBackground() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0F0';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

// Start the game when the page loads
window.onload = startGame;
