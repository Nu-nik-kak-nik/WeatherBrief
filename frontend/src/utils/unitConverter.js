export const convertTemperature = (celsius, units) => {
  if (units === "imperial") return (celsius * 9) / 5 + 32;
  return celsius;
};

export const convertWindSpeed = (ms, units) => {
  if (units === "imperial") return ms * 2.23694;
  return ms;
};

export const convertPressure = (hpa, units) => {
  if (units === "imperial") return hpa * 0.02953;
  return hpa;
};

export const formatTemp = (celsius, units) => {
  const val = convertTemperature(celsius, units);
  return Math.round(val);
};

export const formatWind = (ms, units) => {
  const val = convertWindSpeed(ms, units);
  return val.toFixed(1);
};

export const formatPressure = (hpa, units) => {
  const val = convertPressure(hpa, units);
  return units === "imperial" ? val.toFixed(2) : Math.round(val);
};

export const getPressureUnit = (units) => {
  return units === "imperial" ? "дюйм рт. ст." : "гПа";
};

export const getTemperatureUnit = (units) => {
  return units === "imperial" ? "°F" : "°C";
};

export const getWindUnit = (units) => {
  return units === "imperial" ? "mph" : "м/с";
};
