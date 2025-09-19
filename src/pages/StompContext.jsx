// StompContext.js
import React, { createContext, useRef, useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export const StompContext = createContext(null);

export const StompProvider = ({ children }) => {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!username) return;
    if (clientRef.current?.active) return;

    const socket = new SockJS("http://localhost:9090/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      connectHeaders: { username },
      onConnect: () => {
        console.log("✅ Global WebSocket connected!");
        setConnected(true);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame.headers["message"]);
        setConnected(false);
      },
      onDisconnect: () => {
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        setConnected(false);
      }
    };
  }, [username]);

  return (
    <StompContext.Provider value={{ client: clientRef.current, connected }}>
      {children}
    </StompContext.Provider>
  );
};
