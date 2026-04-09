import { createContext, useContext, useEffect, useState } from 'react';
import socket, { connectSocket, disconnectSocket } from '../socket/socket.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // ── Auto-connect when authenticated, disconnect on logout ──
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  // ── Global socket event listeners ──────────────────────────
  useEffect(() => {
    const onConnect = () => {
      console.log(`[Socket] Connected: ${socket.id}`);
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.error(`[Socket] Connection error: ${err.message}`);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  // ── Room helpers ───────────────────────────────────────────
  const connect = (tkn) => connectSocket(tkn);
  const disconnect = () => disconnectSocket();

  const joinAuction = (auctionId, userId) => {
    if (socket.connected) {
      socket.emit('joinAuction', { auctionId, userId });
    }
  };

  const leaveAuction = (auctionId) => {
    if (socket.connected) {
      socket.emit('leaveAuction', { auctionId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
        joinAuction,
        leaveAuction,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
