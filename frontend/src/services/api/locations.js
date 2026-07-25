import { fetchWithAuth } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    try {
      const error = JSON.parse(text);
      throw new Error(error.detail || `HTTP error ${response.status}`);
    } catch {
      throw new Error(`HTTP error ${response.status}: ${text}`);
    }
  }
  return response.json();
}

export async function getSavedLocations() {
  const response = await fetchWithAuth(`${API_BASE_URL}/locations/`, { method: "GET" });
  return handleResponse(response);
}

export async function addLocation(locationData) {
  const response = await fetchWithAuth(`${API_BASE_URL}/locations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationData),
  });
  return handleResponse(response);
}

export async function deleteLocation(locationId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/locations/${locationId}`, { method: "DELETE" });
  return handleResponse(response);
}

export async function reorderLocations(locationIds) {
  const response = await fetchWithAuth(`${API_BASE_URL}/locations/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location_ids: locationIds }),
  });
  return handleResponse(response);
}
