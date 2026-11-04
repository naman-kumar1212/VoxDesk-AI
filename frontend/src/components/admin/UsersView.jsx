import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Plus,
  Search,
  Edit2,
  RefreshCw,
  Loader2,
  X,
  Mail,
  Building2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function UsersView({ authToken, currentUser }) {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('staff');
  const [formDept, setFormDept] = useState('General Support');
  const [formPassword, setFormPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadUsersAndDepts = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const [uData, dData] = await Promise.all([
        api.getUsers(authToken),
        api.getDepartments(authToken),
      ]);
      setUsers(uData?.users || []);
      setDepartments(dData?.departments || []);
    } catch (err) {
      console.error('Failed to load users directory:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch directory data.' });
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadUsersAndDepts();
  }, [loadUsersAndDepts]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('staff');
    setFormDept(departments[0]?.name || 'General Support');
    setFormPassword('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormRole(user.role || 'staff');
    setFormDept(user.department || 'General Support');
    setFormPassword('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formEmail.trim() || !formName.trim()) {
      setModalError('Full name and email address are required.');
      return;
    }

    if (!editingUser && !formPassword) {
      setModalError('Password is required for new accounts.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        department: formDept,
      };
      if (formPassword) payload.password = formPassword;

      if (editingUser) {
        await api.updateUser(authToken, editingUser.id, payload);
        setFeedback({ type: 'success', message: `User "${payload.name}" updated successfully.` });
      } else {
        await api.createUser(authToken, payload);
        setFeedback({ type: 'success', message: `User "${payload.name}" registered successfully.` });
      }

      setIsModalOpen(false);
      loadUsersAndDepts();
    } catch (err) {
      console.error('User save failed:', err);
      setModalError(err.message || 'Operation failed. Verify input details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (deptFilter !== 'ALL' && u.department !== deptFilter) return false;
    if (statusFilter !== 'ALL') {
      const matchActive = statusFilter === 'active';
      if ((u.is_active ?? true) !== matchActive) return false;
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header & Primary CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            Users Management
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Role-based administrative directory and team staff permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsersAndDepts}
            disabled={isLoading}
            className="p-2 rounded-btn bg-surface border border-border text-slate-600 hover:text-primary-text transition shadow-xs cursor-pointer"
            title="Refresh directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Search & Filters Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or email address..."
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-input text-xs text-primary-text focus:border-brand outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 bg-surface border border-border rounded-input text-secondary-text focus:border-brand outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Directory Table */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-subtle text-muted-text font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Registered</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4 animate-pulse">
                      <div className="h-4 bg-surface-muted rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isActive = u.is_active ?? true;
                  return (
                    <tr key={u.id} className="hover:bg-surface-subtle/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-surface-muted text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-primary-text block">{u.name}</span>
                            <span className="text-[11px] text-muted-text">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-subtle border border-border text-slate-700 capitalize">
                          {u.role || 'staff'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-secondary-text">
                        {u.department || 'General Support'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-text">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3 px-3 text-muted-text">
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1 rounded-btn hover:bg-surface-subtle text-slate-500 hover:text-primary-text transition"
                          title="Edit user details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted-text">
                    No users matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. Add / Edit User Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-card p-6 shadow-elevated w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-primary-text">
                {editingUser ? 'Edit User Profile' : 'Add Team Member'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-primary-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-primary-text block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-primary-text block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="alex.m@company.com"
                  className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-primary-text block mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none cursor-pointer"
                  >
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-primary-text block mb-1">
                    Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-primary-text block mb-1">
                  {editingUser ? 'Update Password (Optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? 'Leave blank to keep current' : '••••••••••••'}
                  className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none"
                />
              </div>

              {modalError && (
                <p className="text-rose-600 font-medium">{modalError}</p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-btn bg-surface border border-border text-secondary-text hover:bg-surface-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-btn bg-brand hover:bg-brand-hover text-white font-semibold disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
