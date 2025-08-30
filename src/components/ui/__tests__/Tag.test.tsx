import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tag from '../Tag';

describe('Tag', () => {
  it('renders with default props', () => {
    render(<Tag>Test Tag</Tag>);
    
    const tag = screen.getByText('Test Tag');
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('renders with outline variant', () => {
    render(<Tag variant="outline">Outline Tag</Tag>);
    
    const tag = screen.getByText('Outline Tag');
    expect(tag).toHaveClass('border', 'border-gray-300');
  });

  it('renders with different colors', () => {
    render(<Tag color="blue">Blue Tag</Tag>);
    
    const tag = screen.getByText('Blue Tag');
    expect(tag).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('handles remove functionality', () => {
    const onRemove = vi.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Removable Tag
      </Tag>
    );
    
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);
    
    expect(onRemove).toHaveBeenCalled();
  });

  it('does not show remove button when not removable', () => {
    render(<Tag>Non-removable Tag</Tag>);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});