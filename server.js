const WebSocket = require('ws')
const http = require('http')

const PORT = process.env.PORT || 3001

const server = http.createServer()
const wss = new WebSocket.Server({ server })

// Store rooms and their connections
const rooms = new Map()

wss.on('connection', (ws) => {
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
})

function broadcastToRoom(roomId, message, excludeWs = null) {
  if (rooms.has(roomId)) {
    rooms.get(roomId).forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
        client.send(JSON.stringify(message))
      }
    })
  }
}

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})
