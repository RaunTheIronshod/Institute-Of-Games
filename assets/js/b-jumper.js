// the general collision detection in this game is badly optimised and will not scale well,
// we are searching forEach rather than using ids to remove objects.
// Once the lists becomes sufficiently large this will create performance issues.

// Id's for bullets and enemies should be implemented if this game is to be continued
// Along with spatial partitioning for collision detection and object pooling

// Be better

const GameState = {
    MENU: "menu",
    PLAYING: "playing",
    PAUSED: "paused",
    GAMEOVER: "gameover",
};

const EnemyState = {
    SPAWNING: "spawning",
    MOVING: "moving",
    ATTACKING: "attacking",
    RETREATING: "retreating",
    DEAD: "dead",
};

const FRAME_RATE = 60;
const WALL_SECTION_DAMAGE = 20;
const PLAYER_JUMP_SPEED = 15;

let context;
let game;
let gameState = GameState.PLAYING;

let canvasHeight = 576;
let canvasWidth = 1024;

// set canvas from html as canvas for out of game context use, might be redundent
const canvas = document.getElementById("b-jumper");
// define context for game space
context = canvas.getContext("2d");

window.onload = function () {
    // define canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.fillRect(0, 0, canvas.width, canvas.height);

    game = new Game(context);
    game.startGameLoop();

    // player.draw();

    isJumping = false;
    hasJumped = false;
    isDashing = false;
    isAlive = true;
};

// player sprite and movement variables
let playerSprite;
let playerBaseSpeed = 1;
let playerSpeed = playerBaseSpeed;
let playerRunSpeed = 2;
let gravity = 0.4;
let jumpSpeed = 15;
let dashSpeed = 40;

// bools
let isJumping;
let hasJumped;
let isAlive;
let isDashing;

// player dimensions
let playerHeight = 20;
let playerWidth = 8;

// player default position and velocity
let playerX = 100;
let playerY = 100;
let playerVelocityY = 0;
let playerVelocityX = 0;

// enemy has a radius but for collision detection we need height and width
let enemyRadius = 10;

// input handling, overkill for this project but allows for more complex input handling later if I decide to continue development
let lastKey;
const keys = {
    a: {
        pressed: false,
    },
    d: {
        pressed: false,
    },
    space: {
        pressed: false,
    },
    shift: {
        pressed: false,
    },
};
window.addEventListener("keydown", (event) => {
    // stop us scrolling when pressing spacebar
    if (event.key === " ") {
        event.preventDefault();
    }

    switch (event.key) {
        case "d":
            keys.d.pressed = true;
            lastKey = "d";
            break;
        case "a":
            keys.a.pressed = true;
            lastKey = "a";
            break;
        case " ":
            keys.space.pressed = true;
            lastKey = "space";
            break;
        case "Shift":
            keys.shift.pressed = true;
            lastKey = "Shift";
            break;
    }
    // console.log(event.key);
});
window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "d":
            keys.d.pressed = false;
            break;
        case "a":
            keys.a.pressed = false;
            break;
        case " ":
            keys.space.pressed = false;
            break;
        case "Shift":
            keys.shift.pressed = false;
            break;
    }
    // console.log(event.key);
});
// restart game
window.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") {
        if (gameState === "gameover") {
            restartGame();
        }
    }
});
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    // Fire a bullet toward the mouse
    game.fireBullet(targetX, targetY);
});

class Enemy {
    constructor(x, y, radius, context) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.context = context;
        this.health = 100;
        this.speed = 2;
        this.state = EnemyState.SPAWNING;
        this.velocityX = -this.speed;
        this.velocityY = 0;
        this.retreatTimer = 0;
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        switch (newState) {
            case EnemyState.SPAWNING:
                this.velocityX = -this.speed;
                break;
            case EnemyState.MOVING:
                this.velocityX = -this.speed;
                this.velocityY = 0;
                break;
            case EnemyState.RETREATING:
                this.retreatTimer = 60;
                this.velocityX = 4;
                break;
            case EnemyState.DEAD:
                this.destroyed = true;
                break;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.setState(EnemyState.DEAD);
        }
    }

    bounceBack() {
        if (this.state !== EnemyState.RETREATING) {
            this.setState(EnemyState.RETREATING);
            this.takeDamage(10);
        }
    }

    update() {
        switch (this.state) {
            case EnemyState.SPAWNING:
                this.setState(EnemyState.MOVING);
                break;

            case EnemyState.MOVING:
                this.x += this.velocityX;
                this.y += this.velocityY;
                break;

            case EnemyState.RETREATING:
                this.x += this.velocityX;
                this.retreatTimer--;
                if (this.retreatTimer <= 0) {
                    this.setState(EnemyState.MOVING);
                }
                break;

            case EnemyState.DEAD:
                this.destroyed = true;
                break;
        }
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        switch (this.state) {
            case EnemyState.MOVING:
                this.context.fillStyle = "red";
                break;
            case EnemyState.RETREATING:
                this.context.fillStyle = "orange";
                break;
            case EnemyState.DEAD:
                this.context.fillStyle = "gray";
                break;
            default:
                this.context.fillStyle = "purple";
                break;
        }

        this.context.fill();
    }
}

