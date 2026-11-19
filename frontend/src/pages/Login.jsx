import React, { useState, useEffect } from 'react';
import {
  Heart,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Stethoscope,
  GraduationCap,
  Phone,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Check,
  KeyRound,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { MindyCharacter } from '../components/Illustrations';

export default function Login() {
  const { login, completeAuth, demoLogin } = useAuth();
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

  // 2-Factor Production Verification States
  const [inVerificationStep, setInVerificationStep] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [verificationNotice, setVerificationNotice] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Cooldown timers
  useEffect(() => {
    let timer;
    if (emailCooldown > 0 || phoneCooldown > 0) {
      timer = setInterval(() => {
        setEmailCooldown((c) => (c > 0 ? c - 1 : 0));
        setPhoneCooldown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCooldown, phoneCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!phoneNumber.trim()) {
          setError('A valid phone number is required for two-factor account verification.');
          setLoading(false);
          return;
        }

        const res = await api.registerInitiate({
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim(),
          role,
          department,
          year_of_study: yearOfStudy,
          phone_number: phoneNumber.trim(),
          country_code: countryCode,
        });

        // Transition to 2FA verification step
        setSessionId(res.session_id);
        setMaskedEmail(res.email_masked);
        setMaskedPhone(res.phone_masked);
        setEmailVerified(false);
        setPhoneVerified(false);
        setEmailOtp('');
        setPhoneOtp('');
        setEmailCooldown(60);
        setPhoneCooldown(60);
        setInVerificationStep(true);
        setVerificationNotice(res.message || 'Verification codes sent to your email and phone.');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e?.preventDefault();
    if (!emailOtp.trim() || emailOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setError(null);
    setVerifyingEmail(true);

    try {
      const res = await api.verifyRegisterEmail(sessionId, emailOtp.trim());
      setEmailVerified(true);
      setVerificationNotice(res.message);

      if (res.completed) {
        setVerificationSuccess(true);
        setTimeout(() => {
          completeAuth(res);
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e?.preventDefault();
    if (!phoneOtp.trim() || phoneOtp.trim().length !== 6) {
      setError('Please enter the 6-digit SMS code sent to your mobile phone.');
      return;
    }
    setError(null);
    setVerifyingPhone(true);

    try {
      const res = await api.verifyRegisterPhone(sessionId, phoneOtp.trim());
      setPhoneVerified(true);
      setVerificationNotice(res.message);

      if (res.completed) {
        setVerificationSuccess(true);
        setTimeout(() => {
          completeAuth(res);
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleResendOTP = async (target) => {
    setError(null);
    if (target === 'email') {
      if (emailCooldown > 0) return;
      setResendingEmail(true);
      try {
        const res = await api.resendRegisterOTP(sessionId, 'email');
        setEmailCooldown(60);
        setVerificationNotice(res.message || 'New email verification code sent.');
      } catch (err) {
        setError(err.message);
      } finally {
        setResendingEmail(false);
      }
    } else {
      if (phoneCooldown > 0) return;
      setResendingPhone(true);
      try {
        const res = await api.resendRegisterOTP(sessionId, 'phone');
        setPhoneCooldown(60);
        setVerificationNotice(res.message || 'New SMS verification code sent.');
      } catch (err) {
        setError(err.message);
      } finally {
        setResendingPhone(false);
      }
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

  const isConfigError = error && (
    error.includes('configured') ||
    error.includes('RESEND_') ||
    error.includes('TWILIO_') ||
    error.includes('FAST2SMS_') ||
    error.includes('SMTP_') ||
    error.includes('Render')
  );

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

        {/* Right Side: Dynamic Form Container */}
        <div className="md:col-span-3 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900">
          <div>
            {/* Header & Step Switcher */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {inVerificationStep
                    ? 'Security Verification'
                    : isRegister
                    ? 'Join MindBridge Campus'
                    : 'Welcome to MindBridge'}
                </h3>
                {inVerificationStep && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Step 2 of 2: Verify your email and phone
                  </p>
                )}
              </div>

              {!inVerificationStep && (
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline transition cursor-pointer"
                >
                  {isRegister ? 'Already registered? Sign in' : 'New student? Register'}
                </button>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className={`mb-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  isConfigError
                    ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {isConfigError && (
                    <strong className="block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Gateway Configuration Required
                    </strong>
                  )}
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Verification Notice Banner */}
            {verificationNotice && (
              <div className="mb-4 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{verificationNotice}</span>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW A: 2FA VERIFICATION SCREEN */}
            {/* ------------------------------------------------------------- */}
            {inVerificationStep ? (
              <div className="space-y-5">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enter the 6-digit verification codes dispatched to verify your identity. Both codes must be verified to complete registration.
                </p>

                {verificationSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Verification Complete!</strong>
                      <span>Welcome to MindBridge Campus. Logging you in to your sanctuary...</span>
                    </div>
                  </div>
                )}

                {/* 1. Email Verification Box */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Email Verification
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {maskedEmail}
                        </span>
                      </div>
                    </div>

                    {emailVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Awaiting Code
                      </span>
                    )}
                  </div>

                  {!emailVerified && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="6-digit code"
                          className="w-full text-center font-mono font-bold tracking-widest py-2 px-3 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmail}
                          disabled={verifyingEmail || emailOtp.length !== 6}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          {verifyingEmail ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Verify</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Check inbox & spam folder</span>
                        <button
                          type="button"
                          onClick={() => handleResendOTP('email')}
                          disabled={emailCooldown > 0 || resendingEmail}
                          className="font-bold text-sky-600 dark:text-sky-400 hover:underline disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {resendingEmail
                            ? 'Sending...'
                            : emailCooldown > 0
                            ? `Resend in ${emailCooldown}s`
                            : 'Resend Email Code'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SMS Phone Verification Box */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Phone SMS Verification
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {maskedPhone}
                        </span>
                      </div>
                    </div>

                    {phoneVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Awaiting Code
                      </span>
                    )}
                  </div>

                  {!phoneVerified && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="6-digit code"
                          className="w-full text-center font-mono font-bold tracking-widest py-2 px-3 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhone}
                          disabled={verifyingPhone || phoneOtp.length !== 6}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          {verifyingPhone ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Verify</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Standard SMS carrier delivery</span>
                        <button
                          type="button"
                          onClick={() => handleResendOTP('phone')}
                          disabled={phoneCooldown > 0 || resendingPhone}
                          className="font-bold text-teal-600 dark:text-teal-400 hover:underline disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {resendingPhone
                            ? 'Sending...'
                            : phoneCooldown > 0
                            ? `Resend in ${phoneCooldown}s`
                            : 'Resend SMS Code'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setInVerificationStep(false);
                      setError(null);
                      setVerificationNotice(null);
                    }}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Registration</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* VIEW B: LOGIN / REGISTRATION FORM */
              /* ------------------------------------------------------------- */
              <>
                {/* 1-Click Instant Demo Role Pills (only for login mode) */}
                {!isRegister && (
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
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Full Name *
                        </label>
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
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Mobile Phone * <span className="text-[10px] font-normal text-slate-400">(for SMS verification & reminders)</span>
                        </label>
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
                              required
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="e.g. 9876543210"
                              className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Department
                          </label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Year
                          </label>
                          <input
                            type="text"
                            value={yearOfStudy}
                            onChange={(e) => setYearOfStudy(e.target.value)}
                            className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Campus Email *
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••• (min 6 characters)"
                        className="w-full py-2.5 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {loading
                        ? 'Connecting...'
                        : isRegister
                        ? 'Continue to Verification'
                        : 'Sign in to Sanctuary'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
            Emergency Crisis Assistance is always free & confidential: <strong>Tele-MANAS 14416</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
