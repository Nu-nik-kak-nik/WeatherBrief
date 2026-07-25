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

export async function getApiKeys() {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/`, { method: "GET" });
  return handleResponse(response);
}

export async function addApiKey(keyData) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(keyData),
  });
  return handleResponse(response);
}

export async function updateApiKey(keyId, updates) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/${keyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
}

export async function deleteApiKey(keyId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/${keyId}`, { method: "DELETE" });
  return handleResponse(response);
}

export async function activateApiKey(keyId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/${keyId}/activate`, { method: "PATCH" });
  return handleResponse(response);
}

export async function deactivateApiKey(keyId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/${keyId}/deactivate`, { method: "PATCH" });
  return handleResponse(response);
}

export async function decryptApiKey(keyId) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api-keys/${keyId}/decrypt`, { method: "GET" });
  const data = await handleResponse(response);
  return data.decrypted_key;
}
