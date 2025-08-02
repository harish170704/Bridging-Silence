import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Client } from "@stomp/stompjs";

const VoiceManager = ({ logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBlind = localStorage.getItem("isBlind") === "true";
  const username = localStorage.getItem("username");
  const recognitionRef = useRef(null);
  const stompClientRef = useRef(null);
  const active = useRef(false);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
  };

  const connectWebSocket = () => {
    if (!username) return;

    const client = new Client({
      brokerURL: "ws://localhost:9090/ws", // ✅ Update your backend port
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ WebSocket connected");
        client.subscribe(`/user/${username}/queue/messages`, (message) => {
          const body = JSON.parse(message.body);
          console.log("📬 Message received:", body);
          speak(`New message from ${body.sender}: ${body.content}`);
        });
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  const setupRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      console.log("🎤 Heard:", transcript);

      if (transcript.includes("send a message")) {
        speak("Redirecting to chat page");
        navigate("/chat");
      } else if (transcript.includes("logout")) {
        speak("Logging you out");
        logout();
      } else if (transcript.includes("open settings")) {
        speak("Opening settings");
        navigate("/settings");
      } else if (transcript.includes("go to home")) {
        speak("Going to home page");
        navigate("/home");
      }
    };

    recognition.onerror = (err) => {
      console.error("Voice recognition error:", err);
    };

    recognition.start();
    console.log("🎧 Voice recognition started");
  };

  useEffect(() => {
    const enableVoice = localStorage.getItem("enableVoice") === "true";

    // 🛑 Only activate after login/signup
    const isLoggedIn =
      location.pathname !== "/" &&
      location.pathname !== "/login" &&
      location.pathname !== "/signup" &&
      location.pathname !== "/choice";

    console.log("🔍 VoiceManager status:", {
      isBlind,
      username,
      enableVoice,
      isLoggedIn,
    });

    if (!isBlind || !username || !enableVoice || !isLoggedIn) return;

    if (!active.current) {
      setupRecognition();
      connectWebSocket();
      active.current = true;
    }

    return () => {
      recognitionRef.current?.stop();
      stompClientRef.current?.deactivate();
      active.current = false;
    };
  }, [isBlind, username, location.pathname]);

  return null;
};

export default VoiceManager;
