import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAuth } from '../services/auth';
import { setLoader, setSession } from '../store/sessionSlice';
import { useNavigate } from 'react-router-dom';

export function useInitSession() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setLoader(true)); 
    (async () => {
      const session = await fetchAuth();
      if (!session.logged) navigate('/unauthorized');
      dispatch(setSession(session));
      dispatch(setLoader(false));
    })();
  }, [dispatch]);
}