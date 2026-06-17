import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { SecondaryButton } from './SecondaryButton';

describe('SecondaryButton', () => {
  it('renders button with text', () => {
    render(<SecondaryButton text="Cancel" />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders icon alongside text', () => {
    render(<SecondaryButton text="Delete" icon={faTrash} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SecondaryButton text="Cancel" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button when disabled is true', () => {
    render(<SecondaryButton text="Cancel" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with submit type when specified', () => {
    render(<SecondaryButton text="Submit" type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
