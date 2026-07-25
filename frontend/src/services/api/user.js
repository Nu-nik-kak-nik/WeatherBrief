import { fetchWithAuth } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getProfile() {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`, { method: "GET" });
  return handleResponse(response);
}

export async function updateProfile(updates) {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
}

export async function changePassword(oldPassword, newPassword) {
  const url = `${API_BASE_URL}/users/change-password?old_password=${encodeURIComponent(oldPassword)}&new_password=${encodeURIComponent(newPassword)}`;
  const response = await fetchWithAuth(url, { method: "POST" });
  return handleResponse(response);
}

export async function deactivateAccount() {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/deactivate`, { method: "POST" });
  return handleResponse(response);
}
