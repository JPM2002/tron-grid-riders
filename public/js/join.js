const socket = io();
const username = prompt("Enter your name:") || "Anon";

socket.emit('join-game', { username });

function sendDirection(dir) {
  socket.emit('player-action', { type: 'direction', direction: dir });
}

function sendAction(action) {
  socket.emit('player-action', { type: 'action', action });
}
