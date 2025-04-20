import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAuth } from '../services/auth';
import { setLoader, setSession } from '../store/sessionSlice';

export function useInitSession() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoader(true)); 
    (async () => {
      const session = await fetchAuth();
      dispatch(setSession(session));
      dispatch(setLoader(false));
    })();
  }, [dispatch]);
}