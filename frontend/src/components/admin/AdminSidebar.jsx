import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Building2,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSidebar({
  activeTab = 'Dashboard',
  onTabChange,
  onLogout,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  currentUser = null,
  isMobile = false,
}) {
  const menuItems = [
    { id: 'Dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'Tickets', name: 'Tickets', icon: Ticket },
    { id: 'Analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'Departments', name: 'Departments', icon: Building2 },
    { id: 'Users', name: 'Users', icon: Users },
  ];

  return (
    <aside
      className="w-full h-full bg-[#061B31] text-[#E3ECF7] flex flex-col justify-between border-r border-[#1C1E54] select-none overflow-hidden"
      aria-label="Admin Sidebar"
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Top Header: Brand Logo & Collapse / Close controls */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1C1E54] shrink-0 bg-[#061B31]">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 rounded-lg min-w-0"
          title="Return to public site"
        >
          {isCollapsed && !isMobile ? (
            <div className="w-8 h-8 rounded-lg bg-[#533AFD] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm">
              VD
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#533AFD] text-white flex items-center justify-center p-1.5 shadow-sm shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-full h-full"
                  aria-hidden="true"
                >
                  <line x1="4" y1="10" x2="4" y2="14" />
                  <line x1="8" y1="7" x2="8" y2="17" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <line x1="16" y1="7" x2="16" y2="17" />
                  <line x1="20" y1="10" x2="20" y2="14" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-white leading-none text-sm">
                VoxDesk <span className="text-[#FB76FA] font-mono text-[11px] font-normal">Console</span>
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-[#A1AAB8] hover:text-white rounded-lg hover:bg-[#1C1E54] transition-colors"
            aria-label="Close sidebar drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-[#A1AAB8] hover:text-white rounded-lg hover:bg-[#1C1E54] transition-colors hidden lg:flex"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Middle Navigation Items */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-mono font-medium tracking-wider text-[#A1AAB8] uppercase">
          {!isCollapsed || isMobile ? 'Operations' : '•••'}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.name}
              onClick={() => {
                if (onTabChange) onTabChange(item.id);
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#1C1E54] text-white shadow-sm'
                  : 'text-[#D4DEE9] hover:bg-[#1C1E54]/60 hover:text-white'
              } ${isCollapsed && !isMobile ? 'justify-center px-0' : ''}`}
              title={item.name}
            >
              {/* Stripe violet active indicator hairline */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#635BFF] rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#635BFF]' : 'text-[#A1AAB8]'}`} />
              {(!isCollapsed || isMobile) && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Bottom User Profile & Sign Out Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-[#1C1E54] bg-[#061B31] space-y-2 shrink-0">
        <div className={`flex items-center gap-2.5 p-2 rounded-lg bg-[#1C1E54]/70 border border-[#2B408A]/40 ${isCollapsed && !isMobile ? 'justify-center p-1.5' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-[#533AFD] text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0 shadow-sm">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0 text-left">
              <span className="text-xs font-semibold text-white block truncate leading-tight">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] font-mono text-[#A1AAB8] block truncate leading-tight">
                {currentUser?.email || 'admin@voxdesk.ai'}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#FB76FA] hover:bg-[#FB76FA]/10 hover:text-[#FB76FA] transition-colors cursor-pointer ${
            isCollapsed && !isMobile ? 'justify-center px-0' : ''
          }`}
          title="Sign out of admin console"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
