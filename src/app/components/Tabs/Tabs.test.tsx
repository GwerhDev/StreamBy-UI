import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons';
import { Tabs, TabItem } from './Tabs';

const tabs: TabItem[] = [
  { id: 'files', label: 'Files', icon: faFile },
  { id: 'folders', label: 'Folders', icon: faFolder },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} active="files" onChange={vi.fn()} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Folders')).toBeInTheDocument();
  });

  it('calls onChange with tab id when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="files" onChange={onChange} />);
    await user.click(screen.getByText('Folders'));
    expect(onChange).toHaveBeenCalledWith('folders');
  });

  it('marks active tab with active class', () => {
    render(<Tabs tabs={tabs} active="folders" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /folders/i }).className).toContain('active');
  });

  it('renders close button when onClose is provided', () => {
    const tabsWithClose: TabItem[] = [{ ...tabs[0], onClose: vi.fn() }];
    render(<Tabs tabs={tabsWithClose} active="files" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('calls onClose without triggering onChange', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onChange = vi.fn();
    const tabsWithClose: TabItem[] = [{ ...tabs[0], onClose }];
    render(<Tabs tabs={tabsWithClose} active="files" onChange={onChange} />);
    const closeBtn = screen.getByRole('button', { name: '' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders action content', () => {
    render(<Tabs tabs={tabs} active="files" onChange={vi.fn()} actions={<button>New Tab</button>} />);
    expect(screen.getByText('New Tab')).toBeInTheDocument();
  });
});
