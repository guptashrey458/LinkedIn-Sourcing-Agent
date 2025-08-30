import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar, Header, Breadcrumb, Grid, GridItem, Container } from '../components/layout';

// Test wrapper for components that need router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Layout Components', () => {
  describe('Sidebar', () => {
    it('renders sidebar with navigation items', () => {
      render(
        <RouterWrapper>
          <Sidebar />
        </RouterWrapper>
      );
      
      expect(screen.getByText('LinkedIn Sourcing')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Jobs')).toBeInTheDocument();
      expect(screen.getByText('Candidates')).toBeInTheDocument();
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('can be collapsed', () => {
      const { rerender } = render(
        <RouterWrapper>
          <Sidebar collapsed={false} />
        </RouterWrapper>
      );
      
      expect(screen.getByText('LinkedIn Sourcing')).toBeInTheDocument();
      
      rerender(
        <RouterWrapper>
          <Sidebar collapsed={true} />
        </RouterWrapper>
      );
      
      expect(screen.queryByText('LinkedIn Sourcing')).not.toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('renders header with search and user menu', () => {
      render(<Header />);
      
      expect(screen.getByPlaceholderText(/search candidates/i)).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows notifications button', () => {
      render(<Header />);
      
      const notificationButton = screen.getByLabelText('Notifications');
      expect(notificationButton).toBeInTheDocument();
    });
  });

  describe('Breadcrumb', () => {
    it('renders breadcrumb items', () => {
      const items = [
        { label: 'Jobs', href: '/jobs' },
        { label: 'Create Job' }
      ];
      
      render(
        <RouterWrapper>
          <Breadcrumb items={items} />
        </RouterWrapper>
      );
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Jobs')).toBeInTheDocument();
      expect(screen.getByText('Create Job')).toBeInTheDocument();
    });

    it('can hide home breadcrumb', () => {
      const items = [
        { label: 'Jobs', href: '/jobs' },
        { label: 'Create Job' }
      ];
      
      render(
        <RouterWrapper>
          <Breadcrumb items={items} showHome={false} />
        </RouterWrapper>
      );
      
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.getByText('Jobs')).toBeInTheDocument();
    });
  });

  describe('Grid', () => {
    it('renders grid with items', () => {
      render(
        <Grid cols={2}>
          <GridItem colSpan={1}>Item 1</GridItem>
          <GridItem colSpan={1}>Item 2</GridItem>
        </Grid>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Container', () => {
    it('renders container with content', () => {
      render(
        <Container>
          <div>Test content</div>
        </Container>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });
});