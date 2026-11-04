import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Users,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  RefreshCw,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Mail,
  Building2,
  Calendar,
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
  const [formStatus, setFormStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Load departments for assignment dropdown
  useEffect(() => {
    if (!authToken) return;
    api.getDepartments(authToken)
      .then((data) => setDepartments(data?.departments || []))
      .catch((err) => console.error('Failed to load departments:', err));
  }, [authToken]);

  // Load users
  const loadUsers = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const data = await api.getUsers(authToken, {
        role: roleFilter,
        department: deptFilter,
        status: statusFilter,
        q: debouncedSearch,
      });
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch users.' });
    } finally {
      setIsLoading(false);
    }
  }, [authToken, roleFilter, deptFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('staff');
    setFormDept(departments[0]?.name || 'General Support');
    setFormPassword('');
    setFormStatus('active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormDept(u.department || 'General Support');
    setFormPassword('');
    setFormStatus(u.status || 'active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setModalError(null);
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    const email = formEmail.trim().toLowerCase();

    if (!name || name.length < 2) {
      setModalError('Name is required.');
      return;
    }
    if (!email || !email.includes('@')) {
      setModalError('A valid email address is required.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingUser) {
        await api.updateUser(authToken, editingUser.id, {
          name,
          role: formRole,
          department: formDept,
          status: formStatus,
        });
        setFeedback({ type: 'success', message: `User '${name}' updated successfully.` });
      } else {
        await api.createUser(authToken, {
          name,
          email,
          role: formRole,
          department: formDept,
          password: formPassword || undefined,
        });
        setFeedback({ type: 'success', message: `User '${name}' added successfully.` });
      }
      handleCloseModal();
      await loadUsers();
    } catch (err) {
      console.error('Submit user error:', err);
      setModalError(err.message || 'Failed to save user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Add User Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Users Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage administrative personnel, support agents, role authorization and department assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-700/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* 2. Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by staff name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Support Staff</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* 4. Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Authorized Personnel Directory</span>
            <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {users.length} Users
            </span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading && users.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" />
              <p>Loading user records...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">No matching user accounts found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Assigned Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Registered</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => {
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span>Administrator</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            <span>Support Staff</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.department || 'General Support'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                        {u.last_active_at ? (
                          new Date(u.last_active_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingUser ? 'Edit User Account' : 'Add Authorized User'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={Boolean(editingUser)}
                  placeholder="m.chen@example.com"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-primary-500 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
                  >
                    <option value="staff">Support Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Initial Password (Optional for Staff, required for Admin login)
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-primary-500"
                  />
                </div>
              )}

              {editingUser && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Access Suspended)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formName.trim() || !formEmail.trim()}
                  className="px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Update User' : 'Create User'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

