import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { WebSocketEventMessage } from '@/types'

interface WebSocketContextType {
  isConnected: boolean
  lastEvent: WebSocketEventMessage | null
  eventHistory: WebSocketEventMessage[]
  reconnect: () => void
  sendPing: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastEvent: null,
  eventHistory: [],
  reconnect: () => {},
  sendPing: () => {},
})

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebSocketEventMessage | null>(null)
  const [eventHistory, setEventHistory] = useState<WebSocketEventMessage[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<any>(null)
  const retryCountRef = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return
    }

    const host = window.location.hostname || 'localhost'
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Connect to port 8000 or proxy
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}:8000/ws/security-events`

    try {
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        retryCountRef.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const data: WebSocketEventMessage = JSON.parse(event.data)
          if (data.type === 'PONG') {
            return
          }
          if (data.type === 'SECURITY_EVENT') {
            setLastEvent(data)
            setEventHistory((prev) => [data, ...prev.slice(0, 49)])
          }
        } catch {
          // ignore non-json messages
        }
      }

      socket.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
        // Exponential backoff reconnect: 1s, 2s, 4s up to 15s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000)
        retryCountRef.current += 1
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }

      socket.onerror = () => {
        socket.close()
      }
    } catch {
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    connect()
    // Heartbeat ping interval every 25 seconds
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 25000)

    return () => {
      clearInterval(interval)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('ping')
    }
  }

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        lastEvent,
        eventHistory,
        reconnect: connect,
        sendPing,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)
