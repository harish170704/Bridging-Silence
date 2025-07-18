import React, { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import "../Styles/ChatPage.css";

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
    } catch {
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
    recog.onend = () => {
      listeningRef.current = false;
    };
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
        if (exists) setStep("askMessage");
        else setStep("invalidRecipient");
      } else {
        setStep("askRecipient");
      }
    } else if (step === "askMessage") {
      setMessageContent(text);
      setStep("confirmMessage");
    } else if (step === "confirmMessage") {
      if (text.includes("proceed")) {
        sendMessage();
      } else {
        setStep("askMessage");
      }
    } else if (step === "postSendOptions") {
      if (text.includes("send another")) {
        setStep("askRecipient");
        localStorage.setItem("pauseGlobalVoice", "true");
        speak("Whom do you want to send the message to?", startListening);
      } else if (text.includes("exit")) {
        localStorage.setItem("pauseGlobalVoice", "false");
        speak("Exiting chat page. Redirecting to home.", () => {
          window.location.href = "/home";
        });
      } else {
        speak("Please say send another or exit the chat page.", startListening);
      }
    }
  };

  const sendMessage = () => {
    const sender = localStorage.getItem("username");
    if (!sender || !recipient || !messageContent) {
      alert("Please fill all fields.");
      return;
    }

    const msgPayload = {
      sender,
      receiver: recipient,
      message: messageContent,
    };

    if (!clientRef.current || !clientRef.current.connected) {
      alert("Connecting to chat server... please wait a moment.");
      return;
    }

    clientRef.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(msgPayload),
    });

    setMessages((m) => [...m, { sender, message: messageContent }]);
    setRecipient("");
    setMessageContent("");
    setStep("postSendOptions");

    if (isBlind) {
      speak("Message sent successfully.", () => {
        speak(
          "Do you want to send another message or exit the chat page?",
          startListening
        );
      });
    }
  };

  const connectWebSocket = () => {
    const client = new Client({
      brokerURL: "ws://localhost:9090/ws",
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Connected to WebSocket");
        client.subscribe(`/user/${username}/queue/messages`, (msg) => {
          const b = JSON.parse(msg.body);
          setMessages((m) => [...m, { sender: b.sender, message: b.message }]);
          if (isBlind) speak(`New message from ${b.sender}: ${b.message}`);
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;
  };

  useEffect(() => {
    if (!isBlind) return;
    switch (step) {
      case "askRecipient":
        localStorage.setItem("pauseGlobalVoice", "true");
        speak("Whom do you want to send the message to?", startListening);
        break;
      case "confirmRecipient":
        speak(`You said ${recipient}. Say proceed or change.`, startListening);
        break;
      case "invalidRecipient":
        speak("That user does not exist. Please say another username.", () =>
          setStep("askRecipient")
        );
        break;
      case "askMessage":
        speak("What is your message?", startListening);
        break;
      case "confirmMessage":
        speak(
          `You said ${messageContent}. Say proceed or change.`,
          startListening
        );
        break;
      default:
        break;
    }
  }, [step]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      recognitionRef.current?.stop();
      clientRef.current?.deactivate();
    };
  }, []);

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
          <div key={i} className="message-item">
            <strong>{m.sender}:</strong> {m.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;
