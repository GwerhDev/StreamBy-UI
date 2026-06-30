import reducer, {
  setProjects,
  addProject,
  removeProject,
  setProjectsLoading,
  ProjectsState,
} from './projectsSlice';
import { ProjectList } from '../interfaces';

const makeProject = (overrides: Partial<ProjectList> = {}): ProjectList => ({
  id: 'p1',
  name: 'My Project',
  archived: false,
  ...overrides,
} as ProjectList);

const initialState: ProjectsState = { list: [], loading: true, error: null };

describe('projectsSlice', () => {
  describe('setProjects', () => {
    it('sets the list and clears loading', () => {
      const projects = [makeProject({ id: 'p1' }), makeProject({ id: 'p2' })];
      const state = reducer(initialState, setProjects(projects));
      expect(state.list).toHaveLength(2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('replaces an existing list', () => {
      const first = reducer(initialState, setProjects([makeProject({ id: 'p1' })]));
      const state = reducer(first, setProjects([makeProject({ id: 'p2' })]));
      expect(state.list).toHaveLength(1);
      expect(state.list[0].id).toBe('p2');
    });
  });

  describe('addProject', () => {
    it('appends a project to the list', () => {
      const state = reducer(
        { list: [makeProject({ id: 'p1' })], loading: false, error: null },
        addProject(makeProject({ id: 'p2' })),
      );
      expect(state.list).toHaveLength(2);
      expect(state.list[1].id).toBe('p2');
    });
  });

  describe('removeProject', () => {
    it('removes the project with the matching id', () => {
      const state = reducer(
        { list: [makeProject({ id: 'p1' }), makeProject({ id: 'p2' })], loading: false, error: null },
        removeProject('p1'),
      );
      expect(state.list).toHaveLength(1);
      expect(state.list[0].id).toBe('p2');
    });

    it('is a no-op for unknown id', () => {
      const initial = { list: [makeProject({ id: 'p1' })], loading: false, error: null };
      const state = reducer(initial, removeProject('unknown'));
      expect(state.list).toHaveLength(1);
    });
  });

  describe('setProjectsLoading', () => {
    it('sets loading to true', () => {
      const state = reducer(
        { list: [], loading: false, error: null },
        setProjectsLoading(),
      );
      expect(state.loading).toBe(true);
    });
  });
});
