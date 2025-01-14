import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export function Agents() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <Link
          to="/agents/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
        >
          <Plus size={16} />
          <span>Create Agent</span>
        </Link>
      </div>

      {/* Agent list will go here */}
    </div>
  );
}