const wallW = 10;
const ballSize = 10;
const pathW = 25;
const holeSize = 20;
// es para ver si vaue esta entre -limit y limit
function minmax(value, limit) {
    return Math.min(Math.max(value, -limit), limit);
}
const distance2D = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
const getAngle = (p1, p2) => {
    let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    if (p2.x < p1.x)
        angle += Math.PI;
    return angle;
}
const closestItCanBe = (cap, ball) => {
    let angle = getAngle(cap, ball);
    const deltaX = cap.x + Math.cos(angle) * (ballSize + wallW);
    const deltaY = cap.y + Math.sin(angle) * (ballSize + wallW);
    return {
        x: cap + deltaX,
        y: cap + deltaY
    }
}
const rollAroundCap = (cap, ball) => {
    let impactAngle = getAngle(cap, ball);
    let heading = getAngle(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );
    let impactHeadingAngle = impactAngle - heading;
    const velocityMagnitude = distance2D(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );
    const velocityMagnitudeDiagonalToTheImpact = Math.sin(impactHeadingAngle) * velocityMagnitude;
    const closestDistance = wallW / 2 + ballSize;
    const rotationAngle = Math.atan(velocityMagnitudeDiagonalToTheImpact / closestDistance);
    const deltaFromCap = {
        x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
        y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance
    }
    const x = ball.x;
    const y = ball.y;
    const velocityX = ball.x - (cap.x + deltaFromCap.x);
    const velocityY = ball.y - (cap.y + deltaFromCap.y);
    const nextX = x + velocityX;
    const nextY = y + velocityY;
    return {
        x, y, velocityX, velocityY, nextX, nextY
    }
}
const slow = (number, difference) => {
    if (Math.abs(number) <= difference) return 0;
    if (number > difference) return number - difference;
    return number + difference;
};
const mazeElement = document.getElementById("maze");
const joystickHeadElement = document.getElementById("joystick-head");
const noteElement = document.getElementById("note");
let hardMode = false;
let previousTimestamp;
let gameInProgress;
let mouseStartX;
let mouseStartY;
let accelerationX;
let accelerationY;
let frictionX;
let frictionY;
let balls = [];
let ballElements = [];
let holeElements = [];
resetGame();
balls.forEach(({ x, y }) => {
    const ball = document.createElement("div");
    ball.setAttribute("class", "ball");
    ball.style.cssText = `
        left: ${x}px;
        top: ${y}px;
    `;
    mazeElement.appendChild(ball);
    ballElements.push(ball);
})
const walls = [
    // Border
    { column: 0, row: 0, horizontal: true, length: 10 },
    { column: 0, row: 0, horizontal: false, length: 9 },
    { column: 0, row: 9, horizontal: true, length: 10 },
    { column: 10, row: 0, horizontal: false, length: 9 },

    // Horizontal lines starting in 1st column
    { column: 0, row: 6, horizontal: true, length: 1 },
    { column: 0, row: 8, horizontal: true, length: 1 },

    // Horizontal lines starting in 2nd column
    { column: 1, row: 1, horizontal: true, length: 2 },
    { column: 1, row: 7, horizontal: true, length: 1 },

    // Horizontal lines starting in 3rd column
    { column: 2, row: 2, horizontal: true, length: 2 },
    { column: 2, row: 4, horizontal: true, length: 1 },
    { column: 2, row: 5, horizontal: true, length: 1 },
    { column: 2, row: 6, horizontal: true, length: 1 },

    // Horizontal lines starting in 4th column
    { column: 3, row: 3, horizontal: true, length: 1 },
    { column: 3, row: 8, horizontal: true, length: 3 },

    // Horizontal lines starting in 5th column
    { column: 4, row: 6, horizontal: true, length: 1 },

    // Horizontal lines starting in 6th column
    { column: 5, row: 2, horizontal: true, length: 2 },
    { column: 5, row: 7, horizontal: true, length: 1 },

    // Horizontal lines starting in 7th column
    { column: 6, row: 1, horizontal: true, length: 1 },
    { column: 6, row: 6, horizontal: true, length: 2 },

    // Horizontal lines starting in 8th column
    { column: 7, row: 3, horizontal: true, length: 2 },
    { column: 7, row: 7, horizontal: true, length: 2 },

    // Horizontal lines starting in 9th column
    { column: 8, row: 1, horizontal: true, length: 1 },
    { column: 8, row: 2, horizontal: true, length: 1 },
    { column: 8, row: 3, horizontal: true, length: 1 },
    { column: 8, row: 4, horizontal: true, length: 2 },
    { column: 8, row: 8, horizontal: true, length: 2 },

    // Vertical lines after the 1st column
    { column: 1, row: 1, horizontal: false, length: 2 },
    { column: 1, row: 4, horizontal: false, length: 2 },

    // Vertical lines after the 2nd column
    { column: 2, row: 2, horizontal: false, length: 2 },
    { column: 2, row: 5, horizontal: false, length: 1 },
    { column: 2, row: 7, horizontal: false, length: 2 },

    // Vertical lines after the 3rd column
    { column: 3, row: 0, horizontal: false, length: 1 },
    { column: 3, row: 4, horizontal: false, length: 1 },
    { column: 3, row: 6, horizontal: false, length: 2 },

    // Vertical lines after the 4th column
    { column: 4, row: 1, horizontal: false, length: 2 },
    { column: 4, row: 6, horizontal: false, length: 1 },

    // Vertical lines after the 5th column
    { column: 5, row: 0, horizontal: false, length: 2 },
    { column: 5, row: 6, horizontal: false, length: 1 },
    { column: 5, row: 8, horizontal: false, length: 1 },

    // Vertical lines after the 6th column
    { column: 6, row: 4, horizontal: false, length: 1 },
    { column: 6, row: 6, horizontal: false, length: 1 },

    // Vertical lines after the 7th column
    { column: 7, row: 1, horizontal: false, length: 4 },
    { column: 7, row: 7, horizontal: false, length: 2 },

    // Vertical lines after the 8th column
    { column: 8, row: 2, horizontal: false, length: 1 },
    { column: 8, row: 4, horizontal: false, length: 2 },

    // Vertical lines after the 9th column
    { column: 9, row: 1, horizontal: false, length: 1 },
    { column: 9, row: 5, horizontal: false, length: 2 }
].map((wall) => ({
    x: wall.column * (pathW + wallW),
    y: wall.row * (pathW + wallW),
    horizontal: wall.horizontal,
    length: wall.length * (pathW + wallW)
}));
walls.forEach(({ x, y, horizontal, length }) => {
    const wall = document.createElement("div");
    wall.setAttribute("class", "wall");
    wall.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${horizontal ? length : wallW}px;
        height: ${horizontal ? wallW : length}px;
    `;
    mazeElement.appendChild(wall);
})
const holes = [
    { column: 0, row: 5 },
    { column: 2, row: 0 },
    { column: 2, row: 4 },
    { column: 4, row: 6 },
    { column: 6, row: 2 },
    { column: 6, row: 8 },
    { column: 8, row: 1 },
    { column: 8, row: 2 },
].map((hole) => ({
    x: hole.column * (wallW + pathW) + wallW / 2 + pathW / 2,
    y: hole.row * (wallW + pathW) + wallW / 2 + pathW / 2,
}));
window.addEventListener("mousemove", (event) => {
    if(gameInProgress){
        const mouseDeltaX= -Math.minmax(event.clientX - mouseStartX, 15);
        const mouseDeltaY= -Math.minmax(event.clientY - mouseStartY, 15);
        joystickHeadElement.style.cssText = `
            left: ${mouseDeltaX}px;
            top: ${mouseDeltaY}px;
            animation: none;
            cursor: grabbing;
        `;
        const rotationX = mouseDeltaY *.8;
        const rotationY = mouseDeltaX *.8;
        mazeElement.style.cssText = `
            transform: rotateY(${rotationY}deg) rotateX(${rotationX}deg);
        `;
        const gravity = 0.5;
        const friction = 0.01;
        accelerationX = gravity * Math.sin(rotationY * Math.PI / 180);
        accelerationY = gravity * Math.sin(rotationX * Math.PI / 180);
        frictionX = gravity* friction * Math.cos(rotationY * Math.PI / 180);
        frictionY = gravity* friction * Math.cos(rotationX * Math.PI / 180);
    }
});
window.addEventListener("mousedown", (event) => {
    if(![" ", "H", "h", "E", "e"].includes(event.key))
    return;
    event.preventDefault();
    if (event.key==' '){
        resetGame();
        return;
    }
    if (event.key=='H'||event.key=='h'){
        hardMode = true;
        resetGame();
        return;
    }
    if (event.key=='E'||event.key=='e'){
        hardMode = false;
        resetGame();
        return;
    }
});
function resetGame() {
    previousTimestamp = undefined;
    gameInProgress = false;
    mouseStartX = undefined;
    mouseStartY = undefined;
    accelerationX = undefined;
    accelerationY = undefined;
    frictionX = undefined;
    frictionY = undefined;
    mazeElement.style.cssText = `
        transform: rotateY(0deg) rotateX(0deg);
    `;
    joystickHeadElement.style.cssText = `
        left: 0px;
        top: 0px;
        animation: glow;
        cursor: grab;
    `;
    if (hardMode) {
        noteElement.innerHTML = "Hard mode: ON";
    } else {
        noteElement.innerHTML = "Hard mode: OFF";
    }
    noteElement.style.opacity = 1;
    balls = [
        { column: 0, row: 0 },
        { column: 9, row: 0 },
        { column: 0, row: 8 },
        { column: 9, row: 8 },
    ].map((ball) => ({
        x: ball.column * (wallW + pathW) + wallW / 2 + pathW / 2,
        y: ball.row * (wallW + pathW) + wallW / 2 + pathW / 2,
        velocityX: 0,
        velocityY: 0,
    }));
    if (ballElements.length) {
        balls.forEach(({ x, y }, index) => {
            ballElements[index].style.cssText = `
                left: ${x}px;
                top: ${y}px;
            `;
        });
    }
    holeElements.forEach((hole) => {
        mazeElement.removeChild(hole);
    });
    if (hardMode) {
        holes.forEach(({ x, y }) => {
            const ball = document.createElement("div");
            ball.setAttribute("class", "black-hole");
            mazeElement.appendChild(ball);
            holeElements.push(ball);
        })
    }
}
function main(timestamp){
    if(gameInProgress) return;
    if (previousTimestamp === undefined) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
        return;
        const maxVelocity = 1.5;
        const timeElapsed = (timestamp - previousTimestamp)/16;
        try{
            if(accelerationX !=undefined && accelerationY !=undefined){
                const velocityChangeX = accelerationX * timeElapsed;
                const velocityChangeY = accelerationY * timeElapsed;
                const frictionDeltaX = frictionX * timeElapsed;
                const frictionDeltaY = frictionY * timeElapsed;
                balls.forEach((ball) => {
                    if(velocityChangeX ==0){
                        ball.velocityX = slow(ball.velocityX, frictionDeltaX);
                    }else{
                        ball.velocityX += velocityChangeX;
                        ball.velocityX = Math.max(Math.min(ball.velocityX*1.5),-1.5);
                        ball.velocityX -= Math.sign(velocityChangeX) * frictionDeltaX;
                        ball.velocityChangeX = Math.minmax(ball.velocityX, maxVelocity);
                    }
                    if(velocityChangeY ==0){
                        ball.velocityY = slow(ball.velocityY, frictionDeltaY);
                    }else{
                        ball.velocityY += velocityChangeY;
                        ball.velocityY = Math.max(Math.min(ball.velocityY*1.5),-1.5);
                        ball.velocityY -= Math.sign(velocityChangeY) * frictionDeltaY;
                        ball.velocityChangeY = Math.minmax(ball.velocityY, maxVelocity);
                    }
                    ball.nextX = ball.x + ball.velocityX;
                    ball.nextY = ball.y + ball.velocityY;
                    if (debugMode) console.log('tick', ball);
                    walls.forEach((wall, wi) => {
                        if (wall.horizontal) {
                            
                        }
                    });
                });
            }
        }catch(e){
            console.log(e);
        }
    }
}