const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('mindbridge_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('mindbridge_token', token);
  } else {
    localStorage.removeItem('mindbridge_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear token if stored
    if (endpoint !== '/auth/login') {
      setAuthToken(null);
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = 'API Request Failed';
    if (typeof data.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data.detail)) {
      errorMsg = data.detail.map(d => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ');
    } else if (data.detail && typeof data.detail === 'object') {
      errorMsg = data.detail.msg || JSON.stringify(data.detail);
    } else if (data.message) {
      errorMsg = data.message;
    } else if (typeof data === 'string') {
      errorMsg = data;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  registerInitiate: (data) => request('/auth/register-initiate', { method: 'POST', body: JSON.stringify(data) }),
  verifyRegisterEmail: (session_id, otp_code) => request('/auth/register-verify-email', { method: 'POST', body: JSON.stringify({ session_id, otp_code }) }),
  verifyRegisterPhone: (session_id, otp_code) => request('/auth/register-verify-phone', { method: 'POST', body: JSON.stringify({ session_id, otp_code }) }),
  resendRegisterOTP: (session_id, target) => request('/auth/register-resend-otp', { method: 'POST', body: JSON.stringify({ session_id, target }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Mood
  getMoods: (days = 30) => request(`/mood/?days=${days}`),
  createMood: (moodData) => request('/mood/', { method: 'POST', body: JSON.stringify(moodData) }),
  deleteMood: (id) => request(`/mood/${id}`, { method: 'DELETE' }),

  // Stress
  getStressEntries: (days = 30) => request(`/stress/?days=${days}`),
  createStress: (stressData) => request('/stress/', { method: 'POST', body: JSON.stringify(stressData) }),
  getStressSummary: () => request('/stress/summary'),
  deleteStress: (id) => request(`/stress/${id}`, { method: 'DELETE' }),

  // Sleep
  getSleepEntries: (days = 30) => request(`/sleep/?days=${days}`),
  createSleep: (sleepData) => request('/sleep/', { method: 'POST', body: JSON.stringify(sleepData) }),
  getSleepMetrics: () => request('/sleep/metrics'),
  deleteSleep: (id) => request(`/sleep/${id}`, { method: 'DELETE' }),

  // Journal
  getJournals: (search = '', tag = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tag) params.append('tag', tag);
    const qs = params.toString();
    return request(`/journal/${qs ? `?${qs}` : ''}`);
  },
  getJournal: (id) => request(`/journal/${id}`),
  createJournal: (journalData) => request('/journal/', { method: 'POST', body: JSON.stringify(journalData) }),
  updateJournal: (id, journalData) => request(`/journal/${id}`, { method: 'PUT', body: JSON.stringify(journalData) }),
  deleteJournal: (id) => request(`/journal/${id}`, { method: 'DELETE' }),

  // Daily Check-in (Unified Phase 6)
  getTodayCheckIn: () => request('/checkin/today'),
  submitDailyCheckIn: (checkInData) => request('/checkin/', { method: 'POST', body: JSON.stringify(checkInData) }),

  // AI Assistant
  getSuggestedPrompts: () => request('/ai/suggested-prompts'),
  getAIConfig: () => request('/ai/config'),
  updateAIConfig: (configData) => request('/ai/config', { method: 'POST', body: JSON.stringify(configData) }),
  sendMessage: (message, conversation_id = null, consent_share_context = true, message_type = 'text', audio_url = null) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id, consent_share_context, message_type, audio_url }),
    }),
  getConversations: () => request('/ai/conversations'),
  getConversation: (id) => request(`/ai/conversations/${id}`),
  deleteConversation: (id) => request(`/ai/conversations/${id}`, { method: 'DELETE' }),

  // Insights
  getPersonalInsights: () => request('/insights/personal'),
  getAggregateTrends: () => request('/insights/aggregate'),

  // Counsellors & Appointments
  getCounsellors: () => request('/counsellors/'),
  getCounsellor: (id) => request(`/counsellors/${id}`),
  createAppointment: (aptData) => request('/appointments/', { method: 'POST', body: JSON.stringify(aptData) }),
  getMyAppointments: () => request('/appointments/my'),
  updateAppointmentStatus: (id, statusData) =>
    request(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) }),
  cancelAppointment: (id, cancellation_reason) =>
    request(`/appointments/${id}/cancel?cancellation_reason=${encodeURIComponent(cancellation_reason || 'Cancelled')}`, {
      method: 'PUT',
    }),

  // Resources
  getResources: (category = '', search = '') => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString();
    return request(`/resources/${qs ? `?${qs}` : ''}`);
  },
  getResource: (id) => request(`/resources/${id}`),
  createResource: (resData) => request('/resources/', { method: 'POST', body: JSON.stringify(resData) }),
  updateResource: (id, resData) => request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(resData) }),
  deleteResource: (id) => request(`/resources/${id}`, { method: 'DELETE' }),

  // Notifications & Preferences
  getNotifications: () => request('/notifications/'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  getPreferences: () => request('/notifications/preferences'),
  updatePreferences: (prefData) =>
    request('/notifications/preferences', { method: 'PUT', body: JSON.stringify(prefData) }),

  // Admin
  getPlatformStats: () => request('/admin/stats'),
  getUsers: (role = '') => request(`/admin/users${role ? `?role=${role}` : ''}`),
  toggleUserStatus: (id, is_active) =>
    request(`/admin/users/${id}/status?is_active=${is_active}`, { method: 'PUT' }),
  changeUserRole: (id, new_role) =>
    request(`/admin/users/${id}/role?new_role=${new_role}`, { method: 'PUT' }),

  // SMS Wellbeing Reminders
  getReminderStatus: () => request('/reminders/status'),
  updatePhoneNumber: (phoneData) => request('/reminders/phone', { method: 'POST', body: JSON.stringify(phoneData) }),
  sendReminderOTP: (phone_number) => request('/reminders/otp/send', { method: 'POST', body: JSON.stringify({ phone_number }) }),
  verifyReminderOTP: (phone_number, otp_code) => request('/reminders/otp/verify', { method: 'POST', body: JSON.stringify({ phone_number, otp_code }) }),
  updateReminderPreferences: (prefData) => request('/reminders/preferences', { method: 'PUT', body: JSON.stringify(prefData) }),
  triggerTestReminder: () => request('/reminders/test-reminder', { method: 'POST' }),
  optOutReminders: () => request('/reminders/opt-out', { method: 'POST' }),
  getSMSLogs: () => request('/reminders/logs'),
};
