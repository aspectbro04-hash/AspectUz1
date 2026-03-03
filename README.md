# Mafia Online

A real-time multiplayer social deduction game.

## Features

- **Real-time Gameplay**: Powered by Socket.io for instant updates.
- **Roles**: Mafia, Doctor, Sheriff, Civilian.
- **Phases**: Day/Night cycle with voting and actions.
- **Responsive UI**: Works on mobile and desktop.
- **Reconnect Support**: Players can refresh the page and rejoin the game.

## How to Play

1. **Create a Room**: Enter your name and create a new game room.
2. **Invite Friends**: Share the room code with up to 11 other players.
3. **Start Game**: The host starts the game once at least 4 players join.
4. **Night Phase**:
   - **Mafia**: Choose a victim to eliminate.
   - **Doctor**: Choose a player to save.
   - **Sheriff**: Investigate a player to reveal their role.
5. **Day Phase**: Discuss who the Mafia might be.
6. **Voting Phase**: Vote to eliminate a suspect. Majority rules.
7. **Win Conditions**:
   - **Town Wins**: Eliminate all Mafia members.
   - **Mafia Wins**: Outnumber the Town.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.io
- **Language**: TypeScript

## Development

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`
4. Start production server: `npm start`
