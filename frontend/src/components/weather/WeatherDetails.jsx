import React from "react";
import { useWeather } from "../../hooks/useWeather";
import { useSettings } from "../../hooks/useSettings";
import {
  WiHumidity,
  WiBarometer,
  WiStrongWind,
  WiRainMix,
  WiCloudy,
  WiDaySunny,
} from "react-icons/wi";

const WeatherDetails = () => {
  const { weather, loading } = useWeather();
  const { units } = useSettings();

  if (loading)
    return <div className="bg-[#282828] rounded-2xl p-5 animate-pulse h-48" />;
  if (!weather) return null;

  const { current } = weather;
  const totalPrecip =
    (current.precipitation?.rain_mm ?? 0) +
    (current.precipitation?.snow_mm ?? 0);
  const windUnit = units === "metric" ? "м/с" : "mph";

  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-5 shadow-none">
      <h3 className="text-xl font-semibold text-[#ebdbb2] mb-4">
        Детали погоды
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <WiHumidity size={28} className="text-[#8ec07c]" />
          <div>
            <p className="text-xs text-[#928374]">Влажность</p>
            <p className="font-semibold text-[#ebdbb2]">
              {current.humidity_pct}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WiBarometer size={28} className="text-[#d3869b]" />
          <div>
            <p className="text-xs text-[#928374]">Давление</p>
            <p className="font-semibold text-[#ebdbb2]">
              {Math.round(current.pressure_hpa)} гПа
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WiStrongWind size={28} className="text-[#83a598]" />
          <div>
            <p className="text-xs text-[#928374]">Ветер</p>
            <p className="font-semibold text-[#ebdbb2]">
              {current.wind.speed.toFixed(1)} {windUnit}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WiRainMix size={28} className="text-[#83a598]" />
          <div>
            <p className="text-xs text-[#928374]">Осадки (мм)</p>
            <p className="font-semibold text-[#ebdbb2]">
              {totalPrecip.toFixed(1)} мм
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WiCloudy size={28} className="text-[#928374]" />
          <div>
            <p className="text-xs text-[#928374]">Облачность</p>
            <p className="font-semibold text-[#ebdbb2]">
              {current.clouds_pct}%
            </p>
          </div>
        </div>
        {current.visibility_m && (
          <div className="flex items-center gap-3">
            <WiDaySunny size={28} className="text-[#fabd2f]" />
            <div>
              <p className="text-xs text-[#928374]">Видимость</p>
              <p className="font-semibold text-[#ebdbb2]">
                {(current.visibility_m / 1000).toFixed(1)} км
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDetails;
