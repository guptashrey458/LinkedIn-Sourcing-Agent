import { describe, it, expect } from 'vitest';
import { renderWithProviders, runAccessibilityTestSuite, createMockCandidate } from '@/test';
import { DataTable } from '../DataTable';

describe('DataTable Accessibility Tests', () => {
  const mockData = Array.from({ length: 5 }, (_, i) => 
    createMockCandidate({ id: `${i + 1}`, name: `Candidate ${i + 1}` })
  );

  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
    },
    {
      id: 'company',
      header: 'Company',
      accessorKey: 'company',
    },
    {
      id: 'score',
      header: 'Score',
      accessorKey: 'score',
    },
  ];

  it('meets WCAG accessibility standards', async () => {
    const renderResult = renderWithProviders(
      <DataTable data={mockData} columns={columns} />
    );

    await runAccessibilityTestSuite(renderResult, {
      expectedFocusableElements: ['button', 'input'],
      expectedAriaAttributes: {
        'table': {
          'role': 'table',
          'aria-label': 'Data table',
        },
        'thead': {
          'role': 'rowgroup',
        },
        'tbody': {
          'role': 'rowgroup',
        },
      },
    });
  });

  it('has proper table structure and semantics', () => {
    const { getByRole, getAllByRole } = renderWithProviders(
      <DataTable data={mockData} columns={columns} />
    );

    // Table should have proper role
    const table = getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('aria-label');

    // Headers should be properly marked
    const columnHeaders = getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(columns.length);
    
    columnHeaders.forEach((header, index) => {
      expect(header).toHaveAttribute('scope', 'col');
      expect(header).toHaveTextContent(columns[index].header);
    });

    // Rows should be properly marked
    const rows = getAllByRole('row');
    expect(rows).toHaveLength(mockData.length + 1); // +1 for header row
  });

  it('supports keyboard navigation', async () => {
    const user = await import('@testing-library/user-event').then(m => m.userEvent.setup());
    
    const { getAllByRole } = renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={columns}
        sorting={{ enabled: true }}
        pagination={{ enabled: true }}
      />
    );

    // Test sorting button keyboard navigation
    const sortButtons = getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-label')?.includes('Sort by')
    );

    if (sortButtons.length > 0) {
      const firstSortButton = sortButtons[0];
      firstSortButton.focus();
      expect(firstSortButton).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(firstSortButton).toHaveAttribute('aria-sort');
    }
  });

  it('provides proper ARIA labels for interactive elements', () => {
    const { getAllByRole } = renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={columns}
        sorting={{ enabled: true }}
        pagination={{ enabled: true }}
        selection={{ enabled: true }}
      />
    );

    // Sort buttons should have descriptive labels
    const sortButtons = getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-label')?.includes('Sort by')
    );
    
    sortButtons.forEach((button, index) => {
      expect(button).toHaveAttribute('aria-label', `Sort by ${columns[index].header}`);
    });

    // Selection checkboxes should have labels
    const checkboxes = getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-label');
    });
  });

  it('announces sorting changes to screen readers', async () => {
    const user = await import('@testing-library/user-event').then(m => m.userEvent.setup());
    
    const { getByRole, getAllByRole } = renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={columns}
        sorting={{ enabled: true }}
      />
    );

    const sortButton = getAllByRole('button')[0]; // First sort button
    await user.click(sortButton);

    // Check for aria-sort attribute
    const header = sortButton.closest('[role="columnheader"]');
    expect(header).toHaveAttribute('aria-sort');

    // Check for live region announcements
    const liveRegions = document.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('provides proper pagination accessibility', () => {
    const { getByRole, getAllByRole } = renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={columns}
        pagination={{ 
          enabled: true,
          page: 2,
          total: 50,
          limit: 10,
        }}
      />
    );

    // Pagination should have navigation role
    const pagination = getByRole('navigation', { name: /pagination/i });
    expect(pagination).toBeInTheDocument();

    // Page buttons should have proper labels
    const pageButtons = getAllByRole('button').filter(btn => 
      btn.textContent?.match(/^\d+$/) || 
      btn.getAttribute('aria-label')?.includes('page')
    );

    pageButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });

    // Current page should be marked
    const currentPageButton = pagination.querySelector('[aria-current="page"]');
    expect(currentPageButton).toBeInTheDocument();
  });

  it('handles empty state accessibility', () => {
    const { getByRole, getByText } = renderWithProviders(
      <DataTable data={[]} columns={columns} />
    );

    const table = getByRole('table');
    expect(table).toBeInTheDocument();

    // Empty state should be announced
    const emptyMessage = getByText(/no data available/i);
    expect(emptyMessage).toBeInTheDocument();
    expect(emptyMessage).toHaveAttribute('role', 'status');
  });

  it('provides loading state accessibility', () => {
    const { getByRole } = renderWithProviders(
      <DataTable data={mockData} columns={columns} loading />
    );

    // Loading indicator should be announced
    const loadingIndicator = getByRole('status');
    expect(loadingIndicator).toBeInTheDocument();
    expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
  });

  it('supports high contrast mode', () => {
    const { container } = renderWithProviders(
      <DataTable data={mockData} columns={columns} />
    );

    // Check for proper border styles that work in high contrast
    const table = container.querySelector('table');
    expect(table).toHaveClass('border-collapse');
    
    const cells = container.querySelectorAll('td, th');
    cells.forEach(cell => {
      expect(cell).toHaveClass('border');
    });
  });

  it('maintains focus management during interactions', async () => {
    const user = await import('@testing-library/user-event').then(m => m.userEvent.setup());
    
    const { getAllByRole } = renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={columns}
        sorting={{ enabled: true }}
      />
    );

    const sortButton = getAllByRole('button')[0];
    
    // Focus should be maintained after sorting
    sortButton.focus();
    expect(sortButton).toHaveFocus();
    
    await user.click(sortButton);
    expect(sortButton).toHaveFocus();
  });

  it('provides proper row selection accessibility', async () => {
    const user = await import('@testing-library/user-event').then(m => m.userEvent.setup());
    
    const { getAllByRole, getByRole } = renderWithProviders(
      <DataTable 
        data={mockData} 
        columns={columns}
        selection={{ enabled: true }}
      />
    );

    // Select all checkbox
    const selectAllCheckbox = getByRole('checkbox', { name: /select all/i });
    expect(selectAllCheckbox).toBeInTheDocument();
    expect(selectAllCheckbox).toHaveAttribute('aria-label', 'Select all rows');

    // Individual row checkboxes
    const rowCheckboxes = getAllByRole('checkbox').filter(cb => cb !== selectAllCheckbox);
    expect(rowCheckboxes).toHaveLength(mockData.length);

    rowCheckboxes.forEach((checkbox, index) => {
      expect(checkbox).toHaveAttribute('aria-label', `Select row ${index + 1}`);
    });

    // Test selection announcement
    await user.click(rowCheckboxes[0]);
    
    // Should update aria-selected on the row
    const row = rowCheckboxes[0].closest('[role="row"]');
    expect(row).toHaveAttribute('aria-selected', 'true');
  });
});