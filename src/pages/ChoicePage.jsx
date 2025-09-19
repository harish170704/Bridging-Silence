import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const ChoicePage = () => {
  const loginBtnRef = useRef(null);
  const signupBtnRef = useRef(null);
  const navigate = useNavigate();
  const isBlind = localStorage.getItem("isBlind") === "true";

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log("Heard:", transcript);

      if (transcript.includes("login")) {
        const confirm = new SpeechSynthesisUtterance(
          "Redirecting to login page."
        );
        confirm.onend = () => loginBtnRef.current.click();
        window.speechSynthesis.speak(confirm);
      } else if (transcript.includes("create")) {
        const confirm = new SpeechSynthesisUtterance(
          "Redirecting to create account page."
        );
        confirm.onend = () => signupBtnRef.current.click();
        window.speechSynthesis.speak(confirm);
      } else {
        const retry = new SpeechSynthesisUtterance(
          "Please say login or create account."
        );
        retry.onend = () => setTimeout(() => startListening(), 1000);
        window.speechSynthesis.speak(retry);
      }
    };

    recognition.onerror = () => {
      const err = new SpeechSynthesisUtterance(
        "Sorry, I didn't catch that. Please say login or create account."
      );
      err.onend = () => setTimeout(() => startListening(), 1000);
      window.speechSynthesis.speak(err);
    };
  };

  useEffect(() => {
    if (isBlind) {
      const msg = new SpeechSynthesisUtterance(
        "Do you want to login or create account?"
      );
      msg.onend = () => startListening();
      window.speechSynthesis.speak(msg);
    }
  }, [isBlind]);

  return (
    <div className="choice-page-container">
      <h1 className="choice-title">Do you want to login or create account?</h1>
      <div className="choice-button-group">
        <button
          ref={loginBtnRef}
          onClick={() => navigate("/login")}
          className="choice-button"
        >
          Login
        </button>
        <button
          ref={signupBtnRef}
          onClick={() => navigate("/signup")}
          className="choice-button"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default ChoicePage;
