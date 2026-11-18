import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import StressTracker from './pages/StressTracker';
import SleepTracker from './pages/SleepTracker';
import Journal from './pages/Journal';
import AIAssistant from './pages/AIAssistant';
import Insights from './pages/Insights';
import Resources from './pages/Resources';
import Counsellors from './pages/Counsellors';
import CounsellorPortal from './pages/CounsellorPortal';
import AdminPortal from './pages/AdminPortal';
import Settings from './pages/Settings';

// Shared Components & Modals
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import EmergencyModal from './components/EmergencyModal';
import QuickCheckInModal from './components/QuickCheckInModal';
import BreathingExerciseModal from './components/BreathingExerciseModal';
import GroundingToolModal from './components/GroundingToolModal';
import PWAInstallBanner from './components/PWAInstallBanner';
import { LiquidBlobBackground } from './components/Illustrations';
import { Heart, LayoutDashboard, Smile, BookOpen, Bot, Sparkles, TrendingUp } from 'lucide-react';

export default function App() {
  const { user, loading, isAuthenticated, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Global Modals
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isGroundingOpen, setIsGroundingOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-500 text-white flex items-center justify-center font-bold mb-3 shadow-glow-teal animate-bounce-subtle">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <p className="text-xs text-charcoal-600 font-bold">Opening MindBridge Campus Sanctuary...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onOpenCheckIn={() => setIsCheckInOpen(true)}
            onOpenBreathing={() => setIsBreathingOpen(true)}
            onOpenGrounding={() => setIsGroundingOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onNavigate={setActiveTab}
          />
        );
      case 'mood':
        return <MoodTracker onNavigate={setActiveTab} onOpenBreathing={() => setIsBreathingOpen(true)} />;
      case 'stress':
        return <StressTracker onNavigate={setActiveTab} onOpenBreathing={() => setIsBreathingOpen(true)} />;
      case 'sleep':
        return <SleepTracker onNavigate={setActiveTab} />;
      case 'journal':
        return <Journal onNavigate={setActiveTab} />;
      case 'ai':
        return (
          <AIAssistant
            onOpenBreathing={() => setIsBreathingOpen(true)}
            onOpenGrounding={() => setIsGroundingOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onNavigate={setActiveTab}
          />
        );
      case 'insights':
        return (
          <Insights
            onNavigate={setActiveTab}
            onOpenBreathing={() => setIsBreathingOpen(true)}
          />
        );
      case 'resources':
        return (
          <Resources
            onOpenBreathing={() => setIsBreathingOpen(true)}
            onOpenGrounding={() => setIsGroundingOpen(true)}
          />
        );
      case 'counsellors':
        return <Counsellors />;
      case 'counsellor-portal':
        return <CounsellorPortal />;
      case 'admin-portal':
        return <AdminPortal />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard
            onOpenCheckIn={() => setIsCheckInOpen(true)}
            onOpenBreathing={() => setIsBreathingOpen(true)}
            onOpenGrounding={() => setIsGroundingOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex font-sans text-charcoal-800 relative overflow-x-hidden">
      {/* Ambient Morphing Liquid Blobs */}
      <LiquidBlobBackground />

      {/* PWA Install Drawer / Offline Banner */}
      <PWAInstallBanner />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0 relative z-10">
        <Navbar
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
          onOpenCheckIn={() => setIsCheckInOpen(true)}
          onOpenBreathing={() => setIsBreathingOpen(true)}
          onNavigate={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-7 lg:p-8 max-w-6xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* App-like Mobile Bottom Navigation Bar (PWA Experience) */}
      {isStudent && (
        <div className="fixed bottom-0 left-0 right-0 z-30 liquid-glass border-t border-cream-200/90 px-3 py-1.5 md:hidden flex items-center justify-around shadow-wellness-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-3 text-[11px] transition cursor-pointer ${
              activeTab === 'dashboard' ? 'text-teal-700 font-bold' : 'text-charcoal-400 hover:text-charcoal-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="mt-0.5">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('mood')}
            className={`flex flex-col items-center py-1 px-3 text-[11px] transition cursor-pointer ${
              activeTab === 'mood' ? 'text-teal-700 font-bold' : 'text-charcoal-400 hover:text-charcoal-800'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span className="mt-0.5">Mood</span>
          </button>

          {/* Central 1-Tap Check-In Floating Pill */}
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="flex flex-col items-center -mt-4 bg-gradient-to-r from-teal-600 to-sky-600 text-white p-2.5 rounded-full shadow-glow-teal hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center py-1 px-3 text-[11px] transition cursor-pointer ${
              activeTab === 'journal' ? 'text-teal-700 font-bold' : 'text-charcoal-400 hover:text-charcoal-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="mt-0.5">Journal</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center py-1 px-3 text-[11px] transition cursor-pointer ${
              activeTab === 'ai' ? 'text-teal-700 font-bold' : 'text-charcoal-400 hover:text-charcoal-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="mt-0.5">Mindy</span>
          </button>
        </div>
      )}

      {/* Global Modals */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={() => {
          // If on dashboard, force refresh
          if (activeTab === 'dashboard') {
            setActiveTab('dashboard');
          }
        }}
      />
      <BreathingExerciseModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />
      <GroundingToolModal
        isOpen={isGroundingOpen}
        onClose={() => setIsGroundingOpen(false)}
      />
    </div>
  );
}
