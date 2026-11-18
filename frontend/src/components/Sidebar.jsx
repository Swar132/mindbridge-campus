import React from 'react';
import {
  LayoutDashboard,
  Smile,
  Zap,
  Moon,
  BookOpen,
  Bot,
  TrendingUp,
  Library,
  Users,
  Settings,
  ShieldCheck,
  Stethoscope,
  LogOut,
  Flame,
  Shield,
  Activity,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ activeTab, onSelectTab, isMobileOpen, onCloseMobile }) {
  const { user, logout, isStudent, isCounsellor, isAdmin } = useAuth();

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mood', label: 'Mood Tracker', icon: Smile },
    { id: 'stress', label: 'Stress Radar', icon: Zap },
    { id: 'sleep', label: 'Sleep Sanctuary', icon: Moon },
    { id: 'journal', label: 'Private Journal', icon: BookOpen, badge: 'Private' },
    { id: 'ai', label: 'Mindy AI', icon: Bot, badge: 'AI' },
    { id: 'insights', label: 'Insights & Trends', icon: TrendingUp },
    { id: 'resources', label: 'Resource Library', icon: Library },
    { id: 'counsellors', label: 'Campus Counsellors', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const counsellorNavItems = [
    { id: 'counsellor-portal', label: 'Counsellor Portal', icon: Stethoscope },
    { id: 'counsellors', label: 'Staff Directory', icon: Users },
    { id: 'resources', label: 'Resource Guides', icon: Library },
    { id: 'insights', label: 'Campus Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'admin-portal', label: 'Governance Command', icon: ShieldCheck },
    { id: 'dashboard', label: 'Student View', icon: LayoutDashboard },
    { id: 'counsellor-portal', label: 'Counsellor View', icon: Stethoscope },
    { id: 'resources', label: 'Resource Editor', icon: Library },
    { id: 'insights', label: 'Campus Trends', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  let navItems = studentNavItems;
  if (isCounsellor) navItems = counsellorNavItems;
  else if (isAdmin) navItems = adminNavItems;

  const handleSelect = (id) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 liquid-glass-apple border-r border-sky-100/90 dark:border-slate-800/90 flex flex-col justify-between transition-all duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header — Modern Geometric Blue Style (matching reference image) */}
          <div className="px-5 py-4 border-b border-sky-100/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Geometric Blue M Logo */}
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-sky-500/20">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white">
                  <path d="M4 18L9 6L12 13L15 6L20 18H16L14 12L12 16L10 12L8 18H4Z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
                  MINDBRIDGE
                </span>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase">
                  Campus Health
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="px-3.5 py-2.5 mx-3 my-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-sky-100 dark:border-slate-700/80 flex items-center gap-2.5 shadow-xs">
            <div className="relative">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-400"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name || 'Emily Smith'}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="capitalize">{user?.role}</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-400" /> 7d
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links — Elegant Light Blue & White Pills */}
          <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pt-1 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/90 dark:border-sky-800/90 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Area with Theme Toggle & Logout */}
          <div className="p-3 border-t border-sky-100/80 dark:border-slate-800/80 space-y-2 bg-white/40 dark:bg-slate-900/40">
            {/* Quick Theme Switcher in Sidebar Footer */}
            <div className="px-3 py-2 rounded-xl bg-sky-50/70 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
