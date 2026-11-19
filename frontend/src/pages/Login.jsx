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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
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
          phone_number: phoneNumber.trim() ? phoneNumber.trim() : null,
          country_code: countryCode,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Ambient background accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/40 dark:bg-sky-900/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-200/40 dark:bg-purple-900/20 blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-5 relative z-10">
        {/* Left Side: Rich Wellness Visual & Mindy Mascot */}
        <div className="md:col-span-2 bg-gradient-to-br from-sky-600 via-teal-600 to-indigo-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-300/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight block">
                  MindBridge
                </span>
                <span className="text-[10px] text-sky-100 font-semibold tracking-wider uppercase">
                  Campus Wellbeing Platform
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
              <p className="text-xs text-sky-100/90 mt-2 leading-relaxed max-w-xs mx-auto">
                Evidence-guided mental health tracking, private reflections, and 24/7 empathetic support tailored for college life.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-sky-100">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-200" />
              <span>Encrypted & Safe</span>
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-200" />
              <span>Installable PWA</span>
            </span>
          </div>
        </div>

        {/* Right Side: Login Form & 1-Click Demo Buttons */}
        <div className="md:col-span-3 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {isRegister ? 'Join MindBridge Campus' : 'Welcome to MindBridge'}
              </h3>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline transition cursor-pointer"
              >
                {isRegister ? 'Already have an account? Sign in' : 'New student? Register'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* 1-Click Instant Demo Role Pills */}
            <div className="mb-6 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Instant 1-Click Demo Access:</span>
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-sky-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold shadow-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Student Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('counsellor')}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-teal-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold shadow-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Counsellor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 border border-purple-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold shadow-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Swar Sharma"
                        className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Mobile Number <span className="text-[10px] font-normal text-slate-400">(Optional for SMS reminders)</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-28 py-2.5 px-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs cursor-pointer"
                      >
                        <option value="+91">🇮🇳 +91 (IN)</option>
                        <option value="+1">🇺🇸 +1 (US)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+61">🇦🇺 +61 (AU)</option>
                        <option value="+971">🇦🇪 +971 (AE)</option>
                        <option value="+65">🇸🇬 +65 (SG)</option>
                        <option value="+49">🇩🇪 +49 (DE)</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 98765 43210"
                          className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Receive gentle daily check-in invitations (verified via OTP in Settings).
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@mindbridge.edu"
                    className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign in to Sanctuary'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
            Emergency Crisis Assistance is always free & confidential: <strong>Tele-MANAS 14416</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
