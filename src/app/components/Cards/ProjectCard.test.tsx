import { render, screen } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';
import { ProjectList } from '../../../interfaces';

const project: ProjectList = { id: '1', name: 'My Project', archived: false };
const projectWithImage: ProjectList = { id: '2', name: 'Imaged', archived: false, image: 'img.png' };

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('renders first letter of name when no image', () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders image when provided', () => {
    render(<ProjectCard project={projectWithImage} />);
    expect(document.querySelector('img')).toBeInTheDocument();
  });
});
