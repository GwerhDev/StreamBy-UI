import { API_BASE } from '../config/api';

export async function fetchAuth() {
  try {
    const res = await fetch(`${API_BASE}/streamby/auth`, {
      credentials: 'include',
    });
  
    if (!res.ok) return { logged: false };
    return await res.json();
    
  } catch (error) {
    console.error(error);
    return { logged: false };
  }
}

export async function fetchLogout(setLoader: any) {
  try {
    if (setLoader) setLoader(true);
    const res = await fetch(`${API_BASE}/logout`, {
      credentials: 'include',
    });

    if (!res.ok) return { logged: false };
    return await res.json();

  } catch (error) {
    console.error(error);
    return { logged: true };
  }
}
