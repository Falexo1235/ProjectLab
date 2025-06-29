import { getApiUrl } from "../config/api"

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let token = localStorage.getItem('token');
  let refreshToken = localStorage.getItem('refreshToken');
  let headers = new Headers(init?.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response = await fetch(input, { ...init, headers });
  if (response.status !== 401) return response;

  if (!token || !refreshToken) {
    handleLogout();
    throw new Error('Session expired');
  }
  const refreshResp = await fetch(getApiUrl('/api/v1/Users/refresh-token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, refreshToken })
  });
  if (!refreshResp.ok) {
    handleLogout();
    throw new Error('Session expired');
  }
  const data = await refreshResp.json();
  localStorage.setItem('token', data.token);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  headers.set('Authorization', `Bearer ${data.token}`);
  return fetch(input, { ...init, headers });
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
} 