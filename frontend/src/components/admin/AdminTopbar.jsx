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
    <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none">
      {/* Left Area: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-secondary-text hover:text-primary-text rounded-btn hover:bg-surface-subtle transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-primary-text">
            VoxDesk Control Center
          </span>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <span className="font-medium text-brand bg-brand-subtle px-2 py-0.5 rounded-tag border border-brand/20">
            {activeTab}
          </span>
        </div>
      </div>

      {/* Right Area: Admin Profile Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setProfileDropdownOpen((prev) => !prev)}
          aria-expanded={profileDropdownOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 px-3 py-1.5 rounded-btn border border-border bg-surface text-xs font-medium text-secondary-text shadow-xs hover:bg-surface-subtle hover:text-primary-text transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 rounded-btn bg-brand text-white flex items-center justify-center text-[10px] font-mono font-medium">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="hidden sm:inline truncate max-w-[140px]">
            {currentUser?.name || currentUser?.email || 'Admin'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-secondary-text transition-transform duration-150 ${
              profileDropdownOpen ? 'rotate-180 text-brand' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {profileDropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 bg-surface border border-border rounded-card shadow-md p-1.5 z-30 space-y-1"
          >
            <div className="px-3 py-2 border-b border-border text-xs">
              <div className="font-medium text-primary-text truncate">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-mono text-muted-text truncate">
                {currentUser?.email || 'admin@voxdesk.ai'}
              </div>
              <div className="text-[10px] font-mono text-brand mt-1">
                Role: {currentUser?.role || 'Admin'}
              </div>
            </div>

            <Link
              to="/"
              role="menuitem"
              onClick={() => setProfileDropdownOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary-text hover:text-primary-text hover:bg-surface-subtle rounded-btn transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to public home</span>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileDropdownOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-btn font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
