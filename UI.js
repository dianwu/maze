const MAZE_MIN_LENGTH = 5;
const MAZE_MAX_LENGTH = 30;
let selectMazeWidth = document.querySelector("#mazeWidth");
let selectMazeHeight = document.querySelector("#mazeHeight");

let mazeMargin = 2; //px
let mazeGridWidth = 30; //px

let mazeWidth = 10;
let mazeHeight = 10;
let eller = new EllerMaze(mazeWidth, mazeHeight);
let maze = null;
let mazeCanvas = document.getElementById("mazeCanvas");
let context = mazeCanvas.getContext("2d");
mazeCanvas.addEventListener("click", onMazeCanvasClick);
let message = document.getElementById("message");
let points = [];
let link = [];

let astar = null;
let path = [];
let startPoint = null;
let endPoint = null;
let currentPoint = null;

const playerGraphicStatusList = [3, 2, 1, 0, -1, -2, -3, -2, -1, 0, 1, 2, 3];
const playerFrame = 1000 / 15;
const PATH_NONE = 0;
const PATH_DONE = 1;
const PATH_SELECT_START = 2;
const PATH_SELECT_END = 3;
const GAME_READY = 1;
const GAME_PLAYING = 2;
const GAME_COMPLETE = 3;

let pathStatus = PATH_DONE;
let gameStatus = GAME_READY;
let pathStart = null;
let pathEnd = null;
let imageData = null;
let playerGraphicStatus = 0;
let frameTime = 0;
let startTime = null;
let hintFlag = false;

function onload() {
  //maze size auto fit screen size
  selectMazeWidth.value = Math.floor(
    (window.innerWidth - 10 * mazeMargin) / mazeGridWidth
  );
  selectMazeHeight.value = Math.floor(
    (document.querySelector(".content").clientHeight - 2 * mazeMargin) /
      mazeGridWidth
  );

  setupEventListener();
  setNewMaze();
  setupAnimFrameTask();
}

function setupAnimFrameTask() {
  reDrawMaze();
  if (gameStatus === GAME_PLAYING) {
    let spendTime = Date.now() - startTime;
    let ms = spendTime % 1000;
    let ss = ((spendTime - ms) % (1000 * 60)) / 1000;
    let mm = parseInt((spendTime - ms - ss) / (1000 * 60));

    message.innerText = `Time: ${mm}:${ss}:${ms}`;
  }

  if (gameStatus !== GAME_COMPLETE) {
    window.requestAnimationFrame(setupAnimFrameTask);
  }
}

function setupEventListener() {
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Down": // IE/Edge specific value
      case "ArrowDown":
        // Do something for "down arrow" key press.
        moveDown();
        break;
      case "Up": // IE/Edge specific value
      case "ArrowUp":
        // Do something for "up arrow" key press.
        moveUp();
        break;
      case "Left": // IE/Edge specific value
      case "ArrowLeft":
        // Do something for "left arrow" key press.
        moveLeft();
        break;
      case "Right": // IE/Edge specific value
      case "ArrowRight":
        // Do something for "right arrow" key press.
        moveRight();
        break;
    }
  });

  window.addEventListener("devicemotion", onDevicemotion);
}

function onDevicemotion(event) {
  const x = event.accelerationIncludingGravity.x;
  const y = event.accelerationIncludingGravity.y;
  document.getElementById("debugmessage").innerText = event.interval;
  //   event.accelerationIncludingGravity.x;
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  let moveFn;
  let value;
  if (absX > absY) {
    const roundX = Math.round(x);

    if (roundX === 0) {
      return;
    }

    value = roundX;
    moveFn = roundX > 0 ? moveRight : moveLeft;
  } else {
    const roundY = Math.round(y);

    if (roundY === 0) {
      return;
    }

    value = roundY;
    moveFn = roundY > 0 ? moveDown : moveUp;
  }

  switch (Math.round(value)) {
    case 10:
    case 9:
    case 8:
      moveFn();
      moveFn();
      moveFn();
      break;
    case 7:
    case 6:
    case 5:
      moveFn();
      moveFn();
      break;
    case 4:
    case 3:
    case 2:
    case 1:
      moveFn();
      break;
  }
}

