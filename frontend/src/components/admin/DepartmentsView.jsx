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

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormName(dept.name || '');
    setFormDescription(dept.description || '');
    setFormStatus(dept.status || 'active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Department name is required.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        status: formStatus,
      };

      if (editingDept) {
        await api.updateDepartment(authToken, editingDept.id, payload);
        setFeedback({ type: 'success', message: `Department "${payload.name}" updated successfully.` });
      } else {
        await api.createDepartment(authToken, payload);
        setFeedback({ type: 'success', message: `Department "${payload.name}" created successfully.` });
      }

      setIsModalOpen(false);
      loadDepartments();
    } catch (err) {
      console.error('Department save failed:', err);
      setModalError(err.message || 'Operation failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteDepartment(authToken, deptToDelete.id);
      setFeedback({ type: 'success', message: `Department "${deptToDelete.name}" deleted.` });
      setDeptToDelete(null);
      loadDepartments();
    } catch (err) {
      console.error('Department deletion failed:', err);
      setFeedback({ type: 'error', message: err.message || 'Cannot delete department with active tickets.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header & Primary CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            Departments Management
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Operational unit capacity, active ticket queues, and routing rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDepartments}
            disabled={isLoading}
            className="p-2 rounded-btn bg-surface border border-border text-slate-600 hover:text-primary-text transition shadow-xs cursor-pointer"
            title="Refresh departments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
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
      {/* 2. Departments Grid */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-card bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {departments.map((dept) => {
            const isActive = dept.status === 'active';
            const totalTickets = dept.ticket_count || dept.total_tickets || 0;

            return (
              <div
                key={dept.id}
                className="bg-surface border border-border rounded-card p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-btn bg-surface-subtle text-slate-700 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-text tracking-tight">
                        {dept.name}
                      </h3>
                      <span className="text-[11px] text-muted-text line-clamp-1 mt-0.5">
                        {dept.description || 'Core service & support operations'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-text block">Open</span>
                    <span className="font-mono font-bold text-slate-700">{dept.open_tickets || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text block">In Progress</span>
                    <span className="font-mono font-bold text-blue-600">{dept.in_progress_tickets || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text block">Resolved</span>
                    <span className="font-mono font-bold text-emerald-600">{dept.resolved_tickets || 0}</span>
                  </div>
                </div>

                {/* Footer Controls: Total tickets + Edit/Delete */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-text">
                    <strong className="text-primary-text font-mono">{totalTickets}</strong> total tickets
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 rounded-btn hover:bg-surface-subtle text-slate-500 hover:text-primary-text transition"
                      title="Edit department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptToDelete(dept)}
                      className="p-1.5 rounded-btn hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Delete department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-surface border border-border rounded-card space-y-2">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <span className="text-xs font-semibold text-primary-text block">No departments configured</span>
          <p className="text-xs text-muted-text">Click Add Department to set up your organizational routing.</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Add / Edit Department Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-card p-6 shadow-elevated w-full max-w-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base font-bold text-primary-text">
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-primary-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-primary-text block mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Logistics & Delivery"
                  className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-primary-text block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Responsibilities and routing guidelines..."
                  className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-primary-text block mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-input text-primary-text focus:border-brand outline-none cursor-pointer"
                >
                  <option value="active">Active (Receives Tickets)</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {isSubmitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. Delete Confirmation Guard Dialog */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-card p-6 shadow-elevated w-full max-w-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-primary-text">Delete Department?</h2>
              <p className="text-xs text-muted-text">
                Are you sure you want to delete <strong>"{deptToDelete.name}"</strong>? This action cannot be reversed.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 rounded-btn bg-surface border border-border text-xs font-semibold text-secondary-text hover:bg-surface-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={isDeleting}
                className="px-5 py-2 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:bg-rose-300"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
