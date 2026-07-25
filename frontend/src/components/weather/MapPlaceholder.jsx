import React from "react";
import { useWeather } from "../../hooks/useWeather";

const MapPlaceholder = () => {
  const { weather } = useWeather();
  const city = weather?.location?.name || "Москва";
  return (
    <div className="bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 w-full h-80 flex items-center justify-center shadow-none">
      <p className="text-center text-[#928374]">
        🗺️ Карта для города {city}
        <br />
        <span className="text-xs">(интеграция с Leaflet/Mapbox)</span>
      </p>
    </div>
  );
};

export default MapPlaceholder;
