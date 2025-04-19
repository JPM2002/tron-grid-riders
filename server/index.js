const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Explicit routes for host and join pages
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'host.html'));
});

app.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'join.html'));
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log(`[+] New connection: ${socket.id}`);

  socket.on('join-game', ({ username }) => {
    console.log(`--> ${username} joined the game`);
    socket.broadcast.emit('player-joined', { id: socket.id, username });
  });

  socket.on('player-action', (data) => {
    socket.broadcast.emit('player-action', { id: socket.id, ...data });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    io.emit('player-left', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
