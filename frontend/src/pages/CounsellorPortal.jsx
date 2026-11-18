import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ShieldCheck,
  Lock,
  Edit,
  Save,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CounsellorPortal() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'completed'
  const [selectedAptForNotes, setSelectedAptForNotes] = useState(null);
  const [privateNotes, setPrivateNotes] = useState('');
  const [meetingRoom, setMeetingRoom] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (aptId, newStatus, extra = {}) => {
    try {
      await api.updateAppointmentStatus(aptId, {
        status: newStatus,
        ...extra,
      });
      fetchAppointments();
      if (selectedAptForNotes) setSelectedAptForNotes(null);
    } catch (err) {
      alert('Error updating appointment: ' + err.message);
    }
  };

  const openNotesModal = (apt) => {
    setSelectedAptForNotes(apt);
    setPrivateNotes(apt.counsellor_private_notes || '');
    setMeetingRoom(apt.meeting_room || 'Student Wellness Centre, Room 204');
    setMeetingLink(apt.meeting_link || '');
  };

  const filtered = appointments.filter((a) => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'approved') return a.status === 'confirmed';
    if (activeTab === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-teal-100/90 via-emerald-50 to-sky-100/80 border border-teal-200/80 p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                Counsellor Clinical Workspace
              </span>
              <span className="text-xs text-charcoal-400 font-medium">Strictly Isolated Notes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 tracking-tight">
              Case Care Management
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xl leading-relaxed">
              Review student consultation requests, configure meeting rooms, and maintain private clinical notes.
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="inline-flex p-1 bg-white/80 rounded-2xl border border-cream-200 shadow-wellness-sm self-start sm:self-auto">
            {['pending', 'approved', 'completed'].map((tab) => {
              const count = appointments.filter((a) =>
                tab === 'pending'
                  ? a.status === 'pending'
                  : tab === 'approved'
                  ? a.status === 'confirmed'
                  : a.status === 'completed'
              ).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 capitalize ${
                    activeTab === tab
                      ? 'bg-teal-600 text-white shadow-wellness-sm'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  <span>{tab === 'approved' ? 'Confirmed Sessions' : `${tab} Requests`}</span>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-cream-200 text-charcoal-800'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-4xl bg-white/90 border border-cream-200 p-12 text-center text-charcoal-400 text-xs shadow-wellness">
            No {activeTab} consultation requests in this view.
          </div>
        ) : (
          filtered.map((apt) => (
            <div
              key={apt.id}
              className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 hover:border-teal-300 p-6 shadow-wellness hover:shadow-wellness-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-charcoal-900">
                    {apt.student?.full_name || 'Student Client'}
                  </span>
                  <span className="text-xs text-charcoal-500">
                    ({apt.student?.department || 'Student'})
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
                  <span>📍 {apt.meeting_room || 'Room 204'}</span>
                </p>

                <p className="text-xs text-charcoal-700">
                  <span className="text-charcoal-400">Discussion Focus:</span> <strong>{apt.reason}</strong>
                </p>

                {apt.student_notes && (
                  <p className="text-xs text-charcoal-600 bg-cream-50 p-3 rounded-2xl border border-cream-200 font-sans italic">
                    "{apt.student_notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                {apt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-wellness-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept Session
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'cancelled', { cancellation_reason: 'Counsellor unavailable' })}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition"
                    >
                      Decline
                    </button>
                  </>
                )}

                {apt.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'completed')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-glow-lavender"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => openNotesModal(apt)}
                      className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-800 font-bold text-xs transition flex items-center gap-1.5 border border-cream-200"
                    >
                      <Edit className="w-3.5 h-3.5 text-teal-600" /> Private Notes
                    </button>
                  </>
                )}

                {apt.status === 'completed' && (
                  <button
                    onClick={() => openNotesModal(apt)}
                    className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-800 font-bold text-xs transition flex items-center gap-1.5 border border-cream-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" /> View Notes
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Private Notes & Session Management Modal */}
      {selectedAptForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFDF9] rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative animate-scale-up">
            <button
              onClick={() => setSelectedAptForNotes(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-100 text-charcoal-400 hover:text-charcoal-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200 inline-block mb-1">
              Confidential Case File
            </span>
            <h2 className="text-xl font-serif font-bold text-charcoal-900">
              Session with {selectedAptForNotes.student?.full_name}
            </h2>
            <p className="text-xs text-charcoal-500 mt-1 mb-4">
              Restricted to licensed campus staff. Inaccessible to students or administrators.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateStatus(selectedAptForNotes.id, selectedAptForNotes.status, {
                  counsellor_private_notes: privateNotes,
                  meeting_room: meetingRoom,
                  meeting_link: meetingLink,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Confidential Clinical Observations
                </label>
                <textarea
                  rows="5"
                  placeholder="Clinical observations, coping techniques recommended, follow-up goals..."
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-2xl bg-white border border-cream-200 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Meeting Location / Room
                </label>
                <input
                  type="text"
                  value={meetingRoom}
                  onChange={(e) => setMeetingRoom(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-charcoal-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAptForNotes(null)}
                  className="px-4 py-2.5 text-xs font-bold text-charcoal-500 hover:text-charcoal-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-wellness-sm transition"
                >
                  Save Case Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
