import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAuth } from '../services/auth';
import { setLoader, setSession } from '../store/sessionSlice';
import { useNavigate } from 'react-router-dom';
import { addApiResponse } from '../store/apiResponsesSlice';
import { API_BASE } from '../config/api';

export function useInitSession() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setLoader(true));
    (async () => {
      const session = await fetchAuth();
      if (!session.logged) {
        dispatch(addApiResponse({ message: 'Authentication failed.', type: 'error' }));
        navigate('/unauthorized');
        dispatch(setSession(session));
        dispatch(setLoader(false));
        return;
      }
      dispatch(addApiResponse({ message: 'Authentication successful.', type: 'success' }));
      try {
        const subRes = await fetch(`${API_BASE}/streamby/user/subscription`, { credentials: 'include' });
        if (subRes.ok) {
          const { subscription } = await subRes.json();
          dispatch(setSession({ ...session, plan: subscription }));
        } else {
          dispatch(setSession(session));
        }
      } catch {
        dispatch(setSession(session));
      }
      dispatch(setLoader(false));
    })();
  }, [dispatch]);
}