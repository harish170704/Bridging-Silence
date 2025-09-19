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

  const speak = (text, callback) => {
    try {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.onend = callback || null;
      window.speechSynthesis.speak(msg);
    } catch (err) {
      console.error("Speech synthesis failed:", err);
    }
  };

  const connectWebSocket = () => {
    if (!username) return;

    const client = new Client({
      brokerURL: "ws://localhost:9090/ws",
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ WebSocket connected");
        client.subscribe(`/user/${username}/queue/messages`, (message) => {
          try {
            const body = JSON.parse(message.body);
            console.log("📬 Message received:", body);
            speak(`New message from ${body.sender}: ${body.content}`);
          } catch (err) {
            console.error("Error reading message:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      console.log("🛑 Voice recognition stopped");
    }
  };

  const setupRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported on this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
          .toLowerCase()
          .trim();

        console.log("🎤 Heard:", transcript);

        if (
          transcript.includes("send a message") ||
          transcript.includes("chat")
        ) {
          speak("Redirecting to chat page", () => {
            stopRecognition();
            navigate("/chat");
          });
        } else if (transcript.includes("logout")) {
          speak("Logging you out", () => {
            stopRecognition();
            logout();
          });
        } else if (transcript.includes("open settings")) {
          speak("Opening settings", () => {
            stopRecognition();
            navigate("/settings");
          });
        } else if (transcript.includes("go to home")) {
          speak("Going to home page", () => {
            stopRecognition();
            navigate("/home");
          });
        }
      };

      recognition.onerror = (err) => {
        console.error("Voice recognition error:", err);
      };

      recognition.onend = () => {
        if (active.current && location.pathname !== "/chat") {
          setTimeout(() => recognition.start(), 300);
        }
      };

      recognition.start();
      console.log("🎧 Voice recognition started");
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  };

  useEffect(() => {
    const enableVoice = localStorage.getItem("enableVoice") === "true";

    const isLoggedIn =
      location.pathname !== "/" &&
      location.pathname !== "/login" &&
      location.pathname !== "/signup" &&
      location.pathname !== "/choice";

    const isAllowedPath = location.pathname !== "/chat";

    console.log("🔍 VoiceManager status:", {
      isBlind,
      username,
      enableVoice,
      isLoggedIn,
      isAllowedPath,
    });

    if (!isBlind || !username || !enableVoice || !isLoggedIn) return;

    if (isAllowedPath && !active.current) {
      setupRecognition();
      connectWebSocket();
      active.current = true;
    }

    if (isAllowedPath && active.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Restart recognition failed:", err);
      }
    }

    return () => {
      stopRecognition();
      stompClientRef.current?.deactivate();
      active.current = false;
    };
  }, [location.pathname]);

  return null;
};

export default VoiceManager;
