import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const BlindCheck = () => {
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();
  const yesBtnRef = useRef(null);
  const noBtnRef = useRef(null);
  const recognitionRef = useRef(null);
  const stoppedRef = useRef(false);

  const handleStart = () => {
    if (started) return;
    setStarted(true);

    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      "Are you blind? Please say yes or no."
    );
    msg.onend = () => {
      setTimeout(() => startListening(), 1000);
    };
    window.speechSynthesis.speak(msg);
  };

  const startListening = () => {
    if (stoppedRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();

      if (transcript.includes("yes")) {
        speakAndSet("You said yes. Redirecting to next page.", "yes");
      } else if (transcript.includes("no")) {
        speakAndSet("You said no. Redirecting to next page.", "no");
      } else {
        retryListening("Please say yes or no.");
      }
    };

    recognition.onerror = () => {
      retryListening("I didn't catch that. Please say yes or no.");
    };
  };

  const retryListening = (text) => {
    if (stoppedRef.current) return;

    const retry = new SpeechSynthesisUtterance(text);
    retry.onend = () => {
      setTimeout(() => startListening(), 1000);
    };
    window.speechSynthesis.speak(retry);
  };

  const speakAndSet = (text, answer) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => {
      localStorage.setItem("isBlind", answer === "yes" ? "true" : "false");
      navigate("/choice");
    };
    window.speechSynthesis.speak(utter);
  };

  const handleClick = (answer) => {
    stoppedRef.current = true;
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();

    localStorage.setItem("isBlind", answer === "yes" ? "true" : "false");
    navigate("/choice");
  };

  return (
    <div
      className={`blind-check-container ${started ? "started" : ""}`}
      onClick={!started ? handleStart : undefined}
    >
      {!started ? (
        <>
          <h1 className="landing-title">Bridging Silence</h1>
          <h3 className="tap-text">Please tap anywhere to begin</h3>
        </>
      ) : (
        <>
          <h2 className="blind-check-title">Are you blind?</h2>
          <div className="btn-wrapper">
            <button
              ref={yesBtnRef}
              onClick={() => handleClick("yes")}
              className="blind-check-button"
            >
              YES
            </button>
            <button
              ref={noBtnRef}
              onClick={() => handleClick("no")}
              className="blind-check-button"
            >
              NO
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BlindCheck;
