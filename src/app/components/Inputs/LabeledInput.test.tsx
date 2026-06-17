import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabeledInput } from './LabeledInput';

const base = { label: 'Email', name: 'email', id: 'email', htmlFor: 'email', type: 'text' as const, value: '', onChange: vi.fn() };

describe('LabeledInput', () => {
  it('renders label', () => {
    render(<LabeledInput {...base} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders input with correct type', () => {
    render(<LabeledInput {...base} type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('renders placeholder', () => {
    render(<LabeledInput {...base} placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<LabeledInput {...base} value="test@example.com" />);
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LabeledInput {...base} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<LabeledInput {...base} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('label is associated with input via htmlFor', () => {
    render(<LabeledInput {...base} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
