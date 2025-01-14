import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Black header area */}
        <div className="h-12 bg-black flex-shrink-0"></div>
        
        {/* Main content area with curved edges */}
        <div className="flex-1 bg-black overflow-hidden">
          <div className="h-full bg-[#f3f4f6] rounded-tl-[2rem] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}