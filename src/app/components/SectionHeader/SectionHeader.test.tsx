import { render, screen } from '@testing-library/react';
import { faRocket } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders title', () => {
    render(<SectionHeader icon={faRocket} title="Projects" />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<SectionHeader icon={faRocket} title="Projects" subtitle="All your projects" />);
    expect(screen.getByText('All your projects')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    render(<SectionHeader icon={faRocket} title="Projects" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    render(<SectionHeader icon={faRocket} title="Projects" badge="3" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders action content when provided', () => {
    render(<SectionHeader icon={faRocket} title="Projects" action={<button>New</button>} />);
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<SectionHeader icon={faRocket} title="Projects" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
