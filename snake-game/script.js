const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

const gridSize = 20;
let snake;
let food = {};
let direction;
let changingDirection = false;
let score;
let gameInterval;
let isGameActive = false; // Flag to track if the game is running

function initializeGame() {
    snake = [
        {x: 10, y: 10}
    ];
    // Initial direction is set by the first key press, or default to right for restart
    // If the game is starting for the first time via a key press, `direction` will already be set.
    // If it's a restart, we'll explicitly set direction to 'right' via the restart button event listener.
    score = 0;
    generateFood();
    if (gameInterval) clearInterval(gameInterval); // Clear any existing interval
    gameInterval = setInterval(gameLoop, 100);
    isGameActive = true; // Game is now active
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? 'green' : 'lime';
        ctx.strokeStyle = 'darkgreen';
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
        ctx.strokeRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
    }

    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'darkred';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveSnake() {
    const head = {x: snake[0].x, y: snake[0].y};

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    snake.unshift(head);

    const didEatFood = head.x === food.x && head.y === food.y;
    if (didEatFood) {
        score += 10;
        generateFood();
    } else {
        snake.pop();
    }
}

function checkCollision() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x > canvas.width / gridSize - 1;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y > canvas.height / gridSize - 1;

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

function gameLoop() {
    if (checkCollision()) {
        clearInterval(gameInterval);
        alert(`Game Over! Score: ${score}`);
        isGameActive = false; // Game is no longer active
        return;
    }

    changingDirection = false;
    moveSnake();
    draw();
}

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;

    // If game is not active, start it with the first arrow key pressed
    if (!isGameActive) {
        if (keyPressed === LEFT_KEY || keyPressed === UP_KEY || keyPressed === RIGHT_KEY || keyPressed === DOWN_KEY) {
            if (keyPressed === LEFT_KEY) direction = 'left';
            else if (keyPressed === UP_KEY) direction = 'up';
            else if (keyPressed === RIGHT_KEY) direction = 'right';
            else if (keyPressed === DOWN_KEY) direction = 'down';
            initializeGame();
            return; // Exit after starting the game, no need to change direction immediately
        }
        return; // Ignore non-arrow keys if game is not active
    }

    // If game is active, proceed with normal direction change logic
    if (changingDirection) return;
    changingDirection = true;

    const goingUp = direction === 'up';
    const goingDown = direction === 'down';
    const goingLeft = direction === 'left';
    const goingRight = direction === 'right';

    if (keyPressed === LEFT_KEY && !goingRight) {
        direction = 'left';
    }
    if (keyPressed === UP_KEY && !goingDown) {
        direction = 'up';
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        direction = 'right';
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        direction = 'down';
    }
}

document.addEventListener('keydown', changeDirection);
restartButton.addEventListener('click', () => {
    direction = 'right'; // Reset direction for restart button
    initializeGame();
});

// No initial call to startGame or initializeGame. Game starts on first arrow key press.
