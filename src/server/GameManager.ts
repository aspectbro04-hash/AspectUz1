import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { GameState, Player, Role, Phase } from '../types';

const ROLES: Role[] = ['MAFIA', 'DOCTOR', 'SHERIFF', 'CIVILIAN'];

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export class GameManager {
  private io: Server;
  private games: Map<string, GameState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  createRoom(hostName: string, socketId: string, sessionId: string, avatar: string): string {
    const roomId = nanoid(6).toUpperCase();
    const host: Player = {
      id: sessionId,
      name: hostName,
      avatar,
      isAlive: true,
      isReady: false,
      socketId,
    };

    const gameState: GameState = {
      roomId,
      phase: 'LOBBY',
      players: [host],
      hostId: sessionId,
      round: 0,
      timer: 0,
      logs: [`Room created by ${hostName}`],
    };

    this.games.set(roomId, gameState);
    this.broadcastState(roomId);
    return roomId;
  }

  joinRoom(roomId: string, playerName: string, socketId: string, sessionId: string, avatar: string): GameState | null {
    const game = this.games.get(roomId);
    if (!game) return null;

    // Check for reconnect
    const existingPlayer = game.players.find(p => p.id === sessionId);
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      // If reconnecting, update name if provided? Or keep old?
      if (playerName) existingPlayer.name = playerName;
      if (avatar) existingPlayer.avatar = avatar;
      
      this.broadcastState(roomId);
      return game;
    }

    if (game.phase !== 'LOBBY') return null; // Can't join in progress for now
    if (game.players.some(p => p.name === playerName)) return null; // Unique names

    const player: Player = {
      id: sessionId,
      name: playerName,
      avatar,
      isAlive: true,
      isReady: false,
      socketId,
    };

    game.players.push(player);
    game.logs.push(`${playerName} joined the lobby`);
    this.broadcastState(roomId);
    return game;
  }

  leaveRoom(socketId: string) {
    for (const [roomId, game] of this.games.entries()) {
      const playerIndex = game.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        const player = game.players[playerIndex];
        
        // If game is in progress, don't remove player completely to allow reconnect
        if (game.phase === 'LOBBY') {
            game.players.splice(playerIndex, 1);
            game.logs.push(`${player.name} left the game`);
            
            if (game.players.length === 0) {
              this.games.delete(roomId);
              this.clearTimer(roomId);
            } else {
              if (game.hostId === player.id) {
                game.hostId = game.players[0].id; // Assign new host
                game.logs.push(`${game.players[0].name} is now the host`);
              }
              this.broadcastState(roomId);
            }
        } else {
            // Game in progress. Just log disconnect?
            game.logs.push(`${player.name} disconnected`);
            this.broadcastState(roomId);
        }
        return;
      }
    }
  }

  startGame(roomId: string, socketId: string) {
    const game = this.games.get(roomId);
    if (!game) return;
    
    // Check if requester is host (by socketId mapped to sessionId)
    const player = game.players.find(p => p.socketId === socketId);
    if (!player || player.id !== game.hostId) return;

    if (game.players.length < 4) return; // Minimum players check

    // Assign Roles
    const playerCount = game.players.length;
    let roles: Role[] = [];
    
    // Setup roles based on player count
    const mafiaCount = Math.max(1, Math.floor(playerCount / 4));
    const doctorCount = 1;
    const sheriffCount = 1;
    const civilianCount = playerCount - mafiaCount - doctorCount - sheriffCount;

    for (let i = 0; i < mafiaCount; i++) roles.push('MAFIA');
    for (let i = 0; i < doctorCount; i++) roles.push('DOCTOR');
    for (let i = 0; i < sheriffCount; i++) roles.push('SHERIFF');
    for (let i = 0; i < civilianCount; i++) roles.push('CIVILIAN');

    roles = shuffle(roles);

    game.players.forEach((player, index) => {
      player.role = roles[index];
      player.isAlive = true;
      player.actionTarget = null;
      player.vote = null;
    });

    game.phase = 'NIGHT';
    game.round = 1;
    game.logs.push('The game has started! Night falls...');
    
    this.startTimer(roomId, 30); // 30 seconds for night actions
    this.broadcastState(roomId);
  }

  handleAction(roomId: string, socketId: string, targetId: string) {
    const game = this.games.get(roomId);
    if (!game) return;
    
    const player = game.players.find(p => p.socketId === socketId);
    if (!player || !player.isAlive) return;

    if (game.phase === 'NIGHT') {
      // Night Actions
      if (player.role === 'MAFIA' || player.role === 'DOCTOR' || player.role === 'SHERIFF') {
        player.actionTarget = targetId;
        this.checkNightActions(roomId);
      }
    } else if (game.phase === 'VOTING') {
      // Voting
      player.vote = targetId;
      this.broadcastState(roomId);
      this.checkVotes(roomId);
    }
  }

  private checkNightActions(roomId: string) {
    const game = this.games.get(roomId);
    if (!game) return;

    const activeRoles = game.players.filter(p => 
      p.isAlive && (p.role === 'MAFIA' || p.role === 'DOCTOR' || p.role === 'SHERIFF')
    );

    const allActed = activeRoles.every(p => p.actionTarget !== null);
    
    if (allActed) {
       this.resolveNight(roomId);
    }
  }

  private resolveNight(roomId: string) {
    this.clearTimer(roomId);
    const game = this.games.get(roomId);
    if (!game) return;

    // Process actions
    const mafia = game.players.filter(p => p.role === 'MAFIA' && p.isAlive);
    
    let killTargetId: string | null = null;
    const actingMafia = mafia.find(p => p.actionTarget);
    if (actingMafia) killTargetId = actingMafia.actionTarget!;

    const doctor = game.players.find(p => p.role === 'DOCTOR' && p.isAlive);
    const saveTargetId = doctor?.actionTarget;

    const sheriff = game.players.find(p => p.role === 'SHERIFF' && p.isAlive);
    if (sheriff && sheriff.actionTarget) {
      const target = game.players.find(p => p.id === sheriff.actionTarget);
      if (target) {
        // Send result to Sheriff only
        const isMafia = target.role === 'MAFIA';
        this.io.to(sheriff.socketId).emit('sheriff_result', {
          targetName: target.name,
          isMafia
        });
      }
    }

    // Resolve Kill
    let eliminatedPlayer = null;
    if (killTargetId && killTargetId !== saveTargetId) {
      const target = game.players.find(p => p.id === killTargetId);
      if (target) {
        target.isAlive = false;
        eliminatedPlayer = target;
        game.logs.push(`${target.name} was eliminated during the night.`);
        game.lastEliminated = { name: target.name, role: target.role! };
      }
    } else {
      game.logs.push('No one was eliminated last night.');
      game.lastEliminated = null;
    }

    // Reset actions
    game.players.forEach(p => p.actionTarget = null);

    // Check Win Condition
    if (this.checkWinCondition(roomId)) return;

    // Move to Day
    game.phase = 'DAY';
    this.startTimer(roomId, 45); // 45 seconds discussion
    this.broadcastState(roomId);
  }

  private checkVotes(roomId: string) {
    const game = this.games.get(roomId);
    if (!game) return;

    const alivePlayers = game.players.filter(p => p.isAlive);
    const votesCast = alivePlayers.filter(p => p.vote !== null).length;

    if (votesCast === alivePlayers.length) {
      this.resolveVoting(roomId);
    }
  }

  private resolveVoting(roomId: string) {
    this.clearTimer(roomId);
    const game = this.games.get(roomId);
    if (!game) return;

    // Count votes
    const votes: Record<string, number> = {};
    game.players.filter(p => p.isAlive).forEach(p => {
      if (p.vote) {
        votes[p.vote] = (votes[p.vote] || 0) + 1;
      }
    });

    // Find max
    let maxVotes = 0;
    let candidateId: string | null = null;
    let tie = false;

    for (const [targetId, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidateId = targetId;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }
    
    if (candidateId && !tie) {
      const target = game.players.find(p => p.id === candidateId);
      if (target) {
        target.isAlive = false;
        game.logs.push(`${target.name} was voted out by the town.`);
        game.lastEliminated = { name: target.name, role: target.role! };
      }
    } else {
      game.logs.push('The town could not agree on a vote. No one was eliminated.');
      game.lastEliminated = null;
    }

    // Reset votes
    game.players.forEach(p => p.vote = null);

    // Check Win Condition
    if (this.checkWinCondition(roomId)) return;

    // Move to Night
    game.phase = 'NIGHT';
    game.round++;
    this.startTimer(roomId, 30);
    this.broadcastState(roomId);
  }

  private checkWinCondition(roomId: string): boolean {
    const game = this.games.get(roomId);
    if (!game) return false;

    const mafiaAlive = game.players.filter(p => p.role === 'MAFIA' && p.isAlive).length;
    const townAlive = game.players.filter(p => p.role !== 'MAFIA' && p.isAlive).length;

    if (mafiaAlive === 0) {
      game.winner = 'TOWN';
      game.phase = 'GAME_OVER';
      game.logs.push('Town wins! All Mafia have been eliminated.');
      this.broadcastState(roomId);
      this.clearTimer(roomId);
      return true;
    }

    if (mafiaAlive >= townAlive) {
      game.winner = 'MAFIA';
      game.phase = 'GAME_OVER';
      game.logs.push('Mafia wins! They have overtaken the town.');
      this.broadcastState(roomId);
      this.clearTimer(roomId);
      return true;
    }

    return false;
  }

  private startTimer(roomId: string, seconds: number) {
    this.clearTimer(roomId);
    const game = this.games.get(roomId);
    if (!game) return;

    game.timer = seconds;
    
    const interval = setInterval(() => {
      if (!game) {
        clearInterval(interval);
        return;
      }
      
      game.timer--;
      
      this.io.to(roomId).emit('timer_update', game.timer);

      if (game.timer <= 0) {
        this.clearTimer(roomId);
        this.handlePhaseEnd(roomId);
      }
    }, 1000);

    this.timers.set(roomId, interval);
  }

  private clearTimer(roomId: string) {
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!);
      this.timers.delete(roomId);
    }
  }

  private handlePhaseEnd(roomId: string) {
    const game = this.games.get(roomId);
    if (!game) return;

    if (game.phase === 'NIGHT') {
      this.resolveNight(roomId);
    } else if (game.phase === 'DAY') {
      game.phase = 'VOTING';
      game.logs.push('Discussion time is over. Time to vote!');
      this.startTimer(roomId, 30); // 30s to vote
      this.broadcastState(roomId);
    } else if (game.phase === 'VOTING') {
      this.resolveVoting(roomId);
    }
  }

  private broadcastState(roomId: string) {
    const game = this.games.get(roomId);
    if (!game) return;

    game.players.forEach(player => {
      // Only send state if player is connected (has socketId)
      if (player.socketId) {
        const clientState = this.sanitizeState(game, player.socketId);
        this.io.to(player.socketId).emit('game_state', clientState);
      }
    });
  }

  private sanitizeState(game: GameState, socketId: string): any {
    const player = game.players.find(p => p.socketId === socketId);
    if (!player) return game;

    const sanitizedPlayers = game.players.map(p => {
      let role = undefined;
      if (game.phase === 'GAME_OVER') role = p.role;
      else if (p.socketId === socketId) role = p.role;
      else if (player.role === 'MAFIA' && p.role === 'MAFIA') role = p.role;
      else if (!p.isAlive) role = p.role;

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isAlive: p.isAlive,
        isReady: p.isReady,
        role,
        vote: game.phase === 'VOTING' || game.phase === 'GAME_OVER' ? p.vote : undefined,
      };
    });

    return {
      roomId: game.roomId,
      phase: game.phase,
      players: sanitizedPlayers,
      hostId: game.hostId,
      round: game.round,
      winner: game.winner,
      timer: game.timer,
      logs: game.logs,
      lastEliminated: game.lastEliminated,
      myPlayer: game.players.find(p => p.socketId === socketId)
    };
  }
}
