import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  subtext: string;
  logo?: string;
}

const workspaces: Workspace[] = [
  { id: '1', name: 'Wannes Geerts', subtext: 'X Workspace' },
  { id: '2', name: 'Personal Space', subtext: 'Y Workspace' },
  { id: '3', name: 'Team Space', subtext: 'Z Workspace' },
];

export function WorkspaceDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 w-full px-3 py-1.5 text-white bg-[#1a1a1a] rounded-lg transition-colors group"
      >
        <div className="w-6 h-6 bg-white rounded-full flex-shrink-0" />
        <div className="flex-1 text-left">
          <div className="font-medium text-xs">{selectedWorkspace.name}</div>
          <div className="text-[10px] text-gray-400">{selectedWorkspace.subtext}</div>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] rounded-lg shadow-lg py-1 z-20">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setSelectedWorkspace(workspace);
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-1.5 hover:bg-black/50 text-white transition-colors"
              >
                <div className="w-6 h-6 bg-white rounded-full flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-xs">{workspace.name}</div>
                  <div className="text-[10px] text-gray-400">{workspace.subtext}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}