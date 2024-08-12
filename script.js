const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

const paddleWidth = 15;
const paddleHeight = 150;
const ballRadius = 15;

let playerPaddleY = (canvas.height - paddleHeight) / 2;
let computerPaddleY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 7 * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = 7 * (Math.random() > 0.5 ? 1 : -1);

let playerScore = 0;
let computerScore = 0;
const winningScore = 15;
let isTwoPlayerMode = false;

let playerUpPressed = false;
let playerDownPressed = false;
let computerUpPressed = false;
let computerDownPressed = false;

function drawRect(x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function drawText(text, x, y, color) {
    context.fillStyle = color;
    context.font = '30px Arial';
    context.fillText(text, x, y);
}

function render() {
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    drawRect(0, playerPaddleY, paddleWidth, paddleHeight, '#00f');
    drawRect(canvas.width - paddleWidth, computerPaddleY, paddleWidth, paddleHeight, '#f00');
    drawCircle(ballX, ballY, ballRadius, '#fff');
    drawText(playerScore, canvas.width / 4, 50, '#00f');
    drawText(computerScore, (canvas.width / 4) * 3, 50, '#f00');
}

function movePaddles() {
    const playerSpeed = 10;
    const computerSpeed = 10;

    if (playerUpPressed) {
        playerPaddleY = Math.max(playerPaddleY - playerSpeed, 0);
    } else if (playerDownPressed) {
        playerPaddleY = Math.min(playerPaddleY + playerSpeed, canvas.height - paddleHeight);
    }

    if (isTwoPlayerMode) {
        if (computerUpPressed) {
            computerPaddleY = Math.max(computerPaddleY - computerSpeed, 0);
        } else if (computerDownPressed) {
            computerPaddleY = Math.min(computerPaddleY + computerSpeed, canvas.height - paddleHeight);
        }
    } else {
        if (ballY > computerPaddleY + paddleHeight / 2) {
            computerPaddleY += computerSpeed;
        } else {
            computerPaddleY -= computerSpeed;
        }
    }
}

function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    if (ballX - ballRadius < paddleWidth) {
        if (ballY > playerPaddleY && ballY < playerPaddleY + paddleHeight) {
            const deltaY = ballY - (playerPaddleY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.3;
            ballSpeedX = -ballSpeedX;
        } else {
            computerScore++;
            resetBall();
        }
    }

    if (ballX + ballRadius > canvas.width - paddleWidth) {
        if (ballY > computerPaddleY && ballY < computerPaddleY + paddleHeight) {
            const deltaY = ballY - (computerPaddleY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.3;
            ballSpeedX = -ballSpeedX;
        } else {
            playerScore++;
            resetBall();
        }
    }
}

function resetBall() {
    if (playerScore >= winningScore || computerScore >= winningScore) {
        resetGame();
    } else {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = 7 * (Math.random() > 0.5 ? 1 : -1);
        ballSpeedY = 7 * (Math.random() > 0.5 ? 1 : -1);
    }
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    playerPaddleY = (canvas.height - paddleHeight) / 2;
    computerPaddleY = (canvas.height - paddleHeight) / 2;
    resetBall();
}

function gameLoop() {
    movePaddles();
    moveBall();
    render();
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    playerPaddleY = event.clientY - rect.top - paddleHeight / 2;
});

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            playerUpPressed = true;
            break;
        case 's':
            playerDownPressed = true;
            break;
        case 'ArrowUp':
            computerUpPressed = true;
            break;
        case 'ArrowDown':
            computerDownPressed = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
            playerUpPressed = false;
            break;
        case 's':
            playerDownPressed = false;
            break;
        case 'ArrowUp':
            computerUpPressed = false;
            break;
        case 'ArrowDown':
            computerDownPressed = false;
            break;
    }
});

function countdown(callback) {
    let count = 3;
    drawText(count, canvas.width / 2 - 15, canvas.height / 2, '#fff');
    const countdownInterval = setInterval(() => {
        count--;
        context.clearRect(0, 0, canvas.width, canvas.height);
        render();
        if (count > 0) {
            drawText(count, canvas.width / 2 - 15, canvas.height / 2, '#fff');
        } else {
            clearInterval(countdownInterval);
            drawText('СТАРТ', canvas.width / 2 - 45, canvas.height / 2, '#fff');
            setTimeout(callback, 1000);
        }
    }, 1000);
}

let gameInterval;

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    countdown(() => {
        resetGame();
        gameInterval = setInterval(gameLoop, 1000 / 60);
    });
}

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    startGame();
});

document.getElementById('onePlayerButton').addEventListener('click', () => {
    isTwoPlayerMode = false;
    resetGame();
    startGame();
});

document.getElementById('twoPlayerButton').addEventListener('click', () => {
    isTwoPlayerMode = true;
    resetGame();
    startGame();
});
