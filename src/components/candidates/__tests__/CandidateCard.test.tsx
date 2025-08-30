import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, createUserEvent, testAccessibility, createMockCandidate } from '@/test';
import { CandidateCard } from '../CandidateCard';

describe('CandidateCard Component', () => {
  const mockCandidate = createMockCandidate({
    id: 'candidate-1',
    name: 'John Doe',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: 5,
    score: 85,
    status: 'new',
  });

  const defaultProps = {
    candidate: mockCandidate,
    onSelect: vi.fn(),
    onViewProfile: vi.fn(),
    onGenerateMessage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders candidate information correctly', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <CandidateCard {...defaultProps} />
    );
    
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(getByText('Tech Corp')).toBeInTheDocument();
    expect(getByText('San Francisco, CA')).toBeInTheDocument();
    expect(getByText('5 years')).toBeInTheDocument();
    expect(getByTestId('candidate-score')).toHaveTextContent('85');
  });

  it('renders skills correctly', () => {
    const { getByText } = renderWithProviders(<CandidateCard {...defaultProps} />);
    
    expect(getByText('JavaScript')).toBeInTheDocument();
    expect(getByText('React')).toBeInTheDocument();
    expect(getByText('Node.js')).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    const { getByTestId, rerender } = renderWithProviders(
      <CandidateCard {...defaultProps} />
    );
    
    expect(getByTestId('status-badge')).toHaveTextContent('New');
    expect(getByTestId('status-badge')).toHaveClass('bg-blue-100');
    
    const contactedCandidate = { ...mockCandidate, status: 'contacted' as const };
    rerender(<CandidateCard {...defaultProps} candidate={contactedCandidate} />);
    
    expect(getByTestId('status-badge')).toHaveTextContent('Contacted');
    expect(getByTestId('status-badge')).toHaveClass('bg-yellow-100');
  });

  it('displays score with correct color coding', () => {
    const { getByTestId, rerender } = renderWithProviders(
      <CandidateCard {...defaultProps} />
    );
    
    // High score (85) should be green
    expect(getByTestId('candidate-score')).toHaveClass('text-green-600');
    
    // Medium score
    const mediumScoreCandidate = { ...mockCandidate, score: 70 };
    rerender(<CandidateCard {...defaultProps} candidate={mediumScoreCandidate} />);
    expect(getByTestId('candidate-score')).toHaveClass('text-yellow-600');
    
    // Low score
    const lowScoreCandidate = { ...mockCandidate, score: 50 };
    rerender(<CandidateCard {...defaultProps} candidate={lowScoreCandidate} />);
    expect(getByTestId('candidate-score')).toHaveClass('text-red-600');
  });

  it('handles selection correctly', async () => {
    const onSelect = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <CandidateCard {...defaultProps} onSelect={onSelect} showActions />
    );
    
    const checkbox = getByRole('checkbox');
    await user.click(checkbox);
    
    expect(onSelect).toHaveBeenCalledWith(mockCandidate);
  });

  it('handles view profile action', async () => {
    const onViewProfile = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <CandidateCard {...defaultProps} onViewProfile={onViewProfile} showActions />
    );
    
    const viewButton = getByRole('button', { name: /view profile/i });
    await user.click(viewButton);
    
    expect(onViewProfile).toHaveBeenCalledWith(mockCandidate);
  });

  it('handles generate message action', async () => {
    const onGenerateMessage = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <CandidateCard {...defaultProps} onGenerateMessage={onGenerateMessage} showActions />
    );
    
    const messageButton = getByRole('button', { name: /generate message/i });
    await user.click(messageButton);
    
    expect(onGenerateMessage).toHaveBeenCalledWith(mockCandidate);
  });

  it('renders in compact mode', () => {
    const { container, queryByText } = renderWithProviders(
      <CandidateCard {...defaultProps} compact />
    );
    
    // In compact mode, some details should be hidden
    expect(container.firstChild).toHaveClass('p-3'); // Smaller padding
    expect(queryByText('5 years')).not.toBeInTheDocument(); // Experience hidden
  });

  it('hides actions when showActions is false', () => {
    const { queryByRole } = renderWithProviders(
      <CandidateCard {...defaultProps} showActions={false} />
    );
    
    expect(queryByRole('checkbox')).not.toBeInTheDocument();
    expect(queryByRole('button', { name: /view profile/i })).not.toBeInTheDocument();
    expect(queryByRole('button', { name: /generate message/i })).not.toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    const candidateWithMissingData = createMockCandidate({
      email: undefined,
      profilePicture: undefined,
    });
    
    const { container } = renderWithProviders(
      <CandidateCard {...defaultProps} candidate={candidateWithMissingData} />
    );
    
    // Should render without errors
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays profile picture when available', () => {
    const candidateWithPicture = {
      ...mockCandidate,
      profilePicture: 'https://example.com/profile.jpg',
    };
    
    const { getByRole } = renderWithProviders(
      <CandidateCard {...defaultProps} candidate={candidateWithPicture} />
    );
    
    const image = getByRole('img', { name: /john doe/i });
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });

  it('shows initials when no profile picture', () => {
    const { getByTestId } = renderWithProviders(
      <CandidateCard {...defaultProps} />
    );
    
    expect(getByTestId('candidate-initials')).toHaveTextContent('JD');
  });

  it('handles long names and titles gracefully', () => {
    const candidateWithLongData = createMockCandidate({
      name: 'John Alexander Doe-Smith Jr.',
      title: 'Senior Principal Software Engineering Manager and Technical Lead',
    });
    
    const { getByText } = renderWithProviders(
      <CandidateCard {...defaultProps} candidate={candidateWithLongData} />
    );
    
    expect(getByText('John Alexander Doe-Smith Jr.')).toBeInTheDocument();
    expect(getByText('Senior Principal Software Engineering Manager and Technical Lead')).toBeInTheDocument();
  });

  it('meets accessibility standards', async () => {
    const renderResult = renderWithProviders(
      <CandidateCard {...defaultProps} showActions />
    );
    await testAccessibility(renderResult);
  });

  it('has correct ARIA attributes', () => {
    const { getByRole, getByTestId } = renderWithProviders(
      <CandidateCard {...defaultProps} showActions />
    );
    
    const card = getByTestId('candidate-card');
    expect(card).toHaveAttribute('role', 'article');
    
    const checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Select John Doe');
    
    const viewButton = getByRole('button', { name: /view profile/i });
    expect(viewButton).toHaveAttribute('aria-label', 'View John Doe profile');
  });

  it('supports keyboard navigation', async () => {
    const onViewProfile = vi.fn();
    const user = await createUserEvent();
    
    const { getByRole } = renderWithProviders(
      <CandidateCard {...defaultProps} onViewProfile={onViewProfile} showActions />
    );
    
    const viewButton = getByRole('button', { name: /view profile/i });
    viewButton.focus();
    
    await user.keyboard('{Enter}');
    expect(onViewProfile).toHaveBeenCalledWith(mockCandidate);
  });

  it('handles hover states correctly', async () => {
    const user = await createUserEvent();
    
    const { getByTestId } = renderWithProviders(
      <CandidateCard {...defaultProps} />
    );
    
    const card = getByTestId('candidate-card');
    
    await user.hover(card);
    expect(card).toHaveClass('hover:shadow-md');
  });
});