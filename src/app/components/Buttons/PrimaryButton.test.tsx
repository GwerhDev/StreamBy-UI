import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';

describe('PrimaryButton', () => {
  it('renders button with text', () => {
    render(<PrimaryButton text="Save" />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('renders children as text fallback', () => {
    render(<PrimaryButton>Save Draft</PrimaryButton>);
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
  });

  it('renders icon alongside text', () => {
    render(<PrimaryButton text="Save" icon={faSave} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PrimaryButton text="Save" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button when disabled is true', () => {
    render(<PrimaryButton text="Save" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PrimaryButton text="Save" onClick={onClick} disabled />);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
