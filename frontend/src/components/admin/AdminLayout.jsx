import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import AdminMainContent from './AdminMainContent';

export default function AdminLayout({
  activeTab = 'Dashboard',
  onTabChange,
  currentUser = null,
  onLogout,
  children,
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('voxdesk_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist sidebar collapsed preference
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('voxdesk_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard accessibility & body scroll lock for mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="fixed inset-0 flex bg-slate-50 font-sans overflow-hidden select-none">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Permanent Desktop Sidebar (Full Viewport Height 100dvh) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        className={`hidden md:flex flex-col h-full shrink-0 z-30 transition-[width] duration-200 ease-in-out ${
          isCollapsed ? 'w-[76px]' : 'w-[280px]'
        }`}
      >
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          currentUser={currentUser}
          onLogout={onLogout}
          isMobile={false}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Mobile / Tablet Slide-out Drawer with Backdrop Overlay */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative z-10 w-[280px] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <AdminSidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (onTabChange) onTabChange(tab);
                setMobileOpen(false);
              }}
              currentUser={currentUser}
              onLogout={onLogout}
              isMobile={true}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Right Area: Sticky Topbar + Independently Scrollable Main Content */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50">
        <AdminTopbar
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onLogout={onLogout}
        />

        <AdminMainContent>
          {children}
        </AdminMainContent>
      </div>
    </div>
  );
}

