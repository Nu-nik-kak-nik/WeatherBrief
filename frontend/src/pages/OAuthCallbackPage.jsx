import React, { useEffect } from "react";
import { setAccessToken } from "../services/api/token";

const OAuthCallbackPage = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error:", error);
      window.location.href = "/login?error=oauth_failed";
      return;
    }

    if (accessToken) {
      setAccessToken(accessToken);
      console.log("Token saved in memory.");
      window.location.replace("/");
    } else {
      console.warn("No access token in URL");
      window.location.href = "/login?error=no_token";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1d2021]">
      <div className="text-[#ebdbb2]">Завершение авторизации...</div>
    </div>
  );
};

export default OAuthCallbackPage;
