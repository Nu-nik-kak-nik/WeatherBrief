import { setAccessToken, getAccessToken, clearAccessToken } from './token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (error.detail && Array.isArray(error.detail)) {
      console.error("Validation errors:", error.detail);
    }
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function register(
  nickname,
  email,
  password,
  preferredLang = "ru",
  defaultUnits = "metric",
) {
  const lang = preferredLang === "en" ? "en" : "ru";
  const units = defaultUnits === "imperial" ? "imperial" : "metric";

  const payload = {
    username: nickname,
    email: email,
    hashed_password: password,
    preferred_lang: lang,
    default_units: units,
    is_verified: false,
    is_active: true,
    role: "user",
  };

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(response);
  if (data?.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

export async function refreshToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (response.status === 401) {
    clearAccessToken();
    return null;
  }
  const data = await handleResponse(response);
  if (data?.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

export function githubLogin() {
  window.location.href = `${API_BASE_URL}/auth/oauth/github/login`;
}

export function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const error = params.get('error');
  if (accessToken) {
    setAccessToken(accessToken);
    return { accessToken };
  }
  return { error };
}

export async function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (response.status === 401) return null;
  const data = await handleResponse(response);
  return {
    id: data.id,
    nickname: data.username,
    email: data.email,
    avatar: null,
    savedCities: [],
    hasPassword: data.has_password || false,
    settings: {
      language: data.preferred_lang || "ru",
      units: data.default_units || "metric",
      theme: "dark",
    },
  };
}

export async function logout() {
  const token = getAccessToken();
  if (token) {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    }).catch(() => {});
  }
  clearAccessToken();
}
