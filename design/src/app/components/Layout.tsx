import React from 'react';
import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';

export const Layout: React.FC = () => {
  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        background: 'linear-gradient(160deg, #0A0D1A 0%, #0D1220 40%, #101525 100%)',
      }}
    >
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <DesktopSidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:overflow-y-auto">
        {/* Desktop: wide content area */}
        <div className="flex-1 flex justify-center lg:justify-start">
          <div className="w-full max-w-md lg:max-w-2xl xl:max-w-3xl relative pb-20 lg:pb-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
