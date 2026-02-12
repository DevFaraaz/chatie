const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const PORT = process.env.PORT || 3000

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // Store rooms and their connections
  const rooms = new Map()

  io.on('connection', (socket) => {
    let currentRoom = null
    let username = null

    socket.on('join', (data) => {
      currentRoom = data.roomId
      username = data.username

      if (!rooms.has(currentRoom)) {
        rooms.set(currentRoom, new Set())
      }
      rooms.get(currentRoom).add(socket.id)

      socket.join(currentRoom)

      // Notify others in room
      io.to(currentRoom).emit('user-joined', {
        type: 'user-joined',
        username: username,
        message: `${username} joined the room`,
      })

      // Send room info to the user
      socket.emit('room-info', {
        type: 'room-info',
        roomId: currentRoom,
        memberCount: rooms.get(currentRoom).size,
      })
    })

    socket.on('chat', (data) => {
      if (currentRoom) {
        io.to(currentRoom).emit('chat', {
          type: 'chat',
          username: username,
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
        })
      }
    })

    socket.on('disconnect', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket.id)

        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom)
        } else {
          io.to(currentRoom).emit('user-left', {
            type: 'user-left',
            username: username,
            message: `${username} left the room`,
          })
        }
      }
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
