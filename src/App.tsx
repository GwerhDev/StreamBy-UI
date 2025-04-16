import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './app/pages/Login';
import Dashboard from './app/pages/Dashboard';
import MediaProject from './app/pages/MediaProject';
import NotFound from './app/pages/NotFound';
import DefaultLayout from './app/layouts/DefaultLayout';
import { useSession } from './hooks/useSession';
import { Loader } from './app/components/Loader';
import { useEffect } from 'react';

function App() {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && !session.logged) {
      navigate('/login');
    }
  }, [session, navigate]);

  if (!session) return <Loader />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Dashboard profilePic={session.profilePic} />} />
        <Route path="/project/:id" element={<MediaProject />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
