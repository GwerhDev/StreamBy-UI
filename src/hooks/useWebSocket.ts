import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { connectWS, disconnectWS } from '../services/websocket';

export function useWebSocket() {
  const logged = useSelector((state: RootState) => state.session.logged);

  useEffect(() => {
    if (logged) {
      connectWS();
    } else {
      disconnectWS();
    }
  }, [logged]);
}
