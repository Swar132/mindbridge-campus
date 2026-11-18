import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  BookOpen,
  BarChart3,
  Moon,
  Zap,
  Lock,
  X,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'resources'
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Resource Form
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState('Stress Management');
  const [resSummary, setResSummary] = useState('');
  const [resContent, setResContent] = useState('');
  const [resReadTime, setResReadTime] = useState(5);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [platformStats, aggregateTrends, userList, resList] = await Promise.all([
        api.getPlatformStats(),
        api.getAggregateTrends(),
        api.getUsers(roleFilter),
        api.getResources(),
      ]);
      setStats(platformStats);
      setTrends(aggregateTrends);
      setUsers(userList || []);
      setResources(resList || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [roleFilter]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.toggleUserStatus(userId, !currentStatus);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await api.updateResource(editingResource.id, {
          title: resTitle,
          category: resCategory,
          summary: resSummary,
          content: resContent,
          read_time_minutes: Number(resReadTime),
        });
      } else {
        await api.createResource({
          title: resTitle,
          category: resCategory,
          summary: resSummary,
          content: resContent,
          read_time_minutes: Number(resReadTime),
        });
      }
      setIsResourceModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm('Delete this resource guide?')) {
      try {
        await api.deleteResource(id);
        fetchAdminData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const openCreateResource = () => {
    setEditingResource(null);
    setResTitle('');
    setResCategory('Stress Management');
    setResSummary('');
    setResContent('');
    setResReadTime(5);
    setIsResourceModalOpen(true);
  };

  const openEditResource = (r) => {
    setEditingResource(r);
    setResTitle(r.title);
    setResCategory(r.category);
    setResSummary(r.summary);
    setResContent(r.body_markdown || r.summary);
    setResReadTime(r.read_time_minutes);
    setIsResourceModalOpen(true);
  };

  const moodChartData = Object.keys(trends?.campus_mood_distribution || {}).map((m) => ({
    name: m,
    value: trends.campus_mood_distribution[m],
  }));

  const stressChartData = Object.keys(trends?.top_campus_stressors || {}).map((cat) => ({
    category: cat.split(' ')[0],
    fullName: cat,
    count: trends.top_campus_stressors[cat],
  }));

  const VIBRANT_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#38BDF8', '#EC4899', '#FA6038', '#6366F1'];

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden border border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Administrative Governance
              </span>
              <span className="text-xs text-slate-300">Campus Oversight</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus Wellbeing Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Monitor university-wide anonymized mental health trends, oversee user permissions, and publish curated clinical toolkits.
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="inline-flex p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Aggregate Trends
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Resources ({resources.length})
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Shield Notification */}
      <div className="p-4 rounded-3xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-teal-950 dark:text-teal-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            <strong>Enforced Journal Isolation:</strong> Administrators have zero access to student private journals or identifiable emotional entries.
          </span>
        </div>
        <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 shrink-0">
          ORM Guard Active
        </span>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Total Students</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats?.total_students || 34}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Enrolled learners</p>
            </div>

            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Check-ins Logged</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats?.total_mood_logs || 128}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Platform entries</p>
            </div>

            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">Campus Staff</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats?.total_counsellors || 1}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Nitu Singh Bhadouria (SAC I)</p>
            </div>

            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Consultations</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats?.total_appointments || 14}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Student sessions</p>
            </div>
          </div>

          {/* Aggregate Anonymous Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Campus Mood Breakdown (Anonymized)</h3>
              <p className="text-xs text-slate-400 mb-4">Proportion of campus student emotional ratings</p>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={moodChartData} innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                      {moodChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Top Campus Stress Triggers</h3>
              <p className="text-xs text-slate-400 mb-4">Anonymized report for student support planning</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stressChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Campus Account Registry</h3>
              <p className="text-xs text-slate-400">Manage user access roles and activation status</p>
            </div>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              {['', 'student', 'counsellor', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`text-xs px-3 py-1 rounded-xl transition capitalize font-bold cursor-pointer ${
                    roleFilter === r
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r || 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full capitalize border border-sky-200 dark:border-sky-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{u.department || 'Campus'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'bg-rose-100 text-rose-800'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Resource Library Management</h3>
              <p className="text-xs text-slate-400">Curated clinical coping guides and student references</p>
            </div>
            <button
              onClick={openCreateResource}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Resource
            </button>
          </div>

          <div className="space-y-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</span>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full font-bold">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{r.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditResource(r)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Edit resource"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(r.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Edit / Create Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scale-up">
            <button
              onClick={() => setIsResourceModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h2>

            <form onSubmit={handleSaveResource} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={resCategory}
                    onChange={(e) => setResCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Read Time (min)
                  </label>
                  <input
                    type="number"
                    value={resReadTime}
                    onChange={(e) => setResReadTime(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Summary
                </label>
                <textarea
                  rows="2"
                  value={resSummary}
                  onChange={(e) => setResSummary(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Guide Body (Prose / Markdown)
                </label>
                <textarea
                  rows="5"
                  value={resContent}
                  onChange={(e) => setResContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
