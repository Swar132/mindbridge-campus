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
        colors: ['#A78BFA', '#10B981', '#38BDF8'],
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
    const reason = prompt('Reason for cancellation (optional):');
    if (reason !== null) {
      try {
        await api.cancelAppointment(id, reason);
        fetchData();
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
      }
    }
  };

  return (
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-emerald-100/90 via-teal-50 to-sky-100/80 border border-emerald-200/80 p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                Confidential Human Guidance
              </span>
              <span className="text-xs text-charcoal-400 font-medium">Free for All Students</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 tracking-tight">
              Connect With Campus Counsellors
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl leading-relaxed">
              Book private 1-on-1 consultations with licensed college mental health professionals. Safe, welcoming, and 100% confidential.
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="inline-flex p-1 bg-white/80 rounded-2xl border border-cream-200 shadow-wellness-sm self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'directory'
                  ? 'bg-purple-600 text-white shadow-wellness-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Counsellor Directory ({counsellors.length})
            </button>
            <button
              onClick={() => setActiveTab('my-appointments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'my-appointments'
                  ? 'bg-purple-600 text-white shadow-wellness-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <span>My Sessions</span>
              {appointments.length > 0 && (
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                  activeTab === 'my-appointments' ? 'bg-white/20 text-white' : 'bg-cream-200 text-charcoal-800'
                }`}>
                  {appointments.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {bookedToast && (
          <div className="mt-4 p-3 rounded-2xl bg-mint-100 border border-mint-300 text-mint-950 text-xs font-bold flex items-center justify-between">
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
              className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 hover:border-lavender-300 p-6 shadow-wellness hover:shadow-wellness-lg transition-all duration-200 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={c.user?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'}
                    alt={c.user?.full_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-lavender-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-charcoal-900 truncate">
                      {c.user?.full_name}
                    </h3>
                    <p className="text-xs text-purple-700 font-bold">{c.title}</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">{c.years_experience} yrs campus practice</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-charcoal-600 mb-4 pb-3 border-b border-cream-200/80">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{c.room_location || 'Student Wellness Centre, Room 204'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{c.user?.email}</span>
                  </p>
                </div>

                <p className="text-xs text-charcoal-600 leading-relaxed bg-cream-50/70 p-3.5 rounded-2xl border border-cream-200/70 line-clamp-3 mb-3 font-sans">
                  "{c.bio}"
                </p>

                {c.specializations && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.specializations.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => openBooking(c)}
                className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-glow-lavender hover:scale-102 active:scale-98"
              >
                Book 50-Min Consultation
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Appointments Tab */}
      {activeTab === 'my-appointments' && (
        <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
              <p className="text-xs text-charcoal-500">No scheduled consultations yet.</p>
              <button
                onClick={() => setActiveTab('directory')}
                className="mt-3 text-xs text-purple-700 font-bold hover:underline"
              >
                Browse available counsellors
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-3xl bg-cream-50/70 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-charcoal-900">
                        {apt.counsellor?.user?.full_name || 'Campus Counsellor'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-mint-100 text-mint-900 border border-mint-200'
                            : apt.status === 'pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-cream-200 text-charcoal-600'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 flex flex-wrap items-center gap-3">
                      <span>📅 {apt.appointment_date}</span>
                      <span>⏰ {apt.time_slot}</span>
                      <span>📍 Room 204</span>
                    </p>
                    <p className="text-xs text-charcoal-700">Topic: {apt.reason}</p>
                  </div>

                  {apt.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition self-start sm:self-auto"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFDF9] rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative animate-scale-up">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-100 text-charcoal-400 hover:text-charcoal-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 inline-block mb-1">
              Confidential Booking
            </span>
            <h2 className="text-xl font-serif font-bold text-charcoal-900">
              Session with {selectedCounsellor.user?.full_name}
            </h2>
            <p className="text-xs text-charcoal-500 mt-1 mb-4">
              Private, 50-minute student session. You may optionally share your 7-day wellbeing overview.
            </p>

            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-cream-200 text-charcoal-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Time Slot
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-white border border-cream-200 text-charcoal-900"
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
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Primary Discussion Topic
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-charcoal-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Optional Notes for Counsellor
                </label>
                <textarea
                  rows="2"
                  placeholder="Anything specific you'd like to explore..."
                  value={sharedNotes}
                  onChange={(e) => setSharedNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl bg-white border border-cream-200 text-charcoal-900 resize-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-cream-100 border border-cream-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-charcoal-800">Share 7-Day Trend Summary</p>
                  <p className="text-[10px] text-charcoal-500">Helps counsellor prepare tailored strategies</p>
                </div>
                <input
                  type="checkbox"
                  checked={shareSummary}
                  onChange={(e) => setShareSummary(e.target.checked)}
                  className="w-4 h-4 accent-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-charcoal-500 hover:text-charcoal-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-glow-lavender transition"
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
