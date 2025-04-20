import { Routes, Route } from 'react-router-dom';
import Login from './app/pages/Login';
import Dashboard from './app/pages/Dashboard';
import NotFound from './app/pages/NotFound';
import DefaultLayout from './app/layouts/DefaultLayout';
import { useSession } from './hooks/useSession';
import { Loader } from './app/components/Loader';
import { ProjectCreate } from './app/pages/ProjectCreate';
import { Project } from './app/pages/Project';

function App() {
  const session = useSession();

  return (
    <>
      {
        session
          ?
          <Routes>
            <Route path="/login" element={<Login logged={session.logged} />} />
            <Route element={<DefaultLayout userData={session} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/project/create" element={<ProjectCreate />} />
              <Route path="/project/:id" element={<Project />} />
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
