import React, { useState } from 'react';
import { Settings, User, Key, ShieldCheck, Database, Bell, Save, CheckCircle2, Cpu } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState('gsk_groq_enterprise_demo_8921379812481000');
  const [model, setModel] = useState('gemma2-9b-it');
  const [autoNER, setAutoNER] = useState(true);
  const [voiceDictation, setVoiceDictation] = useState(true);
  const [dupThreshold, setDupThreshold] = useState('85');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'CRM Settings Persisted',
      description: `Updated active inference model to ${model} and refreshed API token.`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>CRM & LangGraph Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage user preferences, Groq API endpoints, and database connection pooling.</p>
        </div>
        <Badge variant="success" className="font-bold">Enterprise Tier</Badge>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-blue-600" />
            <span>Medical Representative Profile</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue="Alex Mercer"
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Assigned Territory / Role</label>
              <input
                type="text"
                defaultValue="Senior Lead Representative (North India / Delhi NCR)"
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Corporate Email</label>
              <input
                type="email"
                defaultValue="alex.mercer@veevacrm.health"
                className="w-full h-10 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">CRM Tenant ID</label>
              <input
                type="text"
                defaultValue="TENANT-HEALTHCLOUD-9902"
                className="w-full h-10 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-mono text-slate-600 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </Card>

        {/* AI Engine & Groq API Settings */}
        <Card className="p-6 space-y-4 border-t-4 border-t-purple-600">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              <span>LangGraph AI Engine & Groq API parameters</span>
            </span>
            <Badge variant="purple">gemma2-9b-it Active</Badge>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Groq API Key (GROQ_API_KEY)</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-300 bg-white text-sm font-mono text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Active LLM Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="gemma2-9b-it">gemma2-9b-it (Recommended Fast NER)</option>
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Deep Strategic Reasoning)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Low Latency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Duplicate Check Similarity Threshold (%)</label>
                <input
                  type="number"
                  value={dupThreshold}
                  onChange={(e) => setDupThreshold(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800">Real-time Entity Extraction (NER) on Chat Mode</span>
                  <p className="text-xs text-slate-500">Automatically extracts doctors, hospitals, products, and sentiments as you type.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoNER}
                  onChange={(e) => setAutoNER(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800">Web Speech API Voice Dictation Support</span>
                  <p className="text-xs text-slate-500">Enables microphone dictation with automatic speech-to-text formatting.</p>
                </div>
                <input
                  type="checkbox"
                  checked={voiceDictation}
                  onChange={(e) => setVoiceDictation(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Database & System Status */}
        <Card className="p-6 space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>PostgreSQL Database & ORM Status</span>
            </span>
            <Badge variant="success">● Online & Synchronized</Badge>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Connection String:</span>
              <span>postgresql://postgres:***@localhost:5432/crm_hcp_db</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">SQLAlchemy Pool:</span>
              <span>AsyncSession / Engine Pool Size: 10</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Alembic Migrations:</span>
              <span className="text-emerald-700 font-bold">Base &rarr; Head synced</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 font-bold px-8">
            <Save className="w-4 h-4 mr-2" /> Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
