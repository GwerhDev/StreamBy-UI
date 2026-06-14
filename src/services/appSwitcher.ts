import { SwitcherApp, SwitcherCategory } from '../interfaces';

function parseEnv(raw: any[]): SwitcherCategory[] {
  return raw.map(cat => ({
    id: cat._id,
    name: cat._name,
    apps: Object.entries(cat)
      .filter(([k]) => /^\d+$/.test(k))
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => v as SwitcherApp),
  }));
}

export async function fetchAppEnv(url: string): Promise<SwitcherCategory[]> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch app environment');
  const raw: any[] = await res.json();
  return parseEnv(raw);
}
