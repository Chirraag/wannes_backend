import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FormData {
  voice: string;
  language: string;
  welcomeMessageEnabled: boolean;
  welcomeMessage: string;
  prompt: string;
}

const voices = ['Charlotte', 'John', 'Emma', 'Michael'];
const languages = ['English', 'Dutch', 'French', 'German'];

export function CreateAgent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    voice: voices[0],
    language: languages[0],
    welcomeMessageEnabled: true,
    welcomeMessage: '',
    prompt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        navigate('/agents');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex space-x-8">
        {/* Main form */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold mb-6">Create Agent</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Voice selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voice
                </label>
                <select
                  value={formData.voice}
                  onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {voices.map((voice) => (
                    <option key={voice} value={voice}>
                      {voice}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              {/* Welcome message section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Welcome Message
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={formData.welcomeMessageEnabled.toString()}
                    onChange={(e) => setFormData({ ...formData, welcomeMessageEnabled: e.target.value === 'true' })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">AI begins with message</option>
                    <option value="false">Wait for user message</option>
                  </select>
                </div>
                {formData.welcomeMessageEnabled && (
                  <textarea
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                    placeholder="Enter welcome message"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                  />
                )}
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Enter agent prompt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-48"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Agent
              </button>
            </div>
          </form>
        </div>

        {/* Side divs */}
        <div className="w-64 space-y-4">
          {/* Empty div for future use */}
          <div className="bg-white rounded-lg p-4 shadow-sm h-64">
            {/* Content will be added later */}
          </div>

          {/* Test agents div */}
          <div className="bg-white rounded-lg p-4 shadow-sm h-64">
            {/* Test agents content will be added later */}
          </div>
        </div>
      </div>
    </div>
  );
}