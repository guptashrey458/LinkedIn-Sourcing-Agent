import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataTable from '../DataTable';

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
];

const mockColumns = [
  { key: 'name', title: 'Name', dataIndex: 'name' as const, sortable: true },
  { key: 'email', title: 'Email', dataIndex: 'email' as const },
  { key: 'role', title: 'Role', dataIndex: 'role' as const, filterable: true },
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable data={[]} columns={mockColumns} loading={true} />);
    
    // Check for skeleton loading elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('shows empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles sorting', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        sorting={{ onChange: onSortChange }}
      />
    );
    
    fireEvent.click(screen.getByText('Name'));
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
  });

  it('handles search', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('handles pagination', () => {
    const onPageChange = vi.fn();
    const pagination = {
      current: 1,
      pageSize: 2,
      total: 3,
      onChange: onPageChange,
    };
    
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        pagination={pagination}
      />
    );
    
    expect(screen.getByText('Showing 1 to 2 of 3 results')).toBeInTheDocument();
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2, 2);
  });

  it('handles row selection', () => {
    const onSelectionChange = vi.fn();
    const selection = {
      selectedRowKeys: [],
      onChange: onSelectionChange,
    };
    
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        selection={selection}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First data row checkbox
    
    expect(onSelectionChange).toHaveBeenCalledWith([1], [mockData[0]]);
  });
});