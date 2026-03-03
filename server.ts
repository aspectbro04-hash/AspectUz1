import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './src/server/GameManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const gameManager = new GameManager(io);

  // Socket.io Logic
  io.on('connection', (socket) => {
    const playerId = socket.handshake.query.playerId as string;
    console.log('User connected:', socket.id, 'PlayerID:', playerId);

    if (!playerId) {
      console.log('No playerId provided, disconnecting');
      socket.disconnect();
      return;
    }

    // Attempt to rejoin any active game for this player
    // This is tricky because we don't know which room they were in easily without searching all games
    // But join_room event handles it if client sends room ID.
    // Client usually knows room ID from local state or URL? 
    // My GameContext doesn't persist roomId in localStorage, so client might lose it on refresh.
    // If client loses roomId, they can't rejoin.
    // But if they have roomId (e.g. from URL param if I implemented that, or just memory if not full refresh), they can rejoin.
    // For now, let's assume client handles re-joining via UI if they know the code.
    
    socket.on('create_room', ({ playerName }, callback) => {
      const roomId = gameManager.createRoom(playerName, socket.id, playerId);
      socket.join(roomId);
      callback({ roomId });
    });

    socket.on('join_room', ({ roomId, playerName }, callback) => {
      const game = gameManager.joinRoom(roomId, playerName, socket.id, playerId);
      if (game) {
        socket.join(roomId);
        callback({ success: true, game });
      } else {
        callback({ success: false, message: 'Room not found or full' });
      }
    });

    socket.on('start_game', ({ roomId }) => {
      gameManager.startGame(roomId, playerId);
    });

    socket.on('action', ({ roomId, targetId }) => {
      gameManager.handleAction(roomId, playerId, targetId);
    });

    socket.on('vote', ({ roomId, targetId }) => {
      // Reuse handleAction for voting logic as it's similar
      gameManager.handleAction(roomId, playerId, targetId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      gameManager.leaveRoom(socket.id);
    });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
