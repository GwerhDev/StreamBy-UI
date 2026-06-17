import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomCheckbox } from './CustomCheckbox';

const base = { id: 'terms', name: 'terms', checked: false, onChange: vi.fn() };

describe('CustomCheckbox', () => {
  it('renders checkbox', () => {
    render(<CustomCheckbox {...base} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<CustomCheckbox {...base} label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('reflects checked state', () => {
    render(<CustomCheckbox {...base} checked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('reflects unchecked state', () => {
    render(<CustomCheckbox {...base} checked={false} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomCheckbox {...base} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('disables checkbox when disabled prop is true', () => {
    render(<CustomCheckbox {...base} disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
