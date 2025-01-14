import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Phone, Clock, Plus, Edit, Trash2 } from 'lucide-react';

// Mock data - In a real app, this would come from your backend
const agents = [
  { id: 1, name: 'Claudia Clayssens', phone: '+32456214587', voice: 'Charlotte', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
  { id: 2, name: 'Jef Jefferdsen', phone: '+32456214587', voice: 'Bart', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' },
  { id: 3, name: 'Donald Egberts', phone: '+32456214587', voice: 'John', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
  { id: 4, name: 'Mira Moossens', phone: '+32456214587', voice: 'Lola', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80' },
  { id: 5, name: 'Charlotte De Witte', phone: '+32456214587', voice: 'John', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e' },
  { id: 6, name: 'Bart Larsen', phone: '+32456214587', voice: 'Lola', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e' },
];

const knowledgeBase = [
  { id: 1, title: 'Batterijopslag' },
  { id: 2, title: 'Zonnepanelen' },
  { id: 3, title: 'Warmtepompen' },
];

function StatCard({ icon: Icon, label, value, change }: { icon: any, label: string, value: string, change?: { value: string, positive: boolean } }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="text-gray-400" size={18} />
        <span className="text-gray-600 text-sm">{label}</span>
        {change && (
          <span className={`ml-auto text-xs ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
            {change.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Welcome {firstName}!</h1>
      <div className="text-base text-gray-600 mb-6">
        Let's save you <span className="bg-blue-600 text-white px-2 py-0.5 rounded">68%</span> on payroll and schedule more appointments.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard 
          icon={Phone} 
          label="Total Calls" 
          value="345" 
          change={{ value: "+8,4%", positive: true }}
        />
        <StatCard 
          icon={Clock} 
          label="Avg Call Duration" 
          value="1m51" 
          change={{ value: "-3,7%", positive: false }}
        />
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-600 mb-2">Customer satisfaction</h3>
          <div className="flex items-center justify-center">
            <div className="text-3xl font-bold">82%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Agents</h2>
            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm">
              <Plus size={16} />
              <span>Add agent</span>
            </button>
          </div>
          <div className="space-y-3">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center space-x-3">
                <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{agent.name}</h3>
                  <div className="text-xs text-gray-500">
                    Phone: {agent.phone} • Voice: {agent.voice}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit size={14} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-blue-600 hover:text-blue-700 text-xs font-medium">
            Go to Agents
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Knowledge base</h2>
            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm">
              <Plus size={16} />
              <span>Add article</span>
            </button>
          </div>
          <div className="space-y-3">
            {knowledgeBase.map(article => (
              <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-sm">
                    📄
                  </div>
                  <span className="text-sm font-medium">{article.title}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit size={14} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-blue-600 hover:text-blue-700 text-xs font-medium">
            Go to Knowledge base
          </button>
        </div>
      </div>
    </div>
  );
}