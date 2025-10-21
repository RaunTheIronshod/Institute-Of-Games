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
let gravity = 0.3;
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
    console.log(event.key);
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
    console.log(event.key);
});

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
        console.log("Drawing player at:", this.x, this.y);
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
        } else if (this.x + this.playerWidth > canvasWidth) {
            this.x = canvasWidth - this.playerWidth;
        }

        // update horizontal velocity based on key inputs
        if (keys.a.pressed && lastKey === "a") {
            this.playerVelocityX = -1;
        } else if (keys.d.pressed && lastKey === "d") {
            this.playerVelocityX = 1;
        }

        // check if player is jumping
        if (keys.space.pressed && lastKey === "space") {
            this.playerVelocityY = -this.jumpSpeed;
        }

        // stop horizontal movement if no keys are pressed
        if (!keys.a.pressed && !keys.d.pressed) {
            this.playerVelocityX = 0;
        }
    }
}

class Enemy {}

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
    }

    draw() {
        // Clear the canvas before drawing
        this.context.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the background
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw the player
        this.player.draw();
    }
}
