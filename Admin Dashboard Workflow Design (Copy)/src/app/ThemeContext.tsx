import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/** Returns class strings for light vs dark variants */
export function useT() {
  const { isDark } = useTheme();
  return {
    isDark,
    page:        isDark ? 'bg-gray-900'                 : 'bg-gray-50',
    card:        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-100',
    cardFlat:    isDark ? 'bg-gray-800'                 : 'bg-white',
    header:      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-100',
    surface:     isDark ? 'bg-gray-900'                 : 'bg-gray-50',
    border:      isDark ? 'border-gray-700'             : 'border-orange-100',
    borderGray:  isDark ? 'border-gray-700'             : 'border-gray-100',
    divide:      isDark ? 'divide-gray-700'             : 'divide-gray-50',
    text:        isDark ? 'text-gray-100'               : 'text-gray-800',
    textSm:      isDark ? 'text-gray-300'               : 'text-gray-600',
    textXs:      isDark ? 'text-gray-400'               : 'text-gray-500',
    textMuted:   isDark ? 'text-gray-500'               : 'text-gray-400',
    input:       isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-800',
    tabBar:      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-100',
    redLight:    isDark ? 'bg-orange-900/30 border-orange-800' : 'bg-orange-50 border-orange-100',
    hoverRow:    isDark ? 'hover:bg-gray-700'           : 'hover:bg-orange-50',
    badge:       isDark ? 'bg-gray-700 text-gray-300'   : 'bg-gray-100 text-gray-600',
  };
}
