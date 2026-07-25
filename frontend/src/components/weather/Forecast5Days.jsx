import React from "react";
import { useWeather } from "../../hooks/useWeather";
import { WiDaySunny, WiRain, WiSnow, WiCloudy } from "react-icons/wi";

const iconMap = {
  Clear: WiDaySunny,
  Rain: WiRain,
  Snow: WiSnow,
  Clouds: WiCloudy,
};

const Forecast5Days = () => {
  const { forecast, loading } = useWeather();

  if (loading)
    return <div className="bg-[#282828] rounded-2xl p-5 animate-pulse h-40" />;
  if (!forecast || !forecast.length) return null;

  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 p-5">
      <h3 className="text-xl font-semibold text-[#ebdbb2] mb-4">
        Прогноз на 5 дней
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {forecast.map((day, idx) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString("ru-RU", {
            weekday: "short",
          });
          const condition = day.dominant_condition?.main || "Clear";
          const Icon = iconMap[condition] || WiDaySunny;

          let iconColor = "#fabd2f";
          if (condition === "Rain") iconColor = "#83a598";
          if (condition === "Snow") iconColor = "#8ec07c";
          if (condition === "Clouds") iconColor = "#928374";

          const totalPrecip =
            (day.total_rain_mm || 0) + (day.total_snow_mm || 0);
          const hasPrecip = totalPrecip > 0;

          return (
            <div key={idx} className="bg-[#1d2021] rounded-xl p-3 text-center">
              <p className="font-medium text-[#ebdbb2]">{dayName}</p>
              <Icon
                size={36}
                className="mx-auto my-2"
                style={{ color: iconColor }}
              />
              <p className="text-lg font-bold text-[#ebdbb2]">
                {Math.round(day.temp_max)}°
              </p>
              <p className="text-sm text-[#928374]">
                {Math.round(day.temp_min)}°
              </p>
              {hasPrecip && (
                <p className="text-xs text-[#83a598] mt-1">
                  💧 {totalPrecip.toFixed(1)} мм
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Forecast5Days;
