import React from 'react';
import { Phone, ShieldAlert, HeartHandshake, X, LifeBuoy, MapPin, Heart } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFDF9] rounded-4xl max-w-lg w-full shadow-2xl border border-cream-200 overflow-hidden relative animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-coral-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold">Confidential Support & Care</h2>
              <p className="text-rose-100 text-xs mt-0.5">
                You do not have to carry this alone. Free, 24/7 human guidance is always here.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Tele-MANAS */}
          <div className="p-4 rounded-3xl border-2 border-rose-200 bg-rose-50/70 flex items-start gap-4">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shrink-0 shadow-glow-coral">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-charcoal-900 text-sm">Tele-MANAS (Govt. of India)</h3>
                <span className="text-[10px] bg-rose-200 text-rose-900 font-extrabold px-2.5 py-0.5 rounded-full">
                  24/7 Toll-Free
                </span>
              </div>
              <p className="text-xs text-charcoal-600 mt-1 leading-relaxed">
                National Tele Mental Health Programme. Confidential counsellors available in 20+ regional languages.
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <a
                  href="tel:14416"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-extrabold hover:bg-rose-700 shadow-glow-coral transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call 14416
                </a>
                <a
                  href="tel:18008914416"
                  className="text-xs text-rose-700 hover:underline font-mono font-bold"
                >
                  Alt: 1800-891-4416
                </a>
              </div>
            </div>
          </div>

          {/* National Emergency Services */}
          <div className="p-4 rounded-3xl border border-cream-200 bg-white flex items-start gap-4 shadow-wellness-sm">
            <div className="p-2.5 bg-charcoal-800 text-white rounded-2xl shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-charcoal-900 text-sm">National Emergency Helpline</h3>
                <span className="text-[10px] bg-cream-100 text-charcoal-700 font-bold px-2 py-0.5 rounded-full">
                  Emergency Medical
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-1">
                For immediate campus medical crises, ambulances or acute personal safety.
              </p>
              <div className="mt-2.5">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-charcoal-800 text-white rounded-xl text-xs font-bold hover:bg-black transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call 112
                </a>
              </div>
            </div>
          </div>

          {/* KIRAN Helpline */}
          <div className="p-4 rounded-3xl border border-cream-200 bg-white flex items-start gap-4 shadow-wellness-sm">
            <div className="p-2.5 bg-purple-600 text-white rounded-2xl shrink-0 shadow-glow-lavender">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-charcoal-900 text-sm">KIRAN Mental Health Helpline</h3>
              <p className="text-xs text-charcoal-500 mt-1">
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

          {/* Campus Medical Centre */}
          <div className="p-4 rounded-3xl border border-cream-200 bg-cream-50/70 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-charcoal-400 shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal-600">
              <strong className="text-charcoal-900">Campus Health & Wellness Centre:</strong> Building B, Room 102. Open Monday–Saturday 9:00 AM – 7:00 PM for walk-in consultations.
            </div>
          </div>
        </div>

        <div className="p-4 bg-cream-100/60 border-t border-cream-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-cream-200 hover:bg-cream-300 text-charcoal-800 font-extrabold text-xs transition"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
