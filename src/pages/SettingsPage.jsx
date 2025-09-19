import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SettingsPage.css";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isBlind, setIsBlind] = useState(false);
  const [theme, setTheme] = useState("light");
  const [username, setUsername] = useState("");

  // Load saved state on mount
  useEffect(() => {
    const blindFlag = localStorage.getItem("isBlind") === "true";
    setIsBlind(blindFlag);

    // Redirect blind users away from Settings
    if (blindFlag) {
      navigate("/home");
      return;
    }

    const uname = localStorage.getItem("username") || "default";
    setUsername(uname);

    const saved = JSON.parse(localStorage.getItem(`settings_${uname}`)) || {};
    setTheme(saved.theme || "light");
  }, [navigate]);

  // Apply theme class on body
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  const saveSettings = (newSettings) => {
    const updated = {
      theme,
      ...newSettings,
    };
    localStorage.setItem(`settings_${username}`, JSON.stringify(updated));
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* Only non-blind users reach this point */}
      <div className="setting-group">
        <label htmlFor="theme-select">Theme:</label>
        <select
          id="theme-select"
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
    </div>
  );
};

export default SettingsPage;
