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
    }

    draw() {
        this.context.fillStyle = "blue";
        this.context.fillRect(this.x, this.y, this.width, this.height);
    }
}

window.onload = function () {
    // set canvas from html as map for out of game context use, might be redundent
    const map = document.getElementById("b-jumper");
    // define context for game space
    const context = map.getContext("2d");

    // define canvas size
    map.width = 1024;
    map.height = 576;

    context.fillRect(0, 0, map.width, map.height);

    const player = new Player(
        playerX,
        playerY,
        playerWidth,
        playerHeight,
        context
    );
    player.draw();

    isJumping = false;
    hasJumped = false;
    isDashing = false;
    isAlive = true;
};
