
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioSession, AIProviderConfig } from '../types.ts';

const LANGUAGES = [
  { code: 'en', name: 'English (Global)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
];

interface SettingsViewProps {
  sessions?: AudioSession[];
  apiConfig: AIProviderConfig;
  onConfigChange: (c: AIProviderConfig) => void;
  onDeleteCache?: (id: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ sessions = [], apiConfig, onConfigChange, onDeleteCache }) => {
  const navigate = useNavigate();
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [localConfig, setLocalConfig] = useState<AIProviderConfig>({ ...apiConfig });

  const handleSave = () => {
    onConfigChange(localConfig);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const updateConfig = (updates: Partial<AIProviderConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32 min-h-full">
      <header className="flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/')} className="size-10 flex items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-white/5 active:scale-90 transition-transform shadow-sm dark:shadow-none">
             <span className="material-symbols-outlined text-slate-500 dark:text-gray-400">arrow_back</span>
           </button>
           <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
        </div>
      </header>

      {/* Theme Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <span className="material-symbols-outlined text-slate-400 dark:text-gray-500 text-sm">palette</span>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest">Interface Theme</h3>
        </div>
        <div className="grid grid-cols-2 bg-surface-light dark:bg-surface-dark p-1 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <button 
            onClick={() => updateConfig({ theme: 'light' })}
            className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${localConfig.theme === 'light' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Light Mode
          </button>
          <button 
            onClick={() => updateConfig({ theme: 'dark' })}
            className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${localConfig.theme === 'dark' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-gray-500 hover:text-white'}`}
          >
            Dark Mode
          </button>
        </div>
      </section>

      {/* Provider Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <span className="material-symbols-outlined text-slate-400 dark:text-gray-500 text-sm">hub</span>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest">Model Provider</h3>
        </div>
        <div className="grid grid-cols-2 bg-surface-light dark:bg-surface-dark p-1 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
          <button 
            onClick={() => updateConfig({ provider: 'gemini' })}
            className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${localConfig.provider === 'gemini' ? (localConfig.theme === 'light' ? 'bg-slate-900 text-white' : 'bg-primary text-white') : 'text-slate-400 dark:text-gray-500 hover:text-white'}`}
          >
            Built-in Engine
          </button>
          <button 
            onClick={() => updateConfig({ provider: 'deepgram' })}
            className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${localConfig.provider === 'deepgram' ? (localConfig.theme === 'light' ? 'bg-slate-900 text-white' : 'bg-primary text-white') : 'text-slate-400 dark:text-gray-500 hover:text-white'}`}
          >
            Custom ASR
          </button>
        </div>
      </section>

      {/* Preference Settings */}
      <section className="bg-surface-light dark:bg-surface-dark/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-6 shadow-sm dark:shadow-none">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Learning Language</label>
          <div className="relative">
            <select 
              value={localConfig.deepgramLanguage}
              onChange={(e) => updateConfig({ deepgramLanguage: e.target.value })}
              className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white appearance-none outline-none cursor-pointer focus:ring-1 focus:ring-accent"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none">expand_more</span>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="size-10 rounded-xl bg-slate-100 dark:bg-background-dark flex items-center justify-center text-primary dark:text-accent">
               <span className="material-symbols-outlined">auto_awesome</span>
             </div>
             <div>
               <h4 className="font-black text-sm text-slate-900 dark:text-white">System Status</h4>
               <p className="text-[10px] text-primary dark:text-green-400 uppercase tracking-widest font-black">Architecture Stable</p>
             </div>
           </div>
           <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed italic">
             "Using the system's pre-configured intelligence engine for high-speed transcription and analysis."
           </p>
        </div>
      </section>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        className={`w-full py-5 rounded-[2rem] border border-white/10 font-display text-lg font-black text-white shadow-2xl active:scale-[0.98] transition-all relative overflow-hidden group ${localConfig.theme === 'light' ? 'bg-slate-900' : 'bg-gradient-to-r from-primary to-accent'}`}
      >
        <div className={`absolute inset-0 bg-green-500 flex items-center justify-center transition-transform duration-500 ${saveFeedback ? 'translate-y-0' : 'translate-y-full'}`}>
          <span className="text-white uppercase tracking-widest text-xs">Preferences Updated</span>
        </div>
        <span className="relative z-10">Save Preferences</span>
      </button>

      <div className="pt-4 text-center">
        <p className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-[0.3em]">EchoListen v1.2.6 Mobile</p>
      </div>
    </div>
  );
};

export default SettingsView;
