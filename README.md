# Chatie - Chat App

A modern, real-time chat application built with Next.js and shadcn/ui components. Two people can chat by exchanging room IDs with zero authentication or database.

## Tech Stack

- **Frontend**: Next.js 14 + React 18
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Node.js + Express + WebSocket
- **Real-time**: WebSocket Protocol

## Features

- ✨ Create or join chat rooms by ID
- 🚀 Real-time messaging with WebSockets
- 📱 Fully responsive mobile design
- 🎨 Modern gradient UI with shadcn/ui
- 👥 Live member count
- 📋 Copy room ID to clipboard
- 🔔 Toast notifications
- ⚡ Zero database/authentication

## Quick Start

### Installation

```bash
npm install
```

### Development

Run both Next.js dev server and WebSocket server in separate terminals:

```bash
# Terminal 1 - Next.js frontend (port 3000)
npm run dev

# Terminal 2 - WebSocket server (port 3001)
node server.js
```

Open [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm run start  # Next.js
node server.js  # WebSocket server
```

## How to Use

1. **Enter your name** on the join screen
2. **Create a room** - Leave Room ID blank to generate a new one
3. **Or join existing room** - Paste a room ID from someone else
4. **Start chatting** - Messages appear in real-time
5. **Share room ID** - Click the room ID in header to copy and share

## Architecture

```
Client Browser (Next.js)
       ↓
   WebSocket
       ↓
Node.js Server (Express + WS)
       ↓
   WebSocket
       ↓
Other Client Browser
```

Room-based messaging: Messages broadcast only to clients in the same room.

## Environment Variables

Optional:
- `PORT` - WebSocket server port (default: 3001)

## Notes

- All data is in-memory (ephemeral)
- Rooms are deleted when the last user leaves
- No persistence between server restarts
- Perfect for temporary peer-to-peer communication
