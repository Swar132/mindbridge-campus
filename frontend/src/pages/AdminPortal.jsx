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
      setUsers(userList);
      setResources(resList);
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
      alert('Error saving resource: ' + err.message);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.deleteResource(id);
      fetchAdminData();
    } catch (err) {
      alert('Error deleting resource: ' + err.message);
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
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="rounded-4xl bg-gradient-to-r from-purple-800 via-indigo-900 to-charcoal-900 text-white p-6 sm:p-8 shadow-wellness relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-mint-400" />
                Administrative Governance
              </span>
              <span className="text-xs text-purple-200">Campus Oversight</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Campus Wellbeing Command
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-xl leading-relaxed">
              Monitor university-wide anonymized mental health trends, oversee user permissions, and publish curated clinical toolkits.
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="inline-flex p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-white text-purple-950 shadow-wellness-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Aggregate Trends
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'users'
                  ? 'bg-white text-purple-950 shadow-wellness-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'resources'
                  ? 'bg-white text-purple-950 shadow-wellness-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Resources ({resources.length})
            </button>
          </div>
        </div>
      </div>

      {/* Strict Privacy Shield Notification */}
      <div className="p-4 rounded-3xl bg-mint-50/90 border border-mint-200/80 text-mint-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-mint-600 shrink-0" />
          <span>
            <strong>Enforced Journal Isolation:</strong> Administrators have zero access to student private journals or identifiable emotional entries.
          </span>
        </div>
        <span className="text-[10px] font-bold text-mint-800 bg-white px-3 py-1 rounded-full border border-mint-200 shrink-0">
          ORM Guard Active
        </span>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-4xl bg-gradient-to-br from-lavender-50 to-white border border-lavender-200/80 p-5 shadow-wellness">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Total Students</span>
              <p className="text-3xl font-serif font-black text-purple-950 mt-1">{stats?.total_students || 34}</p>
              <p className="text-[10px] text-charcoal-400 mt-0.5">Enrolled learners</p>
            </div>

            <div className="rounded-4xl bg-gradient-to-br from-mint-50 to-white border border-mint-200/80 p-5 shadow-wellness">
              <span className="text-[10px] font-bold text-mint-700 uppercase tracking-wider block">Check-ins Logged</span>
              <p className="text-3xl font-serif font-black text-mint-950 mt-1">{stats?.total_mood_logs || 128}</p>
              <p className="text-[10px] text-charcoal-400 mt-0.5">Platform entries</p>
            </div>

            <div className="rounded-4xl bg-gradient-to-br from-sky-50 to-white border border-sky-200/80 p-5 shadow-wellness">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Campus Staff</span>
              <p className="text-3xl font-serif font-black text-sky-950 mt-1">{stats?.total_counsellors || 3}</p>
              <p className="text-[10px] text-charcoal-400 mt-0.5">Licensed professionals</p>
            </div>

            <div className="rounded-4xl bg-gradient-to-br from-peach-50 to-white border border-peach-200/80 p-5 shadow-wellness">
              <span className="text-[10px] font-bold text-coral-700 uppercase tracking-wider block">Consultations</span>
              <p className="text-3xl font-serif font-black text-coral-950 mt-1">{stats?.total_appointments || 14}</p>
              <p className="text-[10px] text-charcoal-400 mt-0.5">Student sessions</p>
            </div>
          </div>

          {/* Aggregate Anonymous Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
              <h3 className="text-base font-serif font-bold text-charcoal-900 mb-1">Campus Mood Breakdown (Anonymized)</h3>
              <p className="text-xs text-charcoal-400 mb-4">Proportion of campus student emotional ratings</p>
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

            <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
              <h3 className="text-base font-serif font-bold text-charcoal-900 mb-1">Top Campus Stress Triggers</h3>
              <p className="text-xs text-charcoal-400 mb-4">Anonymized report for faculty wellness planning</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stressChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE7DC" />
                    <XAxis dataKey="category" tick={{ fill: '#756E96', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#756E96', fontSize: 10 }} tickLine={false} axisLine={false} />
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
        <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-charcoal-900">Campus Account Registry</h3>
              <p className="text-xs text-charcoal-400">Manage user access roles and activation status</p>
            </div>
            <div className="inline-flex p-1 bg-cream-100 rounded-2xl border border-cream-200 self-start sm:self-auto">
              {['', 'student', 'counsellor', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`text-xs px-3 py-1 rounded-xl transition capitalize font-bold ${
                    roleFilter === r
                      ? 'bg-purple-600 text-white shadow-wellness-sm'
                      : 'text-charcoal-600 hover:text-charcoal-900'
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
                <tr className="border-b border-cream-200 text-charcoal-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-50/60 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-charcoal-900">{u.full_name}</p>
                      <p className="text-[11px] text-charcoal-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full capitalize border border-purple-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-charcoal-600">{u.department || 'Campus'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-mint-100 text-mint-900' : 'bg-rose-100 text-rose-900'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className="text-xs text-purple-700 hover:underline font-bold"
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
        <div className="rounded-4xl bg-white/95 backdrop-blur-md border border-cream-200/90 p-6 shadow-wellness">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-charcoal-900">Resource Library Management</h3>
              <p className="text-xs text-charcoal-400">Curated clinical coping guides and student references</p>
            </div>
            <button
              onClick={openCreateResource}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-glow-lavender"
            >
              <Plus className="w-3.5 h-3.5" /> Add Resource
            </button>
          </div>

          <div className="space-y-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-3xl bg-cream-50/70 border border-cream-200 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-charcoal-900">{r.title}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1 line-clamp-1">{r.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditResource(r)}
                    className="p-1.5 rounded-xl text-charcoal-400 hover:text-purple-600 hover:bg-lavender-50 transition"
                    title="Edit resource"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(r.id)}
                    className="p-1.5 rounded-xl text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFDF9] rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative animate-scale-up">
            <button
              onClick={() => setIsResourceModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-cream-100 text-charcoal-400 hover:text-charcoal-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-4">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h2>

            <form onSubmit={handleSaveResource} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={resCategory}
                    onChange={(e) => setResCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Read Time (min)
                  </label>
                  <input
                    type="number"
                    value={resReadTime}
                    onChange={(e) => setResReadTime(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Summary
                </label>
                <textarea
                  rows="2"
                  value={resSummary}
                  onChange={(e) => setResSummary(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-white border border-cream-200 text-charcoal-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Guide Body (Prose / Markdown)
                </label>
                <textarea
                  rows="5"
                  value={resContent}
                  onChange={(e) => setResContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-white border border-cream-200 text-charcoal-900 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-charcoal-500 hover:text-charcoal-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-glow-lavender transition"
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
