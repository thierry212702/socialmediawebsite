// File: src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BACKGROUND_THEMES } from '../utils/constants';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [backgroundTheme, setBackgroundTheme] = useLocalStorage('backgroundTheme', 'default');
  const [accentColor, setAccentColor] = useLocalStorage('accentColor', '#3B82F6');

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark/light theme
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Apply background theme
    applyBackgroundTheme(backgroundTheme);

    // Apply accent color
    root.style.setProperty('--color-accent', accentColor);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#18181B' : '#EFF6FF');
    }
  }, [theme, backgroundTheme, accentColor]);

  // Apply background theme
  const applyBackgroundTheme = (themeId) => {
    const body = document.body;
    const theme = BACKGROUND_THEMES.find(t => t.id === themeId) || BACKGROUND_THEMES[0];
    
    // Remove all theme classes
    body.classList.remove('bg-gradient-sunset', 'bg-gradient-ocean', 'bg-gradient-forest', 
                         'bg-gradient-cotton-candy', 'bg-gradient-warm-light', 'bg-gradient-midnight');
    
    // Add gradient class if it's a gradient theme
    if (theme.type === 'gradient') {
      body.classList.add(`bg-gradient-${themeId}`);
    } else {
      // For solid colors, set background color
      body.style.background = theme.color;
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Set specific theme
  const setThemeMode = (mode) => {
    setTheme(mode);
  };

  // Set background theme
  const setBackgroundThemeById = (themeId) => {
    setBackgroundTheme(themeId);
  };

  // Set accent color
  const setAccentColorHex = (color) => {
    setAccentColor(color);
  };

  // Reset to default theme
  const resetTheme = () => {
    setTheme('light');
    setBackgroundTheme('default');
    setAccentColor('#3B82F6');
  };

  // Get current theme info
  const getCurrentTheme = () => {
    return {
      mode: theme,
      background: BACKGROUND_THEMES.find(t => t.id === backgroundTheme) || BACKGROUND_THEMES[0],
      accentColor,
    };
  };

  const value = {
    theme,
    backgroundTheme,
    accentColor,
    toggleTheme,
    setThemeMode,
    setBackgroundThemeById,
    setAccentColorHex,
    resetTheme,
    getCurrentTheme,
    availableThemes: BACKGROUND_THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};