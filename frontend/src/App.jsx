import { useState } from "react";
import LoginPage from "./pages/loginPage";
import SignupPage from "./pages/signupPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LobbyPage from "./pages/lobbyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />{" "}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
