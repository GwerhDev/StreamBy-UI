import { Routes, Route } from 'react-router-dom';
import Login from './app/pages/Login';
import Dashboard from './app/pages/Dashboard';
import MediaProject from './app/pages/MediaProject';
import NotFound from './app/pages/NotFound';
import DefaultLayout from './app/layouts/DefaultLayout';
import { useSession } from './hooks/useSession';
import { Loader } from './app/components/Loader';

function App() {
  const session = useSession();

  return (
    <>
      {
        session
          ?
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<Dashboard profilePic={session.profilePic} />} />
              <Route path="/project/:id" element={<MediaProject />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          :
          <Loader />
      }
    </>
  );
}

export default App;
