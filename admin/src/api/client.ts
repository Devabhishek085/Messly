const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('messly_admin_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('messly_admin_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('messly_admin_token');
};

const authHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export async function loginAdmin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function fetchWeeklyMenu() {
  const res = await fetch(`${API_BASE}/menu/week`);
  if (!res.ok) throw new Error('Failed to fetch weekly menu');
  return res.json();
}

export async function updateWeeklyMenu(day: string, menuData: any) {
  const res = await fetch(`${API_BASE}/admin/menu/${day}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(menuData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update weekly menu');
  return data;
}

export async function fetchTimings() {
  const res = await fetch(`${API_BASE}/timings`);
  if (!res.ok) throw new Error('Failed to fetch timings');
  return res.json();
}

export async function updateTimings(timingsData: any) {
  const res = await fetch(`${API_BASE}/admin/timings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(timingsData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update timings');
  return data;
}

export async function fetchOverrides() {
  const res = await fetch(`${API_BASE}/admin/menu/overrides`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch overrides');
  return res.json();
}

export async function setSpecialOverride(date: string, menuData: any) {
  const res = await fetch(`${API_BASE}/admin/menu/date/${date}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(menuData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save special override');
  return data;
}

export async function deleteSpecialOverride(date: string) {
  const res = await fetch(`${API_BASE}/admin/menu/date/${date}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete override');
  return data;
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/admin/analytics`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
  return data;
}
