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
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VoxDeskLogo from '../VoxDeskLogo';

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
      className="w-full h-full bg-[#111827] text-[#C7D2E0] flex flex-col justify-between border-r border-[#1F2937] select-none overflow-hidden"
      aria-label="Admin Sidebar"
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Top Header: Brand Logo & Collapse / Close controls */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1F2937] shrink-0 bg-[#111827]">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand rounded-lg min-w-0"
          title="Return to Public Site"
        >
          {isCollapsed && !isMobile ? (
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center p-1.5 font-bold text-xs shrink-0 shadow-xs">
              VD
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
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
              <span className="font-bold tracking-tight text-white leading-none text-base">
                VoxDesk <span className="text-[#8B6CF0] font-semibold">AI</span>
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
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
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition hidden lg:flex"
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
        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-xs font-medium transition cursor-pointer relative ${
                isActive
                  ? 'bg-[#26344B] text-white font-semibold'
                  : 'text-[#C7D2E0] hover:bg-[#182338] hover:text-white'
              } ${isCollapsed && !isMobile ? 'justify-center px-0' : ''}`}
              title={item.name}
            >
              {/* Refined violet left active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#8B6CF0] rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8B6CF0]' : 'text-slate-400'}`} />
              {(!isCollapsed || isMobile) && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Bottom User Profile & Sign Out Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-[#1F2937] bg-[#111827] space-y-2 shrink-0">
        <div className={`flex items-center gap-2.5 p-2 rounded-btn bg-[#182338] ${isCollapsed && !isMobile ? 'justify-center p-1.5' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0 text-left">
              <span className="text-xs font-semibold text-white block truncate leading-tight">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate leading-tight">
                {currentUser?.email || 'admin@voxdesk.ai'}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer ${
            isCollapsed && !isMobile ? 'justify-center px-0' : ''
          }`}
          title="Sign out of Admin Console"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
