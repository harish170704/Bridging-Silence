import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaComment, FaSignOutAlt } from "react-icons/fa";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const isBlind = localStorage.getItem("isBlind") === "true";
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const initRecognition = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = handleVoiceCommand;
    recognition.onerror = () => {
      recognition.stop();
      recognition.start();
    };
    recognitionRef.current = recognition;
    return recognition;
  };

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.onend = callback || null;
    window.speechSynthesis.speak(msg);
  };

  const startListening = () => {
    if (!isBlind) return;
    const rec = recognitionRef.current || initRecognition();
    if (!rec) return;
    rec.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleVoiceCommand = (event) => {
    const command = event.results[event.results.length - 1][0].transcript
      .trim()
      .toLowerCase();
    if (command.includes("send a message") || command.includes("chat")) {
      navigate("/chat");
    } else if (command.includes("logout") || command.includes("sign out")) {
      handleLogout();
    } else {
      speak("Sorry, please say Send a message or Logout.");
    }
  };

  const handleLogout = () => {
    stopListening();
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    if (isBlind) {
      if (localStorage.getItem("homeWelcomed") !== "true") {
        const nameToSpeak = username ? `Hello ${username}.` : "Hello.";
        const welcomeMessage = `${nameToSpeak} Welcome to Bridging Silence.`;
        const msg = new SpeechSynthesisUtterance(welcomeMessage);
        msg.onend = () => {
          localStorage.setItem("homeWelcomed", "true");
          setTimeout(
            () => speak("Say Send a message or Logout.", startListening),
            300
          );
        };
        window.speechSynthesis.speak(msg);
      } else {
        speak("Say Send a message or Logout.", startListening);
      }
    }
    return () => stopListening();
  }, [isBlind, username]);

  const actionCards = [
    {
      id: 1,
      title: "Chat",
      description: "Start or continue a conversation",
      icon: <FaComment className="card-icon" />,
      action: () => navigate("/chat"),
    },
    {
      id: 2,
      title: "Logout",
      description: "Sign out of your account",
      icon: <FaSignOutAlt className="card-icon" />,
      action: handleLogout,
    },
  ];

  return (
    <div className={`home-container ${isListening ? "listening" : ""}`}>
      <header className="navbar">
        <div className="nav-logo">Bridging Silence</div>
        {!isBlind && (
          <nav className="nav-links">
            <Link to="/chat" className="nav-link">
              <FaComment style={{ marginRight: "6px" }} />
              Chat
            </Link>
            <button
              onClick={handleLogout}
              className="nav-link logout-button"
              style={{ marginLeft: "auto" }}
            >
              <FaSignOutAlt style={{ marginRight: "6px" }} />
              Logout
            </button>
          </nav>
        )}
      </header>

      <main className="main-content">
        <h1>Welcome{username ? `, ${username}` : ""}</h1>
        <p className="description">
          {isBlind
            ? "You can say 'Send a message' to start chatting or 'Logout' to sign out."
            : "Choose an option below or use voice commands to navigate."}
        </p>

        <div className="cards-container">
          {isBlind
            ? actionCards.map((card) => (
                <div
                  key={card.id}
                  className="card"
                  onClick={card.action}
                  onKeyDown={(e) => e.key === "Enter" && card.action()}
                  role="button"
                  tabIndex={0}
                  aria-label={`${card.title}. ${card.description}`}
                >
                  {card.icon}
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </div>
              ))
            : [
                {
                  id: 1,
                  title: "Chat",
                  description: "Start or continue a conversation",
                  icon: <FaComment className="card-icon" />,
                  action: () => navigate("/chat"),
                },
                {
                  id: 2,
                  title: "Logout",
                  description: "Sign out of your account",
                  icon: <FaSignOutAlt className="card-icon" />,
                  action: handleLogout,
                },
              ].map((card) => (
                <div
                  key={card.id}
                  className="card"
                  onClick={card.action}
                  onKeyDown={(e) => e.key === "Enter" && card.action()}
                  role="button"
                  tabIndex={0}
                  aria-label={`${card.title}. ${card.description}`}
                >
                  {card.icon}
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </div>
              ))}
        </div>
      </main>

      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Bridging Silence. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
