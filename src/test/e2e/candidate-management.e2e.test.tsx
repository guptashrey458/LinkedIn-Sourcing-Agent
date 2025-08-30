import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders, createUserEvent, waitFor, createMockCandidate, mockFetch, mockApiResponse } from '@/test';
import App from '@/App';

describe('Candidate Management E2E Tests', () => {
  let user: Awaited<ReturnType<typeof createUserEvent>>;

  beforeEach(async () => {
    user = await createUserEvent();
    
    // Mock authentication
    mockFetch(mockApiResponse({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'recruiter',
        permissions: ['read:candidates', 'write:candidates'],
      },
      token: 'mock-token',
    }));
  });

  it('completes full candidate discovery and management workflow', async () => {
    // Mock candidates data
    const mockCandidates = Array.from({ length: 10 }, (_, i) => 
      createMockCandidate({
        id: `candidate-${i + 1}`,
        name: `Candidate ${i + 1}`,
        score: 80 + i,
      })
    );

    mockFetch(mockApiResponse({
      candidates: mockCandidates,
      total: 10,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    }));

    const { getByRole, getByText, getAllByRole, getByTestId } = renderWithProviders(<App />);

    // 1. Navigate to candidates page
    const candidatesLink = getByRole('link', { name: /candidates/i });
    await user.click(candidatesLink);

    await waitFor(() => {
      expect(getByText('Candidates')).toBeInTheDocument();
    });

    // 2. Verify candidates are loaded and displayed
    await waitFor(() => {
      expect(getByText('Candidate 1')).toBeInTheDocument();
      expect(getByText('Candidate 10')).toBeInTheDocument();
    });

    // 3. Test filtering functionality
    const searchInput = getByRole('textbox', { name: /search candidates/i });
    await user.type(searchInput, 'Candidate 5');

    // Mock filtered results
    mockFetch(mockApiResponse({
      candidates: [mockCandidates[4]], // Candidate 5
      total: 1,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    }));

    const searchButton = getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(getByText('Candidate 5')).toBeInTheDocument();
    });

    // 4. Test candidate selection
    const candidateCheckbox = getByRole('checkbox', { name: /select candidate 5/i });
    await user.click(candidateCheckbox);

    expect(candidateCheckbox).toBeChecked();

    // 5. Test viewing candidate profile
    mockFetch(mockApiResponse(mockCandidates[4]));
    
    const viewProfileButton = getByRole('button', { name: /view.*profile/i });
    await user.click(viewProfileButton);

    await waitFor(() => {
      expect(getByRole('dialog')).toBeInTheDocument();
      expect(getByText('Candidate Profile')).toBeInTheDocument();
    });

    // 6. Test updating candidate status
    const statusSelect = getByRole('combobox', { name: /status/i });
    await user.click(statusSelect);
    
    const contactedOption = getByRole('option', { name: /contacted/i });
    await user.click(contactedOption);

    // Mock update response
    mockFetch(mockApiResponse({
      ...mockCandidates[4],
      status: 'contacted',
    }));

    const saveButton = getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(getByText(/successfully updated/i)).toBeInTheDocument();
    });

    // 7. Close profile modal
    const closeButton = getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    // 8. Test bulk operations
    // Clear search first
    await user.clear(searchInput);
    await user.click(searchButton);

    await waitFor(() => {
      expect(getAllByRole('checkbox').length).toBeGreaterThan(1);
    });

    // Select multiple candidates
    const selectAllCheckbox = getByRole('checkbox', { name: /select all/i });
    await user.click(selectAllCheckbox);

    // Open bulk actions menu
    const bulkActionsButton = getByRole('button', { name: /bulk actions/i });
    await user.click(bulkActionsButton);

    // Test bulk status update
    const bulkStatusOption = getByRole('menuitem', { name: /update status/i });
    await user.click(bulkStatusOption);

    const bulkStatusSelect = getByRole('combobox', { name: /new status/i });
    await user.click(bulkStatusSelect);
    
    const interestedOption = getByRole('option', { name: /interested/i });
    await user.click(interestedOption);

    // Mock bulk update response
    mockFetch(mockApiResponse(
      mockCandidates.map(c => ({ ...c, status: 'interested' }))
    ));

    const applyBulkButton = getByRole('button', { name: /apply to selected/i });
    await user.click(applyBulkButton);

    await waitFor(() => {
      expect(getByText(/bulk update completed/i)).toBeInTheDocument();
    });

    // 9. Test export functionality
    const exportButton = getByRole('button', { name: /export/i });
    await user.click(exportButton);

    const csvOption = getByRole('menuitem', { name: /csv/i });
    await user.click(csvOption);

    // Mock export response
    mockFetch(mockApiResponse({
      exportId: 'export-123',
      downloadUrl: '/api/exports/download/export-123',
      status: 'completed',
    }));

    const confirmExportButton = getByRole('button', { name: /confirm export/i });
    await user.click(confirmExportButton);

    await waitFor(() => {
      expect(getByText(/export completed/i)).toBeInTheDocument();
    });
  });

  it('handles error states gracefully', async () => {
    // Mock network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { getByRole, getByText } = renderWithProviders(<App />);

    // Navigate to candidates page
    const candidatesLink = getByRole('link', { name: /candidates/i });
    await user.click(candidatesLink);

    // Should show error message
    await waitFor(() => {
      expect(getByText(/error loading candidates/i)).toBeInTheDocument();
    });

    // Test retry functionality
    mockFetch(mockApiResponse({
      candidates: [],
      total: 0,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    }));

    const retryButton = getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(getByText(/no candidates found/i)).toBeInTheDocument();
    });
  });

  it('maintains state during navigation', async () => {
    const mockCandidates = Array.from({ length: 5 }, (_, i) => 
      createMockCandidate({ id: `candidate-${i + 1}`, name: `Candidate ${i + 1}` })
    );

    mockFetch(mockApiResponse({
      candidates: mockCandidates,
      total: 5,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    }));

    const { getByRole, getByText } = renderWithProviders(<App />);

    // Navigate to candidates and apply filters
    const candidatesLink = getByRole('link', { name: /candidates/i });
    await user.click(candidatesLink);

    await waitFor(() => {
      expect(getByText('Candidates')).toBeInTheDocument();
    });

    // Apply a filter
    const scoreFilter = getByRole('slider', { name: /minimum score/i });
    await user.click(scoreFilter);
    // Simulate changing score to 80
    
    // Select a candidate
    const candidateCheckbox = getByRole('checkbox', { name: /select candidate 1/i });
    await user.click(candidateCheckbox);

    // Navigate away and back
    const dashboardLink = getByRole('link', { name: /dashboard/i });
    await user.click(dashboardLink);

    await waitFor(() => {
      expect(getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate back to candidates
    await user.click(candidatesLink);

    await waitFor(() => {
      expect(getByText('Candidates')).toBeInTheDocument();
    });

    // Verify state is maintained
    expect(candidateCheckbox).toBeChecked();
    // Score filter should still be applied
  });

  it('supports keyboard-only navigation', async () => {
    const mockCandidates = [createMockCandidate({ id: '1', name: 'Test Candidate' })];

    mockFetch(mockApiResponse({
      candidates: mockCandidates,
      total: 1,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    }));

    const { getByRole } = renderWithProviders(<App />);

    // Navigate using keyboard
    await user.tab(); // Focus on first interactive element
    
    // Find candidates link and activate with keyboard
    const candidatesLink = getByRole('link', { name: /candidates/i });
    candidatesLink.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(document.title).toContain('Candidates');
    });

    // Navigate to candidate actions using keyboard
    await user.tab(); // Search input
    await user.tab(); // Filter button
    await user.tab(); // First candidate checkbox
    
    const candidateCheckbox = document.activeElement as HTMLElement;
    expect(candidateCheckbox).toHaveAttribute('type', 'checkbox');
    
    // Select using space key
    await user.keyboard(' ');
    expect(candidateCheckbox).toBeChecked();

    // Navigate to view profile button
    await user.tab();
    await user.tab();
    
    const viewButton = document.activeElement as HTMLElement;
    expect(viewButton).toHaveTextContent(/view/i);
    
    // Activate with Enter
    mockFetch(mockApiResponse(mockCandidates[0]));
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(getByRole('dialog')).toBeInTheDocument();
    });
  });
});