import React, { useState, useEffect, useRef } from "react";
import { useWeather } from "../../hooks/useWeather";
import { useUser } from "../../hooks/useUser";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";
import * as geoApi from "../../services/api/geo";
import { FiSearch, FiMapPin } from "react-icons/fi";

const CitySearch = ({ onCitySelect, className = "" }) => {
  const { accessToken } = useAuth();
  const { language } = useSettings();
  const { setCurrentCity } = useWeather();
  const { addCity } = useUser();
  const [searchMode, setSearchMode] = useState("name");
  const [query, setQuery] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchMode === "name" && query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (searchMode === "coords" && (lat === "" || lon === "")) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let cities = [];
        if (searchMode === "name") {
          cities = await geoApi.searchByName({
            query,
            limit: 10,
            lang: language,
          });
        } else {
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);
          if (isNaN(latNum) || isNaN(lonNum)) return;
          cities = await geoApi.searchByCoords({
            lat: latNum,
            lon: lonNum,
            limit: 5,
            lang: language,
          });
        }
        setResults(cities);
        setShowDropdown(true);
      } catch (err) {
        console.error("City search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchMode, query, lat, lon, language, accessToken]);

  const handleSelectCity = (city) => {
    if (onCitySelect) {
      onCitySelect(city);
    }
    if (city.lat && city.lon) {
    }
    setQuery("");
    setLat("");
    setLon("");
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setSearchMode("name")}
          className={`flex-1 flex items-center justify-center px-3 py-1 rounded-full text-xs transition ${
            searchMode === "name"
              ? "bg-[#fabd2f] text-[#1d2021]"
              : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836]"
          }`}
        >
          Название
        </button>
        <button
          onClick={() => setSearchMode("coords")}
          className={`flex-1 flex items-center justify-center px-3 py-1 rounded-full text-xs transition ${
            searchMode === "coords"
              ? "bg-[#fabd2f] text-[#1d2021]"
              : "bg-[#1d2021] text-[#ebdbb2] hover:bg-[#3c3836]"
          }`}
        >
          Координаты
        </button>
      </div>

      {searchMode === "name" && (
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#928374]"
            size={16}
          />
          <input
            type="text"
            placeholder="Введите название"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 pl-12 pr-3 text-[#ebdbb2] placeholder:text-[#928374] text-sm focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent"
          />
        </div>
      )}

      {searchMode === "coords" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Широта (lat)"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-3 text-[#ebdbb2] placeholder:text-[#928374] text-sm focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Долгота (lon)"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-full bg-[#1d2021] border border-[#ebdbb2]/20 rounded-xl py-2 px-3 text-[#ebdbb2] placeholder:text-[#928374] text-sm focus:outline-none focus:ring-2 focus:ring-[#fabd2f] focus:border-transparent"
            />
          </div>
        </div>
      )}

      {showDropdown && (results.length > 0 || loading) && (
        <ul className="absolute z-20 mt-1 w-full bg-[#282828] rounded-2xl border border-[#ebdbb2]/20 max-h-60 overflow-auto p-1 shadow-lg">
          {loading && (
            <li className="p-2 text-center text-[#928374]">Загрузка...</li>
          )}
          {results.map((city, idx) => (
            <li
              key={idx}
              onClick={() => handleSelectCity(city)}
              className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition text-[#ebdbb2] hover:bg-white/10"
            >
              <FiMapPin size={16} className="flex-shrink-0" />
              <span className="truncate">
                {city.name}, {city.country} {city.state && `(${city.state})`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CitySearch;