class HomingEnemy extends Enemy {
    constructor(x, y, speed, radius, context, targetPlayer = false) {
        super(x, y, radius, context);
        this.speed = speed;
        this.targetPlayer = targetPlayer;
        this.homingActive = false;
        this.currentTarget = null; // store chosen target once
    }

    update(player, wall) {
        // Activate homing once halfway across screen
        if (!this.homingActive && this.x < canvas.width / 2) {
            this.homingActive = true;

            // pick target when activating
            if (this.targetPlayer) {
                this.currentTarget = player;
            } else {
                const alive = wall.aliveSections;
                if (alive.length > 0) {
                    this.currentTarget =
                        alive[Math.floor(Math.random() * alive.length)];
                } else {
                    this.currentTarget = player; // fallback
                }
            }
        }

        switch (this.state) {
            case EnemyState.SPAWNING:
                this.setState(EnemyState.MOVING);
                break;

            case EnemyState.MOVING:
                if (this.homingActive && this.currentTarget) {
                    const targetX =
                        this.currentTarget.x +
                        (this.currentTarget.width ?? 0) / 2;
                    const targetY =
                        this.currentTarget.y +
                        (this.currentTarget.height ?? 0) / 2;

                    const dx = targetX - this.x;
                    const dy = targetY - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 0) {
                        this.velocityX = (dx / distance) * this.speed;
                        this.velocityY = (dy / distance) * this.speed;
                    }
                }

                this.x += this.velocityX;
                this.y += this.velocityY;
                break;

            case EnemyState.RETREATING:
                this.x += this.velocityX;
                this.retreatTimer--;
                if (this.retreatTimer <= 0) {
                    this.setState(EnemyState.MOVING);
                    this.homingActive = false; // reset so they can pick new target later
                    this.currentTarget = null;
                }
                break;

            case EnemyState.DEAD:
                this.destroyed = true;
                break;
        }
    }
}

class PowerUp {
    constructor(x, y, type, context, duration = 10000) {
        this.x = x;
        this.y = y;
        this.width = 16; // size for collision
        this.height = 16;
        this.type = type; // e.g., "speed"
        this.context = context;
        this.active = true;
        this.duration = duration; // milliseconds
    }

    draw() {
        if (!this.active) return;

        switch (this.type) {
            case "speed":
                this.context.fillStyle = "green";
                break;
            default:
                this.context.fillStyle = "white";
        }

        this.context.fillRect(this.x, this.y, this.width, this.height);
    }

    apply(player) {
        if (!this.active) return;
        this.active = false;

        switch (this.type) {
            case "speed":
                player.playerBaseSpeed *= 2;
                player.playerRunSpeed *= 2;

                setTimeout(() => {
                    player.playerBaseSpeed /= 2;
                    player.playerRunSpeed /= 2;
                }, this.duration);
                break;
        }
    }

    checkCollision(player) {
        if (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        ) {
            this.apply(player);
        }
    }
}

class Player {
    constructor(playerX, playerY, playerWidth, playerHeight, context) {
        this.x = playerX;
        this.y = playerY;
        this.width = playerWidth;
        this.height = playerHeight;
        this.gravity = gravity;
        this.playerBaseSpeed = playerBaseSpeed;
        this.speed = playerSpeed;
        this.playerRunSpeed = playerRunSpeed;
        this.playerDashSpeed = dashSpeed;
        this.jumpSpeed = jumpSpeed;
        this.context = context;
        this.playerVelocityY = 0;
        this.playerVelocityX = 0;
        this.isJumping;
        this.hasJumped;
        this.isAlive;
        this.isDashing;
    }

