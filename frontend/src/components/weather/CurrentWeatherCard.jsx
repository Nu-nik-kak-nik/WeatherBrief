import React from "react";
import { useWeather } from "../../hooks/useWeather";
import { useSettings } from "../../hooks/useSettings";
import { getWeatherAccent } from "../../utils/weatherAccents";
import {
  WiDaySunny,
  WiRain,
  WiSnow,
  WiCloudy,
  WiSunrise,
  WiSunset,
  WiHumidity,
  WiBarometer,
  WiStrongWind,
  WiRain as WiRainDrop,
} from "react-icons/wi";
import { FiEye } from "react-icons/fi";

const iconMap = {
  Clear: WiDaySunny,
  Rain: WiRain,
  Snow: WiSnow,
  Clouds: WiCloudy,
};

const formatTime = (timestamp, timezoneOffsetSec) => {
  if (!timestamp) return "--:--";
  const localTimeMs = (timestamp + timezoneOffsetSec) * 1000;
  return new Date(localTimeMs).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
};

const CurrentWeatherCard = () => {
  const { weather, loading } = useWeather();
  const { units } = useSettings();

  if (loading)
    return <div className="bg-[#282828] rounded-2xl p-5 animate-pulse h-80" />;
  if (!weather) return null;

  const { location, current } = weather;
  const condition = current.condition.main;
  const Icon = iconMap[condition] || WiDaySunny;
  const accent = getWeatherAccent(condition, current.is_day);

  const windUnit = units === "metric" ? "м/с" : "mph";
  const pressureUnit = units === "metric" ? "гПа" : "дюйм рт. ст.";
  const visibilityKm = (current.visibility_m / 1000).toFixed(1);

  const totalPrecip =
    (current.precipitation?.rain_mm ?? 0) +
    (current.precipitation?.snow_mm ?? 0);

  return (
    <div
      className="bg-[#282828] rounded-2xl border p-5 transition-all"
      style={{ borderColor: accent.border, boxShadow: accent.glow }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <h2 className="text-2xl font-bold text-[#ebdbb2]">
            {location.name}, {location.country}
          </h2>
          <p className="text-sm text-[#928374] mt-1">
            {new Date(current.dt_local).toLocaleString()}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Icon size={56} style={{ color: accent.icon }} />
            <div>
              <span className="text-5xl font-black text-[#ebdbb2]">
                {Math.round(current.temperature)}°
              </span>
              <p className="text-md text-[#ebdbb2]">
                Ощущается {Math.round(current.feels_like)}°
              </p>
              <p className="capitalize text-sm text-[#ebdbb2]">
                {current.condition.description}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <WiHumidity size={28} style={{ color: accent.icon }} />
            <div>
              <p className="text-xs text-[#928374]">Влажность</p>
              <p className="font-semibold text-[#ebdbb2]">
                {current.humidity_pct}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WiBarometer size={28} style={{ color: accent.icon }} />
            <div>
              <p className="text-xs text-[#928374]">Давление</p>
              <p className="font-semibold text-[#ebdbb2]">
                {Math.round(current.pressure_hpa)} гПа
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WiStrongWind size={28} style={{ color: accent.icon }} />
            <div>
              <p className="text-xs text-[#928374]">Ветер</p>
              <p className="font-semibold text-[#ebdbb2]">
                {current.wind.speed.toFixed(1)} {windUnit}
                {current.wind.gust
                  ? ` (порывы ${current.wind.gust.toFixed(1)} ${windUnit})`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiEye size={28} style={{ color: accent.icon }} />
            <div>
              <p className="text-xs text-[#928374]">Видимость</p>
              <p className="font-semibold text-[#ebdbb2]">{visibilityKm} км</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WiSunrise size={28} style={{ color: "#fabd2f" }} />
            <div>
              <p className="text-xs text-[#928374]">Восход</p>
              <p className="font-semibold text-[#ebdbb2]">
                {formatTime(current.sunrise, location.timezone_offset)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WiSunset size={28} style={{ color: "#fe8019" }} />
            <div>
              <p className="text-xs text-[#928374]">Закат</p>
              <p className="font-semibold text-[#ebdbb2]">
                {formatTime(current.sunset, location.timezone_offset)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WiRainDrop size={28} style={{ color: accent.icon }} />
            <div>
              <p className="text-xs text-[#928374]">Осадки</p>
              <p className="font-semibold text-[#ebdbb2]">
                {totalPrecip.toFixed(1)} мм
              </p>
            </div>
          </div>
          {current.clouds_pct !== undefined && (
            <div className="flex items-center gap-3">
              <WiCloudy size={28} style={{ color: accent.icon }} />
              <div>
                <p className="text-xs text-[#928374]">Облачность</p>
                <p className="font-semibold text-[#ebdbb2]">
                  {current.clouds_pct}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherCard;
