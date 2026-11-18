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
  Heart,
  Sparkles,
  Flame,
  Shield,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, onSelectTab, isMobileOpen, onCloseMobile }) {
  const { user, logout, isStudent, isCounsellor, isAdmin } = useAuth();

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'mood', label: 'Mood Tracker', icon: Smile, color: 'text-teal-500', activeBg: 'from-teal-500 to-mint-600' },
    { id: 'stress', label: 'Stress Radar', icon: Zap, color: 'text-peach-500', activeBg: 'from-peach-500 to-coral-600' },
    { id: 'sleep', label: 'Sleep Sanctuary', icon: Moon, color: 'text-sky-600', activeBg: 'from-sky-600 to-blue-700' },
    { id: 'journal', label: 'Private Journal', icon: BookOpen, color: 'text-rose-500', badge: 'Private', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'ai', label: 'Mindy AI', icon: Bot, color: 'text-teal-600', badge: 'AI', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'insights', label: 'Insights & Trends', icon: TrendingUp, color: 'text-sky-600', activeBg: 'from-sky-600 to-teal-600' },
    { id: 'resources', label: 'Resource Library', icon: Library, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'counsellors', label: 'Campus Counsellors', icon: Users, color: 'text-teal-700', activeBg: 'from-teal-700 to-sky-700' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-charcoal-400', activeBg: 'from-charcoal-700 to-charcoal-900' },
  ];

  const counsellorNavItems = [
    { id: 'counsellor-portal', label: 'Counsellor Portal', icon: Stethoscope, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'counsellors', label: 'Staff Directory', icon: Users, color: 'text-sky-600', activeBg: 'from-sky-600 to-teal-600' },
    { id: 'resources', label: 'Resource Guides', icon: Library, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'insights', label: 'Campus Analytics', icon: TrendingUp, color: 'text-peach-500', activeBg: 'from-peach-500 to-coral-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-charcoal-400', activeBg: 'from-charcoal-700 to-charcoal-900' },
  ];

  const adminNavItems = [
    { id: 'admin-portal', label: 'Governance Command', icon: ShieldCheck, color: 'text-teal-700', activeBg: 'from-teal-700 to-sky-800' },
    { id: 'dashboard', label: 'Student View', icon: LayoutDashboard, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'counsellor-portal', label: 'Counsellor View', icon: Stethoscope, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'resources', label: 'Resource Editor', icon: Library, color: 'text-sky-500', activeBg: 'from-sky-500 to-teal-600' },
    { id: 'insights', label: 'Campus Trends', icon: TrendingUp, color: 'text-teal-600', activeBg: 'from-teal-600 to-sky-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-charcoal-400', activeBg: 'from-charcoal-700 to-charcoal-900' },
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
          className="fixed inset-0 z-40 bg-charcoal-900/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 liquid-glass border-r border-cream-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-cream-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-600 to-sky-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-glow-teal">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-charcoal-900">
                  MindBridge
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full ml-1.5 uppercase tracking-wider border border-teal-200">
                  Campus PWA
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="px-3.5 py-2.5 mx-3 my-2.5 rounded-2xl bg-white/70 border border-teal-200/70 flex items-center gap-2.5 shadow-wellness-sm">
            <div className="relative">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-400"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white"></span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-charcoal-900 truncate">{user?.full_name || 'Student'}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-charcoal-500">
                <span className="capitalize">{user?.role}</span>
                <span>•</span>
                <span className="text-peach-700 font-bold flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-peach-500 fill-peach-400" /> 7d
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? `bg-gradient-to-r ${item.activeBg} text-white shadow-wellness font-bold scale-101`
                      : 'text-charcoal-700 hover:bg-white/80 hover:text-charcoal-900'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : item.color
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Area with PWA Note & Logout */}
          <div className="p-3 border-t border-cream-200/80 space-y-2 bg-cream-50/50">
            <div className="px-3 py-2 rounded-xl bg-teal-50/90 border border-teal-200/70 text-[10px] text-teal-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 shrink-0 text-teal-600" />
              <span className="leading-tight">Confidential client-side encryption.</span>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
