import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProjectButton } from './ProjectButton';
import { ProjectList } from '../../../interfaces';

const project: ProjectList = {
  id: 'p1',
  name: 'MyProject',
  archived: false,
};

const renderBtn = (loading = false) =>
  render(
    <MemoryRouter>
      <ProjectButton project={project} loading={loading} />
    </MemoryRouter>
  );

describe('ProjectButton', () => {
  it('renders project name as title', () => {
    renderBtn();
    expect(screen.getByTitle('MyProject')).toBeInTheDocument();
  });

  it('renders first letter when no image', () => {
    renderBtn();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = renderBtn(true);
    expect(container.querySelector('button')).toBeInTheDocument();
    expect(screen.queryByTitle('MyProject')).not.toBeInTheDocument();
  });

  it('navigates on click', async () => {
    const user = userEvent.setup();
    renderBtn();
    await user.click(screen.getByTitle('MyProject'));
  });
});
