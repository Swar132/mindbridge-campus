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
  Sparkles,
  MapPin
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
    setMeetingRoom(apt.meeting_room || 'Counselling Room, SAC I, First Floor');
    setMeetingLink(apt.meeting_link || '');
  };

  const filtered = appointments.filter((a) => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'approved') return a.status === 'confirmed';
    if (activeTab === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-7 animate-fade-in pb-10 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-teal-100/90 via-sky-50 to-purple-100/80 dark:from-teal-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-teal-200/80 dark:border-teal-900/60 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Counsellor Care Workspace
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dr. Nitu Singh Bhadouria • SAC I</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Case Care Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              Review student consultation requests, confirm Counselling Room (SAC I, First Floor) sessions, and maintain private notes.
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="inline-flex p-1 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-sky-100 dark:border-slate-700 shadow-xs self-start sm:self-auto">
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 capitalize ${
                    activeTab === tab
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === tab ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading student requests...</div>
        ) : filtered.length === 0 ? (
          <div className="liquid-glass-apple rounded-4xl p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              No {activeTab} student appointments right now.
            </p>
          </div>
        ) : (
          filtered.map((apt) => (
            <div
              key={apt.id}
              className="liquid-glass-interactive rounded-4xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {apt.student?.full_name || 'Anonymous Student'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {apt.student?.department || 'Undergraduate'} ({apt.student?.year_of_study || 'Student'})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" /> {apt.appointment_date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-500" /> {apt.time_slot}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" /> Counselling Room, SAC I, First Floor
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700/80 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Discussion Focus: </span>
                  <span className="text-slate-600 dark:text-slate-300">{apt.reason}</span>
                  {apt.student_notes && (
                    <p className="mt-1 text-slate-500 dark:text-slate-400 italic">"{apt.student_notes}"</p>
                  )}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                {apt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'confirmed', { meeting_room: 'Counselling Room, SAC I, First Floor' })}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition"
                    >
                      Decline
                    </button>
                  </>
                )}

                {apt.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => openNotesModal(apt)}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Clinical Notes</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'completed')}
                      className="px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold transition"
                    >
                      Mark Completed
                    </button>
                  </>
                )}

                {apt.status === 'completed' && (
                  <button
                    onClick={() => openNotesModal(apt)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Notes</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clinical Notes Modal */}
      {selectedAptForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="liquid-glass-apple dark:bg-slate-900 rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sky-100 dark:border-slate-800 relative animate-scale-up">
            <button
              onClick={() => setSelectedAptForNotes(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 inline-block mb-1">
              Confidential Clinical Record
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Session Documentation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Private notes for {selectedAptForNotes.student?.full_name}. Location: Counselling Room, SAC I, First Floor.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  value={meetingRoom}
                  onChange={(e) => setMeetingRoom(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Private Session Notes
                </label>
                <textarea
                  rows="4"
                  placeholder="Record therapeutic observations, grounding techniques recommended, or follow-up plan..."
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedAptForNotes(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedAptForNotes.id, selectedAptForNotes.status, {
                      counsellor_private_notes: privateNotes,
                      meeting_room: meetingRoom,
                    })
                  }
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-extrabold text-xs shadow-xs transition"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