    draw() {
        this.context.fillStyle = "blue";
        this.context.fillRect(this.x, this.y, this.width, this.height);
    }

    handleInput(keys, lastKey) {
        // Horizontal movement
        const speed = keys.shift.pressed
            ? this.playerRunSpeed
            : this.playerBaseSpeed;

        if (keys.a.pressed && keys.d.pressed) {
            this.playerVelocityX = lastKey === "a" ? -speed : speed;
        } else if (keys.a.pressed) {
            this.playerVelocityX = -speed;
        } else if (keys.d.pressed) {
            this.playerVelocityX = speed;
        } else {
            this.playerVelocityX = 0;
        }

        // Jumping
        if (keys.space.pressed && !isJumping && !hasJumped) {
            this.playerVelocityY = -this.jumpSpeed;
            isJumping = true;
            hasJumped = true;
        }
    }

    updatePosition() {
        // Apply gravity
        this.playerVelocityY += this.gravity;

        this.x += this.playerVelocityX;
        this.y += this.playerVelocityY;

        // Ground check
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.playerVelocityY = 0;
            isJumping = false;
            hasJumped = false;
        }

        // Keep inside bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
        }
    }
    updatePlayer() {
        this.player.handleInput(keys, lastKey);
        this.player.updatePosition();
    }
}

let nextBulletId = 0;
class Bullet {
    constructor(x, y, targetX, targetY, context) {
        this.id = nextBulletId++;
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.context = context;
        this.speed = 8;

        // Calculate direction vector toward the target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction vector
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.context.fillStyle = "yellow";
        this.context.fill();
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return (
            this.x < 0 ||
            this.x > canvasWidth ||
            this.y < 0 ||
            this.y > canvasHeight
        );
    }
}

class Game {
    constructor(context) {
        this.player = new Player(
            playerX,
            playerY,
            playerWidth,
            playerHeight,
            context
        );
        this.context = context;
        this.gravity = gravity;
        this.intervalId = null;

        // create a list to hold multiple enemies
        this.enemies = [];
        // spawn every 2 seconds
        this.spawnInterval = 2000;
        this.lastSpawnTime = 0;

        // add bullet storage
        this.bullets = [];

        // add walls
        this.wall = new Wall(context, canvasHeight);

        // powerups
        this.powerUps = [];

        // waves
        this.waveNumber = 0;
        this.enemiesPerWave = 5; // starting enemy count
        this.waveCooldown = 4000; // ms between waves
        this.waveActive = false;
        this.lastWaveEnd = Date.now();

        // score system
        this.killScore = 0;
        this.timeScore = 0;
        this.lastScoreTime = Date.now();
    }

    allWallsDestroyed() {
        return this.wall.sections.every((section) => section.destroyed);
    }

    spawnWave() {
        this.waveNumber++;
        this.waveActive = true;

        // scale difficulty: more enemies per wave
        this.totalEnemiesToSpawn = this.enemiesPerWave + this.waveNumber * 2;

        // spawn delay in milliseconds (smaller = faster)
        this.spawnDelay = Math.max(150, 800 - this.waveNumber * 50);

        this.spawnedEnemies = 0;
        this.nextEnemySpawnTime = Date.now() + this.spawnDelay;

        console.log(
            `Wave ${this.waveNumber} incoming! (${this.totalEnemiesToSpawn} enemies)`
        );
    }

    spawnEnemy() {
        const x = canvasWidth + enemyRadius * 2;
        const y =
            Math.random() * (canvasHeight - enemyRadius * 2) + enemyRadius;

        let enemy;

        // only start spawning homing enemies from certain wave
        if (this.waveNumber >= 2 && Math.random() < 0.2) {
            // 20% chance
            enemy = new HomingEnemy(x, y, 2, enemyRadius, this.context);
        } else {
            enemy = new Enemy(x, y, enemyRadius, this.context);
        }

        this.enemies.push(enemy);

        // adjust normal enemies speed per wave
        if (!(enemy instanceof HomingEnemy)) {
            enemy.velocityX -= this.waveNumber * 0.2;
        }
    }

    fireBullet(targetX, targetY) {
        const bullet = new Bullet(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            targetX,
            targetY,
            this.context
        );
        this.bullets.push(bullet);
    }

    update() {
        this.updatePlayer();
        this.updateEnemies();
        this.updateBullets();
        this.handleCollisions();
        this.handleWaves();
        this.updateScore();
        this.checkGameOver();
        this.powerUps.forEach((pu) => pu.checkCollision(this.player));
    }

