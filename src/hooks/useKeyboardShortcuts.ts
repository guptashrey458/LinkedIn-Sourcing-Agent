import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (enabled: boolean = true) => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'd',
      ctrlKey: true,
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard'
    },
    {
      key: 'c',
      ctrlKey: true,
      action: () => navigate('/candidates'),
      description: 'Go to Candidates'
    },
    {
      key: 'j',
      ctrlKey: true,
      action: () => navigate('/jobs'),
      description: 'Go to Jobs'
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => navigate('/pipeline'),
      description: 'Go to Pipeline'
    },
    {
      key: ',',
      ctrlKey: true,
      action: () => navigate('/settings'),
      description: 'Go to Settings'
    },
    // Search shortcut
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search'
    },
    // Theme toggle
    {
      key: 't',
      altKey: true,
      action: () => {
        const themeToggle = document.querySelector('[data-theme-toggle]') as HTMLButtonElement;
        if (themeToggle) {
          themeToggle.click();
        }
      },
      description: 'Toggle theme'
    },
    // Help
    {
      key: 'F1',
      action: () => {
        // Show help modal or navigate to help page
        console.log('Help requested');
      },
      description: 'Show help'
    },
    // Show shortcuts
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Show shortcuts modal
        console.log('Show keyboard shortcuts');
      },
      description: 'Show keyboard shortcuts'
    }
  ];

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = !!s.ctrlKey === event.ctrlKey;
        const altMatch = !!s.altKey === event.altKey;
        const shiftMatch = !!s.shiftKey === event.shiftKey;
        
        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, navigate]);

  return { shortcuts };
};