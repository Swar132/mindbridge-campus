import React, { useState, useEffect } from 'react';
import { Menu, Sparkles, PhoneCall, Wind, Heart, Wifi, WifiOff, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';

export default function Navbar({
  onOpenMobileMenu,
  onOpenEmergency,
  onOpenCheckIn,
  onOpenBreathing,
  onNavigate,
}) {
  const { user, demoLogin } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 liquid-glass-apple border-b border-sky-100/90 dark:border-slate-800/90 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors duration-300">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation"
          className="p-2 rounded-2xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 md:hidden transition shadow-xs"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="hidden sm:inline text-sky-700 dark:text-sky-400 font-bold">MindBridge Campus</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 border border-sky-200/80 dark:border-slate-700/80 text-sky-950 dark:text-sky-200 capitalize font-medium flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span>
              {user?.role === 'student' ? 'Student Wellbeing Sanctuary' : user?.role === 'counsellor' ? 'Counsellor Care Portal' : 'Campus Admin Console'}
            </span>
          </span>
        </div>
      </div>

      {/* Right: Controls, Theme Toggle & Interactive Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network State Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition ${
            isOnline
              ? 'bg-sky-50/90 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
              : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 animate-pulse'
          }`}
          title={isOnline ? 'Connected to MindBridge Cloud' : 'Working in Offline Mode'}
        >
          {isOnline ? <Wifi className="w-3 h-3 text-sky-600 dark:text-sky-400" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Apple iOS Liquid Glass Theme Toggle */}
        <ThemeToggle />

        {/* Demo Role Switcher */}
        <div className="hidden lg:flex items-center bg-white/90 dark:bg-slate-800/90 p-0.5 rounded-2xl border border-sky-100 dark:border-slate-700 text-xs font-semibold shadow-xs">
          <button
            onClick={() => demoLogin('student')}
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'student'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => demoLogin('counsellor')}
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'counsellor'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Counsellor
          </button>
          <button
            onClick={() => demoLogin('admin')}
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'admin'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Admin
          </button>
        </div>

        {/* 2-Min Breathing Shortcut */}
        {user?.role === 'student' && onOpenBreathing && (
          <button
            onClick={onOpenBreathing}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-sky-800 dark:text-sky-300 bg-sky-50/90 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl border border-sky-200/90 dark:border-sky-800/90 transition font-semibold"
          >
            <Wind className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-pulse" />
            <span>Breathe</span>
          </button>
        )}

        {/* Quick Check-in Button */}
        {user?.role === 'student' && (
          <button
            onClick={onOpenCheckIn}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-500/20 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check in</span>
          </button>
        )}

        {/* Settings button shortcut */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('settings')}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        )}

        {/* Notification Bell */}
        <NotificationDropdown />

        {/* SOS Crisis Button */}
        <button
          onClick={onOpenEmergency}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition active:scale-95"
          title="Confidential 24/7 Helpline: 14416"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SOS 14416</span>
        </button>
      </div>
    </header>
  );
}
