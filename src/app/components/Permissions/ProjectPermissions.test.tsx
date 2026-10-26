import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectPermissions } from './ProjectPermissions';

describe('ProjectPermissions', () => {
  it("shows the section, with nothing to configure yet", () => {
    render(<ProjectPermissions />);
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('What each role can do in this project.')).toBeInTheDocument();
    expect(screen.getByTestId('project-permissions-empty')).toBeInTheDocument();
  });
});
