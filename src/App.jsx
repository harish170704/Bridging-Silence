import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { StompProvider } from "./pages/StompContext";
import GlobalMessageReader from "./pages/GlobalMessageReader";
import BlindCheck from "./pages/BlindCheck";
import ChoicePage from "./pages/ChoicePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Home from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import VoiceManager from "./components/VoiceManager";

const AppRoutes = () => {
  const navigate = useNavigate();
  const isBlind = localStorage.getItem("isBlind") === "true";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <StompProvider>
      <GlobalMessageReader />
      <VoiceManager logout={handleLogout} />
      <Routes>
        <Route path="/" element={<BlindCheck />} />
        <Route path="/choice" element={<ChoicePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </StompProvider>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
