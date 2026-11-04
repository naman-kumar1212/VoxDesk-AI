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

export default function Sidebar({
  activeTab = 'Dashboard',
  onTabChange,
  onLogout,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  currentUser = null,
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
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-sidebar text-slate-300 min-h-screen flex flex-col justify-between p-4 shrink-0 border-r border-slate-800 transition-all duration-200 select-none`}
    >
      <div>
        {/* Brand Header with App Icon and mobile close / desktop collapse */}
        <div className="flex items-center justify-between mb-8 px-1 pt-2">
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

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close mobile sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Collapse toggle for desktop */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
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

        {/* Primary Navigation: All 5 functional sections */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Navigation
            </div>
          )}

          <nav className="space-y-1" aria-label="Admin Navigation">
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
                  title={item.name}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                  } py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer: User profile info, Public Home link & Logout */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        {/* Logged in admin identity */}
        {!isCollapsed && currentUser && (
          <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-600/20 text-primary-400 font-bold flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white truncate">
                {currentUser.name || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>
        )}

        <Link
          to="/"
          title="Exit to Public Home"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
          } py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition`}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Exit to Public Home</span>}
        </Link>

        <button
          type="button"
          onClick={onLogout}
          title="Sign Out"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
          } py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer`}
        >
          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
