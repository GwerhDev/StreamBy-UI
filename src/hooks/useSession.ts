import { useEffect, useState } from 'react';
import { fetchAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export function useSession() {
  const [session, setSession] = useState<null | { logged: boolean; userId?: string; role?: string; projects?: string[]; profilePic?: string }>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const data = await fetchAuth();
      if (!data.logged) navigate('/login');
      setSession(data);
    })();
  }, []);

  return session;
}
