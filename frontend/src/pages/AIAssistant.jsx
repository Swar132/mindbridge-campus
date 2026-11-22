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
  AlertCircle,
  Brain,
  Trash2,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MindyCharacter } from '../components/Illustrations';
import MarkdownMessage from '../components/MarkdownMessage';

const PROMPT_CARDS = [
  { text: "I want to solve two DSA problems daily on LeetCode for placement readiness. Help me stay accountable and track this goal!", icon: Target, color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200' },
  { text: "I have technical rounds coming up for campus placements and feel nervous about imposter syndrome.", icon: Compass, color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-950 dark:text-teal-200' },
  { text: "I have multiple submissions and midterm exams next week. Help me break this into a high-yield study plan.", icon: Sparkles, color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60 text-orange-950 dark:text-orange-200' },
  { text: "I had a frustrating argument with my hostel roommate and can't focus. How should I navigate this?", icon: HeartHandshake, color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-200' },
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

  // Long-Term Memory & Goals State
  const [memories, setMemories] = useState([]);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState({
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
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

  const loadMemories = async () => {
    try {
      const memList = await api.getMemories();
      setMemories(memList || []);
    } catch (err) {
      console.warn('Failed to fetch student memories:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAIConfig(), loadMemories()]);
      const convList = await api.getConversations();
      setConversations(convList || []);

      if (convList && convList.length > 0) {
        selectConversation(convList[0].id);
      } else {
        currentConvIdRef.current = null;
        setCurrentConvId(null);
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            content: `Hello ${user?.full_name?.split(' ')[0] || 'Friend'} 🌿\n\nI am Mindy, your conversational companion and mentor at MindBridge Campus. Whether you want to talk through placement anxiety, stick to daily problem-solving goals, unpack coursework or roommate friction, or explore a curious concept—I am here to listen with depth, continuity, and zero judgment.\n\nWhat would you like to explore or focus on today?`,
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
        content: `A fresh quiet space is ready. What would you like to explore or talk through? You can share a daily goal, ask an academic question, or reflect on your day.`,
        created_at: new Date().toISOString(),
      },
    ]);
    setIsSidebarOpen(false);
    setLastError(null);
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation from your history?')) return;
    try {
      await api.deleteConversation(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (currentConvId === id) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleClearMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all tracked memories and goals? This gives you a completely clean slate.')) return;
    try {
      await api.clearMemories();
      setMemories([]);
    } catch (err) {
      console.error('Failed to clear memories:', err);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    try {
      setIsAddingGoal(true);
      const newMem = await api.createMemory({
        topic: 'Personal Goal',
        key_point: newGoalInput.trim(),
        category: 'goal',
        progress_status: 'active'
      });
      setMemories((prev) => [newMem, ...prev]);
      setNewGoalInput('');
    } catch (err) {
      console.error('Failed to add goal:', err);
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleSaveAIConfig = async (e) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      setConfigSuccess(null);
      const updated = await api.updateAIConfig({
        groq_api_key: groqKeyInput.trim() || undefined,
        groq_model: 'openai/gpt-oss-120b'
      });
      setAiConfig(updated);
      setConfigSuccess('AI Configuration saved successfully! Mindy is connected to live hosted LLM.');
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

      // Refresh conversations and active memories list in background
      const [updatedConvs, updatedMems] = await Promise.all([
        api.getConversations(),
        api.getMemories()
      ]);
      setConversations(updatedConvs || []);
      setMemories(updatedMems || []);
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
        return { name: 'Hosted LLM (Groq)', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      }
      if (aiConfig.provider === 'gemini') {
        return { name: 'Gemini Flash', color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
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

          <div className="space-y-1.5 max-h-[calc(100vh-420px)] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No previous conversations.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`group w-full text-left p-2.5 rounded-2xl text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                    currentConvId === c.id
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate">{c.title || 'Support Session'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 text-slate-400 transition shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Long-Term Memory & AI Engine Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowMemoryModal(true)}
            className="w-full p-2.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="font-semibold">Memory & Goals</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-200/60 dark:bg-teal-800/80 text-teal-800 dark:text-teal-200">
              {memories.length}
            </span>
          </button>

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

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            <strong>Confidential & Isolated:</strong> Conversations and memories are strictly stored under your account.
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
              onClick={() => setShowMemoryModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="View Mindy's Long-Term Memory & Active Goals"
            >
              <Brain className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{memories.length} {memories.length === 1 ? 'Goal' : 'Goals'} Tracked</span>
            </button>

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
                Curated Student Topics & Habits:
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
                        If you are experiencing acute distress, call Tele-MANAS toll-free at <strong>14416</strong> (24/7), or visit campus counsellor <strong>Dr. Nitu Singh Bhadouria</strong> in <strong>SAC I, First Floor</strong> (Email: <em>nitusingh_b@dau.ac.in</em>). You do not have to carry this alone.
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
              placeholder="Ask Mindy anything (e.g. solve 2 DSA problems daily, placement prep, exam plan)..."
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

      {/* Mindy's Long-Term Memory & Tracked Goals Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Mindy's Long-Term Memory & Goals
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mindy remembers your ongoing commitments across sessions to proactively follow up with you.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMemoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Goal Input */}
            <form onSubmit={handleAddGoal} className="flex gap-2">
              <input
                type="text"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                placeholder="Add a new goal (e.g. Solve 2 DSA problems daily, wake up at 7am)..."
                className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={isAddingGoal || !newGoalInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track Goal</span>
              </button>
            </form>

            {/* Memories List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {memories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 space-y-2">
                  <Target className="w-8 h-8 mx-auto opacity-40 text-teal-500" />
                  <p className="text-xs font-medium">No goals or long-term memories logged yet.</p>
                  <p className="text-[11px]">
                    Tell Mindy: <em>"I want to solve two DSA problems daily"</em> or add a goal above, and Mindy will proactively check in on your consistency!
                  </p>
                </div>
              ) : (
                memories.map((m) => {
                  const getStatusBadge = (status) => {
                    if (status === 'achieved') return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
                    if (status === 'struggling') return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                    if (status === 'in_progress') return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                    return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
                  };

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {m.topic}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(m.progress_status)}`}>
                            {m.progress_status}
                          </span>
                          {m.target_frequency && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{m.target_frequency}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                          {m.key_point}
                        </p>
                        {m.details && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                            {m.details}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                        title="Delete this memory item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer / Clear All */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-[10px] text-slate-400">
                Memories are private to your student ID ({user?.email}).
              </span>
              {memories.length > 0 && (
                <button
                  onClick={handleClearMemories}
                  className="px-3 py-1 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All Memory</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