function setNewMaze() {
  context.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);
  mazeWidth = parseInt(selectMazeWidth.value, 10);
  mazeHeight = parseInt(selectMazeHeight.value, 10);
  setupMaze(mazeWidth, mazeHeight);
  pathStatus = PATH_DONE;
  // reset
  changeMazePathStatus();
  // Setting path mode;
  changeMazePathStatus();
  // setup start
  getRandomPoint();
  // setup end
  getRandomPoint();
  startTime = null;
  gameStatus = GAME_READY;
  console.log("points", points);
}

function startPath() {
  changeMazePathStatus();
}

function changeMazePathStatus() {
  console.log("changeMazePathStatus", pathStatus);
  switch (pathStatus) {
    case PATH_DONE:
      pathStatus = PATH_NONE;
      //erase path
      context.putImageData(imageData, 0, 0);
      break;
    case PATH_NONE:
      pathStatus = PATH_SELECT_START;
      break;
    case PATH_SELECT_START:
      pathStatus = PATH_SELECT_END;
      break;
    case PATH_SELECT_END:
      pathStatus = PATH_DONE;
      message.innerText = "Ready Go!!!!";
      drawPlayer();
      break;
  }
}

function hintPath() {
  hintFlag = true;
  setTimeout(() => {
    hintFlag = false;
  }, 1000);
}

function getRandomPoint() {
  const canvasRelativeX =
    (parseInt(Math.random() * mazeCanvas.width) * mazeCanvas.width) /
    mazeCanvas.clientWidth;
  const canvasRelativeY =
    (parseInt(Math.random() * mazeCanvas.height) * mazeCanvas.height) /
    mazeCanvas.clientHeight;
  let x = Math.floor((canvasRelativeX - mazeMargin) / mazeGridWidth);
  let y = Math.floor((canvasRelativeY - mazeMargin) / mazeGridWidth);
  drawPathPoint(x, y);
}

function drawStartPoint(x, y) {
  const sideLength = mazeGridWidth / 2;
  const startX = x * mazeGridWidth + mazeMargin + mazeGridWidth / 2;
  const startY = y * mazeGridWidth + mazeMargin + mazeGridWidth / 4;

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(startX + sideLength / 2, startY + sideLength);
  context.lineTo(startX - sideLength / 2, startY + sideLength);
  context.fillStyle = "red";
  context.fill();
}

function drawEndPoint(x, y) {
  const startX = x * mazeGridWidth + mazeMargin + mazeGridWidth / 2;
  const startY = y * mazeGridWidth + mazeMargin + mazeGridWidth / 2;

  var alpha = (2 * Math.PI) / 10;
  var radius = 12;
  var starXY = [startX, startY];

  context.beginPath();

  for (var i = 11; i != 0; i--) {
    var r = (radius * ((i % 2) + 1)) / 2;
    var omega = alpha * i;
    context.lineTo(
      r * Math.sin(omega) + starXY[0],
      r * Math.cos(omega) + starXY[1]
    );
  }

  context.closePath();
  context.fillStyle = "red";
  context.fill();
}

function drawPathPoint(x, y) {
  if (pathStatus === PATH_SELECT_START) {
    pathStart = points.find((p) => p.X === x && p.Y === y);
    drawStartPoint(x, y);
    startPoint = [x, y];
    currentPoint = [x, y];
  } else if (pathStatus === PATH_SELECT_END) {
    pathEnd = points.find((p) => p.X === x && p.Y === y);
    drawEndPoint(x, y);
    endPoint = [x, y];
  }
  imageData = context.getImageData(0, 0, mazeCanvas.width, mazeCanvas.height);
  changeMazePathStatus();
}

