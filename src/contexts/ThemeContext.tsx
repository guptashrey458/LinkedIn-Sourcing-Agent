import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppearanceSettings } from '../types';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  appearance: AppearanceSettings;
  updateAppearance: (appearance: Partial<AppearanceSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  defaultAppearance?: AppearanceSettings;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  defaultAppearance = {
    theme: 'system',
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    fontFamily: 'Inter',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true,
    customBranding: {
      companyName: 'LinkedIn Sourcing Agent',
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
    },
  }
}) => {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(defaultTheme);
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Resolve theme based on current setting
  const resolveTheme = (currentTheme: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Update theme
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    setAppearance(prev => ({ ...prev, theme: newTheme }));
    localStorage.setItem('theme', newTheme);
  };

  // Update appearance settings
  const updateAppearance = (newAppearance: Partial<AppearanceSettings>) => {
    setAppearance(prev => ({ ...prev, ...newAppearance }));
    if (newAppearance.theme) {
      setThemeState(newAppearance.theme);
    }
  };

  // Apply theme to document
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    const root = document.documentElement;
    
    // Apply theme class
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom CSS variables
    root.style.setProperty('--color-primary', appearance.primaryColor);
    root.style.setProperty('--color-secondary', appearance.secondaryColor);
    root.style.setProperty('--font-family', appearance.fontFamily);
    
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--font-size-base', fontSizeMap[appearance.fontSize]);

    // Apply compact mode
    if (appearance.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Apply animations setting
    if (!appearance.showAnimations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [theme, appearance]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        setResolvedTheme(getSystemTheme());
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    appearance,
    updateAppearance,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};