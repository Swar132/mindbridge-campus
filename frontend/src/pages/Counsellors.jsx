import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Sparkles,
  Video,
  Check,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_SLOTS = [
  '10:00 AM - 11:00 AM',
  '11:30 AM - 12:30 PM',
  '02:00 PM - 03:00 PM',
  '03:30 PM - 04:30 PM',
  '04:30 PM - 05:30 PM',
];

export default function Counsellors() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'my-appointments'
  const [counsellors, setCounsellors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(AVAILABLE_SLOTS[0]);
  const [reason, setReason] = useState('Academic Stress & Exam Anxiety');
  const [sharedNotes, setSharedNotes] = useState('');
  const [shareSummary, setShareSummary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookedToast, setBookedToast] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cList, aptList] = await Promise.all([
        api.getCounsellors(),
        api.getMyAppointments(),
      ]);
      setCounsellors(cList);
      setAppointments(aptList);
    } catch (err) {
      console.error('Failed to load counsellor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openBooking = (counsellor) => {
    setSelectedCounsellor(counsellor);
    setIsBookingModalOpen(true);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedCounsellor) return;

    try {
      setIsSubmitting(true);
      await api.createAppointment({
        counsellor_id: selectedCounsellor.user_id,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        reason,
        student_notes: sharedNotes || undefined,
        share_wellbeing_summary: shareSummary,
      });

      setIsBookingModalOpen(false);
      setBookedToast(true);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0284C7', '#38BDF8', '#8B5CF6'],
      });
      fetchData();
      setActiveTab('my-appointments');
      setTimeout(() => setBookedToast(false), 4000);
    } catch (err) {
      alert('Error booking appointment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    const cancelReason = prompt('Reason for cancellation (optional):');
    if (cancelReason !== null) {
      try {
        await api.cancelAppointment(id, cancelReason);
        fetchData();
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
      }
    }
  };

  return (
    <div className="space-y-7 animate-fade-in pb-10 transition-colors duration-300">
      {/* Header Banner — Soft Lavender & Teal Ambient Gradient */}
      <div className="rounded-4xl bg-gradient-to-r from-purple-100/90 via-sky-50 to-teal-100/80 dark:from-purple-950/40 dark:via-slate-900 dark:to-teal-950/40 border border-purple-200/80 dark:border-purple-900/60 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/80 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Confidential Human Guidance
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Free for All Students</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Connect With Campus Counsellor
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              Book a private, 1-on-1 consultation with our campus counsellor. Safe, welcoming, and 100% confidential.
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="inline-flex p-1 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-sky-100 dark:border-slate-700 shadow-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'directory'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Counsellor Directory ({counsellors.length})
            </button>
            <button
              onClick={() => setActiveTab('my-appointments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'my-appointments'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>My Sessions</span>
              {appointments.length > 0 && (
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                  activeTab === 'my-appointments' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {appointments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {bookedToast && (
          <div className="mt-4 p-3 rounded-2xl bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-700 text-teal-950 dark:text-teal-200 text-xs font-bold flex items-center justify-between">
            <span>Appointment request submitted! Your counsellor will receive your consultation schedule.</span>
          </div>
        )}
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counsellors.map((c) => (
            <div
              key={c.id}
              className="liquid-glass-interactive rounded-4xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={c.user?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                    alt={c.user?.full_name || 'Dr. Nitu Singh Bhadouria'}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-sky-300 dark:ring-sky-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                      {c.user?.full_name || 'Dr. Nitu Singh Bhadouria'}
                    </h3>
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-bold">{c.title || 'College Student Counsellor'}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{c.years_experience || 8} yrs campus counselling practice</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4 pb-3 border-b border-sky-100 dark:border-slate-800">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {c.room_location || 'Counselling Room, SAC I, First Floor'}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <a
                      href={`mailto:${c.contact_email || c.user?.email || 'nitusingh_b@dau.ac.in'}`}
                      className="truncate font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      title="Click to send email"
                    >
                      {c.contact_email || c.user?.email || 'nitusingh_b@dau.ac.in'}
                    </a>
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-sky-50/70 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-sky-100 dark:border-slate-700/70 line-clamp-3 mb-3 font-sans">
                  "{c.bio || 'Compassionate and confidential guidance for students navigating examination pressure, placement challenges, academic stress, and personal wellbeing in SAC I.'}"
                </p>

                {c.specializations && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.specializations.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => openBooking(c)}
                className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs transition shadow-md shadow-sky-500/20 active:scale-95"
              >
                Book 50-Min Consultation
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Appointments Tab */}
      {activeTab === 'my-appointments' && (
        <div className="liquid-glass-apple rounded-4xl p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No scheduled consultations yet.</p>
              <button
                onClick={() => setActiveTab('directory')}
                className="mt-3 text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                Browse available counsellor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {apt.counsellor?.user?.full_name || 'Dr. Nitu Singh Bhadouria'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                            : apt.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                      <span>📅 {apt.appointment_date}</span>
                      <span>⏰ {apt.time_slot}</span>
                      <span>📍 Counselling Room, SAC I, First Floor</span>
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">Topic: {apt.reason}</p>
                  </div>

                  {apt.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition self-start sm:self-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && selectedCounsellor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="liquid-glass-apple dark:bg-slate-900 rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sky-100 dark:border-slate-800 relative animate-scale-up">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 inline-block mb-1">
              Confidential Booking
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Session with {selectedCounsellor.user?.full_name || 'Dr. Nitu Singh Bhadouria'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Private, 50-minute student session at Counselling Room, SAC I, First Floor.
            </p>

            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Time Slot
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {AVAILABLE_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Primary Discussion Topic
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Optional Notes for Counsellor
                </label>
                <textarea
                  rows="2"
                  placeholder="Anything specific you'd like to explore..."
                  value={sharedNotes}
                  onChange={(e) => setSharedNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Share 7-Day Trend Summary</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Helps counsellor prepare tailored strategies</p>
                </div>
                <input
                  type="checkbox"
                  checked={shareSummary}
                  onChange={(e) => setShareSummary(e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-sky-500/25 transition"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Request ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
