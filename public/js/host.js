const socket = io();
const players = {};

// Handle new player joining
socket.on('player-joined', ({ id, username }) => {
  players[id] = {
    username,
    x: Math.random() * 600 + 50,  // Random spawn
    y: Math.random() * 400 + 50,
    dir: 'right',
    color: getRandomColor(),
  };
  console.log(`${username} joined the grid.`);
});

// Handle direction/action input from player
socket.on('player-action', ({ id, type, direction, action }) => {
  const player = players[id];
  if (!player) return;

  if (type === 'direction') {
    player.dir = direction;
  } else if (type === 'action') {
    if (action === 'boost') {
      player.boosting = true;
      setTimeout(() => player.boosting = false, 1000); // 1 second boost
    } else if (action === 'brake') {
      player.braking = true;
      setTimeout(() => player.braking = false, 1000); // 1 second brake
    }
  }
});

// Handle player disconnecting
socket.on('player-left', (id) => {
  delete players[id];
});

// Get a nice glowing color
function getRandomColor() {
  const colors = ['cyan', 'lime', 'magenta', 'yellow', 'orange', 'white'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Move player based on direction and boost/brake
function movePlayer(player) {
  let speed = 2;
  if (player.boosting) speed = 4;
  if (player.braking) speed = 1;

  switch (player.dir) {
    case 'up':
      player.y -= speed;
      break;
    case 'down':
      player.y += speed;
      break;
    case 'left':
      player.x -= speed;
      break;
    case 'right':
      player.x += speed;
      break;
  }
}

// Get canvas context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Render loop
function gameLoop() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    const player = players[id];
    movePlayer(player);

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, 10, 10);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
