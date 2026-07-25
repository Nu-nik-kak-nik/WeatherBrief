import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";
import { useWeather } from "../../hooks/useWeather";
import SavedCitiesList from "../user/SavedCitiesList";
import CitySearch from "../weather/CitySearch";
import { FiMapPin, FiUser, FiX } from "react-icons/fi";

const Sidebar = ({ isMobileOpen, onClose }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, addCity, savedCities } = useUser();
  const { weather, setCurrentCity, fetchWeatherByCoords } = useWeather();
  const navigate = useNavigate();
  const [selectedCityForSave, setSelectedCityForSave] = useState(null);

  if (authLoading) {
    return (
      <div className="p-5 text-center text-[#ebdbb2] bg-[#282828] h-full">
        Загрузка...
      </div>
    );
  }

  const goToProfile = () => {
    navigate("/profile");
    if (onClose) onClose();
  };

  const handleCitySelect = (cityObject) => {
    setSelectedCityForSave(cityObject);
    if (cityObject.lat && cityObject.lon) {
      fetchWeatherByCoords(cityObject.lat, cityObject.lon);
    } else if (cityObject.name) {
      setCurrentCity(cityObject.name);
    }
  };

  const handleSaveSelectedCity = () => {
    if (!selectedCityForSave) return;
    addCity(selectedCityForSave);
    setSelectedCityForSave(null);
    if (onClose) onClose();
  };

  const content = (
    <div className="flex flex-col h-full gap-5 p-5">
      <div className="flex justify-end md:hidden">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiX size={24} />
        </button>
      </div>

      {user ? (
        <button
          onClick={goToProfile}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl w-full transition-all duration-200 hover:bg-white/5 focus:ring-2 focus:ring-[#fabd2f]"
        >
          <div className="w-16 h-16 rounded-full bg-[#fabd2f] flex items-center justify-center text-2xl font-bold text-[#1d2021] shadow-md">
            {(user.nickname || user.username || "?").charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-semibold text-[#ebdbb2]">
            {user.nickname || user.username || "Пользователь"}
          </h3>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5">
          <FiUser size={40} className="text-[#928374]" />
          <p className="text-sm text-[#928374] text-center">
            Войдите, чтобы сохранять локации
          </p>
        </div>
      )}

      <div>
        <CitySearch onCitySelect={handleCitySelect} />
      </div>

      <button
        onClick={handleSaveSelectedCity}
        disabled={!selectedCityForSave}
        className={`w-full py-2 rounded-xl transition flex items-center justify-center gap-2 font-semibold ${
          selectedCityForSave
            ? "bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] cursor-pointer"
            : "bg-[#3c3836] text-[#928374] cursor-not-allowed"
        }`}
      >
        <FiMapPin size={16} />
        {selectedCityForSave
          ? `Сохранить ${selectedCityForSave.name}`
          : "Сохранить"}
      </button>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-semibold text-[#ebdbb2]">Сохранённые локации</h4>
        </div>
        <SavedCitiesList onCitySelect={onClose} />
      </div>
    </div>
  );
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return (
      <>
        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
        )}
        <aside
          className={`fixed top-0 left-0 h-full w-full max-w-full z-50 bg-[#282828] transform transition-transform duration-300 ease-out ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
        >
          {content}
        </aside>
      </>
    );
  }

  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 h-full overflow-y-auto">
      {content}
    </div>
  );
};

export default Sidebar;
