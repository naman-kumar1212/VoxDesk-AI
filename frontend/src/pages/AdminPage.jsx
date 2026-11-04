import React, { useState, useEffect, useCallback } from 'react';
import AdminAccessGate from '../components/AdminAccessGate';
import DashboardMetrics from '../components/DashboardMetrics';
import TicketFilters from '../components/TicketFilters';
import TicketTable from '../components/TicketTable';
import TicketDetail from '../components/TicketDetail';
import { api } from '../services/api';
import { RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicketData, setSelectedTicketData] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });

  const fetchData = useCallback(async () => {
    if (!adminKey) return;
    setIsLoading(true);

    try {
      const [metricsData, ticketsData] = await Promise.all([
        api.getAdminAnalytics(adminKey),
        api.getAdminTickets(adminKey, filters),
      ]);

      setMetrics(metricsData);
      setTickets(ticketsData.tickets || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminKey, filters]);

  useEffect(() => {
    if (adminKey) {
      fetchData();
    }
  }, [adminKey, fetchData]);

  const handleSelectTicket = async (ticketId) => {
    try {
      const data = await api.getAdminTicketDetail(adminKey, ticketId);
      setSelectedTicketData(data);
    } catch (err) {
      console.error('Failed to fetch ticket detail:', err);
    }
  };

  const handleStatusUpdated = () => {
    fetchData();
    // Refresh selected detail
    if (selectedTicketData?.ticket?.id) {
      handleSelectTicket(selectedTicketData.ticket.id);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ status: '', priority: '', category: '' });
  };

  if (!adminKey) {
    return <AdminAccessGate onAuthenticated={setAdminKey} />;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Ticket Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time grievance monitoring, classification auditing, and escalation handling.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <DashboardMetrics metrics={metrics} isLoading={isLoading} />

      {/* Filters Bar */}
      <TicketFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Tickets Table */}
      <TicketTable
        tickets={tickets}
        onSelectTicket={handleSelectTicket}
        isLoading={isLoading}
      />

      {/* Ticket Detail Drawer/Modal */}
      {selectedTicketData && (
        <TicketDetail
          ticketData={selectedTicketData}
          adminKey={adminKey}
          onClose={() => setSelectedTicketData(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}

