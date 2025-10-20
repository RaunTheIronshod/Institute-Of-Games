let playerSpeed = 10;
let gravity = 0.3;
let jumpSpeed = 15;
let isJumping;
let isAlive;

let playerHeight = 10;
let playerWidth = 4;

let playerX = 100;
let playerY = 100;
let playerVelocityY = 0;
let playerVelocityX = 0;

window.onload = function () {
    // set canvas from html as map for out of game context use, might be redundent
    const map = document.getElementById("b-jumper");
    // define context for game space
    const context = map.getContext("2d");

    // define canvas size
    map.width = 1024;
    map.height = 576;

    context.fillRect(0, 0, map.width, map.height);

    isJumping = false;
    isAlive = true;
};
