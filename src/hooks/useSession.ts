import { useEffect, useState } from 'react';
import { fetchAuth } from '../services/auth';

export function useSession() {
  const [session, setSession] = useState<null | { logged: boolean; userId?: string; role?: string; projects?: string[] }>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchAuth();
      setSession(data);
    })();
  }, []);

  return session;
}
