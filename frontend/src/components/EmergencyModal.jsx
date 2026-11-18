import React from 'react';
import { Phone, ShieldAlert, HeartHandshake, X, LifeBuoy, MapPin, Heart, Mail } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Confidential Support & Care</h2>
              <p className="text-rose-100 text-xs mt-0.5">
                You do not have to carry this alone. Free, 24/7 human guidance is always here.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Tele-MANAS */}
          <div className="p-4 rounded-3xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/40 flex items-start gap-4">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shrink-0 shadow-md">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Tele-MANAS (Govt. of India)</h3>
                <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold px-2.5 py-0.5 rounded-full">
                  24/7 Toll-Free
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                National Tele Mental Health Programme. Confidential clinical counsellors available in 20+ languages.
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <a
                  href="tel:14416"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-md transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call 14416
                </a>
                <a
                  href="tel:18008914416"
                  className="text-xs text-rose-700 dark:text-rose-400 hover:underline font-mono font-bold"
                >
                  Alt: 1800-891-4416
                </a>
              </div>
            </div>
          </div>

          {/* College Counsellor Nitu Singh Bhadouria */}
          <div className="p-4 rounded-3xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/30 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 bg-sky-600 text-white rounded-2xl shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Campus Counsellor</h3>
                <span className="text-[10px] bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-100 font-bold px-2 py-0.5 rounded-full">
                  Campus SAC I
                </span>
              </div>
              <p className="text-xs font-bold text-sky-800 dark:text-sky-300 mt-0.5">
                Nitu Singh Bhadouria
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                📍 Location: Counselling Room, SAC I, First Floor
              </p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href="mailto:nitusingh_b@dau.ac.in"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition"
                >
                  <Mail className="w-3.5 h-3.5" /> nitusingh_b@dau.ac.in
                </a>
              </div>
            </div>
          </div>

          {/* National Emergency Services */}
          <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">National Emergency Helpline</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-2 py-0.5 rounded-full">
                  Medical / Safety
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                For immediate campus medical crises, ambulances or acute personal safety.
              </p>
              <div className="mt-2.5">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-black text-white rounded-xl text-xs font-bold transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call 112
                </a>
              </div>
            </div>
          </div>

          {/* KIRAN Helpline */}
          <div className="p-4 rounded-3xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 bg-purple-600 text-white rounded-2xl shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">KIRAN Mental Health Helpline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Govt. helpline providing mental health rehabilitation, anxiety, and depression guidance.
              </p>
              <div className="mt-2.5">
                <a
                  href="tel:18005990019"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call 1800-599-0019
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
