import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const isBlind = localStorage.getItem("isBlind") === "true";

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.onend = callback || null;
    window.speechSynthesis.speak(msg);
  };

  useEffect(() => {
    if (isBlind && localStorage.getItem("homeWelcomed") !== "true") {
      const nameToSpeak = username ? `Hello ${username}.` : "Hello.";
      const welcomeMessage = `${nameToSpeak} Welcome to Bridging Silence.`;

      localStorage.setItem("enableVoice", "false");

      const msg = new SpeechSynthesisUtterance(welcomeMessage);
      msg.onend = () => {
        setTimeout(() => {
          localStorage.setItem("enableVoice", "true");
          localStorage.setItem("homeWelcomed", "true");
        }, 300);
      };
      window.speechSynthesis.speak(msg);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="home-container">
      <header className="navbar">
        <div className="nav-logo">Bridging Silence</div>
        {!isBlind && (
          <nav className="nav-links">
            <Link to="/chat" className="nav-link">
              Chat
            </Link>
            <Link to="/settings" className="nav-link">
              Settings
            </Link>
            <span onClick={handleLogout} className="logout-link nav-link">
              Logout
            </span>
          </nav>
        )}
      </header>

      <main className="main-content">
        <h1>Welcome{username ? `, ${username}` : ""}</h1>
        <p className="description">
          You can chat, change settings, or logout using voice or buttons.
        </p>
      </main>

      <footer className="footer">
        © 2025 Bridging Silence. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
