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
  RotateCcw,
  Cpu,
  Key,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MindyCharacter } from '../components/Illustrations';
import MarkdownMessage from '../components/MarkdownMessage';

const PROMPT_CARDS = [
  { text: "I have technical rounds coming up for campus placements and feel nervous about imposter syndrome.", icon: Compass, color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-950 dark:text-teal-200' },
  { text: "I have multiple submissions and midterm exams next week. Help me break this into a high-yield study plan.", icon: Sparkles, color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60 text-orange-950 dark:text-orange-200' },
  { text: "I had a frustrating argument with my hostel roommate and can't focus. How should I navigate this?", icon: HeartHandshake, color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-200' },
  { text: "Can you explain Dijkstra's algorithm simply with a real-life analogy as if we're preparing for an engineering viva?", icon: Bot, color: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-950 dark:text-sky-200' },
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
  const currentConvIdRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [consentShareContext, setConsentShareContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [aiConfig, setAiConfig] = useState({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    is_live_llm: false,
    groq_configured: false,
    gemini_configured: false,
    openai_configured: false,
    masked_key: null
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const loadAIConfig = async () => {
    try {
      const cfg = await api.getAIConfig();
      if (cfg) setAiConfig(cfg);
    } catch (err) {
      console.warn('Failed to fetch AI config:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await loadAIConfig();
      const convList = await api.getConversations();
      setConversations(convList);

      if (convList.length > 0) {
        selectConversation(convList[0].id);
      } else {
        currentConvIdRef.current = null;
        setCurrentConvId(null);
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            content: `Hello ${user?.full_name?.split(' ')[0] || 'Friend'} 🌿\n\nI am Mindy, your conversational companion at MindBridge Campus. Whether you want to talk through placement anxiety, break down a daunting exam syllabus, unpack an everyday challenge, or even discuss a technical concept or curiosity—I am here to listen with depth, intelligence, and zero judgment.\n\nWhat is on your mind today?`,
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
      currentConvIdRef.current = id;
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
    currentConvIdRef.current = null;
    setCurrentConvId(null);
    setMessages([
      {
        id: 'new',
        sender: 'assistant',
        content: `A fresh quiet space is ready. What would you like to explore or talk through? You can ask an academic question, brainstorm solutions, or share how you are feeling.`,
        created_at: new Date().toISOString(),
      },
    ]);
    setIsSidebarOpen(false);
    setLastError(null);
  };

  const handleSaveAIConfig = async (e) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      setConfigSuccess(null);
      const updated = await api.updateAIConfig({
        groq_api_key: groqKeyInput.trim() || undefined,
        groq_model: 'llama-3.3-70b-versatile'
      });
      setAiConfig(updated);
      setConfigSuccess('AI Configuration saved successfully! Mindy is now powered by hosted Llama 3.3 70B.');
      setGroqKeyInput('');
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to save AI config:', err);
      setConfigSuccess('Error saving configuration. Please try again.');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputText;

    if (!text.trim()) return;
    if (isSending) return;

    setLastError(null);

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      content: text,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsSending(true);

    try {
      const convToSend = currentConvIdRef.current || currentConvId;
      const res = await api.sendMessage(
        text,
        convToSend,
        consentShareContext,
        'text',
        null
      );

      if (res.conversation_id) {
        currentConvIdRef.current = res.conversation_id;
        setCurrentConvId(res.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: res.content || res.reply || '',
          safety_flagged: res.safety_flagged,
          emergency_shown: res.emergency_shown,
          suggested_resources: res.suggested_resources || [],
          created_at: new Date().toISOString(),
        },
      ]);

      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
    } catch (err) {
      console.error('Send message error:', err);
      setLastError('Unable to connect to Mindy right now. Please check your connection or retry.');
    } finally {
      setIsSending(false);
    }
  };

  const getModelBadge = () => {
    if (aiConfig.is_live_llm) {
      if (aiConfig.provider === 'groq') {
        return { name: 'Llama 3.3 70B (Groq)', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      }
      if (aiConfig.provider === 'gemini') {
        return { name: 'Gemini 1.5 Flash', color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      }
      return { name: 'Live LLM Active', color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' };
    }
    return { name: 'Mindy Dynamic AI Engine', color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
  };

  const badge = getModelBadge();

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 animate-fade-in transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 md:hidden"
        />
      )}

      {/* Conversations Sidebar Drawer */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 shadow-lg md:shadow-sm flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Conversation Archive</span>
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition active:scale-95 flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          <div className="space-y-1.5 max-h-[calc(100vh-360px)] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No previous conversations.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition truncate flex items-center gap-2.5 cursor-pointer ${
                    currentConvId === c.id
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <span className="truncate">{c.title || 'Support Session'}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* AI Engine & Privacy Card */}
        <div className="space-y-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="font-semibold">AI Settings</span>
            </div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Configure</span>
          </button>

          <div className="p-3 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 text-[10px] text-teal-950 dark:text-teal-200 leading-tight">
            <strong>Confidential & Private:</strong> Conversations are encrypted and strictly isolated to your student account.
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <MindyCharacter variant="calm" className="w-9 h-9" animated={false} />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${aiConfig.is_live_llm ? 'bg-emerald-500' : 'bg-teal-500'}`}></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mindy AI Companion</h3>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition cursor-pointer ${badge.color}`}
                    title="Click to view or configure LLM"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{badge.name}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Intelligent student listener & mentor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="LLM API Configuration"
            >
              <Cpu className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenEmergency}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>SOS 14416</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* Suggested Starter Cards on New Chat */}
          {messages.length <= 1 && (
            <div className="my-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Curated Student Topics:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROMPT_CARDS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(card.text)}
                      className={`p-3.5 rounded-2xl border text-left text-xs font-bold ${card.color} shadow-xs hover:scale-101 transition flex items-center gap-2.5 cursor-pointer`}
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
                  className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs rounded-tl-none font-sans'
                  }`}
                >
                  <MarkdownMessage content={m.content} isUser={isUser} />

                  {/* Crisis Intervention Alert Box */}
                  {(m.safety_flagged || m.emergency_shown) && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Phone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Immediate Human Care is Here for You</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        If you are experiencing acute distress, call Tele-MANAS toll-free at <strong>14416</strong> (24/7), or visit campus counsellor <strong>Nitu Singh Bhadouria</strong> in <strong>SAC I, First Floor</strong> (Email: <em>nitusingh_b@dau.ac.in</em>). You do not have to carry this alone.
                      </p>
                      <button
                        onClick={onOpenEmergency}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer"
                      >
                        Open Emergency Contacts
                      </button>
                    </div>
                  )}

                  {/* Topic-specific Recommended Resources */}
                  {!isUser && Array.isArray(m.suggested_resources) && m.suggested_resources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggested_resources.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-600/60 flex items-center gap-1"
                        >
                          <span>🌱</span>
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Recommended Action Pills */}
                  {!isUser && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={onOpenBreathing}
                        className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Wind className="w-3 h-3 text-teal-600 dark:text-teal-400" /> 4-7-8 Breathwork
                      </button>
                      <button
                        onClick={onOpenGrounding}
                        className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Compass className="w-3 h-3 text-orange-600 dark:text-orange-400" /> 5-4-3-2-1 Grounding
                      </button>
                      <button
                        onClick={() => onNavigate && onNavigate('counsellors')}
                        className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <HeartHandshake className="w-3 h-3 text-sky-600 dark:text-sky-400" /> Book Counsellor
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
              <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">Mindy is reflecting...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md space-y-2">
          {lastError && (
            <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl">
              {lastError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Mindy anything (e.g. explain an algorithm, placement worries, roommate issues)..."
              disabled={isSending}
              className="flex-1 py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-3 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white transition disabled:opacity-40 shadow-md shadow-teal-500/25 cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentShareContext}
                onChange={(e) => setConsentShareContext(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Allow Mindy to consider your consented weekly check-in trends</span>
            </label>
            <span className="hidden sm:inline">Mindy is an empathetic companion, not clinical treatment.</span>
          </div>
        </div>
      </div>

      {/* AI Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Mindy LLM Intelligence Setup
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 dark:text-teal-200">Active Engine:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300">
                    {badge.name}
                  </span>
                </div>
                {aiConfig.masked_key && (
                  <p className="text-[11px] text-teal-800 dark:text-teal-300">
                    Configured Key: <code className="font-mono">{aiConfig.masked_key}</code>
                  </p>
                )}
              </div>

              <form onSubmit={handleSaveAIConfig} className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>Groq API Key (Hosted Llama 3.3 70B):</span>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Get Free Key (Zero Card)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={groqKeyInput}
                      onChange={(e) => setGroqKeyInput(e.target.value)}
                      placeholder={aiConfig.groq_configured ? "Enter new key to replace existing..." : "Paste gsk_... here"}
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Groq provides instantaneous, free hosted inference on Meta Llama 3.3 70B Versatile with zero credit card required.
                  </p>
                </div>

                {configSuccess && (
                  <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${configSuccess.includes('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{configSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={configSaving || !groqKeyInput.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{configSaving ? 'Saving...' : 'Save & Activate'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
