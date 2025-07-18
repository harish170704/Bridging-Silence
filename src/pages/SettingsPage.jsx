import React, { useEffect, useState } from "react";
import "../styles/SettingsPage.css";

const SettingsPage = () => {
  const [isBlind, setIsBlind] = useState(false);
  const [theme, setTheme] = useState("light");
  const [textSize, setTextSize] = useState("normal");
  const [voiceType, setVoiceType] = useState("female");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const uname = localStorage.getItem("username") || "default";
    setUsername(uname);

    const blind = localStorage.getItem("isBlind") === "true";
    setIsBlind(blind);

    const savedSettings =
      JSON.parse(localStorage.getItem(`settings_${uname}`)) || {};
    setTheme(savedSettings.theme || "light");
    setTextSize(savedSettings.textSize || "normal");
    setVoiceType(savedSettings.voiceType || "female");
  }, []);

  // 🟡 Apply theme and text size on load/change
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);

    document.body.classList.remove("normal", "large");
    document.body.classList.add(textSize);
  }, [theme, textSize]);

  const saveSettings = (newSettings) => {
    const updated = {
      theme,
      textSize,
      voiceType,
      ...newSettings,
    };
    localStorage.setItem(`settings_${username}`, JSON.stringify(updated));

    if (newSettings.theme) {
      document.body.classList.remove("light", "dark");
      document.body.classList.add(newSettings.theme);
    }
    if (newSettings.textSize) {
      document.body.classList.remove("normal", "large");
      document.body.classList.add(newSettings.textSize);
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {!isBlind && (
        <div className="setting-group">
          <label>Change Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const val = e.target.value;
              setUsername(val);
              localStorage.setItem("username", val);
            }}
          />
        </div>
      )}

      {!isBlind && (
        <div className="setting-group">
          <label>Theme:</label>
          <select
            value={theme}
            onChange={(e) => {
              const val = e.target.value;
              setTheme(val);
              saveSettings({ theme: val });
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      )}

      {!isBlind && (
        <div className="setting-group">
          <label>Text Size:</label>
          <select
            value={textSize}
            onChange={(e) => {
              const val = e.target.value;
              setTextSize(val);
              saveSettings({ textSize: val });
            }}
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
      )}

      {isBlind && (
        <div className="setting-group">
          <label>Voice Type:</label>
          <select
            value={voiceType}
            onChange={(e) => {
              const val = e.target.value;
              setVoiceType(val);
              saveSettings({ voiceType: val });
            }}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
