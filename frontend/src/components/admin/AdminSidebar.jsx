import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Building2,
  Users,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
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
      className="w-full h-full bg-sidebar text-slate-300 flex flex-col justify-between border-r border-slate-800/80 select-none overflow-hidden"
      aria-label="Admin Sidebar"
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Top Header: Brand Logo, Name, and Collapse / Close controls */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg min-w-0"
          title="Return to Public Site"
        >
          <img
            src="/voxdesk-app-icon-512.png"
            alt="VoxDesk AI App Icon"
            className="w-8 h-8 rounded-xl object-contain shadow-md ring-1 ring-primary-500/30 shrink-0"
            width="32"
            height="32"
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-white font-extrabold text-sm tracking-tight leading-none truncate">
                VoxDesk <span className="text-primary-400 font-medium">AI</span>
              </div>
              <div className="text-[10px] text-primary-300/80 font-bold tracking-wider uppercase mt-1">
                Admin Console
              </div>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close mobile navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse / Expand Toggle */}
        {!isMobile && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Middle Section: Navigation Menu Items (Scrollable if height is constrained) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
        )}

        <nav className="space-y-1" aria-label="Administrative Navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onTabChange) onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? item.name : undefined}
                aria-label={item.name}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'
                } rounded-xl text-xs font-semibold transition cursor-pointer group relative ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Collapsed floating tooltip badge on hover */}
                {isCollapsed && (
                  <span className="sr-only">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Bottom Section: Admin Profile Card, Exit to Public Home, and Sign Out */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-800/80 p-3 space-y-1.5 bg-sidebar">
        {/* Admin User Details Card (when expanded) */}
        {!isCollapsed && currentUser && (
          <div className="px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600/20 text-primary-400 font-bold flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white truncate text-xs">
                {currentUser.name || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser.email}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-primary-400 mt-0.5">
                Role: {currentUser.role || 'Admin'}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Profile Icon with Tooltip */}
        {isCollapsed && currentUser && (
          <div
            className="flex justify-center py-2"
            title={`${currentUser.name || 'Admin'} (${currentUser.email || ''})`}
          >
            <div className="w-8 h-8 rounded-xl bg-primary-600/20 text-primary-400 font-bold flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Exit to Public Home Link */}
        <Link
          to="/"
          title="Exit to Public Home"
          aria-label="Exit to Public Home"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
          } text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition`}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Exit to Public Home</span>}
        </Link>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onLogout}
          title="Sign Out"
          aria-label="Sign Out"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
          } text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer`}
        >
          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
