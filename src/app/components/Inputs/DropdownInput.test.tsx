import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownInput } from './DropdownInput';

const options = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

describe('DropdownInput', () => {
  it('renders trigger button with selected label', () => {
    render(<DropdownInput value="editor" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('renders placeholder when no matching option', () => {
    render(<DropdownInput value="" onChange={vi.fn()} options={options} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<DropdownInput value="viewer" onChange={vi.fn()} options={options} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('calls onChange with selected value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DropdownInput value="viewer" onChange={onChange} options={options} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Admin'));
    expect(onChange).toHaveBeenCalledWith('admin');
  });

  it('disables trigger button when disabled prop is true', () => {
    render(<DropdownInput value="viewer" onChange={vi.fn()} options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
