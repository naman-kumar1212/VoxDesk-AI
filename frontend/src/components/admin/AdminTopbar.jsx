import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronDown, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminTopbar({
  activeTab = 'Dashboard',
  currentUser = null,
  onOpenMobileSidebar,
  onLogout,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handlePointerDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none">
      {/* Left Area: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-800 tracking-tight">
            VoxDesk Control Center
          </span>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <span className="font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100/60">
            {activeTab}
          </span>
        </div>
      </div>

      {/* Right Area: Admin Profile Dropdown Pill */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setProfileDropdownOpen((prev) => !prev)}
          aria-expanded={profileDropdownOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px] font-bold">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="hidden sm:inline truncate max-w-[140px]">
            {currentUser?.name || currentUser?.email || 'Admin'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              profileDropdownOpen ? 'rotate-180 text-primary-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {profileDropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-2 border-b border-slate-100 text-xs">
              <div className="font-bold text-slate-800 truncate">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || 'admin@voxdesk.ai'}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-primary-600 mt-1">
                Role: {currentUser?.role || 'Admin'}
              </div>
            </div>

            <Link
              to="/"
              role="menuitem"
              onClick={() => setProfileDropdownOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Public Home</span>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileDropdownOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

