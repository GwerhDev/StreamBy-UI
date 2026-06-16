import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  it('renders button with text', () => {
    render(<ActionButton text="Save" />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('renders as anchor when href is provided', () => {
    render(<ActionButton text="Open" href="/dashboard" />);
    expect(screen.getByRole('link', { name: /open/i })).toBeInTheDocument();
  });

  it('renders icon alongside text', () => {
    render(<ActionButton text="Add" icon={faPlus} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ActionButton text="Click me" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows spinner when isLoading is true', () => {
    render(<ActionButton text="Save" isLoading />);
    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('disables the button when disabled is true', () => {
    render(<ActionButton text="Save" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
