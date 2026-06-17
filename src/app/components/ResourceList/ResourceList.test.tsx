import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { ResourceList } from './ResourceList';

const base = {
  icon: faFile,
  title: 'Files',
  subtitle: 'All your files',
  items: [],
  loading: false,
  onAdd: vi.fn(),
  addLabel: 'Add File',
};

const items = [
  { id: '1', card: <span>File A</span> },
  { id: '2', card: <span>File B</span> },
];

describe('ResourceList', () => {
  it('renders title and subtitle via SectionHeader', () => {
    render(<ResourceList {...base} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('All your files')).toBeInTheDocument();
  });

  it('renders skeleton items when loading', () => {
    const { container } = render(<ResourceList {...base} loading />);
    const skeletons = container.querySelectorAll('li');
    expect(skeletons.length).toBe(3);
  });

  it('renders empty state when no items', () => {
    render(<ResourceList {...base} />);
    expect(screen.getByText(/emptiness/i)).toBeInTheDocument();
  });

  it('renders items when provided', () => {
    render(<ResourceList {...base} items={items} />);
    expect(screen.getByText('File A')).toBeInTheDocument();
    expect(screen.getByText('File B')).toBeInTheDocument();
  });

  it('renders add card with label in list', () => {
    render(<ResourceList {...base} items={items} />);
    expect(screen.getByText('Add File')).toBeInTheDocument();
  });

  it('calls onAdd when add card is clicked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ResourceList {...base} items={items} onAdd={onAdd} />);
    await user.click(screen.getByText('Add File'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
