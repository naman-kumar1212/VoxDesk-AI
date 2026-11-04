import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Building2,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ShieldCheck,
} from 'lucide-react';

export default function DepartmentsView({ authToken }) {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete guard confirmation state
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const data = await api.getDepartments(authToken);
      setDepartments(data?.departments || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch departments.' });
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormDescription(dept.description || '');
    setFormStatus(dept.status || 'active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setModalError(null);
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name || name.length < 2) {
      setModalError('Department name must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingDept) {
        await api.updateDepartment(authToken, editingDept.id, {
          name,
          description: formDescription.trim(),
          status: formStatus,
        });
        setFeedback({ type: 'success', message: `Department '${name}' updated successfully.` });
      } else {
        await api.createDepartment(authToken, {
          name,
          description: formDescription.trim(),
          status: formStatus,
        });
        setFeedback({ type: 'success', message: `Department '${name}' created successfully.` });
      }
      handleCloseModal();
      await loadDepartments();
    } catch (err) {
      console.error('Department submit error:', err);
      setModalError(err.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!dept) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await api.deleteDepartment(authToken, dept.id);
      setFeedback({ type: 'success', message: `Department '${dept.name}' deleted successfully.` });
      setDeptToDelete(null);
      await loadDepartments();
    } catch (err) {
      console.error('Delete department error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to delete department.' });
      setDeptToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Departments Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure routing departments, assign specialized support teams, and monitor assigned grievance queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDepartments}
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
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* 2. Global Feedback Banner */}
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

      {/* 3. Department Cards Grid */}
      {isLoading && departments.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200/80">
          <Inbox className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No departments configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => {
            const hasAssignedTickets = (dept.total_tickets || 0) > 0;

            return (
              <div
                key={dept.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Card Title & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                            dept.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {dept.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(dept)}
                        title="Edit Department"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeptToDelete(dept)}
                        title="Delete Department"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-2">
                    {dept.description || 'No specialized description provided for this department.'}
                  </p>
                </div>

                {/* Queue Metrics 4-Box Grid */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dept.staff_count || 0} Assigned Staff</span>
                    </div>
                    <span className="font-extrabold font-mono text-slate-900">
                      {dept.total_tickets || 0} Total
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Open</div>
                      <div className="font-bold text-slate-700 font-mono">{dept.open_tickets || 0}</div>
                    </div>
                    <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                      <div className="text-[10px] text-blue-500 uppercase font-semibold">Active</div>
                      <div className="font-bold text-blue-700 font-mono">{dept.in_progress_tickets || 0}</div>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                      <div className="text-[10px] text-emerald-500 uppercase font-semibold">Done</div>
                      <div className="font-bold text-emerald-700 font-mono">{dept.resolved_tickets || 0}</div>
                    </div>
                    <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100">
                      <div className="text-[10px] text-rose-500 uppercase font-semibold">Esc.</div>
                      <div className="font-bold text-rose-700 font-mono">{dept.escalated_tickets || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add/Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingDept ? 'Edit Department' : 'Create New Department'}
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
                  Department Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fraud Investigation"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize the core scope and grievance responsibilities..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Operational Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-800"
                >
                  <option value="active">Active (Receives automated routing)</option>
                  <option value="inactive">Inactive (Suspended)</option>
                </select>
              </div>

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
                  disabled={isSubmitting || !formName.trim()}
                  className="px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingDept ? 'Update Department' : 'Create Department'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Safe Delete Guard Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              Delete Department '{deptToDelete.name}'?
            </h3>

            {deptToDelete.total_tickets > 0 ? (
              <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left leading-relaxed">
                <strong>Cannot Delete:</strong> {deptToDelete.total_tickets} tickets are currently assigned to this department. You must reassign tickets in the Tickets Management tab or deactivate this department instead.
              </p>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                This department has no assigned tickets and can be removed safely. Are you sure you wish to proceed?
              </p>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Close
              </button>
              {deptToDelete.total_tickets === 0 && (
                <button
                  type="button"
                  onClick={() => handleDelete(deptToDelete)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Deletion'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

