import { Routes, Route } from 'react-router-dom';
import Login from './app/pages/Login';
import Signup from './app/pages/Signup';
import Dashboard from './app/pages/Dashboard';
import MediaProject from './app/pages/MediaProject';
import NotFound from './app/pages/NotFound';
import DefaultLayout from './app/layouts/DefaultLayout';
import { useSession } from './hooks/useSession';
import { CLIENT_BASE, REDIRECT_LOGIN } from './config/api';

function App() {
  const session = useSession();

  if (session && !session.logged) {
    window.location.href = REDIRECT_LOGIN + "?callback=" + encodeURIComponent(CLIENT_BASE);
  }

  if (session === null) return <p>Loading session...</p>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<MediaProject />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
