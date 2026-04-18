import s from './LateralTab.module.css';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { faArchive, faBars } from '@fortawesome/free-solid-svg-icons';
import { useEditorMenu } from '../../../context/EditorMenuContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjectButton } from '../Buttons/ProjectButton';
import { ProfileButton } from '../Buttons/ProfileButton';
import { AddProjectButton } from '../Buttons/AddProjectButton';
import { clearCurrentProject } from '../../../store/currentProjectSlice';
import { ProjectList, Session } from '../../../interfaces';
import streambyIcon from '../../../assets/streamby-icon.svg';
import { RootState } from '../../../store';
import { ProjectsState } from '../../../store/projectsSlice';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const applyOrder = (projects: ProjectList[], order: string[]): ProjectList[] => {
  if (!order.length) return projects;
  const orderMap = new Map(order.map((id, i) => [id, i]));
  return [...projects].sort((a, b) => {
    const aIdx = orderMap.has(a.id) ? orderMap.get(a.id)! : order.length;
    const bIdx = orderMap.has(b.id) ? orderMap.get(b.id)! : order.length;
    return aIdx - bIdx;
  });
};

const SortableProjectItem = ({ project }: { project: ProjectList }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none' as const,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectButton project={project} loading={false} />
    </li>
  );
};

export const LateralTab = (props: { projectList: ProjectsState, userData: Session }) => {
  const { projectList, userData } = props || {};
  const { loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { toggleMenu } = useEditorMenu();

  const filteredList = projectList.list.filter((project: ProjectList) => !project.archived);

  const [projectOrder, setProjectOrder] = useLocalStorage<string[]>('streamby-project-order', []);
  const [orderedProjects, setOrderedProjects] = useState<ProjectList[]>(() =>
    applyOrder(filteredList, projectOrder)
  );

  useEffect(() => {
    const filtered = projectList.list.filter((p: ProjectList) => !p.archived);
    setOrderedProjects(prev => {
      const prevIds = new Set(prev.map(p => p.id));
      const newProjects = filtered.filter((p: ProjectList) => !prevIds.has(p.id));
      const merged = [
        ...prev
          .filter(p => filtered.some((f: ProjectList) => f.id === p.id))
          .map(p => filtered.find((f: ProjectList) => f.id === p.id) ?? p),
        ...newProjects,
      ];
      return applyOrder(merged, projectOrder);
    });
  }, [projectList.list, projectOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedProjects(prev => {
        const oldIndex = prev.findIndex(p => p.id === active.id);
        const newIndex = prev.findIndex(p => p.id === over.id);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        setProjectOrder(newOrder.map(p => p.id));
        return newOrder;
      });
    }
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOnclick = () => {
    dispatch(clearCurrentProject());
    navigate('/project/create');
  };

  const handleGoHome = () => {
    dispatch(clearCurrentProject());
    navigate("/");
  };

  const handleGoArchive = () => {
    dispatch(clearCurrentProject());
    navigate("/user/archive");
  };

  return (
    <div className={s.container}>
      <span className={s.iconContainer}>
        <img onClick={handleGoHome} src={streambyIcon} alt="StreamBy Icon" height={25} />
      </span>
      <ul className={s.projects}>
        {
          projectsLoading ? (
            Array.from({ length: 1 }).map((_, index) => (
              <li key={index}>
                <ProjectButton project={{ id: '', name: '', dbType: '' }} loading={true} />
              </li>
            ))
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedProjects.map((project: ProjectList) => (
                  <SortableProjectItem key={project.id} project={project} />
                ))}
              </SortableContext>
            </DndContext>
          )
        }
        <AddProjectButton onClick={handleOnclick} />
      </ul>

      <ul className={s.user}>
        <li className={s.archive} onClick={toggleMenu} title="Toggle menu">
          <FontAwesomeIcon icon={faBars} />
        </li>

        <li className={s.archive} onClick={handleGoArchive}>
          <FontAwesomeIcon icon={faArchive} />
        </li>

        <li>
          <ProfileButton userData={userData} />
        </li>

        <li>
          <div className={s.versionContainer}>
            <small className={s.version}>{"v" + __APP_VERSION__}</small>
          </div>
        </li>
      </ul>
    </div>
  );
};
