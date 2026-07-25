import { fetchWithAuth } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function getCurrentWeather({
  city,
  lat,
  lon,
  units = "metric",
  lang = "ru",
}) {
  const urlParams = new URLSearchParams();
  if (city) urlParams.append("city", city);
  if (lat !== undefined && lon !== undefined) {
    urlParams.append("lat", lat);
    urlParams.append("lon", lon);
  }
  urlParams.append("units", units);
  urlParams.append("lang", lang);

  const response = await fetchWithAuth(
    `${API_BASE_URL}/weather/now?${urlParams}`,
    { method: "GET" }
  );
  return handleResponse(response);
}

export async function getForecastDetailed({
  city,
  lat,
  lon,
  units = "metric",
  lang = "ru",
}) {
  const urlParams = new URLSearchParams();
  if (city) urlParams.append("city", city);
  if (lat !== undefined && lon !== undefined) {
    urlParams.append("lat", lat);
    urlParams.append("lon", lon);
  }
  urlParams.append("units", units);
  urlParams.append("lang", lang);

  const response = await fetchWithAuth(
    `${API_BASE_URL}/weather/5days/detailed?${urlParams}`,
    { method: "GET" }
  );
  return handleResponse(response);
}

export async function getForecastSummary({
  city,
  lat,
  lon,
  units = "metric",
  lang = "ru",
}) {
  const urlParams = new URLSearchParams();
  if (city) urlParams.append("city", city);
  if (lat !== undefined && lon !== undefined) {
    urlParams.append("lat", lat);
    urlParams.append("lon", lon);
  }
  urlParams.append("units", units);
  urlParams.append("lang", lang);

  const response = await fetchWithAuth(
    `${API_BASE_URL}/weather/5days/summary?${urlParams}`,
    { method: "GET" }
  );
  return handleResponse(response);
}
