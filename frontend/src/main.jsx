import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { WeatherProvider } from "./contexts/WeatherContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/globals.css";
import { ConfirmProvider } from "./contexts/ConfirmContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <SettingsProvider>
            <WeatherProvider>
              <ThemeProvider>
                <ConfirmProvider>
                  <App />
                </ConfirmProvider>
              </ThemeProvider>
            </WeatherProvider>
          </SettingsProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
