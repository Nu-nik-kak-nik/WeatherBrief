import React from "react";
import { useSettings } from "../../hooks/useSettings";
import { useLayoutVisibility } from "../../hooks/useLayoutVisibility";
import { FiGlobe, FiThermometer, FiEye, FiEyeOff } from "react-icons/fi";

const SettingsPanel = () => {
  const { language, units, showGraphs, setLanguage, setUnits, setShowGraphs } =
    useSettings();
  const { visibility, toggleVisibility } = useLayoutVisibility();

  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-6">
      <h2 className="text-xl font-semibold text-[#ebdbb2] mb-4">
        Настройки интерфейса
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-[#928374] mb-2 flex items-center gap-2">
            <FiThermometer size={16} /> Единицы измерения
          </label>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setUnits("metric")}
              className={`px-4 py-2 rounded-full transition ${units === "metric" ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836]"}`}
            >
              °C, м/с
            </button>
            <button
              onClick={() => setUnits("imperial")}
              className={`px-4 py-2 rounded-full transition ${units === "imperial" ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836]"}`}
            >
              °F, mph
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#928374] mb-2 flex items-center gap-2">
            <FiGlobe size={16} /> Язык
          </label>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setLanguage("ru")}
              className={`px-4 py-2 rounded-full transition ${language === "ru" ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836]"}`}
            >
              Русский
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-full transition ${language === "en" ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836]"}`}
            >
              English
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#928374] mb-2 flex items-center gap-2">
            <FiEye size={16} /> Видимость блоков на главной
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
              <span className="text-[#ebdbb2]">Прогноз на 5 дней</span>
              <button
                onClick={() => toggleVisibility("showForecast")}
                className={`px-3 py-1 rounded-full text-sm transition ${visibility.showForecast ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#928374]"}`}
              >
                {visibility.showForecast ? "Скрыть" : "Показать"}
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
              <span className="text-[#ebdbb2]">Карта</span>
              <button
                onClick={() => toggleVisibility("showMap")}
                className={`px-3 py-1 rounded-full text-sm transition ${visibility.showMap ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#928374]"}`}
              >
                {visibility.showMap ? "Скрыть" : "Показать"}
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition">
              <span className="text-[#ebdbb2]">
                Графики (температура, осадки, ветер, давление, влажность)
              </span>
              <button
                onClick={() => setShowGraphs(!showGraphs)}
                className={`px-3 py-1 rounded-full text-sm transition ${showGraphs ? "bg-[#fabd2f] text-[#1d2021]" : "bg-[#1d2021] text-[#928374]"}`}
              >
                {showGraphs ? "Скрыть" : "Показать"}
              </button>
            </label>
          </div>
          <p className="text-xs text-[#928374] mt-2">
            Изменения применяются сразу
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
