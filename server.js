const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const WebSocket = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const PORT = process.env.PORT || 3000

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Create WebSocket server with noServer to manually handle upgrades
  const wss = new WebSocket.Server({ noServer: true })

  // Store rooms and their connections
  const rooms = new Map()

  // Handle WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      handleConnection(ws, request)
    })
  })

  function handleConnection(ws, request) {
    ws.isAlive = true
    ws.on('pong', () => {
      ws.isAlive = true
    })

    let currentRoom = null
    let username = null

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)

        if (message.type === 'join') {
          currentRoom = message.roomId
          username = message.username

          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Set())
          }
          rooms.get(currentRoom).add(ws)

          // Notify others in room
          broadcastToRoom(currentRoom, {
            type: 'user-joined',
            username: username,
            message: `${username} joined the room`,
          }, ws)

          // Send current room members count
          ws.send(
            JSON.stringify({
              type: 'room-info',
              roomId: currentRoom,
              memberCount: rooms.get(currentRoom).size,
            })
          )
        }

        if (message.type === 'chat') {
          if (currentRoom) {
            broadcastToRoom(currentRoom, {
              type: 'chat',
              username: username,
              text: message.text,
              timestamp: new Date().toLocaleTimeString(),
            })
          }
        }
      } catch (error) {
        console.error('Error processing message:', error)
      }
    })

    ws.on('close', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(ws)

        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom)
        } else {
          broadcastToRoom(currentRoom, {
            type: 'user-left',
            username: username,
            message: `${username} left the room`,
          })
        }
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  function broadcastToRoom(roomId, message, excludeWs = null) {
    if (rooms.has(roomId)) {
      rooms.get(roomId).forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
          client.send(JSON.stringify(message))
        }
      })
    }
  }

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate()
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    clearInterval(heartbeat)
  })
})
