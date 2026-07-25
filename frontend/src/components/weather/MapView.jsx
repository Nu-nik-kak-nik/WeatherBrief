import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useWeather } from "../../hooks/useWeather";
import { useSettings } from "../../hooks/useSettings";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    background-color: #fabd2f;
    width: 24px;
    height: 24px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid #fe8019;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div><div style="
    position: absolute;
    top: 6px;
    left: 8px;
    width: 8px;
    height: 8px;
    background-color: #1d2021;
    border-radius: 50%;
  "></div>`,
  iconSize: [24, 24],
  popupAnchor: [0, -12],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "",
  iconUrl: "",
  shadowUrl: "",
});

const MapView = () => {
  const { weather, loading } = useWeather();
  const { units } = useSettings();
  const mapRef = useRef(null);

  const lat = weather?.location?.coordinates?.lat;
  const lon = weather?.location?.coordinates?.lon;
  const cityName = weather?.location?.name || "";
  const temperature = weather?.current?.temperature;
  const tempDisplay =
    temperature !== undefined
      ? `${Math.round(temperature)}°${units === "metric" ? "C" : "F"}`
      : "--°";

  useEffect(() => {
    if (mapRef.current && lat && lon) {
      mapRef.current.setView([lat, lon], 12);
    }
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="w-full h-80 md:h-96 bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 flex items-center justify-center">
        <p className="text-[#928374]">Загрузка карты...</p>
      </div>
    );
  }

  if (!lat || !lon) {
    return (
      <div className="w-full h-80 md:h-96 bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 flex items-center justify-center">
        <p className="text-[#928374]">Координаты города недоступны</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#ebdbb2]/20">
      <MapContainer
        center={[lat, lon]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        whenCreated={(map) => (mapRef.current = map)}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker position={[lat, lon]} icon={customIcon}>
          <Popup>
            <div className="text-[#ebdbb2] font-medium">
              {cityName}
              <br />
              🌡️ {tempDisplay}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;
