'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Copy, Users, LogOut, Zap } from 'lucide-react'

interface Message {
  type: 'chat' | 'system'
  username?: string
  text?: string
  message?: string
  timestamp?: string
}

export function Chat() {
  const [screen, setScreen] = useState<'join' | 'chat'>('join')
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [currentRoom, setCurrentRoom] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [toast, setToast] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 2000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  const joinRoom = () => {
    if (!username.trim()) {
      showToast('Please enter your name')
      return
    }

    const room = roomId.trim() || generateRoomId()
    setCurrentRoom(room)
    setCurrentUsername(username)
    setMessages([])

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const isDev = process.env.NODE_ENV === 'development'
    const wsUrl = isDev 
      ? `${protocol}//localhost:3001`
      : `${protocol}//${window.location.host}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          roomId: room,
          username: username,
        })
      )
      setScreen('chat')
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'chat') {
        setMessages((prev) => [...prev, message])
      } else if (message.type === 'user-joined' || message.type === 'user-left') {
        setMessages((prev) => [...prev, { type: 'system', message: message.message }])
      } else if (message.type === 'room-info') {
        setMemberCount(message.memberCount)
      }
    }

    ws.onerror = () => {
      showToast('Connection error. Please try again.')
    }

    ws.onclose = () => {
      showToast('Disconnected from server')
      setScreen('join')
    }

    wsRef.current = ws
  }

  const sendMessage = () => {
    const text = messageInput.trim()
    if (!text) return

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showToast('Not connected. Please rejoin.')
      return
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'chat',
        text: text,
      })
    )

    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoom).then(() => {
      showToast('Room ID copied!')
    })
  }

  const leaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setScreen('join')
    setUsername('')
    setRoomId('')
  }

  if (screen === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-700">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg border-b-0">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6" />
              <CardTitle className="text-3xl">Chatie</CardTitle>
            </div>
            <CardDescription className="text-purple-100 mt-2">
              Real-time chat rooms, instantly shared
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  autoFocus
                  className="bg-slate-50 border-slate-300 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Room ID</label>
                <Input
                  placeholder="Paste room ID or leave blank"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  className="bg-slate-50 border-slate-300 focus:border-purple-500"
                />
                <p className="text-xs text-slate-500 mt-2">Leave blank to create a new room</p>
              </div>
              <Button onClick={joinRoom} className="w-full" size="lg">
                Enter Chat
              </Button>
            </div>
          </CardContent>
        </Card>
        {toast && (
          <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg border border-slate-700">
            {toast}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-4 shadow-lg flex-shrink-0 border-b border-purple-500/20">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{currentUsername}</h2>
            <div
              className="flex items-center gap-2 mt-2 bg-white/10 rounded-lg px-3 py-1.5 w-fit cursor-pointer hover:bg-white/20 transition"
              onClick={copyRoomId}
            >
              <Copy size={14} />
              <span className="text-sm font-mono">{currentRoom}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1.5">
              <Users size={16} />
              <span className="text-sm font-medium">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <Button
              onClick={leaveRoom}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <LogOut size={16} />
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-12 h-12 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.type === 'system') {
              return (
                <div key={idx} className="flex justify-center">
                  <div className="bg-slate-800 text-slate-400 px-4 py-1.5 rounded-full text-xs font-medium border border-slate-700">
                    {msg.message}
                  </div>
                </div>
              )
            }

            const isOwn = msg.username === currentUsername
            return (
              <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-lg px-4 py-2.5 ${
                    isOwn
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                      : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold opacity-85">{msg.username}</p>
                  <p className="mt-1 text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${isOwn ? 'text-purple-100' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
          />
          <Button 
            onClick={sendMessage} 
            size="icon" 
            className="w-10 h-10 flex-shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm shadow-lg border border-slate-700">
          {toast}
        </div>
      )}
    </div>
  )
}