function onMazeCanvasClick(e) {
  if (pathStatus === PATH_DONE || pathStatus === PATH_NONE) {
    return;
  }
  const elementRelativeX = e.offsetX;
  const elementRelativeY = e.offsetY;
  const canvasRelativeX =
    (elementRelativeX * mazeCanvas.width) / mazeCanvas.clientWidth;
  const canvasRelativeY =
    (elementRelativeY * mazeCanvas.height) / mazeCanvas.clientHeight;

  //find click point x, y

  let x = Math.floor((canvasRelativeX - mazeMargin) / mazeGridWidth);
  let y = Math.floor((canvasRelativeY - mazeMargin) / mazeGridWidth);
  drawPathPoint(x, y);
}

function setupMaze(width, height, vBias = 0.5, hBias = 0.5) {
  eller.LengthOfRow = width;
  eller.NumberOfRow = height;
  mazeCanvas.width = mazeMargin * 2 + mazeGridWidth * width;
  mazeCanvas.height = mazeMargin * 2 + mazeGridWidth * height;
  mazeCanvas.style.width = mazeCanvas.width;
  mazeCanvas.style.height = mazeCanvas.height;
  maze = eller.GenerateMaze();
  drawMaze();
  toPathMap(maze);
  //save imagedata with no path
  imageData = context.getImageData(0, 0, mazeCanvas.width, mazeCanvas.height);
}

function setupPath(start, end) {
  astar = new AStarCustomMap(points, link);
  path = astar.GetPath(start, end);
  drawPath(path);
}

function drawMaze() {
  context.beginPath();
  context.strokeStyle = "black";
  //draw left and top line
  context.moveTo(mazeMargin, mazeMargin);
  context.lineTo(mazeMargin + mazeGridWidth * mazeWidth, mazeMargin);

  context.moveTo(mazeMargin, mazeMargin);
  context.lineTo(mazeMargin, mazeMargin + mazeGridWidth * mazeHeight);

  //draw right and bottom of each cell
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].Cells.length; j++) {
      if (maze[i].Cells[j].RightWall) {
        context.moveTo(
          mazeMargin + (j + 1) * mazeGridWidth,
          mazeMargin + i * mazeGridWidth
        );
        context.lineTo(
          mazeMargin + (j + 1) * mazeGridWidth,
          mazeMargin + (i + 1) * mazeGridWidth
        );
      }
      if (maze[i].Cells[j].BottomWall) {
        context.moveTo(
          mazeMargin + j * mazeGridWidth,
          mazeMargin + (i + 1) * mazeGridWidth
        );
        context.lineTo(
          mazeMargin + (j + 1) * mazeGridWidth,
          mazeMargin + (i + 1) * mazeGridWidth
        );
      }
    }
  }
  context.stroke();
  context.closePath();
}

function drawPath(path) {
  context.beginPath();
  context.strokeStyle = "red";
  let pointPath = path.map((x) => points.find((y) => y.Id === x));
  for (let i = 0; i < pointPath.length - 1; i++) {
    context.moveTo(
      mazeMargin + mazeGridWidth / 2 + pointPath[i].X * mazeGridWidth,
      mazeMargin + mazeGridWidth / 2 + pointPath[i].Y * mazeGridWidth
    );
    context.lineTo(
      mazeMargin + mazeGridWidth / 2 + pointPath[i + 1].X * mazeGridWidth,
      mazeMargin + mazeGridWidth / 2 + pointPath[i + 1].Y * mazeGridWidth
    );
  }
  context.stroke();
  context.closePath();
}

/**
 * transfer to astar format
 */
function toPathMap(maze) {
  points = [];
  link = [];
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].Cells.length; j++) {
      let id = maze[i].Cells.length * i + j;
      points.push(new Point(id, j, i));
      if (!maze[i].Cells[j].RightWall) {
        link.push([id, id + 1]);
      }
      if (!maze[i].Cells[j].BottomWall) {
        link.push([id, id + maze[i].Cells.length]);
      }
    }
  }
}

