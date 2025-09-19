// ChatPage.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { StompContext } from "./StompContext";
import "../Styles/ChatPage.css";

const ChatPage = () => {
  const { client } = useContext(StompContext);
  const isBlind = localStorage.getItem("isBlind") === "true";
  const username = localStorage.getItem("username");
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState("askRecipient");
  const [recipient, setRecipient] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const messagesEndRef = useRef(null);

  // Central prompt function for voice flow
  const promptForStep = () => {
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
      postSendOptions: () =>
        speak(
          "Message sent successfully. Say send another or exit.",
          startListening
        ),
    };
    prompts[step]?.();
  };

  const speak = (text, onEnd) => {
    window.speechSynthesis.cancel();
    const msg = new window.SpeechSynthesisUtterance(text);
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
    let gotResult = false;
    recog.start();

    recog.onresult = (e) => {
      gotResult = true;
      listeningRef.current = false;
      const spoken = e.results[0][0].transcript.toLowerCase().trim();
      handleVoiceInput(spoken);
    };
    recog.onerror = () => {
      listeningRef.current = false;
      setTimeout(() => {
        speak("I didn't catch that, please repeat.", promptForStep);
      }, 250);
    };
    recog.onend = () => {
      listeningRef.current = false;
      if (!gotResult) {
        setTimeout(() => {
          speak("I didn't catch that, please repeat.", promptForStep);
        }, 250);
      }
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
      if (text.includes("proceed")) {
        sendMessage();
      } else {
        setStep("askMessage");
      }
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
      alert("Please fill all fields.");
      return;
    }
    const payload = {
      sender: username,
      recipient,
      content: messageContent,
      timestamp: new Date().toISOString(),
    };
    if (!client?.connected) {
      alert("Connecting to chat server... please wait a moment.");
      return;
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

  // Subscribe to messages for chat display
  useEffect(() => {
    if (!client || !username) return;
    let subscription;
    const handleMessage = ({ body }) => {
      const msg = JSON.parse(body);
      setMessages((prev) => [...prev, msg]);
    };
    if (client.connected) {
      subscription = client.subscribe("/user/queue/messages", handleMessage, {
        id: "chat-display",
      });
    } else {
      client.onConnect = () => {
        subscription = client.subscribe("/user/queue/messages", handleMessage, {
          id: "chat-display",
        });
      };
    }
    return () => {
      subscription?.unsubscribe();
      recognitionRef.current?.stop?.();
    };
  }, [client, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isBlind) return;
    promptForStep();
  }, [step, isBlind, recipient, messageContent]);

  // UI for blind users when selecting recipient manually
  if (isBlind && step === "askRecipient") {
    return (
      <div className="chat-container">
        <div className="recipient-selection">
          <h2 className="recipient-title">Select Recipient</h2>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient username"
            className="recipient-input"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Messages</h1>
          <p className="sidebar-subtitle">Welcome, {username}</p>
        </div>
        <div className="contacts-section">
          {recipient && (
            <div className="contact-item active">
              <div className="contact-avatar">
                {recipient.charAt(0).toUpperCase()}
              </div>
              <div className="contact-info">
                <h3 className="contact-name">{recipient}</h3>
                <p className="contact-status">Online</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-info">
            {recipient ? (
              <>
                <div className="chat-header-avatar">
                  {recipient.charAt(0).toUpperCase()}
                </div>
                <div className="chat-header-details">
                  <h3>{recipient}</h3>
                  <p>Online</p>
                </div>
              </>
            ) : (
              <div className="chat-header-details">
                <h3>Select a contact to start chatting</h3>
                <p>Choose someone from your contacts</p>
              </div>
            )}
          </div>
          {isBlind && (
            <div className="voice-controls">
              <button
                className="voice-btn"
                title="Voice Input"
                onClick={startListening}
                aria-label="Start voice input"
              >
                🎤
              </button>
              <button
                className="voice-btn"
                title="Read Messages"
                onClick={() => {
                  messages.forEach((m) => {
                    if (m.recipient === username)
                      speak(`Message from ${m.sender}: ${m.content}`);
                  });
                }}
                aria-label="Read messages aloud"
              >
                🔊
              </button>
            </div>
          )}
        </div>

        <div className="messages-container">
          {messages.length > 0 ? (
            messages.map((m, i) => {
              const isOwn = m.sender === username;
              return (
                <div
                  key={i}
                  className={`message-item ${isOwn ? "sent" : "received"}`}
                >
                  <div
                    className={`message-bubble ${isOwn ? "sent" : "received"}`}
                  >
                    {/* Display sender for received messages */}
                    {!isOwn && <div className="message-sender">{m.sender}</div>}
                    <p className="message-content">{m.content}</p>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isOwn && <span className="message-status">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="message-date">
              <span>Start your conversation</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area for non-blind users */}
        {!isBlind && (
          <div className="chat-input-container">
            <div className="chat-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient username"
                  className="chat-input"
                  style={{ marginBottom: "8px" }}
                />
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message..."
                  className="chat-input"
                  rows={1}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                className="send-btn"
                disabled={!messageContent.trim() || !recipient.trim()}
                aria-label="Send message"
              >
                Send 📤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
