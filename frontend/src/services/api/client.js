import { refreshToken } from "./auth";
import { getAccessToken, setAccessToken, clearAccessToken } from './token';

let refreshPromise = null;

export async function fetchWithAuth(url, options = {}, onRefreshFailed) {
  let token = getAccessToken();
  const makeRequest = (t) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${t}`,
      },
      credentials: 'include',
    });

  let response = await makeRequest(token);
  if (response.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshToken().catch(() => null);
    }
    const data = await refreshPromise;
    refreshPromise = null;
    if (data?.access_token) {
      token = data.access_token;
      setAccessToken(token);
      response = await makeRequest(token);
    } else {
      onRefreshFailed?.();
      clearAccessToken();
      throw new Error('Session expired');
    }
  }
  return response;
}
