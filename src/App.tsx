import { Routes, Route } from 'react-router-dom';
import Login from './app/pages/Login';
import Dashboard from './app/pages/Dashboard';
import NotFound from './app/pages/NotFound';
import DefaultLayout from './app/layouts/DefaultLayout';
import { useInitSession } from './hooks/useInitSession';
import { ProjectCreate } from './app/pages/ProjectCreate';
import { Project } from './app/pages/Project';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { Loader } from './app/components/Loader';

function App() {
  const session = useSelector((state: RootState) => state.session);
  const { loader } = session;
  useInitSession();

  return (
    <>
      {
        loader
          ?
          <Loader />
          :
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/project/create" element={<ProjectCreate />} />
              <Route path="/project/:id" element={<Project />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
      }
    </>
  );
}

export default App;
