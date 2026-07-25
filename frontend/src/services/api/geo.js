import { fetchWithAuth } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function searchByName({ query, limit = 10, lang = "ru" }) {
  const urlParams = new URLSearchParams({ query, limit, lang });
  const response = await fetchWithAuth(
    `${API_BASE_URL}/weather/search/by-name?${urlParams}`,
    { method: "GET" }
  );
  const data = await handleResponse(response);
  return data.results;
}

export async function searchByCoords({ lat, lon, limit = 1, lang = "ru" }) {
  const urlParams = new URLSearchParams({ lat, lon, limit, lang });
  const response = await fetchWithAuth(
    `${API_BASE_URL}/weather/search/by-coords?${urlParams}`,
    { method: "GET" }
  );
  const data = await handleResponse(response);
  return data.results;
}

export async function validateApiKey(plainKey) {
  if (!plainKey) return false;
  const url = new URL(`${API_BASE_URL}/weather/validate-key`);
  url.searchParams.append("query", "Tokyo");
  url.searchParams.append("limit", "1");
  url.searchParams.append("api_key", plainKey);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) return true;
    return false;
  } catch (err) {
    console.error("Validation request failed:", err);
    return false;
  }
}