    updatePlayer() {
        this.player.handleInput(keys, lastKey);
        this.player.updatePosition();
    }

    updateEnemies() {
        this.enemies.forEach((enemy) => {
            if (enemy instanceof HomingEnemy) {
                enemy.update(this.player, this.wall);
            } else {
                enemy.update();
            }
            this.wall.checkCollision(enemy);
        });

        // remove destroyed/offscreen enemies
        this.enemies = this.enemies.filter(
            (enemy) => !enemy.destroyed && enemy.x + enemy.radius > 0
        );
    }

    updateBullets() {
        this.bullets.forEach((bullet) => bullet.update());
        this.bullets = this.bullets.filter(
            (bullet) => !bullet.isOffScreen(canvasWidth, canvasHeight)
        );
    }

    handleCollisions() {
        // bullets vs enemies
        this.enemies.forEach((enemy) => {
            this.bullets.forEach((bullet) => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bullet.radius + enemy.radius) {
                    enemy.takeDamage(50);
                    this.killScore++;
                    bullet.destroyed = true;

                    // ✅ mark enemy destroyed if dead
                    if (enemy.health <= 0) {
                        enemy.destroyed = true;
                    }
                }
            });
        });

        // bullets vs wall
        this.bullets.forEach((bullet) => {
            this.wall.sections.forEach((section) => {
                if (
                    !section.destroyed &&
                    bullet.x + bullet.radius > section.x &&
                    bullet.x - bullet.radius < section.x + section.width &&
                    bullet.y + bullet.radius > section.y &&
                    bullet.y - bullet.radius < section.y + section.height
                ) {
                    section.takeDamage(10);
                    bullet.destroyed = true;
                }
            });
        });

        // player vs enemies
        this.enemies.forEach((enemy) => {
            this.playerenemyColliding(enemy, this.player);
        });

        // ✅ cleanup phase (only once)
        this.bullets = this.bullets.filter(
            (b) => !b.isOffScreen(canvasWidth, canvasHeight) && !b.destroyed
        );
        this.enemies = this.enemies.filter((enemy) => !enemy.destroyed);
    }

    handleWaves() {
        const now = Date.now();

        if (!this.waveActive && now - this.lastWaveEnd > this.waveCooldown) {
            this.spawnWave();
        }

        if (this.waveActive && this.spawnedEnemies < this.totalEnemiesToSpawn) {
            if (now >= this.nextEnemySpawnTime) {
                this.spawnEnemy();
                this.spawnedEnemies++;
                this.nextEnemySpawnTime = now + this.spawnDelay;
            }
        }

        if (
            this.waveActive &&
            this.spawnedEnemies >= this.totalEnemiesToSpawn &&
            this.enemies.length === 0
        ) {
            this.waveActive = false;
            this.lastWaveEnd = now;
        }
    }

    updateScore() {
        const currentTime = Date.now();
        if (currentTime - this.lastScoreTime >= 1000) {
            this.timeScore++;
            this.lastScoreTime = currentTime;
        }
    }

    checkGameOver() {
        if (!isAlive && gameState === GameState.PLAYING) {
            gameState = GameState.GAMEOVER;
            const finalScore = this.killScore * 100 + this.timeScore;
            const highScore = localStorage.getItem("highScore") || 0;
            if (finalScore > highScore) {
                localStorage.setItem("highScore", finalScore);
                console.log("New High Score!");
            }
            this.stopGameLoop();
            setTimeout(() => {
                this.drawGameOver(finalScore, highScore);
            }, 50);
        }
    }

    drawGameOver(finalScore, highScore) {
        // fade background
        this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        // text styling
        this.context.fillStyle = "white";
        this.context.font = "36px monospace";
        this.context.textAlign = "center";

        // main text
        this.context.fillText(
            "GAME OVER",
            canvasWidth / 2,
            canvasHeight / 2 - 60
        );
        this.context.font = "24px monospace";
        this.context.fillText(
            `Final Score: ${finalScore}`,
            canvasWidth / 2,
            canvasHeight / 2 - 20
        );
        this.context.fillText(
            `High Score: ${localStorage.getItem("highScore") || 0}`,
            canvasWidth / 2,
            canvasHeight / 2 + 20
        );
        this.context.fillText(
            "Press R to Restart",
            canvasWidth / 2,
            canvasHeight / 2 + 80
        );
    }

    draw() {
        // Clear the canvas before drawing
        this.context.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the background
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw the wall
        this.wall.draw();
        // Draw the player
        this.player.draw();
        // Draw the enemy
        this.enemies.forEach((enemy) => enemy.draw());
        // draw bullets
        this.bullets.forEach((bullet) => bullet.draw());

        // draw score
        this.context.fillStyle = "white";
        this.context.font = "24px monospace";
        this.context.fillText(`Score: ${this.timeScore}`, 10, 30);
        this.context.fillText(`Kills: ${this.killScore}`, 10, 50);
        this.context.fillText(`Wave: ${this.waveNumber}`, 10, 70);

        this.powerUps.forEach((pu) => pu.draw());
    }

    startGameLoop() {
        const loop = () => {
            this.update();
            this.draw();
            if (isAlive) requestAnimationFrame(loop);
        };
        // Example: spawn near middle of canvas
        this.powerUps.push(
            new PowerUp(
                canvasWidth / 2,
                canvasHeight - 36,
                "speed",
                this.context
            )
        );
        requestAnimationFrame(loop);
    }

    stopGameLoop() {
        clearInterval(this.intervalId);
    }

    // return true if the playerangle and enemy are colliding
    playerenemyColliding(enemy, player) {
        // Find the x/y distance to center of objects
        var distX = Math.abs(enemy.x - player.x - playerWidth / 2);
        var distY = Math.abs(enemy.y - player.y - playerHeight / 2);

        // If it's more than the distance plus the radius, no collision
        if (distX > playerWidth / 2 + enemyRadius) {
            return false;
        }
        if (distY > playerHeight / 2 + enemyRadius) {
            return false;
        }

        // If it's within the distance plus the radius, collision
        var collision = distX <= playerWidth / 2 || distY <= playerHeight / 2;

        // Check for collision at corner using Pythagorean theorem
        var dx = distX - playerWidth / 2;
        var dy = distY - playerHeight / 2;
        collision = collision || dx * dx + dy * dy <= enemyRadius * enemyRadius;

        if (collision) {
            isAlive = false;
            console.log("Collision detected");
        }

        return collision;
    }
}

