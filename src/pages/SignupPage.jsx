import React, { useEffect, useState, useRef } from "react";
import "./App.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    isBlind: localStorage.getItem("isBlind") === "true",
  });

  const [step, setStep] = useState("username");
  const [showPassword, setShowPassword] = useState(false);
  const recognitionRef = useRef(null);
  const passwordRef = useRef(""); // ✅ store password instantly
  const isBlind = formData.isBlind;

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.onend = () => {
      if (callback) callback();
    };
    window.speechSynthesis.speak(msg);
  };

  const startFlow = (initialStep = "username") => {
    setFormData({
      username: "",
      email: "",
      password: "",
      isBlind: localStorage.getItem("isBlind") === "true",
    });
    setStep(initialStep);
    speak(`Please say your ${initialStep}`, () => startListening(initialStep));
  };

  useEffect(() => {
    if (isBlind) startFlow("username");
  }, []);

  useEffect(() => {
    if (isBlind) {
      speak(`Please say your ${step}`, () => startListening(step));
    }
  }, [step]);

  const startListening = (field) => {
    if (!isBlind) return;
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
      const transcript = event.results[0][0].transcript.trim();
      let cleaned;

      if (field === "email") {
        cleaned = transcript
          .toLowerCase()
          .replace(/at the rate/g, "@")
          .replace(/dot/g, ".")
          .replace(/\s/g, "");
      } else if (field === "password") {
        cleaned = transcript.replace(/\s/g, "");
        passwordRef.current = cleaned; // ✅ store password instantly
      } else {
        cleaned = transcript.toLowerCase().replace(/\s/g, "");
      }

      setFormData((prev) => ({ ...prev, [field]: cleaned }));

      speak(
        `Your ${field} is ${cleaned}. Say 'change' to update or 'proceed' to continue.`,
        () => listenChange(field)
      );
    };

    recognition.onerror = () => {
      speak(`I didn't hear that. Please say your ${field}`, () =>
        startListening(field)
      );
    };
  };

  const listenChange = (field) => {
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
        setTimeout(
          () => speak(`Please say your ${field}`, () => startListening(field)),
          100
        );
      } else if (reply.includes("proceed")) {
        if (field === "password") {
          setFormData((prev) => ({ ...prev, password: passwordRef.current }));
        }

        const nextStep =
          field === "username"
            ? "email"
            : field === "email"
            ? "password"
            : null;

        if (nextStep) {
          setStep(nextStep);
        } else {
          setTimeout(() => handleSubmit(), 1000); // ✅ ensure state updated
        }
      } else {
        speak("Say 'change' or 'proceed'.", () => listenChange(field));
      }
    };

    recognition.onerror = () => {
      speak("Say 'change' or 'proceed'.", () => listenChange(field));
    };
  };

  const handleSubmit = async () => {
    const isBlindFlag = localStorage.getItem("isBlind") === "true";

    const updatedFormData = {
      ...formData,
      password: formData.password || passwordRef.current, // ✅ ensure latest password
      isBlind: isBlindFlag,
    };

    console.log("📦 Sending to backend:", updatedFormData);

    try {
      const response = await fetch("http://localhost:9090/api/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });

      const result = await response.text();

      if (result === "User registered successfully") {
        if (isBlindFlag) {
          speak("Signup successful. Redirecting to chat page.");
        } else {
          alert("Signup successful ✅");
        }
        setTimeout(() => (window.location.href = "/home"), 2000);
      } else {
        if (isBlindFlag) {
          speak(`${result}. Let's try again.`, () => startFlow("username"));
        } else {
          alert(result);
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (isBlindFlag) {
        speak("Network error. Let's start over.", () => startFlow("username"));
      } else {
        alert("Signup failed");
      }
    }
  };

  return (
    <div className="form-page-container">
      <h1 className="form-title">Signup</h1>
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
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value.toLowerCase() })
          }
          className="form-input"
        />

        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value.toLowerCase() })
          }
          className="form-input"
        />

        <label>Password</label>
        <input
          type={showPassword ? "text" : "password"}
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
          Submit
        </button>
      </form>
    </div>
  );
};

export default Signup;
