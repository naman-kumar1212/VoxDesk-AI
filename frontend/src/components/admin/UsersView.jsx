import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Plus,
  Search,
  Edit2,
  RefreshCw,
  X,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E3ECF7]">
        <div>
          <h1 className="text-2xl font-semibold text-[#061B31] tracking-[-0.03em]">
            Users Management
          </h1>
          <p className="text-xs text-[#425466] mt-0.5">
            Role-based administrative directory and operational team staff permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsersAndDepts}
            disabled={isLoading}
            className="p-2 rounded-full bg-white border border-[#D4DEE9] text-[#061B31] hover:bg-[#F6F9FC] transition shadow-sm cursor-pointer"
            title="Refresh directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#533AFD] hover:bg-[#635BFF] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] hover:shadow-[0_8px_20px_rgba(83,58,253,0.32)] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-[12px] border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-[#E6F9F0] border-[#00D66F]/30 text-[#00D66F] font-semibold'
              : 'bg-[#FFF1F2] border-[#FECDD3] text-[#DF1B41] font-semibold'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#737373] hover:text-[#061B31]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Search & Filters Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-4 sm:p-5 shadow-[0_4px_12px_rgba(13,23,56,0.05)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or email address..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-xs text-[#061B31] placeholder:text-[#A1AAB8] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] font-medium focus:border-[#0570DE] outline-none cursor-pointer"
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
      <div className="bg-white border border-[#D4DEE9]/80 rounded-[18px] shadow-[0_8px_20px_rgba(13,23,56,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAFDFF] text-[#737373] text-[11px] font-semibold uppercase tracking-wider border-b border-[#E3ECF7]">
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
            <tbody className="divide-y divide-[#E3ECF7]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4 animate-pulse">
                      <div className="h-4 bg-[#F6F9FC] rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isActive = u.is_active ?? true;
                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFD] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#533AFD]/10 text-[#533AFD] border border-[#533AFD]/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-[#061B31] block">{u.name}</span>
                            <span className="text-[11px] text-[#737373] font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F6F9FC] border border-[#E3ECF7] text-[#061B31] capitalize">
                          {u.role || 'staff'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#425466]">
                        {u.department || 'General Support'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-[#E6F9F0] text-[#00D66F] border-[#00D66F]/30'
                              : 'bg-[#F6F9FC] text-[#737373] border-[#D4DEE9]'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#737373] font-mono tabular-nums">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3 px-3 text-[#737373] font-mono tabular-nums">
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-full hover:bg-[#F6F9FC] text-[#737373] hover:text-[#061B31] transition cursor-pointer"
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
                  <td colSpan={7} className="py-12 text-center text-xs text-[#737373]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061B31]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#D4DEE9] rounded-[18px] p-6 sm:p-7 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF7]">
              <h2 className="text-base font-semibold text-[#061B31]">
                {editingUser ? 'Edit User Profile' : 'Add Team Member'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#737373] hover:text-[#061B31]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#061B31] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-[#061B31] block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="alex.m@company.com"
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#061B31] block mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] outline-none cursor-pointer font-medium"
                  >
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#061B31] block mb-1">
                    Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] outline-none cursor-pointer font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#061B31] block mb-1">
                  {editingUser ? 'Update Password (Optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? 'Leave blank to keep current' : '••••••••••••'}
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none"
                />
              </div>

              {modalError && (
                <p className="text-[#DF1B41] font-semibold">{modalError}</p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white border border-[#D4DEE9] text-[#425466] hover:bg-[#F6F9FC] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#533AFD] hover:bg-[#635BFF] text-white font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] disabled:bg-[#ECF0F4] disabled:text-[#A1AAB8] disabled:cursor-not-allowed"
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
