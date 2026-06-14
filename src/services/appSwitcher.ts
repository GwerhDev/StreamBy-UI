import { SwitcherCategory } from '../interfaces';

export async function fetchAppEnv(url: string): Promise<SwitcherCategory[]> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch app environment');
  return res.json();
}
