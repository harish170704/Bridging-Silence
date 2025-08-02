import React, { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "../Styles/ChatPage.css";

Client.debug = (msg) => console.debug("STOMP ➡️", msg);

const ChatPage = () => {
  const isBlind = localStorage.getItem("isBlind") === "true";
  const username = localStorage.getItem("username");
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState("askRecipient");
  const [recipient, setRecipient] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const clientRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const messagesEndRef = useRef(null);

  const speak = (text, onEnd) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    if (onEnd) msg.onend = onEnd;
    window.speechSynthesis.speak(msg);
  };

  const checkUserExists = async (name) => {
    try {
      const res = await fetch(`http://localhost:9090/api/user/exists/${name}`);
      return (await res.text()) === "true";
    } catch (e) {
      console.error("Error checking user:", e);
      return false;
    }
  };

  const startListening = () => {
    if (listeningRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.continuous = false;
    recognitionRef.current = recog;
    listeningRef.current = true;
    recog.start();
    recog.onresult = (e) => {
      listeningRef.current = false;
      const spoken = e.results[0][0].transcript.toLowerCase().trim();
      handleVoiceInput(spoken);
    };
    recog.onend = () => (listeningRef.current = false);
    recog.onerror = () => {
      listeningRef.current = false;
      speak("I didn't catch that, please repeat.", startListening);
    };
  };

  const handleVoiceInput = async (text) => {
    if (step === "askRecipient") {
      setRecipient(text);
      setStep("confirmRecipient");
    } else if (step === "confirmRecipient") {
      if (text.includes("proceed")) {
        const exists = await checkUserExists(recipient);
        setStep(exists ? "askMessage" : "invalidRecipient");
      } else {
        setStep("askRecipient");
      }
    } else if (step === "askMessage") {
      setMessageContent(text);
      setStep("confirmMessage");
    } else if (step === "confirmMessage") {
      text.includes("proceed") ? sendMessage() : setStep("askMessage");
    } else if (step === "postSendOptions") {
      if (text.includes("send another")) {
        setRecipient("");
        setMessageContent("");
        setStep("askRecipient");
        speak("Whom do you want to send the message to?", startListening);
      } else if (text.includes("exit")) {
        window.location.href = "/home";
      } else {
        speak("Please say send another or exit.", startListening);
      }
    }
  };

  const sendMessage = () => {
    if (!username || !recipient.trim() || !messageContent.trim()) {
      return alert("Please fill all fields.");
    }
    const payload = {
      sender: username,
      recipient,
      content: messageContent,
      timestamp: new Date().toISOString(),
    };
    const client = clientRef.current;
    if (!client?.connected) {
      return alert("Connecting to chat server... please wait a moment.");
    }
    client.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(payload),
    });
    setMessages((prev) => [...prev, payload]);
    setMessageContent("");
    setStep("postSendOptions");
    if (isBlind)
      speak(
        "Message sent successfully. Say send another or exit.",
        startListening
      );
  };

  const connectWebSocket = () => {
    if (!username) {
      console.error("Username not found in localStorage");
      return;
    }

    if (clientRef.current?.active) {
      console.log("WebSocket already connected.");
      return;
    }

    const socket = new SockJS("http://localhost:9090/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      connectHeaders: { username },
      onConnect: () => {
        console.log("✅ WebSocket connected!");
        client.subscribe(
          "/user/queue/messages",
          ({ body }) => {
            const msg = JSON.parse(body);
            console.log("← MESSAGE:", msg);
            setMessages((prev) => [...prev, msg]);
            if (isBlind && msg.recipient === username) {
              speak(`New message from ${msg.sender}: ${msg.content}`);
            }
          },
          { id: "sub-messages", ack: "auto" }
        );
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame.headers["message"]);
      },
    });

    clientRef.current = client;
    client.activate();
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      recognitionRef.current?.stop?.();
      clientRef.current?.deactivate?.();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isBlind) return;
    const prompts = {
      askRecipient: () =>
        speak("Whom do you want to send the message to?", startListening),
      confirmRecipient: () =>
        speak(`You said ${recipient}. Say proceed or change.`, startListening),
      invalidRecipient: () =>
        speak("That user does not exist. Please say another username.", () =>
          setStep("askRecipient")
        ),
      askMessage: () => speak("What is your message?", startListening),
      confirmMessage: () =>
        speak(
          `You said ${messageContent}. Say proceed or change.`,
          startListening
        ),
    };
    prompts[step]?.();
  }, [step, isBlind, recipient, messageContent]);

  return (
    <div className="chat-container">
      <h2>Chat Page</h2>

      {!isBlind && (
        <div className="chat-form">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient"
          />
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Your message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}

      <div className="message-list">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message-item ${
              m.sender === username ? "sent" : "received"
            }`}
          >
            <strong>{m.sender}</strong>: {m.content}
            <div className="timestamp">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatPage;
