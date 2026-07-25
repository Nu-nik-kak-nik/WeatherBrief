import React from "react";
import { useWeather } from "../../hooks/useWeather";
import { getGradientByCondition } from "../../constants/weatherGradients";

const Background = () => {
  const { weather } = useWeather();
  const condition = weather?.condition || "Clear";
  const gradientClass = getGradientByCondition(condition);

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full -z-10 transition-all duration-1000 ${gradientClass} bg-cover bg-fixed`}
      style={{
        backgroundSize: "cover",
        animation: "float 20s infinite alternate",
      }}
    />
  );
};

export default Background;
