let canvasContext;
let playerContext;

// set canvas from html as canvas for out of game canvasContext use, might be redundent
const canvas = document.getElementById("b-jumper");
// define canvasContext for game space
canvasContext = canvas.getContext("2d");

window.onload = function () {
    // define canvas size
    canvas.width = 1024;
    canvas.height = 576;

    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    const game = new Game();
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

class Player {
    canvas = this.canvas;
    constructor(playerX, playerY, playerWidth, playerHeight, canvasContext) {
        this.x = playerX;
        this.y = playerY;
        this.width = playerWidth;
        this.height = playerHeight;
        this.gravity = gravity;
        this.speed = playerSpeed;
        this.playerRunSpeed = playerRunSpeed;
        this.playerDashSpeed = dashSpeed;
        this.jumpSpeed = jumpSpeed;
        this.canvasContext = canvasContext;
        this.playerContext = playerContext;
    }

    draw() {
        this.canvasContext.fillStyle = "blue";
        this.canvasContext.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        // apply gravity
        this.playerVelocityY += this.gravity;

        // update player position
        this.y += this.playerVelocityY;

        // check if player is on the ground
        if (this.y + this.height >= this.canvas.height) {
            this.y = this.canvas.height - this.height;
            this.playerVelocityY = 0;
            isJumping = false;
            hasJumped = false;
        }
    }
}

class Game {
    constructor(canvasContext) {
        this.player = new Player(
            playerX,
            playerY,
            playerWidth,
            playerHeight,
            canvasContext
        );
        this.canvasContext = canvasContext;
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
        this.canvasContext.clearRect(
            0,
            0,
            this.canvasContext.canvas.width,
            this.canvasContext.canvas.height
        );
        this.player.draw();
    }
}
