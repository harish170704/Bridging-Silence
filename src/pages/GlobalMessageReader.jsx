// GlobalMessageReader.js
import React, { useEffect, useContext } from "react";
import { StompContext } from "./StompContext";

const GlobalMessageReader = () => {
  const { client } = useContext(StompContext);
  const username = localStorage.getItem("username");
  const isBlind = localStorage.getItem("isBlind") === "true";

  useEffect(() => {
    if (!client || !username || !isBlind) return;

    let subscription;

    const handleMessage = ({ body }) => {
      const msg = JSON.parse(body);
      if (msg.recipient === username) {
        // Announce incoming message globally for blind users
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `New message from ${msg.sender}: ${msg.content}`
        );
        window.speechSynthesis.speak(utterance);
      }
    };

    if (client.connected) {
      subscription = client.subscribe("/user/queue/messages", handleMessage, {
        id: "global-blind-reader",
      });
    } else {
      const onConnect = () => {
        subscription = client.subscribe("/user/queue/messages", handleMessage, {
          id: "global-blind-reader",
        });
      };
      client.onConnect = onConnect;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [client, username, isBlind]);

  return null; // No UI needed
};

export default GlobalMessageReader;
