import React from 'react';

export default function AdminMainContent({ children }) {
  return (
    <main
      className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4 sm:p-8 bg-app focus:outline-none"
      id="admin-main-content"
      tabIndex={-1}
    >
      <div className="max-w-7xl w-full mx-auto space-y-6 pb-12">
        {children}
      </div>
    </main>
  );
}
