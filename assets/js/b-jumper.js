let context;

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

    const game = new Game(context);
    game.startGameLoop();

    // player.draw();

    isJumping = false;
    hasJumped = false;
    isDashing = false;
    isAlive = true;
};

// player sprite and movement variables
let playerSprite;
let playerSpeed = 10;
let playerRunSpeed = 15;
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
};
window.addEventListener("keydown", (event) => {
    // Stop us scrolling when pressing spacebar
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
    }
    // console.log(event.key);
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
        // apply gravity
        this.playerVelocityY += this.gravity;

        // update player position
        this.y += this.playerVelocityY;
        this.x += this.playerVelocityX;

        // check if player is on the ground
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.playerVelocityY = 0;
            isJumping = false;
            hasJumped = false;
        }

        // check if player is out of bounds
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
        }

        // update horizontal velocity based on key inputs
        if (keys.a.pressed && lastKey === "a") {
            this.playerVelocityX = -1;
        } else if (keys.d.pressed && lastKey === "d") {
            this.playerVelocityX = 1;
        }

        // check if player is jumping
        if (
            keys.space.pressed &&
            lastKey === "space" &&
            !isJumping &&
            !hasJumped
        ) {
            this.playerVelocityY = -this.jumpSpeed;
            isJumping = true;
            hasJumped = true;
        }

        // stop horizontal movement if no keys are pressed
        if (!keys.a.pressed && !keys.d.pressed) {
            this.playerVelocityX = 0;
        }
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

        this.enemy = new Enemy(300, 500, enemyRadius, context);
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

    update() {
        this.player.update();

        this.playerenemyColliding(this.enemy, this.player);

        if (!isAlive) {
            this.stopGameLoop();
            console.log("Game Over");
        }
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
        this.enemy.draw();
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
    // playerenemyColliding(enemy, player) {
    //     // Find the x/y distance to center of objects
    //     var distX = Math.abs(enemy.x - player.x - player.width / 2);
    //     var distY = Math.abs(enemy.y - player.y - player.height / 2);

    //     // If it's more than the distance plus the radius, no collision
    //     if (distX > player.width / 2 + enemy.radius) {
    //         return false;
    //     }
    //     if (distY > player.height / 2 + enemy.radius) {
    //         return false;
    //     }

    //     // If it's within the distance plus the radius, collision
    //     var collision = distX <= player.width / 2 || distY <= player.height / 2;
    //     // Check for collision at corner using Pythagorean theorem
    //     var dx = distX - player.width / 2;
    //     var dy = distY - player.height / 2;
    //     collision =
    //         collision || dx * dx + dy * dy <= enemy.radius * enemy.radius;

    //     if (collision) {
    //         // Handle collision here
    //         player.x = enemy.x - player.width / 2 - enemy.radius;
    //         player.y = enemy.y - player.height / 2 - enemy.radius;
    //         player.playerVelocityX = 0;
    //         player.playerVelocityY = 0;
    //         // Update game state accordingly
    //         // For example, you can set isAlive to false to end the game
    //         isAlive = false;
    //     }

    //     return collision;
    // }
}
