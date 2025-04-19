import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchProject } from '../../services/streamby';

export default function MediaProject() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  console.log(files);

/*   useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const proj = await fetchProject(id);
        const fileList = await fetchFiles(id);
        setProject(proj);
        setFiles(fileList);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]); */

  if (!project) return <p>Loading...</p>;

  return (
    <div>

    </div>
  );
}
