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
    <header className="h-16 bg-white border-b border-[#E3ECF7] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none">
      {/* Left Area: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-[#425466] hover:text-[#061B31] rounded-lg hover:bg-[#F6F9FC] transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#061B31]">
            VoxDesk Control Center
          </span>
          <span className="text-[#A1AAB8]" aria-hidden="true">/</span>
          <span className="font-semibold text-[#533AFD] bg-[#533AFD]/10 px-2.5 py-0.5 rounded-full border border-[#533AFD]/20">
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
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4DEE9] bg-white text-xs font-semibold text-[#061B31] shadow-sm hover:bg-[#F6F9FC] transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-[#533AFD] text-white flex items-center justify-center text-[10px] font-mono font-bold">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="hidden sm:inline truncate max-w-[140px]">
            {currentUser?.name || currentUser?.email || 'Admin'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#737373] transition-transform duration-150 ${
              profileDropdownOpen ? 'rotate-180 text-[#533AFD]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {profileDropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 bg-white border border-[#D4DEE9] rounded-[14px] shadow-[0_12px_28px_rgba(13,23,56,0.12)] p-2 z-30 space-y-1"
          >
            <div className="px-3 py-2 border-b border-[#E3ECF7] text-xs">
              <div className="font-semibold text-[#061B31] truncate">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-mono text-[#737373] truncate">
                {currentUser?.email || 'admin@voxdesk.ai'}
              </div>
              <div className="text-[10px] font-mono font-medium text-[#533AFD] mt-1">
                Role: {currentUser?.role || 'Admin'}
              </div>
            </div>

            <Link
              to="/"
              role="menuitem"
              onClick={() => setProfileDropdownOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#425466] hover:text-[#061B31] hover:bg-[#F6F9FC] rounded-lg transition-colors font-medium"
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
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#DF1B41] hover:bg-[#FFF1F2] rounded-lg font-semibold transition-colors cursor-pointer"
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
