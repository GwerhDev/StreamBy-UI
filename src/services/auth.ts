import { API_BASE } from '../config/api';

export async function fetchAuth() {
  const res = await fetch(`${API_BASE}/auth`, {
    credentials: 'include',
  });

  if (!res.ok) return { logged: false };
  return await res.json();
}
