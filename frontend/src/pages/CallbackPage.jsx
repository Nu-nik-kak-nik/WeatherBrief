import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const CallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchProviders } = useAuth();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success") === "true";
    const error = params.get("error");

    if (error) {
      setStatus("error");
      setTimeout(() => navigate("/profile"), 3000);
    } else if (success) {
      setStatus("success");
      fetchProviders();
      setTimeout(() => navigate("/profile"), 2000);
    } else {
      setStatus("success");
      setTimeout(() => navigate("/profile"), 2000);
    }
  }, [location, navigate, fetchProviders]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1d2021]">
      <div className="bg-[#282828] rounded-2xl p-8 text-center">
        {status === "processing" && (
          <p>Обработка входа через внешний сервис...</p>
        )}
        {status === "success" && (
          <p className="text-green-500">Успешно! Перенаправление...</p>
        )}
        {status === "error" && (
          <p className="text-red-500">
            Ошибка при подключении. Закройте окно и попробуйте снова.
          </p>
        )}
      </div>
    </div>
  );
};

export default CallbackPage;
