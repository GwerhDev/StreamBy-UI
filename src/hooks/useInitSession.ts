import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAuth, fetchSubscription } from '../services/auth';
import { setLoader, setSession } from '../store/sessionSlice';
import { useNavigate } from 'react-router-dom';
import { addApiResponse } from '../store/apiResponsesSlice';

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
      const plan = await fetchSubscription();
      dispatch(setSession(plan ? { ...session, plan } : session));
      dispatch(setLoader(false));
    })();
  }, [dispatch]);
}