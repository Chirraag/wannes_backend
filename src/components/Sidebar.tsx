import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Phone, 
  History, 
  CreditCard, 
  LogOut 
} from 'lucide-react';
import { signOut } from '../lib/auth';
import { WorkspaceDropdown } from './WorkspaceDropdown';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/home' },
  { icon: Users, label: 'Agents', path: '/agents' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge-base' },
  { icon: Phone, label: 'Phone numbers', path: '/phone-numbers' },
  { icon: History, label: 'Call history', path: '/call-history' },
  { icon: CreditCard, label: 'Billing', path: '/billing' },
];

export function Sidebar() {
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="w-56 h-screen bg-black text-white flex flex-col flex-shrink-0 overflow-hidden">
      <div className="p-3 border-b border-gray-800">
        <WorkspaceDropdown />
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-900'
                  }`
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-gray-300 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}