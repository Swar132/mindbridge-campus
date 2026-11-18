import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Phone,
  Check,
  Wind,
  HeartHandshake,
  MessageSquare,
  Compass,
  Info,
  Sparkles,
  Shield,
  Clock,
  Menu,
  X,
  Mic,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MindyCharacter } from '../components/Illustrations';
import VoiceNoteRecorder from '../components/VoiceNoteRecorder';

const PROMPT_CARDS = [
  { text: "I am feeling intense anxiety about campus placement interviews and shortlists.", icon: Compass, color: 'from-teal-50 to-sky-100 border-teal-200 text-teal-950' },
  { text: "I have multiple project deadlines and feel overwhelmed by academic workload.", icon: Sparkles, color: 'from-peach-50 to-coral-100 border-peach-200 text-peach-950' },
  { text: "I feel exhausted during the day and have trouble turning off my racing thoughts before bed.", icon: Clock, color: 'from-sky-50 to-blue-100 border-sky-200 text-sky-950' },
  { text: "Can you guide me through a 2-minute calming grounding technique right now?", icon: Wind, color: 'from-mint-50 to-teal-100 border-mint-200 text-teal-950' },
];

export default function AIAssistant({
  onOpenBreathing,
  onOpenGrounding,
  onOpenEmergency,
  onNavigate,
}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [consentShareContext, setConsentShareContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastError, setLastError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const loadData = async () => {
    try {
      setLoading(true);
      const convList = await api.getConversations();
      setConversations(convList);

      if (convList.length > 0) {
        selectConversation(convList[0].id);
      } else {
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            content: `Hello ${user?.full_name?.split(' ')[0] || 'Friend'} 🌿\n\nI am Mindy, your confidential student wellbeing companion. Whether you're feeling academic workload pressure, placement anxiety, or simply need an objective space to decompress, I am here to listen with warmth and zero judgment.\n\nYou can chat with me using text or voice notes. What is on your mind today?`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load AI conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectConversation = async (id) => {
    try {
      setCurrentConvId(id);
      const fullConv = await api.getConversation(id);
      setMessages(fullConv.messages || []);
      setIsSidebarOpen(false);
      setLastError(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([
      {
        id: 'new',
        sender: 'assistant',
        content: `A fresh quiet space is ready. What would you like to reflect on? You can share via text or tap the microphone for a voice note.`,
        created_at: new Date().toISOString(),
      },
    ]);
    setIsSidebarOpen(false);
    setLastError(null);
  };

  const handleSend = async (textToSend = null, audioPayload = null) => {
    const text = textToSend || inputText;
    const isVoice = audioPayload !== null;

    if (!isVoice && !text.trim()) return;
    if (isSending) return;

    setLastError(null);

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      content: isVoice ? `🎙️ Voice Note (${audioPayload.durationSeconds}s)` : text,
      message_type: isVoice ? 'voice' : 'text',
      audio_url: isVoice ? audioPayload.base64 : null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend && !isVoice) setInputText('');
    setShowVoiceRecorder(false);
    setIsSending(true);

    try {
      const messageParam = isVoice ? `[Voice note audio reflection: ${audioPayload.durationSeconds} seconds]` : text;
      const res = await api.sendMessage(
        messageParam,
        currentConvId,
        consentShareContext,
        isVoice ? 'voice' : 'text',
        isVoice ? audioPayload.base64 : null
      );

      if (!currentConvId && res.conversation_id) {
        setCurrentConvId(res.conversation_id);
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.content,
        safety_flagged: res.safety_flagged || res.emergency_shown,
        suggested_resources: res.suggested_resources || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      api.getConversations().then(setConversations).catch(() => {});
    } catch (err) {
      setLastError('Mindy is temporarily disconnected. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: 'I apologize, but I am momentarily experiencing connection latency. Please take a gentle breath, or feel free to reach our campus counsellors.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-5 animate-fade-in pb-4">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-charcoal-900/30 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Conversations Drawer / Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 liquid-glass rounded-4xl border border-white/90 shadow-wellness p-4 flex flex-col justify-between transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-cream-200/80 mb-3">
            <span className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
              Previous Reflections
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-cream-100 md:hidden text-charcoal-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs shadow-glow-teal transition flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Sanctuary Chat</span>
          </button>

          <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-charcoal-400 text-center py-6">No previous conversations.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition truncate flex items-center gap-2.5 cursor-pointer ${
                    currentConvId === c.id
                      ? 'bg-teal-100/90 text-teal-900 font-bold border border-teal-200 shadow-wellness-sm'
                      : 'text-charcoal-700 hover:bg-white/80'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                  <span className="truncate">{c.title || 'Support Session'}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-teal-50/90 border border-teal-200/80 text-[10px] text-teal-950 leading-tight">
          <strong>Confidential & Private:</strong> Conversations are encrypted and strictly isolated to your student account.
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 rounded-4xl liquid-glass border border-white/90 shadow-wellness flex flex-col justify-between overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-cream-200/80 bg-white/50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-xl text-charcoal-600 hover:bg-cream-100 md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <MindyCharacter variant="calm" className="w-9 h-9" animated={false} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-charcoal-900">Mindy AI Companion</h3>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.2 rounded-full border border-teal-200">
                    Active Sanctuary
                  </span>
                </div>
                <p className="text-[10px] text-charcoal-500">Non-judgmental student listener • Text & Voice</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEmergency}
              className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-rose-600" />
              <span>SOS 14416</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* Suggested Starter Cards on New Chat */}
          {messages.length <= 1 && (
            <div className="my-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400 block mb-2">
                Common Student Topics:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROMPT_CARDS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(card.text)}
                      className={`p-3.5 rounded-2xl border text-left text-xs font-bold bg-gradient-to-r ${card.color} shadow-wellness-sm hover:shadow-wellness transition-all hover:scale-102 flex items-center gap-2.5 cursor-pointer`}
                    >
                      <Icon className="w-4 h-4 shrink-0 opacity-80" />
                      <span>{card.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const isVoice = m.message_type === 'voice' || (m.audio_url && m.audio_url.startsWith('data:audio'));

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!isUser && (
                  <div className="shrink-0 mt-1">
                    <MindyCharacter variant="calm" className="w-8 h-8" animated={false} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-wellness rounded-tr-none'
                      : 'bg-white/95 border border-cream-200/90 text-charcoal-800 shadow-wellness-sm rounded-tl-none font-sans'
                  }`}
                >
                  {/* Voice Note Audio Player */}
                  {isVoice && m.audio_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Volume2 className="w-4 h-4" />
                        <span>Voice Reflection</span>
                      </div>
                      <audio controls src={m.audio_url} className="w-full h-8 rounded-lg" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-xs sm:text-sm">{m.content}</p>
                  )}

                  {/* Crisis Intervention Alert Box */}
                  {(m.safety_flagged || m.emergency_shown) && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Phone className="w-3.5 h-3.5 text-rose-600" />
                        <span>Immediate Human Care is Here for You</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        If you are experiencing acute distress, call Tele-MANAS toll-free at <strong>14416</strong> (24/7). You do not have to carry this alone.
                      </p>
                      <button
                        onClick={onOpenEmergency}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                      >
                        Open Emergency Contacts
                      </button>
                    </div>
                  )}

                  {/* Recommended Action Pills */}
                  {!isUser && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={onOpenBreathing}
                        className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Wind className="w-3 h-3 text-teal-600" /> 4-7-8 Breathwork
                      </button>
                      <button
                        onClick={onOpenGrounding}
                        className="px-2.5 py-1 rounded-xl bg-peach-50 hover:bg-peach-100 text-peach-800 border border-peach-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Compass className="w-3 h-3 text-peach-600" /> 5-4-3-2-1 Grounding
                      </button>
                      <button
                        onClick={() => onNavigate('counsellors')}
                        className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <HeartHandshake className="w-3 h-3 text-sky-600" /> Book Counsellor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex gap-3 justify-start items-center animate-fade-in">
              <MindyCharacter variant="thinking" className="w-8 h-8" animated={false} />
              <div className="px-4 py-3 rounded-2xl bg-white/90 border border-cream-200 shadow-wellness-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                <span className="text-xs text-charcoal-500 ml-1.5">Mindy is reflecting...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Note Recorder Drawer (If activated) */}
        {showVoiceRecorder && (
          <div className="px-4 pb-2">
            <VoiceNoteRecorder
              onAudioReady={(audio) => handleSend(null, audio)}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-cream-200/80 bg-white/60 backdrop-blur-md space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className={`p-2.5 rounded-2xl border transition shadow-sm ${
                showVoiceRecorder
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white/80 text-teal-700 border-teal-200 hover:bg-teal-50'
              }`}
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share what is on your mind (e.g. exam stress, interview anxiety)..."
              disabled={isSending}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-white/90 border border-cream-200 text-xs sm:text-sm text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-wellness-sm"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white transition disabled:opacity-40 shadow-glow-teal cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-charcoal-500 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentShareContext}
                onChange={(e) => setConsentShareContext(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Allow Mindy to consider your consented weekly check-in trends</span>
            </label>
            <span className="hidden sm:inline">Mindy is an empathetic listener, not clinical treatment.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
