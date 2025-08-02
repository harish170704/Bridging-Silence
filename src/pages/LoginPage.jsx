import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [step, setStep] = useState("username");
  const [showPassword, setShowPassword] = useState(false);
  const isBlind = localStorage.getItem("isBlind") === "true";
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isBlind) startFieldLoop(step);
  }, [step]);

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.onend = () => callback && callback();
    window.speechSynthesis.speak(msg);
  };

  const startFieldLoop = (field) => {
    speak(`Please say your ${field}`, () => listenForField(field));
  };

  const listenForField = (field) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.start();

    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript.trim();
      if (!transcript) return startFieldLoop(field);

      // Clean based on field type
      const cleaned =
        field === "password"
          ? transcript.replace(/\s/g, "") // remove spaces only
          : transcript
              .toLowerCase()
              .replace(/at the rate/g, "@")
              .replace(/dot/g, ".")
              .replace(/\s/g, "");

      const updated = { ...formData, [field]: cleaned };
      setFormData(updated);
      confirmField(field, updated);
    };

    recognition.onerror = () => startFieldLoop(field);
  };

  const confirmField = (field, updatedData) => {
    let value = updatedData[field];
    if (field === "password") value = value.split("").join(" ");
    speak(
      `Your ${field} is ${value}. Say change to update or proceed to continue.`,
      () => listenForFieldConfirmation(field, updatedData)
    );
  };

  const listenForFieldConfirmation = (field, updatedData) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.start();

    recognition.onresult = (event) => {
      const reply = event.results[0][0].transcript.toLowerCase().trim();
      if (reply.includes("change")) {
        setFormData((prev) => ({ ...prev, [field]: "" }));
        startFieldLoop(field);
      } else if (reply.includes("proceed")) {
        if (field === "username") setStep("password");
        else handleSubmit(updatedData); // use current data
      } else {
        speak("Say change or proceed.", () =>
          listenForFieldConfirmation(field, updatedData)
        );
      }
    };

    recognition.onerror = () => {
      speak("Say change or proceed.", () =>
        listenForFieldConfirmation(field, updatedData)
      );
    };
  };

  const handleRetryOrSignup = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.start();

    recognition.onresult = (event) => {
      const reply = event.results[0][0].transcript.toLowerCase().trim();
      if (reply.includes("login")) {
        setFormData({ username: "", password: "" });
        setStep("username");
      } else if (reply.includes("create") || reply.includes("sign up")) {
        navigate("/signup");
      } else {
        speak("Say login again or create account.", handleRetryOrSignup);
      }
    };

    recognition.onerror = () => {
      speak("Say login again or create account.", handleRetryOrSignup);
    };
  };

  const handleSubmit = async (data = formData) => {
    try {
      const response = await fetch("http://localhost:9090/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.text();

      if (result === "Login successful") {
        localStorage.setItem("username", data.username);
        if (isBlind) speak("Login successful. Redirecting to home.");
        else alert("Login successful ✅");
        setTimeout(() => navigate("/home"), 1500);
      } else {
        setFormData({ username: "", password: "" });
        speak(
          "Login failed. Do you want to login again or create account?",
          handleRetryOrSignup
        );
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Error logging in. Try again.");
    }
  };

  return (
    <div className="form-page-container">
      <h1 className="form-title">Login</h1>
      <form
        className="form-box"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <label>Username</label>
        <input
          type="text"
          placeholder="Enter username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value.toLowerCase() })
          }
          className="form-input"
        />

        <label>Password</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="form-input"
        />

        {!isBlind && (
          <div style={{ marginBottom: "10px", textAlign: "left" }}>
            <input
              type="checkbox"
              id="showPassword"
              onChange={() => setShowPassword((prev) => !prev)}
            />
            <label htmlFor="showPassword" style={{ marginLeft: "8px" }}>
              Show Password
            </label>
          </div>
        )}

        <button type="submit" className="form-button">
          Login
        </button>
        <p className="form-link" onClick={() => navigate("/signup")}>
          Don't have an account? Sign up
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
