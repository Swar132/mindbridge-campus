import React, { useState } from 'react';
import { Heart, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, Stethoscope, GraduationCap, Phone, Flame, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MindyCharacter } from '../components/Illustrations';

export default function Login() {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          email,
          password,
          full_name: fullName,
          role,
          department,
          year_of_study: yearOfStudy,
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleName) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(roleName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Liquid background accent */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl animate-liquid-blob" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-peach-200/30 blur-3xl animate-liquid-blob" />

      <div className="max-w-4xl w-full liquid-glass rounded-4xl shadow-wellness-lg border border-white/90 overflow-hidden grid grid-cols-1 md:grid-cols-5 relative z-10">
        {/* Left Side: Rich Wellness Visual & Mindy Mascot */}
        <div className="md:col-span-2 bg-gradient-to-br from-teal-700 via-teal-800 to-sky-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-peach-300/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block">
                  MindBridge
                </span>
                <span className="text-[10px] text-teal-200 font-semibold tracking-wider uppercase">
                  Campus Wellbeing PWA
                </span>
              </div>
            </div>

            <div className="my-6 text-center">
              <div className="inline-block p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner mb-3">
                <MindyCharacter variant="waving" className="w-24 h-24 mx-auto" />
              </div>
              <h2 className="text-xl font-bold leading-tight">
                Your Confidential Campus Sanctuary
              </h2>
              <p className="text-xs text-teal-100/90 mt-2 leading-relaxed max-w-xs mx-auto">
                Evidence-guided mental health tracking, private reflections, and 24/7 empathetic support tailored for college life.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-teal-100">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>Encrypted & Safe</span>
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-peach-300" />
              <span>Installable App</span>
            </span>
          </div>
        </div>

        {/* Right Side: Login Form & 1-Click Demo Buttons */}
        <div className="md:col-span-3 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-charcoal-900">
                {isRegister ? 'Join MindBridge Campus' : 'Welcome to MindBridge'}
              </h3>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 transition underline cursor-pointer"
              >
                {isRegister ? 'Already have an account? Sign in' : 'New student? Register'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* 1-Click Instant Demo Role Pills */}
            <div className="mb-6 p-4 rounded-3xl bg-cream-50/80 border border-cream-200/90 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Instant 1-Click Demo Access:</span>
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-teal-50 border border-teal-200/90 text-teal-900 text-xs font-bold shadow-wellness-sm hover:shadow transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  <span>Student Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('counsellor')}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-peach-50 border border-peach-200/90 text-peach-900 text-xs font-bold shadow-wellness-sm hover:shadow transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-peach-600" />
                  <span>Counsellor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-sky-50 border border-sky-200/90 text-sky-900 text-xs font-bold shadow-wellness-sm hover:shadow transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Swar Sharma"
                      className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-white border border-cream-200 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Campus Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@mindbridge.edu"
                    className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-white border border-cream-200 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-white border border-cream-200 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs sm:text-sm shadow-glow-teal transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign in to Sanctuary'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-2 text-center text-[10px] text-charcoal-400">
            Emergency Crisis Assistance is always free & confidential: <strong>Tele-MANAS 14416</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
