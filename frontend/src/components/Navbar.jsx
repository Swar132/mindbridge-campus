import React, { useState, useEffect } from 'react';
import { Menu, Sparkles, PhoneCall, Wind, Heart, Flame, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

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
    <header className="sticky top-0 z-30 liquid-glass border-b border-cream-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation"
          className="p-2 rounded-xl text-charcoal-700 hover:text-charcoal-900 hover:bg-white/80 md:hidden transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="hidden sm:inline text-teal-800 font-bold">MindBridge Campus</span>
          <span className="text-cream-300 hidden sm:inline">/</span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-teal-200/80 text-teal-900 capitalize font-medium flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>
              {user?.role === 'student' ? 'Student Wellbeing Sanctuary' : user?.role === 'counsellor' ? 'Counsellor Care Portal' : 'Campus Admin Console'}
            </span>
          </span>
        </div>
      </div>

      {/* Right: Controls & Interactive Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network State Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition ${
            isOnline
              ? 'bg-teal-50/80 border-teal-200 text-teal-800'
              : 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
          }`}
          title={isOnline ? 'Connected to MindBridge Cloud' : 'Working in Offline Mode'}
        >
          {isOnline ? <Wifi className="w-3 h-3 text-teal-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Demo Role Switcher */}
        <div className="hidden lg:flex items-center bg-white/80 p-0.5 rounded-2xl border border-cream-200 text-xs font-semibold shadow-wellness-sm">
          <button
            onClick={() => demoLogin('student')}
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'student'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm font-bold'
                : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => demoLogin('counsellor')}
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'counsellor'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm font-bold'
                : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Counsellor
          </button>
          <button
            onClick={() => demoLogin('admin')}
            className={`px-3 py-1 rounded-xl transition ${
              user?.role === 'admin'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm font-bold'
                : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Admin
          </button>
        </div>

        {/* 2-Min Breathing Shortcut */}
        {user?.role === 'student' && onOpenBreathing && (
          <button
            onClick={onOpenBreathing}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-teal-800 bg-teal-50/90 hover:bg-teal-100 rounded-xl border border-teal-200/90 transition font-semibold"
          >
            <Wind className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Breathe</span>
          </button>
        )}

        {/* Quick Check-in Button */}
        {user?.role === 'student' && (
          <button
            onClick={onOpenCheckIn}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 via-teal-700 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold rounded-xl transition shadow-glow-teal hover:scale-102 active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check in</span>
          </button>
        )}

        {/* SOS Crisis Button */}
        <button
          onClick={onOpenEmergency}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition hover:shadow-glow-coral"
          title="Confidential 24/7 Helpline: 14416"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SOS 14416</span>
        </button>

        <NotificationDropdown />
      </div>
    </header>
  );
}
