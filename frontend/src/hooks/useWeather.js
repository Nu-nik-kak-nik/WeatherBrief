import { useContext } from "react";
import { WeatherContext } from "../contexts/WeatherContext";

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context)
    throw new Error("useWeather must be used within WeatherProvider");
  return context;
};
