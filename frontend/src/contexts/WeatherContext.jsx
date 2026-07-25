import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { useUser } from "../hooks/useUser";
import * as weatherApi from "../services/api/weather";

export const WeatherContext = createContext();

const DEFAULT_CITY = "London";

export const WeatherProvider = ({ children }) => {
  const { user } = useAuth();
  const { accessToken } = useAuth();
  const { units, language } = useSettings();
  const { savedCities, loadingSavedCities } = useUser();

  const [currentCity, setCurrentCityState] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);

  const prevUserRef = useRef(user);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (prevUserRef.current !== user) {
      prevUserRef.current = user;
      setCurrentCityState(null);
      setWeather(null);
      setForecast([]);
      setHourlyForecast([]);
    }
  }, [user]);

  useEffect(() => {
    if (currentCity !== null) return;
    if (user === undefined) return;
    if (loadingSavedCities) return;

    let initialCity = DEFAULT_CITY;
    if (user !== null && Array.isArray(savedCities) && savedCities.length > 0) {
      initialCity = savedCities[0].location_name || DEFAULT_CITY;
    }
    setCurrentCityState(initialCity);
  }, [user, savedCities, loadingSavedCities, currentCity]);

  const fetchWeatherData = useCallback(
    async (city) => {
      const cityName =
        typeof city === "string" ? city : city?.name || String(city);
      if (!cityName) return;

      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const token = accessToken || undefined;
        const current = await weatherApi.getCurrentWeather(
          { city: cityName, units, lang: language },
          token,
        );
        if (requestId !== requestIdRef.current) return;
        setWeather(current);

        const detailed = await weatherApi.getForecastDetailed(
          { city: cityName, units, lang: language },
          token,
        );
        if (requestId !== requestIdRef.current) return;
        setForecast(detailed.daily_summaries || []);
        setHourlyForecast(detailed.hourly || []);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setWeather(null);
        setForecast([]);
        setHourlyForecast([]);
      } finally {
        setLoading(false);
      }
    },
    [units, language, accessToken],
  );

  useEffect(() => {
    if (currentCity && currentCity !== "undefined") {
      fetchWeatherData(currentCity);
    }
  }, [currentCity, units, language, fetchWeatherData]);

  const setCurrentCity = useCallback((city) => {
    const cityStr =
      typeof city === "string" ? city : city?.name || String(city);
    setCurrentCityState(cityStr);
  }, []);

  const fetchWeatherByCoords = useCallback(
    async (lat, lon) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const token = accessToken || undefined;
        const weatherData = await weatherApi.getCurrentWeather(
          { lat, lon, units, lang: language },
          token,
        );
        if (requestId !== requestIdRef.current) return;
        setWeather(weatherData);
        const cityName = weatherData.location.name;
        setCurrentCity(cityName);
        const detailed = await weatherApi.getForecastDetailed(
          { city: cityName, units, lang: language },
          token,
        );
        if (requestId !== requestIdRef.current) return;
        setForecast(detailed.daily_summaries || []);
        setHourlyForecast(detailed.hourly || []);
      } catch (err) {
        console.error("Weather fetch by coords error:", err);
      } finally {
        setLoading(false);
      }
    },
    [units, language, accessToken, setCurrentCity],
  );

  return (
    <WeatherContext.Provider
      value={{
        currentCity,
        setCurrentCity,
        weather,
        forecast,
        loading,
        hourlyForecast,
        fetchWeatherByCoords,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};