function restartGame() {
    console.log("Restarting game...");
    isAlive = true;
    gameState = "playing";

    // reset player position and variables
    playerX = 100;
    playerY = 100;
    lastKey = null;

    // create a new game instance
    game = new Game(context);
    game.startGameLoop();
}

class WallSection {
    constructor(x, y, width, height, context, parentWall) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.context = context;
        this.health = 100;
        this.destroyed = false;
        this.parentWall = parentWall;
    }

    draw() {
        if (this.destroyed) return;
        this.context.fillStyle = "gray";
        this.context.fillRect(this.x, this.y, this.width, this.height);
        this.context.strokeStyle = "black";
        this.context.strokeRect(this.x, this.y, this.width, this.height);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.destroyed) {
            this.destroyed = true;

            // ✅ Let the wall know to refresh aliveSections
            this.parentWall.handleSectionDestroyed();

            if (this.parentWall.sections.every((s) => s.destroyed)) {
                console.log("All walls destroyed! Game over.");
                isAlive = false;
            }
        }
    }
}

class Wall {
    constructor(context, canvasHeight) {
        this.context = context;
        this.sections = [];

        const sectionCount = 6;
        const sectionHeight = canvasHeight / sectionCount;
        const wallWidth = 40;
        const wallX = 0;

        for (let i = 0; i < sectionCount; i++) {
            const y = i * sectionHeight;
            const section = new WallSection(
                wallX,
                y,
                wallWidth,
                sectionHeight,
                context,
                this
            );
            this.sections.push(section);
        }

        // ✅ Keep a cached array of alive sections
        this.aliveSections = [...this.sections];
    }

    draw() {
        this.sections.forEach((section) => section.draw());
    }

    // ✅ Update alive section cache when a section dies
    handleSectionDestroyed() {
        this.aliveSections = this.sections.filter((s) => !s.destroyed);
    }

    checkCollision(enemy) {
        this.aliveSections.forEach((section) => {
            if (
                enemy.x - enemy.radius < section.x + section.width &&
                enemy.x + enemy.radius > section.x &&
                enemy.y - enemy.radius < section.y + section.height &&
                enemy.y + enemy.radius > section.y
            ) {
                section.takeDamage(20);
                if (!enemy.isRetreating) enemy.bounceBack();
            }
        });
    }
}
