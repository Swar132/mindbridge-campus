import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center gap-1.5 p-1 rounded-full transition-all duration-300 focus:outline-hidden ${
        isDark
          ? 'bg-slate-900/90 border border-slate-700/90 text-slate-300 shadow-inner'
          : 'bg-sky-50/90 border border-sky-200/90 text-sky-800 shadow-inner'
      } ${className}`}
      title={`Toggle theme (currently ${theme})`}
    >
      {/* Sliding liquid capsule */}
      <span
        className={`absolute top-1 bottom-1 w-6 h-6 rounded-full transition-all duration-300 transform shadow-md ${
          isDark
            ? 'left-7 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white translate-x-0'
            : 'left-1 bg-white text-amber-500 translate-x-0'
        }`}
        style={{
          boxShadow: isDark
            ? '0 0 12px rgba(56, 189, 248, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
            : '0 2px 8px rgba(2, 132, 199, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
        }}
      />

      {/* Sun icon */}
      <span className="relative z-10 w-6 h-6 flex items-center justify-center transition-colors duration-200">
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-500'}`} />
      </span>

      {/* Moon icon */}
      <span className="relative z-10 w-6 h-6 flex items-center justify-center transition-colors duration-200">
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-slate-400'}`} />
      </span>

      {showLabel && (
        <span className="text-xs font-semibold px-1.5 text-slate-700 dark:text-slate-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
