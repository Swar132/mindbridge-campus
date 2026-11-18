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
      className={`relative inline-flex items-center h-8 w-[58px] p-[2px] rounded-full transition-all duration-300 focus:outline-none cursor-pointer select-none shrink-0 ${
        isDark
          ? 'bg-slate-900/90 border border-slate-700/80 shadow-inner'
          : 'bg-sky-100/90 border border-sky-200/90 shadow-inner'
      } ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode (currently ${theme})`}
    >
      {/* Sliding liquid glass capsule indicator */}
      <span
        className={`absolute top-[2px] left-[2px] w-[26px] h-[26px] rounded-full transition-transform duration-300 ease-out shadow-sm pointer-events-none ${
          isDark
            ? 'translate-x-[26px] bg-gradient-to-tr from-sky-500 to-indigo-600'
            : 'translate-x-0 bg-white'
        }`}
        style={{
          boxShadow: isDark
            ? '0 1px 6px rgba(56, 189, 248, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
            : '0 1px 4px rgba(2, 132, 199, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
        }}
      />

      {/* Sun icon (left slot) */}
      <span className="relative z-10 w-[26px] h-[26px] flex items-center justify-center transition-colors duration-200 shrink-0 pointer-events-none">
        <Sun
          className={`w-3.5 h-3.5 transition-all duration-200 ${
            !isDark ? 'text-amber-500 scale-100 opacity-100' : 'text-slate-400 scale-90 opacity-60'
          }`}
        />
      </span>

      {/* Moon icon (right slot) */}
      <span className="relative z-10 w-[26px] h-[26px] flex items-center justify-center transition-colors duration-200 shrink-0 pointer-events-none">
        <Moon
          className={`w-3.5 h-3.5 transition-all duration-200 ${
            isDark ? 'text-white scale-100 opacity-100' : 'text-slate-500 scale-90 opacity-60'
          }`}
        />
      </span>

      {showLabel && (
        <span className="ml-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 pointer-events-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