function reDrawMaze() {
  //   context.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);
  context.putImageData(imageData, 0, 0);
  if (hintFlag) {
    setupPath(pathStart, pathEnd);
  }
  drawPlayer();
  updateStatus();
}

function updateStatus() {
  const current = Date.now();
  if (current - frameTime < playerFrame) {
    return;
  }

  frameTime = current;
  playerGraphicStatus += 1;
  if (playerGraphicStatus >= playerGraphicStatusList.length) {
    playerGraphicStatus = 0;
  }

  const [x, y] = currentPoint;
  if (pathEnd.X === x && pathEnd.Y === y) {
    gameStatus = GAME_COMPLETE;
    drawComplete();
  }
}

function drawComplete() {
  context.save();
  context.font = 100 / 8 + "vw Arial";
  context.textAlign = "center";
  context.translate(0, 0);
  context.rotate(-0.1);
  context.fillText(
    "Complete!!!",
    mazeCanvas.width / 2,
    mazeCanvas.height / 2,
    mazeCanvas.width - 300
  );
  context.restore();
}

function drawPlayer() {
  if (!currentPoint) {
    return;
  }

  const circle = new Path2D();
  const [x, y] = currentPoint;
  const sideLength =
    mazeGridWidth / 3 + playerGraphicStatusList[playerGraphicStatus];

  // change player graphic status

  const startX = x * mazeGridWidth + mazeMargin + mazeGridWidth / 2;
  const startY = y * mazeGridWidth + mazeMargin + mazeGridWidth / 2;

  //   circle.moveTo(x, y);
  circle.arc(startX, startY, sideLength, 0, 2 * Math.PI);
  context.fillStyle = "blue";
  context.fill(circle);
}

function moveLeft() {
  if (gameStatus === GAME_COMPLETE) {
    return false;
  }

  const [x, y] = currentPoint;

  if (!isLeftAvailable(x, y)) {
    return;
  }

  currentPoint = [x - 1, y];
  recordTime();
  reDrawMaze();
}

function moveUp() {
  if (gameStatus === GAME_COMPLETE) {
    return false;
  }

  const [x, y] = currentPoint;

  if (!isUpAvailable(x, y)) {
    return;
  }

  currentPoint = [x, y - 1];
  recordTime();
  reDrawMaze();
}

function moveDown() {
  if (gameStatus === GAME_COMPLETE) {
    return false;
  }

  const [x, y] = currentPoint;

  if (!isDownAvailable(x, y)) {
    return;
  }

  currentPoint = [x, y + 1];
  recordTime();
  reDrawMaze();
}

function moveRight() {
  if (gameStatus === GAME_COMPLETE) {
    return false;
  }
  const [x, y] = currentPoint;

  if (!isRightAvailable(x, y)) {
    return;
  }

  currentPoint = [x + 1, y];
  recordTime();
  reDrawMaze();
}

function recordTime() {
  if (gameStatus === GAME_READY) {
    startTime = Date.now();
    gameStatus = GAME_PLAYING;
  }
}

function isLeftAvailable(x, y) {
  try {
    return getPointInfo(x - 1, y).RightWall === false;
  } catch (e) {
    // ignore,
  }
  return false;
}

function isRightAvailable(x, y) {
  try {
    return getPointInfo(x, y).RightWall === false;
  } catch (e) {
    // ignore,
  }
  return false;
}

function isUpAvailable(x, y) {
  try {
    return getPointInfo(x, y - 1).BottomWall === false;
  } catch (e) {
    // ignore,
  }
  return false;
}

function isDownAvailable(x, y) {
  try {
    return getPointInfo(x, y).BottomWall === false;
  } catch (e) {
    // ignore,
  }
  return false;
}

function getPointInfo(x, y) {
  try {
    return maze[y].Cells[x];
  } catch (e) {
    // ignore
  }
  return null;
}

function showPointInfo() {
  const [x, y] = currentPoint;
  console.log("moveRight", x, y, maze[y].Cells[x]);
}
