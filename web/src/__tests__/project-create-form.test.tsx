import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateProjectPage from '@/app/projects/create/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('CreateProjectPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'test-project-id', name: 'Test Project' }),
    });
  });

  it('should submit form when valid data is provided', async () => {
    render(<CreateProjectPage />);

    // Fill in the required project name
    const nameInput = screen.getByLabelText(/projectnaam/i);
    fireEvent.change(nameInput, { target: { value: 'Test Project' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /project aanmaken/i });
    fireEvent.click(submitButton);

    // Wait for the fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test Project'),
      });
    });

    // Verify navigation after success
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects');
    });
  });

  it('should auto-generate slug from project name', () => {
    render(<CreateProjectPage />);

    const nameInput = screen.getByLabelText(/projectnaam/i);
    const slugInput = screen.getByLabelText(/slug/i);

    fireEvent.change(nameInput, { target: { value: 'Test Project Name' } });

    expect(slugInput).toHaveValue('test-project-name');
  });

  it('should show error when project name is too short', async () => {
    render(<CreateProjectPage />);

    const nameInput = screen.getByLabelText(/projectnaam/i);
    fireEvent.change(nameInput, { target: { value: 'AB' } });

    const submitButton = screen.getByRole('button', { name: /project aanmaken/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/minimaal 3 tekens/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 402,
      json: async () => ({ error: 'Project limit reached' }),
    });

    render(<CreateProjectPage />);

    const nameInput = screen.getByLabelText(/projectnaam/i);
    fireEvent.change(nameInput, { target: { value: 'Test Project' } });

    const submitButton = screen.getByRole('button', { name: /project aanmaken/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/project limit reached/i)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should allow submission with empty slug (backend will generate)', async () => {
    render(<CreateProjectPage />);

    const nameInput = screen.getByLabelText(/projectnaam/i);
    const slugInput = screen.getByLabelText(/slug/i);

    // Set name and then clear the auto-generated slug
    fireEvent.change(nameInput, { target: { value: 'Test Project' } });
    fireEvent.change(slugInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /project aanmaken/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const payload = JSON.parse(fetchCall[1].body);
    
    // Slug should be undefined when empty, allowing backend to generate
    expect(payload.slug).toBeUndefined();
  });
});