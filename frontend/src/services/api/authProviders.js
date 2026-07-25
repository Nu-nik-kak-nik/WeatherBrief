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
  if (response.status === 204) return null;
  return response.json();
}

export async function getProviders() {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/providers/`, { method: "GET" });
  return handleResponse(response);
}

export async function deleteProvider(authId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/providers/${authId}`, { method: "DELETE" });
  return handleResponse(response);
}

export async function updateProvider(authId, data) {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/providers/${authId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}
