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
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.context.fillStyle = "red";
        this.context.fill();
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
    }

    draw() {
        this.context.fillStyle = "blue";
        this.context.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        // Apply gravity
        this.playerVelocityY += this.gravity;
        this.y += this.playerVelocityY;

        // Ground check
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.playerVelocityY = 0;
            isJumping = false;
            hasJumped = false;
        }

        // Horizontal speed
        const speed = keys.shift.pressed
            ? this.playerRunSpeed
            : this.playerBaseSpeed;

        // Horizontal movement with lastKey handling
        if (keys.a.pressed && keys.d.pressed) {
            // Both keys pressed: last pressed key wins
            this.playerVelocityX = lastKey === "a" ? -speed : speed;
        } else if (keys.a.pressed) {
            this.playerVelocityX = -speed;
        } else if (keys.d.pressed) {
            this.playerVelocityX = speed;
        } else {
            this.playerVelocityX = 0;
            lastKey = null; // reset lastKey when no movement keys are pressed
        }

        this.x += this.playerVelocityX;

        // Keep player inside canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth)
            this.x = canvasWidth - this.width;

        // Jumping
        if (keys.space.pressed && !isJumping && !hasJumped) {
            this.playerVelocityY = -this.jumpSpeed;
            isJumping = true;
            hasJumped = true;
        }

        if (
            !keys.a.pressed &&
            !keys.d.pressed &&
            !keys.space.pressed &&
            !keys.shift.pressed
        ) {
            lastKey = null; // reset lastKey when no movement keys are pressed
            this.playerVelocityX = 0; // and stop player x movement
        }
    }
}

class Bullet {
    constructor(x, y, targetX, targetY, context) {
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

        // score system
        this.killScore = 0;
        this.timeScore = 0;
        this.lastScoreTime = Date.now();
    }

    spawnEnemy() {
        // random x position within canvas width using enemyRadius to prevent spawning off screen
        const x = Math.random() * (canvasWidth - enemyRadius * 2) + enemyRadius;
        // spawn them at the top for now
        const y = -enemyRadius * 2;
        const enemy = new Enemy(x, y, enemyRadius, this.context);
        this.enemies.push(enemy);
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
        this.player.update();

        const currentTime = Date.now();

        // survival points / score increase over time
        if (currentTime - this.lastScoreTime >= 1000) {
            // increase score by 1 every second
            this.timeScore += 1;
            this.lastScoreTime = currentTime;
        }

        // spawn enemies at intervals
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnEnemy();
            this.lastSpawnTime = currentTime;
        }

        // !!! Poor performance, use id based removal later if continuing development as forEach will scale poorly !!!
        // run through our list of enemies for collisions
        this.enemies.forEach((enemy) => {
            this.playerenemyColliding(enemy, this.player);
        });

        // update enemy movement
        this.enemies.forEach((enemy) => {
            // move enemy downwards
            enemy.y += 2;
        });

        // remove enemies that have gone off-screen
        this.enemies = this.enemies.filter(
            (enemy) => enemy.y < canvasHeight + enemy.radius
        );

        // update bullets
        this.bullets.forEach((bullet, bulletIndex) => {
            bullet.update();
            // Remove bullet if it goes off-screen
            if (bullet.isOffScreen(canvasWidth, canvasHeight)) {
                this.bullets.splice(bulletIndex, 1);
                return;
            }

            // check for enemy and bullet collisions
            this.enemies.forEach((enemy, enemyIndex) => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // check if the distance between the bullet and the enemy is less than the sum of their radii (meaning a collision)
                if (distance < bullet.radius + enemy.radius) {
                    // remove enemy and bullet on collision
                    this.enemies.splice(enemyIndex, 1);
                    this.bullets.splice(bulletIndex, 1);
                    this.killScore += 1; // increase kill score
                    console.log("Enemy hit! Score;", this.killScore);
                }
            });
        });

        // check if player is alive
        if (!isAlive && gameState === GameState.PLAYING) {
            gameState = GameState.GAMEOVER;

            const finalScore = this.killScore * 100 + this.timeScore;

            const highScore = localStorage.getItem("highScore") || 0;
            if (finalScore > highScore) {
                localStorage.setItem("highScore", this.score);
                console.log("New High Score!");
            }
            this.stopGameLoop();

            // delay before gameover to avoid update overide
            setTimeout(() => {
                this.drawGameOver(finalScore, highScore);
            }, 50);
        }
    }

    drawGameOver(finalScore, highScore) {
        // Fade background
        this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        // Text styling
        this.context.fillStyle = "white";
        this.context.font = "36px monospace";
        this.context.textAlign = "center";

        // Main text
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
    }

    startGameLoop() {
        this.intervalId = setInterval(() => {
            this.update();
            this.draw();
        }, 1000 / 60); // 60 frames per second, using setInterval instead of requestAnimationFrame to avoid player system issues
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
        // if (distX <= playerWidth / 2) {
        //     console.log("Collision detected on X axis");
        //     return true;
        // }
        // if (distY <= playerHeight / 2) {
        //     console.log("Collision detected on Y axis");
        //     return true;
        // }

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

    // Reset player position and variables
    playerX = 100;
    playerY = 100;
    lastKey = null;

    // Create a new game instance
    game = new Game(context);
    game.startGameLoop();
}
