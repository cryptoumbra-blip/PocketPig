import React from 'react';
import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopRail } from './DesktopRail';

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
      <main className="flex-1 min-w-0 lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-[1500px] min-h-screen">
          <div className="flex min-h-screen justify-center xl:justify-between gap-8 px-0 lg:px-8 2xl:px-10">
            <div className="flex-1 min-w-0 flex justify-center">
              <div className="w-full max-w-md lg:max-w-3xl 2xl:max-w-4xl relative pb-20 lg:pb-10">
                <Outlet />
              </div>
            </div>
            <DesktopRail />
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
