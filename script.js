const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const difficultySelect = document.getElementById("difficulty");
const backgroundThemeSelect = document.getElementById("backgroundTheme");
const themeSelectionDiv = document.getElementById("themeSelection");

let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

let paddleHeight = 10;
let paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;

let brickRowCount;
let brickColumnCount;
let bricks = [];
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;
let score = 0;
let lives = 3;
let level = 1;
let isEasyMode = false;
let gameWon = false;
let explosions = [];

let timer;
let timeLimit = 40;
let timeLimitedLevels = [1, 3];

let tail = [];
const tailLength = 10;

let scoreMilestone = 300; // Initial milestone
let comboCount = 0; // Combo counter
let lastBrickHitTime = 0; // Timestamp of the last brick hit

function setDifficulty(difficulty) {
    switch (difficulty) {
        case "easy":
            brickRowCount = 2;
            brickColumnCount = 8;
            lives = 4;
            dx = 2;
            dy = -2;
            isEasyMode = true;
            themeSelectionDiv.style.display = "block";
            break;
        case "medium":
            brickRowCount = 5;
            brickColumnCount = 8;
            lives = 4;
            dx = 5;
            dy = -5;
            timer = timeLimit;
            isEasyMode = false;
            comboCount = 0; // Reset combo count
            themeSelectionDiv.style.display = "none";
            break;
        case "hard":
            brickRowCount = 7;
            brickColumnCount = 8;
            lives = 4;
            dx = 7;
            dy = -7;
            isEasyMode = false;
            themeSelectionDiv.style.display = "none";
            break;
        default:
            brickRowCount = 3;
            brickColumnCount = 5;
            lives = 4;
            dx = 2;
            dy = -2;
            isEasyMode = false;
            themeSelectionDiv.style.display = "block";
    }
}

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;

            let strength;
            let color;

            if (difficultySelect.value === "easy") {
                strength = 1;
                color = "#0095DD";
            } else if (difficultySelect.value === "medium") {
                strength = (r % 2 === 0) ? 2 : 1;
                color = (strength === 2) ? "#FF6347" : "#0095DD";
            } else {
                strength = Math.floor(Math.random() * 4) + 1;
                color = ["#FF0000", "#0000FF", "#008000", "#800080"][strength - 1];
            }

            bricks[c][r] = { x: brickX, y: brickY, status: strength, color: color };
        }
    }
}

function changeBackgroundTheme(theme) {
    canvas.className = '';
    if (theme === 'night') {
        canvas.classList.add('night');
    } else if (theme === 'forest') {
        canvas.classList.add('forest');
    }
}

startButton.addEventListener("click", function() {
    const difficulty = difficultySelect.value;

    if (isEasyMode && backgroundThemeSelect.value === "") {
        alert("請選擇主題！");
        return;
    }

    setDifficulty(difficulty);
    initBricks();
    changeBackgroundTheme(backgroundThemeSelect.value);
    startButton.style.display = "none";
    canvas.style.display = "block";
    draw();
});

backgroundThemeSelect.addEventListener("change", function() {
    if (difficultySelect.value === "easy") {
        changeBackgroundTheme(backgroundThemeSelect.value);
    }
});

difficultySelect.addEventListener("change", function() {
    const difficulty = difficultySelect.value;
    setDifficulty(difficulty);
    themeSelectionDiv.style.display = (difficulty === "easy") ? "block" : "none";
});

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
canvas.addEventListener("mousemove", mouseMoveHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status > 0) {
                ctx.beginPath();
                ctx.rect(b.x, b.y, brickWidth, brickHeight);
                ctx.fillStyle = b.color;
                ctx.fill();
                ctx.closePath();

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "12px Arial";
                ctx.fillText(b.status, b.x + brickWidth / 2 - 5, b.y + brickHeight / 2 + 5);
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("分數: " + score, 8, 20);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("剩餘生命: " + lives, canvas.width - 150, 20);
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.alpha = 1;
        this.maxSize = 30;
    }

    update() {
        this.size += 2;
        this.alpha -= 0.05;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "#FF0000";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status > 0) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status--;
                    score += 10 + comboCount * 5; // Increment score based on combo count
                    comboCount++; // Increment combo count
                    lastBrickHitTime = Date.now(); // Update the last hit time

                    if (difficultySelect.value === "hard") {
                        explosions.push(new Explosion(b.x + brickWidth / 2, b.y + brickHeight / 2));
                    }

                    if (difficultySelect.value === "medium" && timeLimitedLevels.includes(level)) {
                        let allBricksDestroyed = true;
                        for (let col = 0; col < brickColumnCount; col++) {
                            for (let row = 0; row < brickRowCount; row++) {
                                if (bricks[col][row].status > 0) {
                                    allBricksDestroyed = false;
                                    break;
                                }
                            }
                        }
                        if (allBricksDestroyed) {
                            alert("恭喜！你贏了！");
                            gameWon = true;
                        }
                    }
                }
            }
        }
    }
    
    // Reset combo count if no brick hit within 1 second
    if (Date.now() - lastBrickHitTime > 1000) {
        comboCount = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();

    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        explosions[i].draw();
        if (explosions[i].alpha <= 0) {
            explosions.splice(i, 1);
        }
    }

    collisionDetection();

    if (difficultySelect.value === "medium" && score >= scoreMilestone) {
        if (Math.random() < 0.5) {
            timer += 10;
            alert("Bonus! 延長計時 10 秒!");
        } else {
            lives += 1;
            alert("Bonus! 增加生命!");
        }
        scoreMilestone += 300;
    }

    x += dx;
    y += dy;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            lives--;
            if (lives === 0) {
                alert("遊戲結束！");
                return;
            } else {
                x = canvas.width / 2;
                y = canvas.height - 30;
                comboCount = 0; // Reset combo on life loss
            }
        }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    if (difficultySelect.value === "medium" && timeLimitedLevels.includes(level)) {
        timer -= 1 / 60;
        if (timer <= 0) {
            alert("時間到了！遊戲結束！");
            return;
        }
    }

    if (difficultySelect.value === "medium" && timeLimitedLevels.includes(level)) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText("剩餘時間: " + Math.ceil(timer), canvas.width - 300, 20);
    }

    requestAnimationFrame(draw);
}
