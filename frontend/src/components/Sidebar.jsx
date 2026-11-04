import React from 'react';
import { LayoutDashboard, Ticket, BarChart3, Building2, Users, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar({ activeTab = 'Dashboard', onTabChange, onLogout }) {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Tickets', icon: Ticket },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Departments', icon: Building2 },
    { name: 'Users', icon: Users },
  ];

  return (
    <aside className="w-56 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="flex items-center gap-0.5 text-primary-400">
            <span className="w-1 h-3 bg-primary-400 rounded-full"></span>
            <span className="w-1 h-4.5 bg-primary-400 rounded-full"></span>
            <span className="w-1 h-6 bg-primary-300 rounded-full"></span>
            <span className="w-1 h-4 bg-primary-400 rounded-full"></span>
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none">VoxDesk AI</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">Admin</div>
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => onTabChange && onTabChange(item.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom */}
      <div className="pt-4 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
