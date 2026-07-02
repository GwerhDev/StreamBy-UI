import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchAuth, fetchSubscription } from '../services/auth';
import { setLoader, setSession } from '../store/sessionSlice';
import { useNavigate } from 'react-router-dom';

export function useInitSession() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setLoader(true));
    (async () => {
      const session = await fetchAuth();
      if (!session.logged) {
        dispatch(setSession(session));
        dispatch(setLoader(false));
        navigate('/unauthorized');
        return;
      }
      const plan = await fetchSubscription();
      dispatch(setSession(plan ? { ...session, plan } : session));
      dispatch(setLoader(false));
    })();
  }, [dispatch, navigate]);
}
