import React from 'react';
import { LayoutDashboard, Ticket, BarChart3, Building2, Users, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar({ activeTab = 'Dashboard', onTabChange, onLogout, onCloseMobile }) {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Tickets', icon: Ticket },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Departments', icon: Building2 },
    { name: 'Users', icon: Users },
  ];

  return (
    <aside className="w-60 bg-sidebar text-slate-300 min-h-screen flex flex-col justify-between p-4 shrink-0 border-r border-slate-800">
      <div>
        {/* Brand Header with App Icon */}
        <div className="flex items-center justify-between mb-8 px-2 pt-2">
          <Link
            to="/"
            className="flex items-center gap-3 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            title="Return to Public Site"
          >
            <img
              src="/voxdesk-app-icon-512.png"
              alt="VoxDesk AI App Icon"
              className="w-8 h-8 rounded-xl object-contain shadow-md ring-1 ring-primary-500/30"
              width="32"
              height="32"
            />
            <div>
              <div className="text-white font-extrabold text-sm tracking-tight leading-none">
                VoxDesk <span className="text-primary-400 font-medium">AI</span>
              </div>
              <div className="text-[10px] text-primary-300/80 font-bold tracking-wider uppercase mt-1">
                Admin Console
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5" aria-label="Admin Navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  if (onTabChange) onTabChange(item.name);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
                {item.name !== 'Dashboard' && item.name !== 'Tickets' && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation: Home & Logout */}
      <div className="pt-4 border-t border-slate-800/80 space-y-1">
        <Link
          to="/"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Home</span>
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
