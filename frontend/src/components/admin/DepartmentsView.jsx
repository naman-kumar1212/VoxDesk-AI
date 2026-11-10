import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Building2,
  Users,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E3ECF7]">
        <div>
          <h1 className="text-2xl font-semibold text-[#061B31] tracking-[-0.03em]">
            Departments Management
          </h1>
          <p className="text-xs text-[#425466] mt-0.5">
            Operational unit capacity, active ticket queues, and organizational routing rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDepartments}
            disabled={isLoading}
            className="p-2 rounded-full bg-white border border-[#D4DEE9] text-[#061B31] hover:bg-[#F6F9FC] transition shadow-sm cursor-pointer"
            title="Refresh departments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#533AFD] hover:bg-[#635BFF] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(83,58,253,0.25)] hover:shadow-[0_8px_20px_rgba(83,58,253,0.32)] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
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
      {/* 2. Departments Grid */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-[18px] bg-white border border-[#D4DEE9]/80 animate-pulse shadow-sm" />
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
                className="bg-white border border-[#D4DEE9]/80 rounded-[18px] p-5 sm:p-6 shadow-[0_8px_20px_rgba(13,23,56,0.08)] space-y-4 hover:border-[#533AFD]/40 transition"
              >
                {/* Header: Name + Status & Staff */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-full bg-[#F6F9FC] text-[#533AFD] shrink-0 mt-0.5 border border-[#E3ECF7]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#061B31] tracking-tight">
                        {dept.name}
                      </h3>
                      <p className="text-xs text-[#425466] line-clamp-2 mt-0.5 leading-relaxed">
                        {dept.description || 'Core service & grievance operations.'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#425466] bg-[#F6F9FC] px-2.5 py-0.5 rounded-full border border-[#E3ECF7]">
                          <Users className="w-3 h-3 text-[#737373]" />
                          <span>{dept.staff_count ?? 1} staff assigned</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                      isActive
                        ? 'bg-[#E6F9F0] text-[#00D66F] border-[#00D66F]/30'
                        : 'bg-[#F6F9FC] text-[#737373] border-[#D4DEE9]'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-1.5 p-3 rounded-[12px] bg-[#FAFDFF] border border-[#E3ECF7] text-center text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-[#737373] block uppercase tracking-wider">Open</span>
                    <span className="font-mono font-bold text-[#061B31]">{dept.open_tickets || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#737373] block uppercase tracking-wider">In Prog</span>
                    <span className="font-mono font-bold text-[#0073E6]">{dept.in_progress_tickets || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#737373] block uppercase tracking-wider">Resolved</span>
                    <span className="font-mono font-bold text-[#00D66F]">{dept.resolved_tickets || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#737373] block uppercase tracking-wider">Escalated</span>
                    <span className="font-mono font-bold text-[#DF1B41]">{dept.escalated_tickets || 0}</span>
                  </div>
                </div>

                {/* Footer Controls: Total tickets + Edit/Delete */}
                <div className="pt-2 border-t border-[#E3ECF7] flex items-center justify-between text-xs">
                  <span className="text-[#737373]">
                    <strong className="text-[#061B31] font-mono font-bold">{totalTickets}</strong> total tickets
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 rounded-full hover:bg-[#F6F9FC] text-[#737373] hover:text-[#061B31] transition"
                      title="Edit department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptToDelete(dept)}
                      className="p-1.5 rounded-full hover:bg-[#FFF1F2] text-[#737373] hover:text-[#DF1B41] transition"
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
        <div className="p-12 text-center bg-white border border-[#D4DEE9]/80 rounded-[18px] space-y-2 shadow-sm">
          <Building2 className="w-8 h-8 text-[#A1AAB8] mx-auto" />
          <span className="text-xs font-semibold text-[#061B31] block">No departments configured</span>
          <p className="text-xs text-[#737373]">Click Add Department to set up your organizational routing.</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Add / Edit Department Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061B31]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#D4DEE9] rounded-[18px] p-6 sm:p-7 shadow-2xl w-full max-w-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3ECF7]">
              <h2 className="text-base font-semibold text-[#061B31]">
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#737373] hover:text-[#061B31]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#061B31] block mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Logistics & Delivery"
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-[#061B31] block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Responsibilities and routing guidelines..."
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] focus:ring-2 focus:ring-[#0570DE]/15 outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-[#061B31] block mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D4DEE9] rounded-[4px] text-[#061B31] focus:border-[#0570DE] outline-none cursor-pointer font-medium"
                >
                  <option value="active">Active (Receives Tickets)</option>
                  <option value="inactive">Inactive</option>
                </select>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061B31]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#D4DEE9] rounded-[18px] p-6 sm:p-7 shadow-2xl w-full max-w-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#DF1B41] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#061B31]">Delete Department?</h2>
              <p className="text-xs text-[#737373] leading-relaxed">
                Are you sure you want to delete <strong>"{deptToDelete.name}"</strong>? This action cannot be reversed.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 rounded-full bg-white border border-[#D4DEE9] text-xs font-semibold text-[#425466] hover:bg-[#F6F9FC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-[#DF1B41] hover:bg-[#B81435] text-white text-xs font-semibold disabled:bg-[#ECF0F4] disabled:text-[#A1AAB8] disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(223,27,65,0.25)]"
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
