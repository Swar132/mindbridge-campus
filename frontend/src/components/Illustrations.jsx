import React from 'react';

// Ambient Liquid Glass Background Blobs
export function LiquidBlobBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft Blue Liquid Blob */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-sky-200/40 via-teal-100/30 to-transparent blur-3xl animate-liquid-blob" />
      {/* Warm Peach Liquid Blob */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-peach-200/40 via-coral-100/25 to-transparent blur-3xl animate-liquid-blob" style={{ animationDelay: '-5s' }} />
      {/* Soft Teal Liquid Blob */}
      <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-teal-200/35 via-mint-100/30 to-transparent blur-3xl animate-liquid-blob" style={{ animationDelay: '-9s' }} />
    </div>
  );
}

// Friendly, comforting MindBridge Mascot & Companion (Mindy)
export function MindyCharacter({ variant = 'happy', className = 'w-24 h-24', animated = true }) {
  return (
    <div className={`relative inline-block select-none ${animated ? 'animate-float-slow' : ''} ${className}`}>
      <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="mindy-aura" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#99F6E4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="mindy-body" x1="20" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F0FDFA" />
            <stop offset="100%" stopColor="#CCFBF1" />
          </linearGradient>
          <linearGradient id="mindy-leaf" x1="60" y1="10" x2="80" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <radialGradient id="blush-glow" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FDBA74" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft Ambient Halo */}
        <circle cx="70" cy="75" r="54" fill="url(#mindy-aura)" className="animate-pulse-gentle" />

        {/* Mascot Organic Body with Specular Highlight */}
        <path
          d="M70 30C42 30 26 50 26 78C26 104 44 118 70 118C96 118 114 104 114 78C114 50 98 30 70 30Z"
          fill="url(#mindy-body)"
          stroke="#2DD4BF"
          strokeWidth="2.5"
        />

        {/* Sprout on Head */}
        <path
          d="M70 30C70 20 62 14 55 16C54 24 62 29 70 30Z"
          fill="url(#mindy-leaf)"
          stroke="#0D9488"
          strokeWidth="1.5"
        />
        <path
          d="M70 30C72 18 82 12 89 15C88 23 78 28 70 30Z"
          fill="url(#mindy-leaf)"
          stroke="#0D9488"
          strokeWidth="1.5"
        />
        <circle cx="70" cy="30" r="2.5" fill="#0D9488" />

        {/* Warm Peach Blushing Cheeks */}
        <circle cx="45" cy="80" r="7" fill="url(#blush-glow)" />
        <circle cx="95" cy="80" r="7" fill="url(#blush-glow)" />

        {/* Eyes according to variant */}
        {variant === 'happy' && (
          <>
            <path d="M46 68C48 64 54 64 56 68" stroke="#134E4A" strokeWidth="3" strokeLinecap="round" />
            <path d="M84 68C86 64 92 64 94 68" stroke="#134E4A" strokeWidth="3" strokeLinecap="round" />
            <path d="M63 80C66 85 74 85 77 80" stroke="#134E4A" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {variant === 'calm' && (
          <>
            <path d="M46 70Q51 66 56 70" stroke="#134E4A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M84 70Q89 66 94 70" stroke="#134E4A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M65 81C68 83 72 83 75 81" stroke="#134E4A" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {variant === 'waving' && (
          <>
            <circle cx="51" cy="67" r="3" fill="#134E4A" />
            <circle cx="89" cy="67" r="3" fill="#134E4A" />
            <circle cx="52.5" cy="65.5" r="1" fill="#FFFFFF" />
            <circle cx="90.5" cy="65.5" r="1" fill="#FFFFFF" />
            <path d="M63 80C66 86 74 86 77 80" stroke="#134E4A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Waving Arm with Warm Peach Sparkle */}
            <path d="M106 72C118 64 124 50 120 44C115 39 108 52 104 64" fill="#CCFBF1" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="126" cy="40" r="3" fill="#FDBA74" />
          </>
        )}

        {variant === 'thinking' && (
          <>
            <circle cx="51" cy="67" r="2.8" fill="#134E4A" />
            <circle cx="89" cy="67" r="2.8" fill="#134E4A" />
            <ellipse cx="70" cy="81" rx="4" ry="2.5" fill="#134E4A" />
            {/* Wonder Sparkles */}
            <path d="M110 35L112 40L117 42L112 44L110 49L108 44L103 42L108 40L110 35Z" fill="#FDBA74" />
          </>
        )}
      </svg>
    </div>
  );
}

// Scenic Sunrise Banner Illustration
export function SunriseBannerIllustration({ className = 'w-full h-36' }) {
  return (
    <svg viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="#FFF7ED" />
          <stop offset="100%" stopColor="#CCFBF1" />
        </linearGradient>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="hillGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="hillGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0D9488" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <rect width="800" height="200" fill="url(#skyGrad)" />
      <circle cx="400" cy="115" r="54" fill="url(#sunGrad)" opacity="0.85" />

      {/* Rolling Hills */}
      <path d="M0 160C140 135 240 170 360 145C480 120 620 160 800 135V200H0V160Z" fill="url(#hillGrad1)" />
      <path d="M0 175C120 155 280 185 450 160C620 135 720 175 800 165V200H0V175Z" fill="url(#hillGrad2)" />
    </svg>
  );
}

// Night Sky Illustration for Sleep Sanctuary
export function NightSkyIllustration({ className = 'w-full h-36' }) {
  return (
    <svg viewBox="0 0 300 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="nightGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="60%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#134E4A" />
        </linearGradient>
        <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FED7AA" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="300" height="180" rx="24" fill="url(#nightGrad)" />

      {/* Glowing Moon */}
      <circle cx="230" cy="50" r="32" fill="url(#moonGlow)" />
      <circle cx="230" cy="50" r="16" fill="#FFF7ED" />
      <circle cx="235" cy="48" r="14" fill="#1E293B" />

      {/* Constellation Stars */}
      <circle cx="50" cy="35" r="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="95" cy="55" r="2" fill="#FED7AA" opacity="0.9" />
      <circle cx="140" cy="25" r="1.5" fill="#FFFFFF" opacity="0.8" />
      <circle cx="170" cy="65" r="2" fill="#FFFFFF" opacity="0.85" />
      <circle cx="70" cy="100" r="1.5" fill="#FED7AA" opacity="0.75" />
      <circle cx="120" cy="120" r="2" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

// Zen Stones Illustration for Grounding & Stress Management
export function ZenStonesIllustration({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="stone-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#99F6E4" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="stone-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="stone-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="100" rx="48" ry="11" stroke="#CCFBF1" strokeWidth="1.5" />
      <ellipse cx="60" cy="94" rx="36" ry="14" fill="url(#stone-2)" />
      <ellipse cx="60" cy="76" rx="27" ry="11" fill="url(#stone-3)" />
      <ellipse cx="60" cy="60" rx="20" ry="9" fill="url(#stone-1)" />

      {/* Sprout atop stone */}
      <path d="M60 52C58 44 50 40 44 42C45 49 53 52 60 52Z" fill="#2DD4BF" />
      <path d="M60 52C62 42 70 38 76 40C75 47 67 51 60 52Z" fill="#0D9488" />
    </svg>
  );
}

// Expressive Mood Icon Visualizer
export const MOOD_VISUALS = {
  'Very Happy': {
    emoji: '🌟',
    label: 'Flourishing',
    bg: 'bg-gradient-to-br from-amber-50 to-peach-100',
    border: 'border-peach-300',
    text: 'text-amber-900',
    ring: 'ring-peach-400',
    accentColor: '#F59E0B',
    accentGradient: 'from-amber-400 to-peach-500',
    sub: 'Full of vitality & joy',
  },
  'Happy': {
    emoji: '😊',
    label: 'Positive',
    bg: 'bg-gradient-to-br from-teal-50 to-mint-100',
    border: 'border-teal-300',
    text: 'text-teal-900',
    ring: 'ring-teal-400',
    accentColor: '#0D9488',
    accentGradient: 'from-teal-400 to-mint-500',
    sub: 'Good head space',
  },
  'Neutral': {
    emoji: '🌿',
    label: 'Balanced',
    bg: 'bg-gradient-to-br from-sky-50 to-teal-100/70',
    border: 'border-sky-300',
    text: 'text-sky-900',
    ring: 'ring-sky-400',
    accentColor: '#0284C7',
    accentGradient: 'from-sky-400 to-teal-500',
    sub: 'Steady and present',
  },
  'Sad': {
    emoji: '🌧️',
    label: 'Gentle Low',
    bg: 'bg-gradient-to-br from-blue-50 to-sky-100',
    border: 'border-blue-300',
    text: 'text-blue-900',
    ring: 'ring-blue-400',
    accentColor: '#3B82F6',
    accentGradient: 'from-blue-400 to-sky-500',
    sub: 'Needing gentle care',
  },
  'Anxious': {
    emoji: '💭',
    label: 'Overthinking',
    bg: 'bg-gradient-to-br from-purple-50 to-sky-100',
    border: 'border-purple-300',
    text: 'text-purple-900',
    ring: 'ring-purple-400',
    accentColor: '#8B5CF6',
    accentGradient: 'from-purple-400 to-sky-500',
    sub: 'Wandering mind',
  },
  'Stressed': {
    emoji: '⚡',
    label: 'Pressured',
    bg: 'bg-gradient-to-br from-peach-50 to-coral-100',
    border: 'border-peach-300',
    text: 'text-coral-900',
    ring: 'ring-peach-400',
    accentColor: '#F97316',
    accentGradient: 'from-peach-400 to-coral-500',
    sub: 'Tension build-up',
  },
  'Exhausted': {
    emoji: '🌙',
    label: 'Depleted',
    bg: 'bg-gradient-to-br from-slate-100 to-teal-50',
    border: 'border-slate-300',
    text: 'text-slate-800',
    ring: 'ring-teal-400',
    accentColor: '#0D9488',
    accentGradient: 'from-slate-400 to-teal-600',
    sub: 'Ready for deep rest',
  },
};
